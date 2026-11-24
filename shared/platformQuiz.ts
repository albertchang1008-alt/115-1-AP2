import type { MoodCode } from './zuvioExt';

export type QuizState = 'prepared' | 'announced' | 'open' | 'closing' | 'released';
export type QuizSignal = { sittingId: string; state: QuizState; deadline: number };
export type QuizAnswerMode = 'zuvio' | 'platform';
export const quizSittingId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const quizSignalKey = (courseId: string, classId: string) => courseId + '_' + classId;

export interface QuizControl {
  courseId: string;
  examId: string;
  classId: string;
  title: string;
  label: string;
  itemCount: number;
  state: QuizState;
  round: number;
  ctl: number;
  baseSeconds: number;
  extendSeconds: number;
  openedAt: number;
  deadline: number;
  finalDeadline: number;
  extensions: Record<string, number>;
  makeupIds: string[];
  releasedRound: number;
  releasedAt: number;
  releasedAtByRound: Record<string, number>;
  closedAt: number;
}

export interface QuizMonitorStudent {
  name: string;
  startedRound?: number;
  submittedRound?: number;
  extendedSeconds?: number;
}

export interface QuizMonitor {
  state: QuizState;
  round: number;
  ctl: number;
  deadline: number;
  finalDeadline: number;
  makeupIds: string[];
  prep: 'none' | 'pending' | 'complete' | 'incomplete';
  students: Record<string, QuizMonitorStudent>;
}

export interface QuizLeaveEvent {
  studentId: string;
  round: number;
  episode: number;
  kind: 'leave' | 'return';
  at: number;
  seconds?: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

export interface QuizStudentView {
  sittingId: string;
  title: string;
  label: string;
  state: QuizState;
  round: number;
  serverAt: number;
  deadline: number;
  count: number;
  canStart: boolean;
  session?: { state: 'active' | 'submitted' | 'expired'; seq: number; answers: Record<string, string> };
  questions?: QuizQuestion[];
  moodRequired?: boolean;
  result?: {
    score: number;
    max: number;
    correct: number;
    makeup: number;
    extendedSeconds: number;
    questions: (QuizQuestion & { answer: string; selected: string; explanation: string })[];
  };
}

export interface QuizMoodResponse { mood: MoodCode; feedback: string }

export function quizHash(courseId: string, sittingId: string) {
  return '#/course/' + encodeURIComponent(courseId) + '/quiz/' + encodeURIComponent(sittingId);
}

export function parseQuizHash(hash: string): { courseId: string; sittingId: string } | null {
  const match = /^#\/course\/([^/]+)\/quiz\/([^/?]+)$/.exec(hash);
  if (!match || !quizSittingId.test(match[2])) return null;
  try {
    return { courseId: decodeURIComponent(match[1]), sittingId: match[2] };
  } catch {
    return null;
  }
}

export function platformScoreDistribution(scores: number[], maxScore: number) {
  const sorted = [...scores].sort((a, b) => a - b);
  const count = sorted.length;
  const bins = Array.from({ length: 10 }, (_, i) => ({
    label: i === 9 ? '90–100%' : (i * 10) + '–' + (i * 10 + 9) + '%',
    count: 0,
  }));
  for (const score of sorted) {
    const bin = maxScore > 0 ? Math.max(0, Math.min(9, Math.floor((score * 10) / maxScore))) : 0;
    bins[bin].count++;
  }
  return {
    count,
    maxScore,
    mean: count ? Math.round((sorted.reduce((sum, score) => sum + score, 0) / count) * 100) / 100 : null,
    median: count ? (sorted[Math.floor((count - 1) / 2)] + sorted[Math.floor(count / 2)]) / 2 : null,
    min: sorted[0] ?? null,
    max: sorted.at(-1) ?? null,
    bins,
  };
}
