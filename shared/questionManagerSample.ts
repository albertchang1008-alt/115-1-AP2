import type { Interaction, SlideAnswerKeys, AnswerKeys } from './classroom';
import { TRUE_FALSE_OPTIONS } from './pptImport';

export type SampleQuestion = {
  interaction: Interaction;
  keys: SlideAnswerKeys;
  page?: number;
  rounds: number;
};
export type SampleDeck = { id: string; title: string; slideIds: string[] };
export type QuestionManagerSampleData = {
  decks: SampleDeck[];
  questions: SampleQuestion[];
  source: 'emulator' | 'platform';
  serverKeys?: AnswerKeys;
  roundCounts?: Record<string, number>;
};
export type SampleDifference = { label: string; before: string; after: string };

export function sampleFieldType(field: Interaction['fields'][number]) {
  if (field.kind === 'order') return '排序';
  return field.options.length === 2 && field.options.every((s, i) => s === TRUE_FALSE_OPTIONS[i])
    ? '是非'
    : '單選';
}

export function sampleQuestionDiff(
  before: SampleQuestion | undefined,
  after: SampleQuestion | undefined,
): SampleDifference[] {
  if (!before)
    return [{ label: '新增整題', before: '此頁尚無題目', after: after?.interaction.title || '' }];
  if (!after)
    return [{ label: '刪除整題', before: before.interaction.title, after: '移除此頁的題目與答案' }];
  const changes: SampleDifference[] = [];
  const add = (label: string, a: string, b: string) => {
    if (a !== b) changes.push({ label, before: a, after: b });
  };
  add('題目標題', before.interaction.title, after.interaction.title);
  const ids = [
    ...new Set([...before.interaction.fields, ...after.interaction.fields].map((f) => f.id)),
  ];
  ids.forEach((id, i) => {
    const a = before.interaction.fields.find((f) => f.id === id),
      b = after.interaction.fields.find((f) => f.id === id);
    const prefix = `第 ${i + 1} 欄`;
    if (!a || !b) {
      const detail = (f: typeof a, q: SampleQuestion) =>
        f ? JSON.stringify({ ...f, key: q.keys[f.id] || null }, null, 2) : '未設定';
      add(prefix, detail(a, before), detail(b, after));
      return;
    }
    add(`${prefix}・題幹`, a.label, b.label);
    add(`${prefix}・題型`, sampleFieldType(a), sampleFieldType(b));
    add(`${prefix}・選項`, a.options.join('\n'), b.options.join('\n'));
    const show = (v: string | string[] | undefined) =>
      Array.isArray(v) ? v.join(' → ') : v || '未設定';
    add(`${prefix}・正確答案`, show(before.keys[id]?.answer), show(after.keys[id]?.answer));
    add(
      `${prefix}・解析`,
      before.keys[id]?.explanation || '未填寫',
      after.keys[id]?.explanation || '未填寫',
    );
  });
  return changes;
}
