import Student from '../../src/Student';
import { useState } from 'react';
import { MixedScopeCard, MixedPractice } from '../../src/MixedPractice';
import { PracticeMode } from '../../shared/practice';
import { createRoot } from 'react-dom/client';
import { Flashcards, UnitWrongPractice } from '../../src/PracticeModes';
import {
  applyAttempt,
  effectiveWrong,
  updateWrong,
  Course,
  Progress,
  Question,
  Attempt,
} from '../../shared/model';
import { API } from '../../src/service';
const q = (id: string): Question => ({
  id,
  text: `練習題 ${id}`,
  options: [
    { id: 'a', text: '正確選項' },
    { id: 'b', text: '另一選項' },
  ],
  answer: 'a',
  explanation: '解說',
  socratic: { keyword: '關鍵字', trace: '學生不應看到的教師內容' },
});
const unit = {
  id: 'u',
  title: '血液分類',
  group: '血液',
  description: '',
  required: true,
  threshold: 80,
  opensAt: '',
  dueAt: '',
  bankVersion: 'v',
  questionCount: 37,
  activities: [],
};
const course: Course = {
  id: 'practice-test',
  title: '測試課程',
  description: '',
  term: '115-1',
  classIds: [],
  sheetsUrl: '',
  units: [unit],
};
const qs = Array.from({ length: 37 }, (_, i) => q('q' + i)),
  calls: any[] = [];
let progress: Progress;
const api: API = {
  preview: true,
  async call(name, data: any) {
    calls.push({ name, data });
    if (name === 'getProgress') return progress as any;
    if (name === 'setPreviewProgress') {
      progress = data.progress;
      return {} as any;
    }
    if (name === 'getBank')
      return {
        questions: qs.slice(0, data.unitId === 'u' ? 37 : data.unitId === 'u2' ? 4 : 3),
      } as any;
    if (name === 'submitMixedAttempts') {
      const results = await Promise.all(
        data.attempts.map((attempt: Attempt) => api.call<any>('submitAttempt', { attempt })),
      );
      return {
        progress,
        attempts: results.map((r) => r.attempt),
        summaries: results.map((r) => r.wrongSummary),
      } as any;
    }
    if (name === 'submitAttempt') {
      const a: Attempt = {
        ...data.attempt,
        receivedAt: Date.now(),
        answers: data.attempt.answers.map((r: any) => ({ ...r, correct: r.selected === 'a' })),
      };
      const wrongSummary = updateWrong(
        effectiveWrong(progress.units[a.unitId], unit, a.version),
        a.answers,
        a.receivedAt!,
      ).summary;
      progress = applyAttempt(progress, a, unit);
      return { progress, attempt: a, wrongSummary } as any;
    }
    throw Error(name);
  },
};
const mixedCourse: Course = {
  ...course,
  chapterOrder: ['心臟', '血液'],
  units: [
    unit,
    { ...unit, id: 'u2', title: '血液第二分類', questionCount: 4 },
    { ...unit, id: 'h', title: '心臟分類', group: '心臟', required: false, questionCount: 3 },
    { ...unit, id: 'archived', visibility: 'archived' },
    { ...unit, id: 'hidden', visibility: 'hidden' },
    {
      ...unit,
      id: 'exam',
      review: {
        sourceUnitIds: [],
        sourceVersions: {},
        drawCount: 1,
        allocation: {},
        builtAt: 1,
        history: [],
      },
    },
  ],
};
function MixedHarness({ small = false }: { small?: boolean }) {
  const c = small ? { ...mixedCourse, units: [mixedCourse.units[1]] } : mixedCourse;
  const [launch, setLaunch] = useState<{ mode: PracticeMode; n: number; ids: string[] } | null>(
      null,
    ),
    [p, setP] = useState(progress);
  return launch ? (
    <MixedPractice
      key={`${launch.mode}:${launch.n}`}
      api={api}
      course={c}
      progress={p}
      uid="student"
      mode={launch.mode}
      count={launch.n}
      selectedIds={launch.ids}
      onBack={() => setLaunch(null)}
      onProgress={setP}
    />
  ) : (
    <MixedScopeCard
      course={c}
      progress={p}
      uid="student"
      onStart={(mode, n, ids) => setLaunch({ mode, n, ids })}
    />
  );
}
const root = createRoot(document.getElementById('root')!);
let key = 0;
(window as any).practiceTest = {
  calls,
  course,
  qs,
  mount(kind: string) {
    calls.length = 0;
    const at = kind === 'today' ? Date.now() : Date.now() - 86400000;
    progress = {
      units: {
        u: {
          best: 80,
          attempts: 1,
          updatedAt: at,
          wrong: { v: Object.fromEntries(qs.map((q, i) => [q.id, { n: 37 - i, at }])) },
        },
        u2: {
          best: -1,
          attempts: 1,
          updatedAt: at,
          wrong: { v: { q0: { n: 2, at: Date.now() } } },
        },
      },
      activities: {},
    };
    const back = () => root.render(<p>已返回</p>);
    if (kind === 'student') {
      progress = { units: {}, activities: {} };
      root.render(
        <Student
          key={++key}
          api={api}
          course={course}
          uid="student"
          preview
          notify={(s) => {
            throw Error(s);
          }}
        />,
      );
      return;
    }
    root.render(
      kind.startsWith('mixed') ? (
        <MixedHarness key={++key} small={kind === 'mixed-small'} />
      ) : kind === 'flash' ? (
        <Flashcards
          key={++key}
          rows={qs.slice(0, 2).map((q) => ({ q, unit }))}
          onBack={back}
          onPractice={back}
        />
      ) : (
        <UnitWrongPractice
          key={++key}
          api={api}
          course={course}
          unit={
            kind === 'exam'
              ? {
                  ...unit,
                  review: {
                    sourceUnitIds: [],
                    sourceVersions: {},
                    drawCount: 1,
                    allocation: {},
                    builtAt: 1,
                    history: [],
                  },
                }
              : unit
          }
          progress={progress}
          onBack={back}
          onProgress={(p) => {
            progress = p;
          }}
        />
      ),
    );
  },
};
