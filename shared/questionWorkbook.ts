import { AnswerKeys, Interaction, validateAnswerKeys, validateInteractions } from './classroom';
import { buildDeckSlideId, TRUE_FALSE_OPTIONS, QuestionSheetParseResult } from './pptImport';
export const QUESTION_HEADERS = [
  '頁碼',
  '題型',
  '題幹',
  '選項A',
  '選項B',
  '選項C',
  '選項D',
  '選項E',
  '選項F',
  '答案',
  '解析',
  '題目標題',
  '欄位ID',
  'slideId',
  '選項JSON',
  '答案JSON',
  '解析欄存在',
];
export function questionMatrix(
  items: { interaction: Interaction; keys: AnswerKeys[string]; page?: number }[],
) {
  const matrix: string[][] = [QUESTION_HEADERS];
  for (const q of items)
    for (const f of q.interaction.fields) {
      const key = q.keys[f.id];
      if (!key) throw Error('題目尚未設定完整答案，請先補齊再下載');
      const tf =
        f.kind === 'choice' && JSON.stringify(f.options) === JSON.stringify(TRUE_FALSE_OPTIONS);
      const code = (v: string) => String.fromCharCode(65 + f.options.indexOf(v));
      matrix.push([
        String(q.page || 0),
        tf ? '是非' : f.kind === 'order' ? '排序' : '單選',
        f.label,
        ...Array.from({ length: 6 }, (_, i) => f.options[i] || ''),
        tf
          ? key.answer === TRUE_FALSE_OPTIONS[0]
            ? '對'
            : '錯'
          : Array.isArray(key.answer)
            ? key.answer.map(code).join(' ')
            : code(key.answer),
        key.explanation || '',
        q.interaction.title,
        f.id,
        q.interaction.slideId,
        f.options.length > 6 ? JSON.stringify(f.options) : '',
        f.options.length > 6 ? JSON.stringify(key.answer) : '',
        Object.hasOwn(key, 'explanation') ? '1' : '0',
      ]);
    }
  return matrix;
}
// Extended #38 sheet: multiple fields on one page and exact titles/IDs survive export/import.
// For normal 2..6 options, the original editable A..F / answer columns remain authoritative.
export function parseManagedMatrix(
  matrix: string[][],
  pageCount: number,
  deckId: string,
): QuestionSheetParseResult {
  const interactions: Interaction[] = [],
    answerKeys: AnswerKeys = {},
    items: QuestionSheetParseResult['items'] = [],
    errors: string[] = [];
  for (const [i, r] of matrix.slice(1).entries()) {
    if (!r.some(Boolean)) continue;
    try {
      const page = Number(r[0]);
      if (!Number.isInteger(page) || page < 1 || page > pageCount) throw Error('頁碼無效');
      const sid = r[13];
      if (sid !== buildDeckSlideId(deckId, page))
        throw Error('slideId 與簡報頁碼不符；舊版題目請保留原 JSON 備份');
      const tf = r[1] === '是非';
      if (!['單選', '排序', '是非'].includes(r[1])) throw Error('題型無效');
      const options: string[] = r[14]
        ? JSON.parse(r[14])
        : tf
          ? [...TRUE_FALSE_OPTIONS]
          : r.slice(3, 9).filter(Boolean);
      if (tf && r.slice(3, 9).some((v, idx) => v && v !== TRUE_FALSE_OPTIONS[idx]))
        throw Error('是非題選項固定');
      const resolve = (letter: string) => options[letter.charCodeAt(0) - 65];
      const answer = r[15]
        ? JSON.parse(r[15])
        : tf
          ? r[9] === '對'
            ? TRUE_FALSE_OPTIONS[0]
            : r[9] === '錯'
              ? TRUE_FALSE_OPTIONS[1]
              : null
          : r[1] === '排序'
            ? r[9].split(/\s+/).map(resolve)
            : resolve(r[9]);
      const f = {
        id: r[12],
        label: r[2],
        kind: r[1] === '排序' ? ('order' as const) : ('choice' as const),
        options,
      };
      let q = interactions.find((q) => q.slideId === sid);
      if (!q) {
        q = { slideId: sid, title: r[11], fields: [] };
        interactions.push(q);
        answerKeys[sid] = {};
      }
      if (q.title !== r[11]) throw Error('同頁標題不一致');
      q.fields.push(f);
      answerKeys[sid][f.id] = {
        answer,
        ...(r[16] === '1' || r[10] ? { explanation: r[10] || '' } : {}),
      };
      items.push({
        rowNumber: i + 2,
        page,
        slideId: sid,
        rawKind: r[1],
        kind: f.kind,
        isTrueFalse: tf,
        stem: f.label,
        options,
        rawAnswer: r[9],
        answer,
        explanation: r[10] || '',
        errors: [],
        warnings: [],
      });
    } catch (e) {
      errors.push(`第 ${i + 2} 列：${(e as Error).message}`);
    }
  }
  try {
    validateInteractions(interactions);
    validateAnswerKeys(interactions, answerKeys);
  } catch (e) {
    errors.push((e as Error).message);
  }
  return {
    interactions: errors.length ? [] : interactions,
    answerKeys: errors.length ? {} : answerKeys,
    items,
    errors,
    warnings: [],
    canImport: !errors.length,
  };
}
