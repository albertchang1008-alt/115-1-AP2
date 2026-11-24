import { createRoot } from 'react-dom/client';
import type { Attempt, Course, Question, Unit } from '../../shared/model';
import { emptyProgress } from '../../shared/model';
import { Explanations } from '../../src/QuestionContent';
import { Quiz } from '../../src/Student';
import { Flashcards, PracticeSession } from '../../src/PracticeModes';
import ThemePicker, { applySavedTheme } from '../../src/ThemePicker';
import FontSizePicker from '../../src/FontSizePicker';
import type { API } from '../../src/service';

const options = [
  { id: 'b', text: '長方形' },
  { id: 'a', text: '三角形' },
  { id: 'd', text: '圓形' },
  { id: 'c', text: '六邊形' },
];
const questions: Question[] = ['甲', '乙', '丙'].map((label, i) => ({
  id: `sample-${i}`,
  text: `示例${label}：哪個圖形沒有頂點？`,
  options,
  answer: 'd',
  explanation: '圓形的外圍由一條平滑、封閉的曲線構成。',
  source: i === 0 ? '圖形' : '曲線',
  lectureUrl: 'https://example.test/materials/shapes/',
  lectureTitle: '平面圖形的特徵',
  ...(i === 0 && {
    remedialUrl: 'https://example.test/materials/extra/',
    socratic: { memory: '圓周上看不到角。' },
  }),
}));
const unit: Unit = {
  id: 'shapes', title: '圖形練習', description: '', required: true,
  threshold: 60, opensAt: '', dueAt: '', bankVersion: 'v1', activities: [],
};
const reviewUnit: Unit = {
  ...unit,
  review: { sourceUnitIds: [], sourceVersions: {}, drawCount: 3, allocation: {}, builtAt: 1, history: [] },
};
const secondUnit = { ...unit, id: 'another', title: '綜合練習分類' };
const course: Course = { id: 'sample', title: '示例課程', term: 'test', description: '', sheetsUrl: '', classIds: [], units: [unit, secondUnit] };
const submitted: Attempt[] = [];
const mixedRows = [
  { q: questions[0], unit },
  { q: questions[0], unit: secondUnit },
];
const rows = questions.map((q) => ({ q, unit }));
const summary = { removed: 0, todayCorrect: 0, wrong: 0 };
const api: API = {
  preview: true,
  async call(name, data) {
    if (name !== 'submitAttempt' && name !== 'submitMixedAttempts') throw Error('Unexpected API: ' + name);
    const attempts: Attempt[] = name === 'submitMixedAttempts' ? data.attempts : [data.attempt];
    submitted.push(...attempts);
    const saved = attempts.map((attempt) => ({
      ...attempt,
      answers: attempt.answers.map((answer) => ({ ...answer, correct: answer.selected === 'd' })).reverse(),
    }));
    const progress = emptyProgress();
    return (name === 'submitMixedAttempts'
      ? { attempts: saved.reverse(), summaries: saved.map(() => summary), progress }
      : { attempt: saved[0], wrongSummary: summary, progress }) as any;
  },
};
function Surface({ kind }: { kind: string }) {
  if (kind === 'guides') return (
    <div>
      <section id="teacher-guide"><Explanations q={questions[0]} audience="teacher" outcome="correct" /></section>
      <section id="unknown-guide"><Explanations q={questions[0]} /></section>
      <section id="missing-guide"><Explanations q={{ ...questions[0], lectureUrl: undefined }} outcome="wrong" /></section>
    </div>
  );
  if (kind === 'flashcards') return <Flashcards rows={rows} onBack={() => {}} />;
  if (kind === 'mixed' || kind === 'wrong') return (
    <PracticeSession api={api} course={course} rows={kind === 'mixed' ? mixedRows : rows.slice(0, 2)}
      mode={kind === 'wrong' ? 'review' : 'quiz'} mixed={kind === 'mixed'} onBack={() => {}} onProgress={() => {}} />
  );
  return <Quiz questions={questions} full={kind !== 'draw'} mode="quiz" course={course}
    unit={kind === 'review' ? reviewUnit : unit} researchEnabled={false} onResearch={async () => {}}
    onSubmit={async (attempt) => { submitted.push(attempt); return '已保存'; }} onRetry={async () => {}} onClose={() => {}} />;
}

const root = createRoot(document.getElementById('root')!);
Object.assign(window, {
  answerReviewTest: {
    submitted,
    mount(kind: string) {
      submitted.length = 0;
      applySavedTheme();
      root.render(<><div hidden><ThemePicker /><FontSizePicker /></div><Surface key={kind} kind={kind} /></>);
    },
  },
});
