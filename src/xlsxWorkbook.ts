// Minimal uncompressed Office ZIP. Same inline-string XML consumed by #38, no runtime dependency.
const enc = new TextEncoder();
function crc(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function zip(parts: Record<string, string>) {
  const chunks: Uint8Array[] = [],
    central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(parts)) {
    const n = enc.encode(name),
      bytes = enc.encode(text),
      sum = crc(bytes);
    const h = new Uint8Array(30 + n.length),
      v = new DataView(h.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint32(14, sum, true);
    v.setUint32(18, bytes.length, true);
    v.setUint32(22, bytes.length, true);
    v.setUint16(26, n.length, true);
    h.set(n, 30);
    const c = new Uint8Array(46 + n.length),
      d = new DataView(c.buffer);
    d.setUint32(0, 0x02014b50, true);
    d.setUint16(4, 20, true);
    d.setUint16(6, 20, true);
    d.setUint32(16, sum, true);
    d.setUint32(20, bytes.length, true);
    d.setUint32(24, bytes.length, true);
    d.setUint16(28, n.length, true);
    d.setUint32(42, offset, true);
    c.set(n, 46);
    chunks.push(h, bytes);
    central.push(c);
    offset += h.length + bytes.length;
  }
  const end = new Uint8Array(22),
    d = new DataView(end.buffer);
  d.setUint32(0, 0x06054b50, true);
  d.setUint16(8, central.length, true);
  d.setUint16(10, central.length, true);
  d.setUint32(
    12,
    central.reduce((n, c) => n + c.length, 0),
    true,
  );
  d.setUint32(16, offset, true);
  const all = [...chunks, ...central, end],
    out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let pos = 0;
  for (const c of all) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
function columnName(index: number) {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}
export function exportWorkbook(
  sheetName: string,
  matrix: readonly (readonly (string | number)[])[],
) {
  const xml = (s: string) =>
    s
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
      );
  const rows = matrix
    .map(
      (r, i) =>
        `<row r="${i + 1}">${r
          .map((s, j) => {
            const ref = `${columnName(j)}${i + 1}`;
            return typeof s === 'number'
              ? `<c r="${ref}"><v>${s}</v></c>`
              : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(s)}</t></is></c>`;
          })
          .join('')}</row>`,
    )
    .join('');
  return zip({
    '[Content_Types].xml':
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels':
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`,
  });
}
