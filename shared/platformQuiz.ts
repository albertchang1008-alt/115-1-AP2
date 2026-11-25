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

export interface QuizLeaveSummary {
  count: number;
  seconds: number;
  /** 最近一次離開還沒回來時，離開的時刻。 */
  awaySince?: number;
  episodes: { at: number; seconds?: number }[];
}

/** 依學生彙整切出畫面紀錄（#73）。round 未給時彙整所有輪次。 */
export function summarizeQuizLeaves(
  events: (QuizLeaveEvent & { visit?: string })[], round?: number,
): Record<string, QuizLeaveSummary> {
  const inRound = events.filter((event) => round === undefined || event.round === round);
  const key = (event: QuizLeaveEvent & { visit?: string }) =>
    [event.studentId, event.round, event.visit ?? '', event.episode].join('/');
  const back = new Map<string, number>();
  for (const event of inRound) if (event.kind === 'return') back.set(key(event), event.seconds ?? 0);
  const out: Record<string, QuizLeaveSummary> = {};
  for (const event of inRound.filter((row) => row.kind === 'leave').sort((a, b) => a.at - b.at)) {
    const row = out[event.studentId] ??= { count: 0, seconds: 0, episodes: [] };
    row.count++;
    const seconds = back.get(key(event));
    if (seconds === undefined) {
      row.awaySince = event.at;
      row.episodes.push({ at: event.at });
    } else {
      row.seconds += seconds;
      delete row.awaySince;
      row.episodes.push({ at: event.at, seconds });
    }
  }
  return out;
}

/** 切出紀錄 CSV（教師端下載）：姓名、次數、總秒數、各次時間。 */
export function quizLeaveCsv(
  rows: { name: string; summary: QuizLeaveSummary }[], time: (at: number) => string,
) {
  const cell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  };
  const lines = [['姓名', '離開次數', '離開總秒數', '各次（時間／秒數）'].join(',')];
  for (const { name, summary } of rows) lines.push([
    cell(name), summary.count, summary.seconds,
    cell(summary.episodes.map((row) => time(row.at) + '／' + (row.seconds ?? '未回')).join('；')),
  ].join(','));
  return '﻿' + lines.join('\n') + '\n';
}
