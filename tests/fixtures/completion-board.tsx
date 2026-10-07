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
