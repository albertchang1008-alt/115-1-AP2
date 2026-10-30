import {
  Interaction,
  AnswerKeys,
  SlideAnswerKeys,
  validateInteractions,
  validateAnswerKeys,
} from './classroom';
import { TRUE_FALSE_OPTIONS } from './pptImport';

export type QuestionSnapshot = { interaction: Interaction | null; keys: SlideAnswerKeys };
export function questionSnapshot(
  interactions: Interaction[],
  keys: AnswerKeys,
  slideId: string,
): QuestionSnapshot {
  return {
    interaction: interactions.find((q) => q.slideId === slideId) || null,
    keys: keys[slideId] || {},
  };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
export function patchQuestion(
  interactions: Interaction[],
  keys: AnswerKeys,
  slideId: string,
  expected: QuestionSnapshot,
  next: QuestionSnapshot,
) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(slideId)) throw Error('slideId 無效');
  if (canonical(questionSnapshot(interactions, keys, slideId)) !== canonical(expected))
    throw Error('CONFLICT：此題已由其他分頁修改，請重新載入後再編輯');
  if (containsUndefined(next)) throw Error('不可包含 undefined');
  if (!next || !next.keys || typeof next.keys !== 'object' || Array.isArray(next.keys))
    throw Error('答案設定無效');
  if (
    next.interaction !== null &&
    (!next.interaction || typeof next.interaction !== 'object' || Array.isArray(next.interaction))
  )
    throw Error('題目格式無效');
  if (next.interaction) {
    if (next.interaction.slideId !== slideId) throw Error('只能修改目標 slideId');
    validateInteractions([next.interaction]);
    validateAnswerKeys([next.interaction], { [slideId]: next.keys });
    // A field with either fixed true/false token must retain the exact fixed pair.
    for (const field of next.interaction.fields) {
      if (
        field.options.some((o) => (TRUE_FALSE_OPTIONS as readonly string[]).includes(o)) &&
        (field.kind !== 'choice' || canonical(field.options) !== canonical(TRUE_FALSE_OPTIONS))
      )
        throw Error('是非題選項固定');
    }
  } else if (Object.keys(next.keys).length) throw Error('刪題不可保留答案');
  const index = interactions.findIndex((q) => q.slideId === slideId);
  const result = structuredClone(interactions);
  if (index >= 0) {
    if (next.interaction) result[index] = next.interaction;
    else result.splice(index, 1);
  } else if (next.interaction) result.push(next.interaction);
  validateInteractions(result);
  const answerKeys = structuredClone(keys);
  delete answerKeys[slideId];
  if (next.interaction && Object.keys(next.keys).length)
    answerKeys[slideId] = validateAnswerKeys([next.interaction], { [slideId]: next.keys })[slideId];
  return { interactions: result, answerKeys };
}

function containsUndefined(v: unknown): boolean {
  if (v === undefined) return true;
  return !!v && typeof v === 'object' && Object.values(v).some(containsUndefined);
}
