import type { Question, Unit } from './model';
export type CarryResult = { kept: number; changed: number; removed: number } | 'reset' | 'failed';
const answerText = (q: Question, answer: string | undefined) => {
  const text = q.options.find((o) => o.id === answer)?.text;
  return text === undefined ? undefined : text.trim().replace(/\s+/g, ' ');
};
/** 比較伺服器舊版答案與新版題目，不以選項代碼或題序判定是否延續。 */
export function wrongCarryDrop(
  oldQuestions: Question[],
  oldAnswers: Record<string, string>,
  newQuestions: Question[],
) {
  const next = new Map(newQuestions.map((q) => [q.id, q]));
  const drop: string[] = [];
  let kept = 0,
    changed = 0,
    removed = 0;
  for (const old of oldQuestions) {
    const q = next.get(old.id);
    if (!q) {
      drop.push(old.id);
      removed++;
      continue;
    }
    const before = answerText(old, oldAnswers[old.id]),
      after = answerText(q, q.answer);
    if (
      before === undefined ||
      after === undefined ||
      before !== after ||
      old.options.length !== q.options.length ||
      (old.questionType || 'single') !== (q.questionType || 'single')
    ) {
      drop.push(old.id);
      changed++;
    } else kept++;
  }
  return { drop: drop.sort(), kept, changed, removed };
}
/** 明確保存順序，避免資料庫序列化 map 後以雜湊鍵排序，誤刪最近的版本。 */
export function appendWrongCarry(
  unit: Pick<Unit, 'wrongCarry' | 'wrongCarryOrder'>,
  version: string,
  entry: NonNullable<Unit['wrongCarry']>[string],
) {
  const previous = unit.wrongCarry || {};
  const order = [
    ...new Set([...(unit.wrongCarryOrder || Object.keys(previous)), ...Object.keys(previous)]),
  ].filter((v) => v !== version && previous[v]);
  const wrongCarryOrder = [...order, version].slice(-10);
  const wrongCarry = Object.fromEntries(
    wrongCarryOrder.map((v) => [v, v === version ? entry : previous[v]]),
  );
  return { wrongCarry, wrongCarryOrder };
}
export function carryMessage(carry: CarryResult): string {
  if (carry === 'reset') return '錯題已全部重新計算';
  if (carry === 'failed') return '舊版題庫讀取失敗，錯題重新計算';
  return `錯題延續：保留 ${carry.kept} 題，重置 ${carry.changed + carry.removed} 題（正解改變 ${carry.changed}、刪除 ${carry.removed}）`;
}
