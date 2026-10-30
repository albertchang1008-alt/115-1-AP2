import { QUESTION_HEADERS } from '../shared/questionWorkbook';
import { useState } from 'react';
import { API } from './service';
import {
  buildDeckSlideId,
  buildImageSlideHtml,
  DeckImportDiff,
  normalizeDeckId,
  parseQuestionTableRows,
  QuestionSheetParseResult,
  RawQuestionRow,
} from '../shared/pptImport';
import { parsePptxNotesAndTitles, readXlsxFirstSheetMatrix } from './pptImportFiles';
import {
  arrayBufferToBase64DataUrl,
  RenderedPdfPage,
  renderPdfPagesTo1920Images,
} from './pdfVectorRenderer';

function extractRawRowsFromMatrix(matrix: string[][]): RawQuestionRow[] {
  if (!matrix.length) return [];
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
      ...(matrix[0].join('|') === QUESTION_HEADERS.join('|') ? { managedCells: r } : {}),
      page: r[0] ?? '',
      kind: r[1] ?? '',
      stem: r[2] ?? '',
      options: [r[3] ?? '', r[4] ?? '', r[5] ?? '', r[6] ?? '', r[7] ?? '', r[8] ?? ''],
      answer: r[9] ?? '',
      explanation: r[10] ?? '',
    });
  }
  return rows;
}

export default function PptImportModal({
  api,
  courseId,
  initialTitle = '',
  initialDeckId = '',
  onClose,
  onImported,
  notify,
}: {
  api: API;
  courseId: string;
  initialTitle?: string;
  initialDeckId?: string;
  onClose: () => void;
  onImported: (deckId: string) => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [customDeckId, setCustomDeckId] = useState(initialDeckId);
  const [pdfFileName, setPdfFileName] = useState('');
  const [xlsxFileName, setXlsxFileName] = useState('');
  const [pptxFileName, setPptxFileName] = useState('');

  const [pdfDataUrl, setPdfDataUrl] = useState('');
  const [renderedPages, setRenderedPages] = useState<RenderedPdfPage[]>([]);
  const [rawQuestionRows, setRawQuestionRows] = useState<RawQuestionRow[]>([]);
  const [pptxNotes, setPptxNotes] = useState<Record<number, string>>({});
  const [pptxTitles, setPptxTitles] = useState<Record<number, string>>({});

  const [parsingStatus, setParsingStatus] = useState('');
  const [parseError, setParseError] = useState('');
  const [reimportDiff, setReimportDiff] = useState<DeckImportDiff | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveDeckId = (() => {
    try {
      return normalizeDeckId(customDeckId.trim() || title.trim() || 'review-deck');
    } catch {
      return 'review-deck';
    }
  })();

  const slideTitlesMap: Record<number, string> = {};
  for (const p of renderedPages) {
    slideTitlesMap[p.pageNumber] =
      pptxTitles[p.pageNumber] || p.extractedTitle || `第 ${p.pageNumber} 頁`;
  }

  const parsedQuestions: QuestionSheetParseResult = parseQuestionTableRows(
    rawQuestionRows,
    renderedPages.length || 1,
    effectiveDeckId,
    slideTitlesMap,
  );

  const questionByPage = new Map(parsedQuestions.items.map((it) => [it.page, it]));

  const buildPreparedSlides = () =>
    renderedPages.map((p) => {
      const slideId = buildDeckSlideId(effectiveDeckId, p.pageNumber);
      const slideTitle = pptxTitles[p.pageNumber] || p.extractedTitle || `第 ${p.pageNumber} 頁`;
      const notes = pptxNotes[p.pageNumber] || '';
      const answerPage = /答案|總結|解析/.test(slideTitle);
      return {
        id: slideId,
        pageNumber: p.pageNumber,
        title: slideTitle,
        notes,
        answerPage,
        imageDataUrl: p.imageDataUrl,
      };
    });

  async function refreshDryRunDiff(
    nextPages: RenderedPdfPage[],
    nextRows: RawQuestionRow[],
    nextTitles: Record<number, string>,
    nextNotes: Record<number, string>,
    nextTitleStr: string,
    nextDeckIdStr: string,
  ) {
    if (!nextPages.length) {
      setReimportDiff(null);
      return;
    }
    const checkResult = parseQuestionTableRows(nextRows, nextPages.length, nextDeckIdStr);
    if (!checkResult.canImport) {
      setReimportDiff(null);
      return;
    }
    try {
      const slidesPayload = nextPages.map((p) => {
        const slideId = buildDeckSlideId(nextDeckIdStr, p.pageNumber);
        const st = nextTitles[p.pageNumber] || p.extractedTitle || `第 ${p.pageNumber} 頁`;
        return {
          id: slideId,
          pageNumber: p.pageNumber,
          title: st,
          notes: nextNotes[p.pageNumber] || '',
          answerPage: /答案|總結|解析/.test(st),
          imageDataUrl: p.imageDataUrl,
        };
      });
      const res = await api.call('saveTeachingDeck', {
        courseId,
        deckId: nextDeckIdStr,
        title: nextTitleStr || '未命名簡報',
        slides: slidesPayload,
        questionRows: nextRows,
        dryRun: true,
      });
      if (res?.diff) setReimportDiff(res.diff);
    } catch {
      setReimportDiff(null);
    }
  }

  async function handlePdfSelect(file: File | null) {
    if (!file) return;
    setParseError('');
    setPdfFileName(file.name);
    const defaultName = file.name.replace(/\.pdf$/i, '').trim();
    const nextTitle = title.trim() || defaultName;
    if (!title.trim() && defaultName) setTitle(defaultName);
    const nextDeckId = normalizeDeckId(customDeckId.trim() || nextTitle || 'review-deck');

    try {
      setParsingStatus('正在將 PDF 每頁轉為 1920 寬高畫質投影圖…');
      const ab = await file.arrayBuffer();
      const dataUrl = arrayBufferToBase64DataUrl(ab, 'application/pdf');
      setPdfDataUrl(dataUrl);
      const pages = await renderPdfPagesTo1920Images(ab, (cur, total) => {
        setParsingStatus(`正在轉換 PDF 投影片（${cur} / ${total} 頁）…`);
      });
      setRenderedPages(pages);
      setParsingStatus('');
      await refreshDryRunDiff(pages, rawQuestionRows, pptxTitles, pptxNotes, nextTitle, nextDeckId);
    } catch (e) {
      setParsingStatus('');
      setParseError(`PDF 讀取失敗：${(e as Error).message}`);
    }
  }

  async function handleXlsxSelect(file: File | null) {
    if (!file) return;
    setParseError('');
    setXlsxFileName(file.name);
    try {
      setParsingStatus('正在讀取題目表 (.xlsx)…');
      const ab = await file.arrayBuffer();
      const matrix = await readXlsxFirstSheetMatrix(ab);
      const rows = extractRawRowsFromMatrix(matrix);
      setRawQuestionRows(rows);
      setParsingStatus('');
      if (renderedPages.length) {
        await refreshDryRunDiff(
          renderedPages,
          rows,
          pptxTitles,
          pptxNotes,
          title.trim() || '簡報',
          effectiveDeckId,
        );
      }
    } catch (e) {
      setParsingStatus('');
      setParseError(`題目表讀取失敗：${(e as Error).message}`);
    }
  }

  async function handlePptxSelect(file: File | null) {
    if (!file) return;
    setParseError('');
    setPptxFileName(file.name);
    try {
      setParsingStatus('正在從 .pptx 擷取講者備忘稿與標題…');
      const ab = await file.arrayBuffer();
      const { notesByPage, titlesByPage } = await parsePptxNotesAndTitles(ab);
      setPptxNotes(notesByPage);
      setPptxTitles(titlesByPage);
      setParsingStatus('');
      if (renderedPages.length) {
        await refreshDryRunDiff(
          renderedPages,
          rawQuestionRows,
          titlesByPage,
          notesByPage,
          title.trim() || '簡報',
          effectiveDeckId,
        );
      }
    } catch (e) {
      setParsingStatus('');
      setParseError(`.pptx 備忘稿讀取失敗：${(e as Error).message}`);
    }
  }

  const canConfirm =
    Boolean(title.trim()) &&
    renderedPages.length > 0 &&
    parsedQuestions.canImport &&
    !saving &&
    !parsingStatus;

  async function handleConfirmImport() {
    if (!canConfirm) return;
    setSaving(true);
    setParseError('');
    try {
      const slidesPayload = buildPreparedSlides();
      const res = await api.call('saveTeachingDeck', {
        courseId,
        deckId: effectiveDeckId,
        title: title.trim(),
        slides: slidesPayload,
        questionRows: rawQuestionRows,
        pdfDataUrl,
      });
      notify(
        `已匯入簡報「${title.trim()}」（共 ${res.slideCount} 頁、${res.questionCount} 道互動題）`,
      );
      await onImported(res.deckId || effectiveDeckId);
      onClose();
    } catch (e) {
      setParseError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="ppt-import-modal"
      role="dialog"
      aria-modal="true"
      aria-label="匯入投影片與題目表"
      data-testid="ppt-import-modal"
    >
      <div className="ppt-import-card">
        <div className="ppt-import-header">
          <div>
            <span className="eyebrow">瀏覽器端一次匯入 · 自動合併題目與正解</span>
            <h3>匯入投影片（PDF）＋ 課堂互動題目表（.xlsx）</h3>
          </div>
          <button type="button" onClick={onClose}>
            關閉視窗
          </button>
        </div>

        <div className="ppt-import-form-grid">
          <label className="field">
            1. 簡報名稱（必填，例如：呼吸複習、泌尿＋體液複習）
            <input
              type="text"
              aria-label="簡報名稱"
              placeholder="例如：呼吸複習"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            簡報代碼（自動產生，更新同一份簡報時維持相同代碼）
            <input
              type="text"
              aria-label="簡報代碼"
              placeholder={effectiveDeckId}
              value={customDeckId}
              onChange={(e) => setCustomDeckId(e.target.value)}
            />
          </label>
          <label className="field">
            2. 投影片 PDF（必填，前端自動轉 1920 寬圖並保留向量供放大工具使用）
            <input
              type="file"
              aria-label="投影片 PDF"
              accept=".pdf,application/pdf"
              onChange={(e) => void handlePdfSelect(e.target.files?.[0] || null)}
            />
            {pdfFileName && (
              <small>
                已選擇：{pdfFileName}（{renderedPages.length} 頁）
              </small>
            )}
          </label>
          <label className="field">
            3. 題目表 Excel（.xlsx，支援「單選、排序、是非」）
            <input
              type="file"
              aria-label="題目表 (.xlsx)"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => void handleXlsxSelect(e.target.files?.[0] || null)}
            />
            {xlsxFileName && (
              <small>
                已選擇：{xlsxFileName}（讀取 {parsedQuestions.items.length} 列題目）
              </small>
            )}
          </label>
          <label className="field">
            4. 原始 PowerPoint（.pptx，選填，自動帶入每頁講者備忘稿）
            <input
              type="file"
              aria-label="原始 PowerPoint (.pptx)"
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(e) => void handlePptxSelect(e.target.files?.[0] || null)}
            />
            {pptxFileName && (
              <small>
                已選擇：{pptxFileName}（擷取 {Object.keys(pptxNotes).length} 頁備忘稿）
              </small>
            )}
          </label>
        </div>

        {parsingStatus && (
          <p role="status" className="notice">
            {parsingStatus}
          </p>
        )}
        {parseError && (
          <p role="alert" className="ppt-import-alert-error">
            {parseError}
          </p>
        )}

        {/* Preview Section */}
        {renderedPages.length > 0 && (
          <div className="ppt-import-preview" data-testid="ppt-import-preview">
            <div className="ppt-import-summary-bar">
              <span>
                <strong>簡報名稱：</strong>
                {title.trim() || '（未填寫）'}（代碼：<code>{effectiveDeckId}</code>）
              </span>
              <span>
                <strong>總頁數：</strong>共 {renderedPages.length} 頁
              </span>
              <span>
                <strong>互動題數：</strong>共 {parsedQuestions.items.length} 題
              </span>
              <span>
                <strong>講者備註：</strong>已帶入 {Object.keys(pptxNotes).length} 頁
              </span>
            </div>

            {/* Re-import diff banner when updating an existing deck */}
            {reimportDiff && reimportDiff.isUpdate && (
              <div
                className="ppt-import-diff-box"
                data-testid="ppt-reimport-diff"
                role="region"
                aria-label="重新匯入差異摘要"
              >
                <h4>重新匯入更新差異（同名簡報覆寫預覽）</h4>
                <p>
                  <strong>投影片變更：</strong>
                  新增 {reimportDiff.slides.added.length} 頁、變更{' '}
                  {reimportDiff.slides.changed.length} 頁、刪除 {reimportDiff.slides.removed.length}{' '}
                  頁、維持不變 {reimportDiff.slides.unchanged.length} 頁
                </p>
                <p>
                  <strong>互動題變更：</strong>
                  新增 {reimportDiff.questions.added.length} 題
                  {reimportDiff.questions.added.length
                    ? `（${reimportDiff.questions.added.join('、')}）`
                    : ''}
                  、變更 {reimportDiff.questions.changed.length} 題
                  {reimportDiff.questions.changed.length
                    ? `（${reimportDiff.questions.changed.join('、')}）`
                    : ''}
                  、刪除 {reimportDiff.questions.removed.length} 題
                  {reimportDiff.questions.removed.length
                    ? `（${reimportDiff.questions.removed.join('、')}）`
                    : ''}
                </p>
                <p className="diff-snapshot-note">
                  ✓ 其他簡報的題目全部保留；已經公佈過答案的歷史輪次維持原本快照，不受重匯影響。
                </p>
              </div>
            )}

            {/* Validation Errors (block import) */}
            {parsedQuestions.errors.length > 0 && (
              <div className="ppt-import-errors" data-testid="ppt-import-errors" role="alert">
                <h4>⚠️ 發現 {parsedQuestions.errors.length} 項題目表錯誤（修正前無法匯入）：</h4>
                <ul>
                  {parsedQuestions.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation Warnings */}
            {parsedQuestions.warnings.length > 0 && (
              <div className="ppt-import-warnings" data-testid="ppt-import-warnings">
                <h4>提示訊息：</h4>
                <ul>
                  {parsedQuestions.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed Questions Table Preview */}
            {parsedQuestions.items.length > 0 && (
              <div className="ppt-questions-preview">
                <h4>題目表預覽（共 {parsedQuestions.items.length} 題）</h4>
                <div className="ppt-question-cards">
                  {parsedQuestions.items.map((item) => (
                    <div
                      key={`${item.rowNumber}-${item.page}`}
                      className={`ppt-question-card ${item.errors.length ? 'has-error' : ''}`}
                      data-testid={`preview-question-row-${item.rowNumber}`}
                    >
                      <div className="ppt-question-card-head">
                        <span className="badge">第 {item.page} 頁</span>
                        <span className="badge kind-badge">{item.rawKind}</span>
                        <code>{item.slideId}</code>
                        {item.isTrueFalse && (
                          <span className="badge tf-badge">
                            底層 choice 儲存 · 手機顯示 ○ 對／✕ 錯 大按鈕
                          </span>
                        )}
                      </div>
                      <p className="ppt-question-stem">
                        <strong>題幹：</strong>
                        {item.stem || '（未填題幹）'}
                      </p>
                      {item.isTrueFalse ? (
                        <div className="true-false-preview-buttons" aria-label="是非題大按鈕預覽">
                          {item.options.map((opt) => (
                            <span
                              key={opt}
                              className={`tf-large-btn ${item.answer === opt ? 'is-answer' : ''}`}
                            >
                              {opt}
                              {item.answer === opt ? '（正解）' : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <ul className="ppt-question-options">
                          {item.options.map((opt, idx) => {
                            const letter = ['A', 'B', 'C', 'D', 'E', 'F'][idx] || String(idx + 1);
                            const isCorrectChoice = item.kind === 'choice' && item.answer === opt;
                            return (
                              <li key={idx} className={isCorrectChoice ? 'is-answer' : ''}>
                                <strong>{letter}.</strong> {opt}
                                {isCorrectChoice ? ' ✓（正解）' : ''}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <p className="ppt-question-answer">
                        <strong>設定正解：</strong>
                        {Array.isArray(item.answer)
                          ? item.answer.join(' → ')
                          : item.answer || item.rawAnswer || '（無效）'}
                      </p>
                      {item.explanation && (
                        <p className="ppt-question-exp">
                          <strong>解析（{item.explanation.length}／300 字）：</strong>
                          {item.explanation}
                        </p>
                      )}
                      {item.errors.length > 0 && (
                        <ul className="ppt-row-error-list">
                          {item.errors.map((er, idx) => (
                            <li key={idx}>{er}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide Thumbnails Grid */}
            <div className="ppt-thumbnails-section">
              <h4>投影片縮圖預覽（1920×1080 轉換結果，共 {renderedPages.length} 頁）</h4>
              <div className="ppt-thumbnails-grid">
                {renderedPages.map((p) => {
                  const q = questionByPage.get(p.pageNumber);
                  const slideTitle =
                    pptxTitles[p.pageNumber] || p.extractedTitle || `第 ${p.pageNumber} 頁`;
                  const note = pptxNotes[p.pageNumber];
                  return (
                    <div key={p.pageNumber} className={`ppt-thumb-card ${q ? 'has-question' : ''}`}>
                      <div className="ppt-thumb-frame">
                        <img src={p.imageDataUrl} alt={`第 ${p.pageNumber} 頁縮圖`} />
                      </div>
                      <div className="ppt-thumb-meta">
                        <strong>
                          P.{String(p.pageNumber).padStart(2, '0')} {slideTitle}
                        </strong>
                        {q && <span className="ppt-thumb-q-tag">互動題（{q.rawKind}）</span>}
                        {note && <small className="ppt-thumb-note">備註：{note}</small>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="ppt-import-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="primary"
            disabled={!canConfirm}
            onClick={() => void handleConfirmImport()}
          >
            {saving
              ? '正在儲存簡報並合併題目…'
              : parsedQuestions.errors.length > 0
                ? '請先修正題目表錯誤'
                : '確認匯入並合併題目'}
          </button>
        </div>
      </div>
    </div>
  );
}
