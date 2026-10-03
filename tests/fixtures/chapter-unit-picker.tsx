import { createRoot } from 'react-dom/client';
import { Bank, Analysis } from '../../src/App';
import ResearchEvidence from '../../src/ResearchEvidence';
import type { Course } from '../../shared/model';
import type { API } from '../../src/service';
const chapter = (title: string) => ({ title, description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] });
const unit = (id: string, group: string, title: string) => ({ ...chapter(title), id, group, bankVersion: `version-${id}`, activities: [] });
const course: Course = { id: 'picker-test', title: '測試課程', description: '', term: '115-1', sheetsUrl: '', classIds: ['A'], chapters: { A: chapter('血液'), B: chapter('心臟II'), empty: chapter('尚無題庫') }, chapterOrder: ['B', 'A', 'empty'], units: [unit('a1', 'A', '血液成分與血漿'), unit('b1', 'B', '心輸出量'), unit('b2', 'B', '血壓測量')] };
const calls: any[] = [], pending: ((value: any) => void)[] = [];
const rows = course.units.map(u => ({ unitId: u.id, version: u.bankVersion, modes: { all: { ['question-'+u.id]: { students: 2, wrong: 1, options: { A: 2 } } } } }));
const api: API = { preview: false, async call(name, data) {
  calls.push({ name, data });
  if (name === 'getSyncStatus') return { sheetId: '' } as any;
  if (name === 'getBank') return { questions: [{ id: `loaded-${data.unitId}`, text: `已載入 ${data.unitId}`, options: [{ id: 'A', text: '選項' }], answer: 'A', concept: '' }] } as any;
  if (name === 'getReports') return new Promise(resolve => pending.push(resolve)) as any;
  throw Error('未預期的 API：'+name);
} };
const root = createRoot(document.getElementById('root')!);
const notify = (s: string) => { throw Error(s); };
(window as any).pickerTest = { calls, rows, pending,
  mount(kind: string) { localStorage.clear(); root.render(kind === 'bank' ? <Bank course={course} api={api} notify={notify} onSynced={async () => {}} /> : kind === 'analysis' ? <Analysis course={course} api={api} notify={notify} /> : <ResearchEvidence course={course} api={api} notify={notify} />); },
  resolve(index: number, resultRows = rows) { pending[index]({ rows: resultRows, next: null, job: { updatedAt: 1 } }); },
};
