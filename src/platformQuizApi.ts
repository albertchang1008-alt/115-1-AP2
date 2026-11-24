import { doc, collection, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore, type API } from './service';
import {
  quizSignalKey, type QuizControl, type QuizLeaveEvent, type QuizMonitor, type QuizSignal,
  type QuizStudentView, type QuizMoodResponse,
} from '../shared/platformQuiz';
import type { MoodCode } from '../shared/zuvioExt';

export type LiveLeaveEvent = QuizLeaveEvent & { id: string; visit: string };
type Listener<T> = (next: (value: T) => void, fail: (error: Error) => void) => () => void;

export interface QuizLive {
  signal(courseId: string, classId: string): Listener<QuizSignal | null>;
  recheck(courseId: string, classId: string): Promise<QuizSignal | null>;
  monitor(courseId: string, sittingId: string): Listener<QuizMonitor>;
  events(courseId: string, sittingId: string): Listener<LiveLeaveEvent[]>;
}

function signalRef(courseId: string, classId: string) {
  if (!firestore) throw Error('尚未設定小考連線');
  return doc(firestore, 'quizSignals', quizSignalKey(courseId, classId));
}

export const quizLive: QuizLive = {
  signal: (courseId, classId) => (next, fail) => onSnapshot(signalRef(courseId, classId),
    (snap) => next(snap.exists() ? snap.data() as QuizSignal : null), fail),
  async recheck(courseId, classId) {
    const snap = await getDoc(signalRef(courseId, classId));
    return snap.exists() ? snap.data() as QuizSignal : null;
  },
  monitor: (courseId, sittingId) => (next, fail) => {
    if (!firestore) throw Error('尚未設定小考連線');
    return onSnapshot(doc(firestore, 'courses', courseId, 'platformQuizzes', sittingId, 'monitor', 'summary'),
      (snap) => { if (snap.exists()) next(snap.data() as QuizMonitor); }, fail);
  },
  events: (courseId, sittingId) => (next, fail) => {
    if (!firestore) throw Error('尚未設定小考連線');
    const events = collection(firestore, 'courses', courseId, 'platformQuizzes', sittingId, 'events');
    return onSnapshot(query(events, orderBy('at', 'desc'), limit(80)),
      (snap) => next(snap.docs.map((row) => ({ ...row.data(), id: row.id } as LiveLeaveEvent))), fail);
  },
};

export interface QuizTeacherView {
  quiz: QuizControl;
  monitor: QuizMonitor;
  scores?: { studentId: string; score: number; makeup: number; extendedSeconds: number; blankStart: boolean }[];
}
export const quizStudent = (api: API, courseId: string, sittingId: string) => {
  function call<T>(name: string, data = {}) {
    return api.call<T>(name, { courseId, sittingId, ...data });
  }
  return {
    get: () => call<QuizStudentView>('quizGet'),
    start: (round: number) => call<QuizStudentView>('quizStart', { round }),
    save: (round: number, seq: number, answers: Record<string, string>, submit = false, automatic = false) =>
      call<QuizStudentView & { savedSeq: number }>('quizSave', { round, seq, answers, submit, automatic }),
    leave: (round: number, visit: string, episode: number, kind: 'leave' | 'return', seconds?: number) =>
      call<{ ok: boolean }>('quizLeave', { round, visit, episode, kind, ...(seconds === undefined ? {} : { seconds }) }),
    mood: (mood: MoodCode) => call<QuizMoodResponse>('quizMood', { mood }),
  };
};
