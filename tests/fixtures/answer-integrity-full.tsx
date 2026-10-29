import { ClassUsagePanel } from '../../src/ClassUsagePanel';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Quiz } from '../../src/Student';
import { StudentDetail } from '../../src/App';
import { AnswerIntegrityOverview } from '../../src/AnswerIntegrityPanel';
import { Flashcards, PracticeSession } from '../../src/PracticeModes';
import type { API } from '../../src/service';
import type { Attempt, Progress } from '../../shared/model';
import '../../src/style.css';
const compactStyle = document.createElement('style');
compactStyle.textContent =
  '@media(max-width:600px){.integrity-fixture-nav{display:none!important}}';
document.head.append(compactStyle);
const fixture = (window as any).__INTEGRITY_FIXTURE__;
function api(role: 'teacher' | 'student'): API {
  return {
    preview: false,
    async call(name: string, data: any) {
      const r = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data, role }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.message);
      return result;
    },
  };
}
const teacher = api('teacher'),
  student = api('student');
function Fixture() {
  const [view, setView] = useState('profile'),
    [run, setRun] = useState(0),
    [progress, setProgress] = useState<Progress>(fixture.progress);
  const [status, setStatus] = useState('');
  async function submit(a: Attempt) {
    const r = await student.call<any>('submitAttempt', { attempt: a });
    setProgress(r.progress);
    a.answers = r.attempt.answers;
    a.score = r.attempt.score;
    delete a.integrity;
    if (r.attempt.integrity) a.integrity = r.attempt.integrity;
    return '已保存';
  }
  return (
    <>
      <div
        className="integrity-fixture-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 3000,
          padding: 8,
          background: '#f3f6f8',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {[
          ['profile', '個人檔案'],
          ['class', '全班總覽'],
          ['usage', '使用情況'],
          ['quiz', '開始完整測驗'],
          ['flash', '開始閃卡'],
          ['wrong', '錯題練習'],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setRun((n) => n + 1);
            }}
          >
            {label}
          </button>
        ))}
        <small>本機驗證・全部為假資料</small>
      </div>
      <main style={{ maxWidth: 1500, margin: '90px auto 0', padding: 20 }}>
        {view === 'profile' && (
          <StudentDetail
            course={fixture.course}
            api={teacher}
            student={{ ...fixture.student, progress }}
            close={() => setView('class')}
            notify={setStatus}
          />
        )}
        {view === 'usage' && (
          <ClassUsagePanel api={teacher} courseId={fixture.course.id} classId="A" />
        )}
        {view === 'class' && (
          <AnswerIntegrityOverview key={run} course={fixture.course} api={teacher} classId="A" />
        )}
        {view === 'quiz' && (
          <Quiz
            key={run}
            questions={fixture.questions}
            course={fixture.course}
            unit={fixture.course.units[0]}
            full={true}
            mode="quiz"
            onSubmit={submit}
            onRetry={async () => {
              setRun((n) => n + 1);
            }}
            researchEnabled={false}
            onResearch={async () => {}}
            onClose={() => setView('class')}
          />
        )}
        {view === 'flash' && (
          <Flashcards
            key={run}
            api={student}
            courseId={fixture.course.id}
            rows={fixture.questions.map((q: any) => ({ q, unit: fixture.course.units[0] }))}
            onBack={() => setView('class')}
          />
        )}
        {view === 'wrong' && (
          <PracticeSession
            key={run}
            api={student}
            course={fixture.course}
            rows={fixture.questions.map((q: any) => ({ q, unit: fixture.course.units[0] }))}
            mode="review"
            onBack={() => setView('class')}
            onProgress={setProgress}
          />
        )}
        <p role="status">{status}</p>
      </main>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
