import { createRoot } from 'react-dom/client';
import { Analysis } from '../../src/App';
import { StudentAssessments, TeacherAssessments } from '../../src/Assessments';
import type { Course } from '../../shared/model';
import type { API } from '../../src/service';

const question = {
  id: 'render-safety-question', text: '解析安全顯示測試',
  options: [{ id: 'a', text: '選項甲' }, { id: 'b', text: '選項乙' }], answer: 'a', selected: 'a',
  explanation: '**第一段**<br>第二行<BR/>第三行<br />**末段** **未配對 <script>window.injectionRan=true</script><img src=x onerror="window.injectionRan=true">',
};
const course = { id: 'render-test', title: '測試課程', classIds: ['TEST'], units: [{ id: 'unit', title: '測試分類', bankVersion: 'v1', activities: [] }] } as unknown as Course;
const exam = { id: 'exam', title: '測試試卷', classIds: ['TEST'], kind: 'pretest', state: 'closed', released: true, total: 1, createdAt: 1, session: { state: 'submitted', submittedAt: 1, score: 100, correct: 1, answers: { [question.id]: 'a' } } };
const calls: string[] = [];
const api: API = { preview: false, async call(name) {
  calls.push(name);
  if (name === 'getAssessments') return { assessments: [exam] } as any;
  if (name === 'startAssessment') return { ...exam, serverAt: Date.now(), results: [question] } as any;
  if (name === 'previewAssessment') return { title: exam.title, questions: [question] } as any;
  if (name === 'getBank') return { questions: [question] } as any;
  if (name === 'getReports') return { rows: [{ unitId: 'unit', version: 'v1', modes: { all: { [question.id]: { students: 1, wrong: 0, options: { a: 1 } } } } }], next: null } as any;
  throw Error('Unexpected API: ' + name);
} };
const root = createRoot(document.getElementById('root')!);
const notify = (message: string) => { throw Error(message); };
(window as any).explanationSurfaceTest = {
  calls,
  mount(surface: string) {
    root.render(surface === 'analysis' ? <Analysis api={api} course={course} notify={notify} />
      : surface === 'student' ? <StudentAssessments api={api} course={course} />
        : <TeacherAssessments api={api} course={course} notify={notify} />);
  },
};
