import { QUESTION_HEADERS, parseManagedMatrix } from '../shared/questionWorkbook';
import {
  RawQuestionRow,
  QuestionSheetParseResult,
  parseQuestionTableRows,
} from '../shared/pptImport';

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

/** Parse central directory of a ZIP buffer and return entries. */
function readZipDirectory(buf: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocdOffset = -1;
  const minOffset = Math.max(0, buf.byteLength - 65557);
  for (let i = buf.byteLength - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw Error('檔案不是有效的 ZIP／Office 格式（.xlsx 或 .pptx）');

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map<string, ZipEntry>();
  let pos = cdOffset;
  const decoder = new TextDecoder('utf-8');

  for (let i = 0; i < totalEntries; i++) {
    if (pos + 46 > buf.byteLength || view.getUint32(pos, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(pos + 10, true);
    const compressedSize = view.getUint32(pos + 20, true);
    const uncompressedSize = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localHeaderOffset = view.getUint32(pos + 42, true);
    const name = decoder.decode(buf.subarray(pos + 46, pos + 46 + nameLen));
    entries.set(name, {
      name,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressed as unknown as BufferSource);
  writer.close();
  const res = new Response(ds.readable);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

async function extractZipEntryText(
  buf: Uint8Array,
  entries: Map<string, ZipEntry>,
  name: string,
): Promise<string | null> {
  const entry = entries.get(name);
  if (!entry) return null;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const pos = entry.localHeaderOffset;
  if (view.getUint32(pos, true) !== 0x04034b50) throw Error(`ZIP 區塊損毀：${name}`);
  const nameLen = view.getUint16(pos + 26, true);
  const extraLen = view.getUint16(pos + 28, true);
  const dataStart = pos + 30 + nameLen + extraLen;
  const slice = buf.subarray(dataStart, dataStart + entry.compressedSize);
  const raw =
    entry.compressionMethod === 0
      ? slice
      : entry.compressionMethod === 8
        ? await inflateRawBytes(slice)
        : (() => {
            throw Error(`不支援的壓縮方式：${entry.compressionMethod}`);
          })();
  return new TextDecoder('utf-8').decode(raw);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function colLettersToIndex(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.toUpperCase().charCodeAt(i) - 64);
  }
  return col - 1;
}

/** Extract rows of strings from the first worksheet of an .xlsx buffer. */
export async function readXlsxFirstSheetMatrix(buffer: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const entries = readZipDirectory(buf);

  const sharedStrings: string[] = [];
  const sstXml = await extractZipEntryText(buf, entries, 'xl/sharedStrings.xml');
  if (sstXml) {
    const siMatches = sstXml.match(/<si\b[^>]*>[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const tMatches = si.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g) || [];
      const combined = tMatches
        .map((t) => decodeXmlEntities(t.replace(/^<t(?:\s+[^>]*)?>|<\/t>$/g, '')))
        .join('');
      sharedStrings.push(combined);
    }
  }

  let sheetXml = await extractZipEntryText(buf, entries, 'xl/worksheets/sheet1.xml');
  if (!sheetXml) {
    const firstSheetName = [...entries.keys()]
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
      .sort()[0];
    if (firstSheetName) sheetXml = await extractZipEntryText(buf, entries, firstSheetName);
  }
  if (!sheetXml) throw Error('找不到 Excel 工作表內容（xl/worksheets/sheet1.xml）');

  const matrix: string[][] = [];
  const rowMatches = sheetXml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || [];
  for (const rowXml of rowMatches) {
    const rowCells: string[] = [];
    const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let m: RegExpExecArray | null;
    let fallbackCol = 0;
    while ((m = cellRegex.exec(rowXml)) !== null) {
      const attrs = m[1] || '';
      const inner = m[2] || '';
      const refMatch = attrs.match(/\br="([A-Za-z]+)\d+"/);
      const colIdx = refMatch ? colLettersToIndex(refMatch[1]) : fallbackCol;
      fallbackCol = colIdx + 1;
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : '';

      let val = '';
      if (cellType === 'inlineStr') {
        const tMatches = inner.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g) || [];
        val = tMatches
          .map((t) => decodeXmlEntities(t.replace(/^<t(?:\s+[^>]*)?>|<\/t>$/g, '')))
          .join('');
      } else {
        const vMatch = inner.match(/<v(?:\s+[^>]*)?>([\s\S]*?)<\/v>/);
        const rawV = vMatch ? decodeXmlEntities(vMatch[1]) : '';
        if (cellType === 's') {
          const idx = parseInt(rawV, 10);
          val = Number.isInteger(idx) && sharedStrings[idx] !== undefined ? sharedStrings[idx] : '';
        } else {
          val = rawV;
        }
      }
      while (rowCells.length <= colIdx) rowCells.push('');
      rowCells[colIdx] = val;
    }
    matrix.push(rowCells);
  }
  return matrix;
}

/** Parse an .xlsx question sheet buffer into structured RawQuestionRow[] and validate it. */
export async function parseXlsxQuestionSheet(
  buffer: ArrayBuffer | Uint8Array,
  pageCount: number,
  deckId: string,
  slideTitles?: Record<number, string>,
): Promise<QuestionSheetParseResult> {
  const matrix = await readXlsxFirstSheetMatrix(buffer);
  if (matrix[0]?.join('|') === QUESTION_HEADERS.join('|')) return parseManagedMatrix(matrix, pageCount, deckId);
  if (!matrix.length) {
    return parseQuestionTableRows([], pageCount, deckId, slideTitles);
  }

  // Detect header row (row 1)
  const header = matrix[0].map((s) => String(s || '').trim());
  const hasHeader =
    header.some((h) => h.includes('頁碼') || h.toLowerCase() === 'page') ||
    header.some((h) => h.includes('題型') || h.includes('題幹'));

  const startIdx = hasHeader ? 1 : 0;
  const rows: RawQuestionRow[] = [];
  for (let i = startIdx; i < matrix.length; i++) {
    const r = matrix[i] || [];
    rows.push({
      rowNumber: i + 1,
      page: r[0] ?? '',
      kind: r[1] ?? '',
      stem: r[2] ?? '',
      options: [r[3] ?? '', r[4] ?? '', r[5] ?? '', r[6] ?? '', r[7] ?? '', r[8] ?? ''],
      answer: r[9] ?? '',
      explanation: r[10] ?? '',
    });
  }
  return parseQuestionTableRows(rows, pageCount, deckId, slideTitles);
}

/**
 * Extract speaker notes and slide titles from an optional .pptx buffer.
 * Returns 1-based maps `{ notesByPage, titlesByPage }`.
 */
export async function parsePptxNotesAndTitles(buffer: ArrayBuffer | Uint8Array): Promise<{
  notesByPage: Record<number, string>;
  titlesByPage: Record<number, string>;
}> {
  const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const entries = readZipDirectory(buf);
  const notesByPage: Record<number, string> = {};
  const titlesByPage: Record<number, string> = {};

  const extractParagraphs = (xml: string): string[] => {
    const pMatches = xml.match(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/g) || [];
    const lines: string[] = [];
    for (const p of pMatches) {
      const tMatches = p.match(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/g) || [];
      const line = tMatches
        .map((t) => decodeXmlEntities(t.replace(/^<a:t(?:\s+[^>]*)?>|<\/a:t>$/g, '')))
        .join('')
        .trim();
      if (line) lines.push(line);
    }
    return lines;
  };

  for (const name of entries.keys()) {
    const slideMatch = name.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (slideMatch) {
      const pageNum = parseInt(slideMatch[1], 10);
      const xml = await extractZipEntryText(buf, entries, name);
      if (xml) {
        const lines = extractParagraphs(xml);
        // Find the first meaningful title line (skip short page badges like "P.01 導入頁")
        const candidate =
          lines.find((l) => l.length > 4 && !/^P\.\d+/i.test(l) && !/^\d+\s*\/\s*\d+$/.test(l)) ||
          lines[0] ||
          '';
        if (candidate) titlesByPage[pageNum] = candidate.slice(0, 120);
      }
    }

    const noteMatch = name.match(/^ppt\/notesSlides\/notesSlide(\d+)\.xml$/i);
    if (noteMatch) {
      const pageNum = parseInt(noteMatch[1], 10);
      const xml = await extractZipEntryText(buf, entries, name);
      if (xml) {
        const lines = extractParagraphs(xml).filter((l) => !/^\d+$/.test(l));
        if (lines.length) {
          notesByPage[pageNum] = lines.join('\n').trim();
        }
      }
    }
  }

  return { notesByPage, titlesByPage };
}
