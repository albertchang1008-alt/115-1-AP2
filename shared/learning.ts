export interface LearningEvent {
  id: string;
  type: 'explore' | 'answer' | 'hint' | 'time' | 'completed';
  nodeId?: string;
  questionId?: string;
  correct?: boolean;
  seconds?: number;
}
export interface LearningSummary {
  nodes: string[];
  answers: Record<string, { attempts: number; firstCorrect: boolean }>;
  hints: number;
  activeSeconds: number;
  completed: boolean;
}
export const emptyLearning = (): LearningSummary => ({ nodes: [], answers: {}, hints: 0, activeSeconds: 0, completed: false });
export function validEvent(e: LearningEvent) {
  return !!e && typeof e.id === 'string' && /^[\w-]{1,100}$/.test(e.id) && (
    e.type === 'completed' ||
    (e.type === 'explore' && typeof e.nodeId === 'string' && /^[\w-]{1,100}$/.test(e.nodeId)) ||
    (e.type === 'answer' && typeof e.questionId === 'string' && /^[\w-]{1,100}$/.test(e.questionId) && typeof e.correct === 'boolean') ||
    (e.type === 'hint' && typeof e.questionId === 'string' && /^[\w-]{1,100}$/.test(e.questionId)) ||
    (e.type === 'time' && Number.isFinite(e.seconds) && e.seconds! > 0 && e.seconds! <= 60)
  );
}
export function reduceLearning(old: LearningSummary, events: LearningEvent[]): LearningSummary {
  const result = structuredClone(old);
  for (const e of events) {
    if (!validEvent(e)) throw Error('教材事件格式無效');
    if (e.type === 'explore' && !result.nodes.includes(e.nodeId!)) result.nodes.push(e.nodeId!);
    if (e.type === 'answer') {
      const q = result.answers[e.questionId!] ||= { attempts: 0, firstCorrect: !!e.correct };
      q.attempts++;
    }
    if (e.type === 'hint') result.hints++;
    if (e.type === 'time') result.activeSeconds += e.seconds!;
    if (e.type === 'completed') result.completed = true;
  }
  if (result.nodes.length > 500 || Object.keys(result.answers).length > 500) throw Error('教材節點或題目數超過限制');
  return result;
}
export function learningMetrics(s: LearningSummary) {
  const answers = Object.values(s.answers);
  return { nodes: s.nodes.length, firstCorrect: answers.filter((q) => q.firstCorrect).length, questions: answers.length, attempts: answers.reduce((n, q) => n + q.attempts, 0) };
}
