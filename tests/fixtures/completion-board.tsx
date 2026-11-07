import { createRoot } from 'react-dom/client';
import { CompletionPage } from '../../src/App';
import type { API } from '../../src/service';
import { fixtureCourse, fixtureRows } from './completion-board-data';
const calls: any[] = [],
  notices: string[] = [];
let fail = false,
  paused = false;
const pending: (() => void)[] = [];
const api: API = {
  preview: false,
  async call(name, data) {
    calls.push({ name, data });
    if (paused) await new Promise<void>((resolve) => pending.push(resolve));
    if (fail) throw Error('測試：讀取失敗');
    if (name === 'getCompletion')
      return { course: fixtureCourse, rows: fixtureRows[data.classId], next: null } as any;
    if (name === 'getHistory') return { rows: [], next: null } as any;
    if (name === 'getStudentUnitAttempts')
      return { rows: [
        { clientAt: 1762345080000, score: 70, mode: 'quiz', full: true },
        { clientAt: 1762345860000, score: 85, mode: 'quiz', full: true },
        { clientAt: 1762434120000, score: 95, mode: 'flashcard', full: false },
      ], total: 3, truncated: false } as any;
    if (name === 'getActivitySessions')
      return { found: true, sessions: [
        { startedAt: 1762345000000, lastAt: 1762346000000, maxLevel: 4, estimated: true },
        { startedAt: 1762348000000, lastAt: 1762349000000, completedAt: 1762349000000, estimated: true },
        { startedAt: 1762430000000, lastAt: 1762431000000, completedAt: 1762431000000 },
      ] } as any;
    throw Error('未預期的API ' + name);
  },
};
const root = createRoot(document.getElementById('root')!);
(window as any).completionTest = {
  calls,
  notices,
  course: fixtureCourse,
  rows: fixtureRows,
  pending,
  mount() {
    root.render(
      <CompletionPage course={fixtureCourse} api={api} notify={(s) => notices.push(s)} />,
    );
  },
  setFail(value: boolean) {
    fail = value;
  },
  setPaused(value: boolean) {
    paused = value;
  },
  resolve() {
    pending.shift()?.();
  },
};
(window as any).completionTest.mount();
