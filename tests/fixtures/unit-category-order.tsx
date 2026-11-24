import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CompletionPage, CourseEditor } from '../../src/App';
import Student from '../../src/Student';
import { emptyProgress, forClass, type Chapter, type Course, type Unit } from '../../shared/model';
import { memoryApi, type API } from '../../src/service';

const chapter = (title: string): Chapter => ({ title, description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] });
const category = (id: string, title: string, group = '消化系統'): Unit => ({
  ...chapter(title), group, id, bankVersion: 'bank-v2', questionCount: 5, visibility: 'current',
});

const initialCourse: Course = {
  id: 'category-order-test', title: '題目分類排序測試', description: '', term: '115-1', sheetsUrl: '',
  classIds: ['A'],
  classUnits: { A: ['mouth', 'heart', 'exam', 'swallow', 'stomach', 'overview'] },
  chapterOverrides: { A: { 消化系統: { threshold: 85 } } },
  chapters: { 消化系統: chapter('消化系統'), 循環系統: chapter('循環系統'), 複習考: chapter('複習考') },
  chapterOrder: ['消化系統', '循環系統', '複習考'],
  units: [
    { ...category('mouth', '口腔'), description: '舊章節說明', threshold: 75,
      wrongCarry: { 'bank-v2': { from: 'bank-v1', drop: ['fake-item'] } }, wrongCarryOrder: ['bank-v2'] },
    category('heart', '心臟', '循環系統'),
    category('swallow', '咽吞嚥'),
    { ...category('exam', '複習考', '複習考'), review: {
      drawCount: 5, sourceUnitIds: ['mouth'], sourceVersions: { mouth: 'bank-v2' },
      allocation: { mouth: 5 }, builtAt: 1, history: [],
    } },
    category('stomach', '胃'),
    category('overview', '總覽'),
  ],
};
const legacy = new URLSearchParams(location.search).has('legacy');
const course = legacy ? { ...initialCourse, chapters: undefined, chapterOrder: undefined } : initialCourse;
const progress = emptyProgress();
const mem = memoryApi(course, []);
const notices: string[] = [];
const notify = (message: string) => notices.push(message);
const published = () => mem.call<Course>('getPublished', { courseId: course.id });
let saved = course;
const api: API = { preview: false, async call<T>(name: string, data?: any) {
  if (name === 'getCompletion') return {
    course: await published(),
    rows: [{ uid: 'fixture', studentId: 'fixture-1', classId: 'A', name: '測試帳號', progress }],
    next: null,
  } as T;
  return mem.call<T>(name, data);
} };

function Editor() {
  const [current, setCourse] = useState(course);
  return <div className="app"><aside /><main>
    <CourseEditor course={current} api={api} save={async (draft) => {
      const { revision } = await api.call<{ revision: number }>('saveCourse', { course: draft });
      saved = { ...draft, revision };
      setCourse(saved);
      return saved;
    }} onPublished={setCourse} notify={notify} onDirty={() => {}} preview={() => {}} newCourse={() => {}}
      copyCourse={() => {}} archiveCourse={async () => {}} deleteCourse={async () => {}} deleting={false} />
  </main></div>;
}

const root = createRoot(document.getElementById('root')!);
Object.assign(window, { categoryOrderTest: {
  course, saved: () => saved, published,
  async mount(view: string) {
    const next = await published();
    if (view === 'student') root.render(<Student api={mem} course={forClass(next, 'A')} uid="fixture" preview notify={notify} />);
    if (view === 'completion') root.render(<CompletionPage course={next} api={api} notify={notify} />);
  },
} });
root.render(<Editor />);
