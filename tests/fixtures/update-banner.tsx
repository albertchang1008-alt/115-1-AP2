import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import UpdateBanner from '../../src/UpdateBanner';
import { Quiz } from '../../src/Student';
import { Flashcards, PracticeSession } from '../../src/PracticeModes';
import { StudentAssessments } from '../../src/Assessments';
import { StudentInteraction } from '../../src/ClassroomInteraction';
import { VERSION } from '../../shared/version';
import type { Course, Question } from '../../shared/model';
import type { API } from '../../src/service';
import '../../src/style.css';
import '../../src/answer-integrity.css';
import '../../src/update-banner.css';
const q: Question = {
    id: 'q',
    text: '示範題：開始活動前先做哪個步驟？',
    options: [
      { id: 'a', text: '閱讀說明' },
      { id: 'b', text: '交換想法' },
    ],
    answer: 'a',
    explanation: '先閱讀說明。',
  },
  unit = {
    id: 'u',
    title: '示範單元',
    description: '',
    bankVersion: 'v',
    required: true,
    threshold: 100,
    opensAt: '',
    dueAt: '',
    activities: [],
    visibility: 'current' as const,
  };
const course = {
  id: 'banner-demo',
  title: '本機橫幅驗證',
  classIds: ['A'],
  units: [unit],
  features: { classroomInteraction: true },
} as unknown as Course;
const api: API = {
  preview: false,
  async call(name, data: any) {
    if (name === 'getAssessments')
      return {
        assessments: [
          {
            id: 'exam',
            title: '假資料評量',
            state: 'open',
            total: 1,
            session: {
              state: 'active',
              answers: {},
              revision: 0,
              expiresAt: Date.now() + 480000,
              questions: [q],
            },
            questions: [q],
            serverAt: Date.now(),
          },
        ],
      } as any;
    if (name === 'startAssessment')
      return {
        id: 'exam',
        title: '假資料評量',
        state: 'open',
        total: 1,
        session: {
          state: 'active',
          answers: {},
          revision: 0,
          expiresAt: Date.now() + 480000,
          questions: [q],
        },
        questions: [q],
        serverAt: Date.now(),
      } as any;
    if (name === 'getClassroomInteraction')
      return {
        round: {
          id: 'round',
          interactionId: 'i',
          title: '假資料互動',
          status: 'open',
          fields: [
            { id: 'f', label: '選擇步驟', type: 'choice', options: ['閱讀說明', '交換想法'] },
          ],
          openedAt: Date.now(),
          number: 1,
        },
        submitted: false,
        serverNow: Date.now(),
      } as any;
    return {} as any;
  },
};
function Fixture() {
  const [view, setView] = useState('home'),
    [run, setRun] = useState(0);
  (window as any).bannerFixture = {
    setView: (v: string) => {
      setView(v);
      setRun((n) => n + 1);
    },
  };
  return (
    <>
      <UpdateBanner />
      {view === 'home' ? (
        <div className="app">
          <aside className="sidebar">
            <h2>115-1 AP2</h2>
            <p>教師示範</p>
          </aside>
          <main style={{ padding: 30 }}>
            <h1>課程總覽</h1>
            <p>本機驗證，所有資料均為假資料。</p>
            <p>
              目前載入版本：<strong>{VERSION}</strong>
            </p>
            <button onClick={() => setView('quiz')}>開始示範完整測驗</button>
            <section className="panel" style={{ marginTop: 24 }}>
              <h2>示範單元</h2>
              <p>此頁用來驗證前景版本檢查與手動重載。</p>
            </section>
          </main>
        </div>
      ) : view === 'flash' ? (
        <Flashcards key={run} rows={[{ q, unit }]} onBack={() => setView('home')} />
      ) : view === 'practice' ? (
        <PracticeSession
          key={run}
          rows={[{ q, unit }]}
          course={course}
          api={{ ...api, preview: true }}
          mode="review"
          onBack={() => setView('home')}
          onProgress={() => {}}
        />
      ) : view === 'assessment' ? (
        <StudentAssessments api={api} course={course} />
      ) : view === 'interaction' ? (
        <StudentInteraction api={api} course={course} />
      ) : (
        <Quiz
          key={run}
          questions={[q]}
          course={course}
          unit={view === 'review' ? { ...unit, review: {} as any } : unit}
          full={true}
          mode="quiz"
          researchEnabled={false}
          onResearch={async () => {}}
          onSubmit={async () => {
            await new Promise((r) => setTimeout(r, 500));
            return '已保存';
          }}
          onRetry={async () => setRun((n) => n + 1)}
          onClose={() => setView('home')}
        />
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
