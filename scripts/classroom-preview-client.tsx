import { interactions } from './mi-interactions';
const MI_CLASSROOM_COURSE = '115-1-MI-國考精準對焦';
// Local-only preview fixture. This file is not an application entry or a deployed authentication path.
import React from 'react';
import { createRoot } from 'react-dom/client';
import TeachingControl from '../src/TeachingControl';
import { StudentInteraction } from '../src/ClassroomInteraction';
import {
  tally,
  validateResponses,
  visibleRound,
} from '../shared/classroom';
import '../src/style.css';
const params = new URLSearchParams(location.search),
  role = params.get('role') || 'teacher',
  uid = params.get('uid') || 'student-1',
  classId = params.get('class') || 'N551';
const key = '115-mi-classroom-local-preview-v3';
const course = {
  features: { assessments: true, teachingConsole: true, classroomInteraction: true },
  id: MI_CLASSROOM_COURSE,
  title: '115-MI課堂互動預覽',
  classIds: ['N551', 'N552', 'test'],
  units: [],
  chapters: {},
} as any;
function read() {
  return JSON.parse(localStorage.getItem(key) || '{"rounds":[],"responses":{}}');
}
const api = {
  preview: false,
  async call(name: string, d: any = {}) {
    if (name === 'getClassroomConfig') return { interactions };
    if (name === 'getTeachingDeck') return await fetch('./teacher-deck.json').then((r) => r.json());
    const s = read(),
      round = s.rounds.find((r: any) => r.id === d.roundId) || s.rounds.at(-1);
    if (name === 'classroomInteractionReport')
      return {
        round:
          (d.roundId
            ? round
            : d.slideId
              ? [...s.rounds].reverse().find((r: any) => r.slideId === d.slideId)
              : round) || null,
        activeRound: s.rounds.find((r: any) => r.status === 'open') || null,
        serverNow: Date.now(),
        ...(d.history ? { rounds: [...s.rounds].reverse() } : {}),
      };
    if (name === 'getClassroomInteraction') {
      const current = s.rounds.at(-1);
      if (!current || !current.classIds.includes(classId)) return { round: null };
      const { counts, total, ...prompt } = current,
        response = s.responses[current.id]?.[uid];
      return {
        round: prompt,
        serverNow: Date.now(),
        submitted: !!response,
        answers: response?.answers,
        ...(current.status === 'closed' ? { results: visibleRound(current) } : {}),
      };
    }
    if (name === 'classroomInteractionRecords') {
      const delay = Number(localStorage.getItem('115-mi-classroom-preview-records-delay') || 0);
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return {
        rows: Object.entries(s.responses[round.id] || {}).map(([id, r]: any) => ({
          ...r,
          uid: id,
          classId,
          name: '預覽學生',
          studentId: id,
        })),
      };
    }
    if (name === 'controlClassroomInteraction') {
      if (role !== 'teacher') throw Error('需要教師權限');
      if (d.action === 'open') {
        const active = s.rounds.find((r: any) => r.status === 'open');
        if ((active && active.id !== d.replaceRoundId) || (!active && d.replaceRoundId))
          throw Error('目前互動已變更，請重新確認');
        if (active) {
          active.status = 'closed';
          active.closedAt = Date.now();
        }
        const def = interactions.find((x) => x.slideId === d.slideId)!;
        const next = {
          ...def,
          id: crypto.randomUUID(),
          classIds: d.classIds,
          number: s.rounds.filter((r: any) => r.slideId === d.slideId).length + 1,
          status: 'open',
          openedAt: Date.now(),
          eligibleCount:
            d.classIds.includes('N551') && d.classIds.includes('N552')
              ? 54
              : d.classIds.includes('N551')
                ? 34
                : 20,
          ...(d.durationSeconds ? { deadlineAt: Date.now() + d.durationSeconds * 1000 } : {}),
          total: 0,
          counts: {},
        };
        s.rounds.push(next);
        localStorage.setItem(key, JSON.stringify(s));
        return { round: next, serverNow: Date.now() };
      }
      if (d.action === 'close') {
        round.status = 'closed';
        round.closedAt = Date.now();
      }
      if (d.action === 'extend') {
        if (round.status !== 'open' || round.deadlineAt === undefined)
          throw Error('只能延長倒數互動');
        round.deadlineAt = Math.max(round.deadlineAt, Date.now()) + 30000;
      } else if (d.action !== 'close') throw Error('操作無效');
      localStorage.setItem(key, JSON.stringify(s));
      return { round: visibleRound(round), serverNow: Date.now() };
    }
    if (name === 'submitClassroomInteraction') {
      if (localStorage.getItem('115-mi-classroom-preview-offline') === 'true')
        throw Error('連線中斷');
      const existing = s.responses[round.id]?.[uid];
      if (existing) return { submitted: true, answers: existing.answers };
      if (round.status !== 'open') throw Error('教師已結束作答');
      if (round.deadlineAt !== undefined && Date.now() > round.deadlineAt + 3000)
        throw Error('時間到，作答已截止');
      const answers = validateResponses(round, d.answers);
      s.responses[round.id] ||= {};
      s.responses[round.id][uid] = { answers };
      s.rounds[s.rounds.findIndex((r: any) => r.id === round.id)] = tally(round, answers);
      localStorage.setItem(key, JSON.stringify(s));
      return { submitted: true, answers };
    }
    return { ok: true };
  },
} as any;
createRoot(document.getElementById('root')!).render(
  <>
    <div className="notice">
      <strong>本機模擬預覽</strong> · 不連線正式Firestore、不建立正式測驗或成績。
      <a href="?role=teacher">教師</a> ／ <a href="?role=student&uid=student-1">學生1</a> ／{' '}
      <a href="?role=student&uid=student-2">學生2</a>{' '}
      <button
        onClick={() => {
          localStorage.removeItem(key);
          location.reload();
        }}
      >
        清除模擬紀錄
      </button>
    </div>
    <main style={{ maxWidth: role === 'teacher' ? 1280 : 760, margin: 'auto', padding: 16 }}>
      {role === 'teacher' ? (
        <TeachingControl
          api={api}
          course={course}
          notify={alert}
          changed={async () => {}}
          progress={<p>本預覽只測試課堂互動；既有完成度功能未變更。</p>}
        />
      ) : (
        <StudentInteraction api={api} course={course} />
      )}
    </main>
  </>,
);
