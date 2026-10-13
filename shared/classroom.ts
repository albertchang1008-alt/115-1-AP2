/** Classroom participation is separate from exams, grading and learning progress. No answer keys. */
export type InteractionField = {
  id: string;
  label: string;
  kind: 'choice' | 'order';
  options: string[];
};
export type Interaction = { slideId: string; title: string; fields: InteractionField[] };
export type Responses = Record<string, string | string[]>;
export type PollRound = {
  id: string;
  slideId: string;
  title: string;
  fields: InteractionField[];
  classIds: string[];
  number: number;
  status: 'open' | 'closed';
  openedAt: number;
  closedAt?: number;
  deadlineAt?: number;
  eligibleCount?: number;
  total: number;
  counts: Record<string, number[]>;
};
export function validateResponses(def: Interaction, input: unknown): Responses {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('請完成作答');
  const source = input as Record<string, unknown>,
    result: Responses = {};
  if (Object.keys(source).some((k) => !def.fields.some((f) => f.id === k)))
    throw Error('作答欄位無效');
  for (const f of def.fields) {
    const v = source[f.id];
    if (f.kind === 'order') {
      if (
        !Array.isArray(v) ||
        v.length !== f.options!.length ||
        new Set(v).size !== v.length ||
        v.some((x) => !f.options!.includes(x))
      )
        throw Error('排序必須包含每個事件且不得重複');
      result[f.id] = [...v];
    } else if (f.kind === 'choice') {
      if (typeof v !== 'string' || !f.options.includes(v)) throw Error('請選擇題目提供的選項');
      result[f.id] = v;
    } else throw Error('此互動格式已停用，請教師重新開放');
  }
  return result;
}
export function tally(round: PollRound, answers: Responses): PollRound {
  const next = structuredClone(round);
  next.total++;
  for (const f of round.fields) {
    const v = answers[f.id];
    if (f.kind === 'choice') {
      const n = (next.counts[f.id] ||= f.options!.map(() => 0));
      n[f.options!.indexOf(v as string)]++;
    } else if (f.kind === 'order') {
      for (const [i, s] of (v as string[]).entries()) {
        const n = (next.counts[f.id + '-' + i] ||= f.options!.map(() => 0));
        n[f.options!.indexOf(s)]++;
      }
    }
  }
  return next;
}
export function visibleRound(round: PollRound): PollRound {
  return structuredClone(round);
}

/** The deadline display has no grace; only the server accepts a 3-second network grace. */
export const classroomDurations = [0, 30, 60, 90, 120, 180] as const;
export function interactionSeconds(round: Pick<PollRound, 'deadlineAt' | 'openedAt'>, now: number) {
  return round.deadlineAt === undefined
    ? Math.max(0, Math.floor((now - round.openedAt) / 1000))
    : Math.max(0, Math.ceil((round.deadlineAt - now) / 1000));
}
export function interactionExpired(round: Pick<PollRound, 'deadlineAt'>, now: number) {
  return round.deadlineAt !== undefined && now >= round.deadlineAt;
}
export function interactionTimeLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function validateInteractions(input: unknown): Interaction[] {
  if (!Array.isArray(input) || input.length > 100) throw Error('互動題目設定無效');
  const ids = new Set<string>();
  for (const d of input) {
    if (!d || typeof d.slideId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(d.slideId) || ids.has(d.slideId) || typeof d.title !== 'string' || !d.title.trim() || d.title.length > 200 || !Array.isArray(d.fields) || !d.fields.length || d.fields.length > 20) throw Error('互動題目設定無效');
    ids.add(d.slideId);
    const fields = new Set<string>();
    for (const f of d.fields) {
      if (!f || typeof f.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(f.id) || fields.has(f.id) || !['choice', 'order'].includes(f.kind) || typeof f.label !== 'string' || !f.label.trim() || f.label.length > 1000 || !Array.isArray(f.options) || f.options.length < 2 || f.options.length > 20 || new Set(f.options).size !== f.options.length || f.options.some((s: unknown) => typeof s !== 'string' || !s.trim() || s.length > 500)) throw Error('互動欄位設定無效');
      fields.add(f.id);
    }
  }
  return structuredClone(input);
}
