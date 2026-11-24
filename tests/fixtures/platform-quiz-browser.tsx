import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { QuizStudentCard, type QuizStudentScreen } from '../../src/PlatformQuizStudent';
import { PlatformQuizTeacher, QuizClassDirectory } from '../../src/PlatformQuizTeacher';
import { platformScoreDistribution, type QuizControl, type QuizMonitor, type QuizStudentView } from '../../shared/platformQuiz';
import { Report } from '../../src/ZuvioExams';
import type { QuizLive } from '../../src/platformQuizApi';
import type { API } from '../../src/service';
import type { ZuvioApi } from '../../src/zuvioApi';
import '../../src/style.css';
import '../../src/zuvio-exams.css';
import '../../src/platform-quiz.css';

const params = new URLSearchParams(location.search);
document.documentElement.style.setProperty('--font-scale', params.get('scale') === 'xlarge' ? '1.3' : '1');
const sittingId = '16d0d163-f284-4608-905d-19106c696047';
const now = Date.now();
const courseId = 'quiz-fixture';
const classId = 'fixture-A';
const questions = [
  { id: 'item-one', text: '合成操作題。完成前想換一個選項，應該怎麼做？',
    options: [{ id: 'a', text: '在同一題選擇另一個答案' }, { id: 'b', text: '先離開作答畫面再回來' }] },
  { id: 'item-two', text: '合成操作題。作答結束後到哪裡看結果？',
    options: [{ id: 'a', text: '在這場小考的成績頁查看' }, { id: 'b', text: '在其他班級的課程頁查看' }] },
];
const view: QuizStudentView = {
  sittingId, title: '平台小考操作示例', label: '第一場', state: 'open', round: 0, serverAt: now,
  deadline: now + 600000, count: questions.length, canStart: true, questions,
  result: { score: 4, max: 8, correct: 1, makeup: 0, extendedSeconds: 120, questions: questions.map((q) => ({
    ...q, selected: 'b', answer: 'a', explanation: '這段解析僅用於確認手機版閱讀尺寸。',
  })) },
};
const students: QuizMonitor['students'] = {
  pending: { name: '合成甲生' }, active: { name: '合成乙生', startedRound: 0, extendedSeconds: 120 },
  done: { name: '合成丙生', startedRound: 0, submittedRound: 0 },
};
const quiz: QuizControl = {
  courseId, examId: 'exam', classId, title: view.title, label: view.label, itemCount: view.count,
  state: 'open', round: 0, ctl: 0, baseSeconds: 60, extendSeconds: 0, openedAt: now, deadline: now + 60000,
  finalDeadline: now + 180000, extensions: {}, makeupIds: [], releasedRound: -1, releasedAtByRound: {}, releasedAt: 0, closedAt: 0,
};
const baseMonitor: QuizMonitor = {
  state: 'open', ctl: 0, round: 0, deadline: quiz.deadline, finalDeadline: quiz.finalDeadline,
  makeupIds: [], prep: 'complete', students,
};
const listed = {
  exam: { id: 'exam', title: view.title, createdAt: now, count: 2, score: 4, archived: false,
    answerMode: 'platform' as const, sittings: [] as import('../../src/zuvioApi').Sitting[] },
  sitting: { id: sittingId, label: '第一場', date: '2026-11-25', classIds: [classId], platformState: 'released' as const },
};
const sitting = listed.sitting;
listed.exam.sittings.push(sitting);
const stats = {
  subscriptions: 0, disposals: 0, active: 0, calls: 0,
  onMonitor: undefined as undefined | ((monitor: QuizMonitor) => void),
};
let serverState: QuizControl['state'] = params.get('screen') === 'prepare' ? 'prepared'
  : params.get('screen') === 'results' ? 'released' : 'open';
function serverMonitor(): QuizMonitor {
  return { ...baseMonitor, state: serverState, ...(serverState === 'prepared' ? { deadline: 0, finalDeadline: 0 } : {}) };
}
function subscription<T>(value: T, next: (value: T) => void) {
  stats.subscriptions++;
  stats.active++;
  let live = true;
  queueMicrotask(() => { if (live) next(value); });
  return () => {
    if (!live) return;
    live = false;
    stats.disposals++;
    stats.active--;
  };
}
const live: QuizLive = {
  monitor: () => (next) => {
    stats.onMonitor = next;
    return subscription(serverMonitor(), next);
  },
  events: () => (next) => subscription([{
    id: 'event', studentId: 'active', visit: 'test', round: 0, episode: 1, kind: 'leave', at: now,
  }], next),
  signal: () => () => () => {},
  recheck: async () => null,
};
const api: API = {
  preview: false,
  async call<T>(name: string, req: { action?: string }) {
    stats.calls++;
    if (name === 'quizControl' && req.action === 'end') {
      serverState = 'closing';
      stats.onMonitor?.(serverMonitor());
      serverState = 'released';
    }
    return { quiz: { ...quiz, state: serverState }, monitor: serverMonitor(),
      scores: [{ studentId: 'done', score: 4, makeup: 1, blankStart: false, extendedSeconds: 120 }],
    } as T;
  },
};
const reportApi = {
  listExams: async () => [listed.exam],
  fullReport: async () => ({
    report: { students: 1, questions: [], subunits: [], classes: [] }, compare: null, moodEnabled: false,
    platformStats: platformScoreDistribution([4], 8),
  }),
} as unknown as ZuvioApi;
Object.assign(window, {
  quizMonitorTest: {
    stats,
    closeServer: () => {
      serverState = 'closing';
      stats.onMonitor?.(serverMonitor());
      serverState = 'released';
    },
    setHidden: (hidden: boolean) => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
      document.dispatchEvent(new Event('visibilitychange'));
    },
  },
});
function Fixture() {
  const [screen, setScreen] = useState(params.get('screen') || 'waiting');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [className, setClass] = useState(screen === 'class-quizzes' ? classId : '');
  const teacher = ['classes', 'class-quizzes', 'prepare', 'monitor', 'results', 'away'].includes(screen);
  if (!teacher) return <main className="pq-link-page">
    <QuizStudentCard screen={screen as QuizStudentScreen} view={screen === 'submitted' ? { ...view, session: { state: 'submitted', seq: 1, answers } } : view} seconds={420} answers={answers}
      choose={(id, option) => setAnswers({ ...answers, [id]: option })}
      primary={() => setScreen(({ ready: 'answering', answering: 'confirm', confirm: 'mood', feedback: 'submitted' } as Record<string, string>)[screen] || screen)}
      secondary={() => setScreen(screen === 'confirm' ? 'answering' : screen)}
      mood={() => setScreen('feedback')} feedback="你可以休息一下，再回到課程。" />
  </main>;
  return <main className="zuvio pq-fixture-shell">
    <button type="button" onClick={() => setScreen('away')}>切換到別的課程</button>
    {screen === 'away' ? <p>已離開小考</p> : screen === 'classes' || screen === 'class-quizzes'
      ? <QuizClassDirectory classes={[{ classId, name: '合成甲班', count: 3 }]} exams={[listed.exam]} selected={className}
        select={setClass} back={() => setClass('')} open={() => setScreen('results')} />
      : <PlatformQuizTeacher api={api} live={live} courseId={courseId} className="合成甲班"
        row={listed} reload={() => {}} back={() => { setClass(classId); setScreen('class-quizzes'); }}
        report={() => <Report api={reportApi} initial="exam" classScope={classId} sittingScope={sittingId} moodEnabled={false} />} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
