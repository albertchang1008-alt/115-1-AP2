import { Question } from './model';
export type ExamKind = 'pretest' | 'posttest';
export type ExamQuestion = Pick<Question, 'id' | 'text' | 'options'> & { image?: string };
export function publicExamQuestion(q: Question): ExamQuestion {
  return {
    id: q.id,
    text: q.text,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    ...(q.image ? { image: q.image } : {}),
  };
}
export function examAnswers(questions: Question[], raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('選答格式錯誤');
  const answers = raw as Record<string, unknown>,
    out: Record<string, string> = {};
  for (const [qid, value] of Object.entries(answers)) {
    const q = questions.find((q) => q.id === qid);
    if (!q || typeof value !== 'string' || !q.options.some((o) => o.id === value))
      throw Error('題目或選項不屬於本試卷');
    out[qid] = value;
  }
  return out;
}
export function examGrade(questions: Question[], answers: Record<string, string>) {
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  return {
    correct,
    total: questions.length,
    score: Math.round((correct / questions.length) * 100),
  };
}
