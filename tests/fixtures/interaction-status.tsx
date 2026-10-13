import { interactions } from '../../scripts/mi-interactions';
const MI_CLASSROOM_COURSE = '115-1-MI-國考精準對焦';
import React from 'react';
import { createRoot } from 'react-dom/client';
import TeachingControl from '../../src/TeachingControl';
import { StudentInteraction } from '../../src/ClassroomInteraction';
import {
  PollRound,
  tally,
  validateResponses,
} from '../../shared/classroom';
const course = {
  features: { assessments: true, teachingConsole: true, classroomInteraction: true },
  id: MI_CLASSROOM_COURSE,
  title: '互動狀態驗收',
  classIds: ['N551', 'N552'],
  units: [],
  chapters: {},
} as any;
let rounds: PollRound[] = [],
  replies: Record<string, any> = {},
  advance = 0;
const now = () => 1700000000000 + performance.now() + advance;
const slides = [
  { id: 'cover', title: '一般投影片', html: '<section style="background:#f8fafc;color:#183344;padding:140px;font-size:72px"><h1>一般投影片</h1><p>僅供本機驗收</p></section>', notes: '' },
  ...interactions.map((d) => ({
    id: d.slideId,
    title: d.title,
    html: `<section style="background:#f8fafc;color:#183344;padding:140px;font-size:72px"><h1>${d.title}</h1><p>本機合成投影片 · 題目內容未變更</p></section>`,
    notes: '僅供教師參考',
  })),
];
const api = {
  preview: false,
  async call(name: string, d: any = {}) {
    const active = rounds.find((r) => r.status === 'open');
    const round =
      rounds.find((r) => r.id === d.roundId) ||
      [...rounds].reverse().find((r) => !d.slideId || r.slideId === d.slideId);
    if (name === 'getClassroomConfig') return { interactions };
    if (name === 'getTeachingDeck') return { title: '本機合成簡報 · 無私有資料', slides };
    if (name === 'classroomInteractionReport')
      return {
        round: round || null,
        activeRound: active || null,
        serverNow: now(),
        rounds: [...rounds].reverse(),
      };
    if (name === 'controlClassroomInteraction') {
      if (d.action === 'open') {
        if ((active && active.id !== d.replaceRoundId) || (!active && d.replaceRoundId))
          throw Error('目前互動已變更，請重新確認');
        if (active) {
          active.status = 'closed';
          active.closedAt = now();
        }
        const def = interactions.find((q) => q.slideId === d.slideId)!;
        const next: PollRound = {
          ...def,
          id: 'round-' + (rounds.length + 1),
          number: rounds.filter((r) => r.slideId === d.slideId).length + 1,
          classIds: d.classIds,
          status: 'open',
          openedAt: now(),
          eligibleCount: 54,
          total: 0,
          counts: {},
          ...(d.durationSeconds ? { deadlineAt: now() + d.durationSeconds * 1000 } : {}),
        };
        rounds.push(next);
        return { round: structuredClone(next), serverNow: now() };
      }
      if (!round) throw Error('場次不存在');
      if (d.action === 'extend') {
        if (round !== active || round.deadlineAt === undefined) throw Error('不能延長');
        round.deadlineAt = Math.max(round.deadlineAt, now()) + 30000;
      } else {
        round.status = 'closed';
        round.closedAt = now();
      }
      return { round: structuredClone(round), serverNow: now() };
    }
    if (name === 'getClassroomInteraction') {
      const r = rounds.at(-1);
      if (!r) return { round: null, serverNow: now() };
      const { counts, total, ...prompt } = r;
      return {
        round: structuredClone(prompt),
        serverNow: now(),
        submitted: !!replies[r.id],
        answers: replies[r.id],
        ...(r.status === 'closed' ? { results: structuredClone(r) } : {}),
      };
    }
    if (name === 'submitClassroomInteraction') {
      if (replies[round!.id]) return { submitted: true, answers: replies[round!.id] };
      if (
        round?.status !== 'open' ||
        (round.deadlineAt !== undefined && now() > round.deadlineAt + 3000)
      )
        throw Error('時間到，作答已截止');
      const answers = validateResponses(round, d.answers);
      replies[round.id] = answers;
      rounds = rounds.map((r) => (r.id === round.id ? tally(r, answers) : r));
      return { submitted: true, answers };
    }
    return { rows: [] };
  },
} as any;
createRoot(document.getElementById('root')!).render(
  <>
    <div className="notice">
      <strong>本機合成資料，不連雲端</strong>
      <button onClick={() => (advance += 51000)}>快轉 51 秒</button>
      <button onClick={() => (advance += 30000)}>快轉 30 秒</button>
    </div>
    <main style={{ padding: 12 }}>
      <TeachingControl
        api={api}
        course={course}
        notify={() => {}}
        changed={async () => {}}
        progress={null}
      />
      <StudentInteraction api={api} course={course} />
    </main>
  </>,
);
