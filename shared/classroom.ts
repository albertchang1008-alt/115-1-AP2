/** Classroom participation is separate from exams, grading and learning progress. */
export type InteractionField = {
  id: string;
  label: string;
  kind: 'choice' | 'order';
  options: string[];
};
export type Interaction = { slideId: string; title: string; fields: InteractionField[] };
export type Responses = Record<string, string | string[]>;
export type FieldAnswerKey = {
  answer: string | string[];
  explanation?: string;
};
export type SlideAnswerKeys = Record<string, FieldAnswerKey>;
export type AnswerKeys = Record<string, SlideAnswerKeys>;
export type RoundReveal = {
  revealedAt: number;
  key: SlideAnswerKeys;
};
export type FieldJudgement = {
  correct: boolean;
  expected: string | string[];
  actual?: string | string[];
  stepCorrect?: boolean[];
  explanation?: string;
};
export type RoundJudgement = {
  answered: boolean;
  allCorrect: boolean;
  fields: Record<string, FieldJudgement>;
};
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
  hasAnswerKey?: boolean;
  reveal?: RoundReveal;
};
export type StudentHistoryItem = {
  id: string;
  slideId: string;
  number: number;
  title: string;
  fields: InteractionField[];
  openedAt: number;
  closedAt?: number;
  revealedAt: number;
  reveal: RoundReveal;
  submitted: boolean;
  answers: Responses | null;
  judgement: RoundJudgement;
};

export function validateResponses(def: Pick<Interaction, 'fields'>, input: unknown): Responses {
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

export function validateAnswerKeys(interactions: Interaction[], input: unknown): AnswerKeys {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw Error('答案設定必須是 JSON 物件');
  if (JSON.stringify(input).length > 100000) throw Error('答案設定過大');
  const bySlide = new Map(interactions.map((d) => [d.slideId, d]));
  const rawObj = input as Record<string, unknown>;
  const source =
    !bySlide.has('answerKeys') &&
    Object.keys(rawObj).length === 1 &&
    rawObj.answerKeys &&
    typeof rawObj.answerKeys === 'object' &&
    !Array.isArray(rawObj.answerKeys)
      ? (rawObj.answerKeys as Record<string, unknown>)
      : rawObj;
  const out: AnswerKeys = {};
  for (const [slideId, slideVal] of Object.entries(source)) {
    const def = bySlide.get(slideId);
    if (!def) throw Error(`找不到互動題目：${slideId}`);
    if (!slideVal || typeof slideVal !== 'object' || Array.isArray(slideVal))
      throw Error(`題目 ${slideId} 答案格式錯誤`);
    const byField = new Map(def.fields.map((f) => [f.id, f]));
    const slideOut: SlideAnswerKeys = {};
    for (const [fieldId, fieldVal] of Object.entries(slideVal as Record<string, unknown>)) {
      const field = byField.get(fieldId);
      if (!field) throw Error(`題目 ${slideId} 找不到欄位：${fieldId}`);
      if (!fieldVal || typeof fieldVal !== 'object' || Array.isArray(fieldVal))
        throw Error(`題目 ${slideId}.${fieldId} 答案格式錯誤`);
      const item = fieldVal as Record<string, unknown>;
      if (Object.keys(item).some((k) => k !== 'answer' && k !== 'explanation'))
        throw Error(`題目 ${slideId}.${fieldId} 包含未定義屬性`);
      let cleanAnswer: string | string[];
      if (field.kind === 'choice') {
        if (typeof item.answer !== 'string' || !field.options.includes(item.answer))
          throw Error(`題目 ${slideId}.${fieldId} 正解必須是該題 options 之一`);
        cleanAnswer = item.answer;
      } else if (field.kind === 'order') {
        if (
          !Array.isArray(item.answer) ||
          item.answer.length !== field.options.length ||
          new Set(item.answer).size !== field.options.length ||
          item.answer.some((x) => typeof x !== 'string' || !field.options.includes(x))
        )
          throw Error(`題目 ${slideId}.${fieldId} 排序正解必須是 options 的完整排列`);
        cleanAnswer = [...item.answer];
      } else {
        throw Error('此互動格式已停用');
      }
      let cleanExplanation: string | undefined;
      if (item.explanation !== undefined && item.explanation !== null) {
        if (typeof item.explanation !== 'string')
          throw Error(`題目 ${slideId}.${fieldId} 解析必須是字串`);
        const trimmed = item.explanation
          .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
          .trim();
        if (trimmed.length > 300)
          throw Error(`題目 ${slideId}.${fieldId} 解析長度不可超過 300 字`);
        if (trimmed) cleanExplanation = trimmed;
      }
      slideOut[fieldId] = {
        answer: cleanAnswer,
        ...(cleanExplanation !== undefined ? { explanation: cleanExplanation } : {}),
      };
    }
    if (Object.keys(slideOut).length > 0) {
      if (def.fields.some((f) => !slideOut[f.id]))
        throw Error(`題目 ${slideId} 缺少欄位答案`);
      out[slideId] = slideOut;
    }
  }
  return out;
}

export function extractValidSlideKey(
  def: Pick<Interaction, 'slideId' | 'fields'> | null | undefined,
  rawKeys: unknown,
): SlideAnswerKeys | null {
  if (!def || !rawKeys || typeof rawKeys !== 'object' || Array.isArray(rawKeys)) return null;
  const obj = rawKeys as Record<string, unknown>;
  const map =
    !('slideId' in obj) &&
    obj.answerKeys &&
    typeof obj.answerKeys === 'object' &&
    !Array.isArray(obj.answerKeys)
      ? (obj.answerKeys as Record<string, unknown>)
      : obj;
  const slideVal = map[def.slideId];
  if (!slideVal || typeof slideVal !== 'object' || Array.isArray(slideVal)) return null;
  try {
    const valid = validateAnswerKeys(
      [{ slideId: def.slideId, title: def.slideId, fields: def.fields }],
      { [def.slideId]: slideVal },
    );
    const key = valid[def.slideId];
    return key && Object.keys(key).length === def.fields.length ? key : null;
  } catch {
    return null;
  }
}

export function judgeResponses(
  def: Pick<Interaction, 'fields'>,
  key: SlideAnswerKeys,
  answers?: Responses | null,
): RoundJudgement {
  const fields: Record<string, FieldJudgement> = {};
  const answered = Boolean(answers && Object.keys(answers).length > 0);
  let allCorrect = answered;
  for (const f of def.fields) {
    const k = key?.[f.id];
    if (!k) continue;
    const actual = answers?.[f.id];
    if (f.kind === 'choice') {
      const expected = String(k.answer);
      const isAnswered = typeof actual === 'string';
      const correct = isAnswered && actual === expected;
      if (!correct) allCorrect = false;
      fields[f.id] = {
        correct,
        expected,
        ...(isAnswered ? { actual } : {}),
        ...(k.explanation ? { explanation: k.explanation } : {}),
      };
    } else if (f.kind === 'order') {
      const expected = Array.isArray(k.answer) ? [...k.answer] : [];
      const actualArr = Array.isArray(actual) ? [...actual] : undefined;
      const stepCorrect = expected.map((exp, i) => Boolean(actualArr && actualArr[i] === exp));
      const correct =
        Boolean(actualArr) &&
        actualArr!.length === expected.length &&
        stepCorrect.every(Boolean);
      if (!correct) allCorrect = false;
      fields[f.id] = {
        correct,
        expected,
        ...(actualArr ? { actual: actualArr } : {}),
        stepCorrect,
        ...(k.explanation ? { explanation: k.explanation } : {}),
      };
    }
  }
  if (!Object.keys(fields).length) allCorrect = false;
  return { answered, allCorrect, fields };
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
export function studentPromptRound(round: PollRound) {
  const { counts: _counts, total: _total, hasAnswerKey: _hasKey, reveal, ...prompt } = round;
  return structuredClone(round.reveal ? { ...prompt, reveal } : prompt);
}
export function studentResultsRound(round: PollRound) {
  const { hasAnswerKey: _hasKey, reveal, ...rest } = round;
  return structuredClone(round.reveal ? { ...rest, reveal } : rest);
}

/** The deadline display has no grace; only the server accepts a 3-second network grace. */
export const classroomDurations = [0, 30, 60, 90, 120, 180] as const;
export function interactionSeconds(
  round: { deadlineAt?: number; openedAt?: number } | null | undefined,
  now: number,
) {
  if (!round) return 0;
  return round.deadlineAt === undefined
    ? Math.max(0, Math.floor((now - (round.openedAt || now)) / 1000))
    : Math.max(0, Math.ceil((round.deadlineAt - now) / 1000));
}
export function interactionExpired(
  round: { deadlineAt?: number } | null | undefined,
  now: number,
) {
  return round?.deadlineAt !== undefined && now >= round.deadlineAt;
}
export function interactionTimeLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function validateInteractions(input: unknown): Interaction[] {
  if (!Array.isArray(input) || input.length > 100) throw Error('互動題目設定無效');
  const ids = new Set<string>();
  for (const d of input) {
    if (
      !d ||
      typeof d.slideId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,80}$/.test(d.slideId) ||
      ids.has(d.slideId) ||
      typeof d.title !== 'string' ||
      !d.title.trim() ||
      d.title.length > 200 ||
      !Array.isArray(d.fields) ||
      !d.fields.length ||
      d.fields.length > 20
    )
      throw Error('互動題目設定無效');
    ids.add(d.slideId);
    const fields = new Set<string>();
    for (const f of d.fields) {
      if (
        !f ||
        typeof f.id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(f.id) ||
        fields.has(f.id) ||
        !['choice', 'order'].includes(f.kind) ||
        typeof f.label !== 'string' ||
        !f.label.trim() ||
        f.label.length > 1000 ||
        !Array.isArray(f.options) ||
        f.options.length < 2 ||
        f.options.length > 20 ||
        new Set(f.options).size !== f.options.length ||
        f.options.some((s: unknown) => typeof s !== 'string' || !s.trim() || s.length > 500)
      )
        throw Error('互動欄位設定無效');
      fields.add(f.id);
    }
  }
  return structuredClone(input);
}
