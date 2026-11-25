// 課堂點名正式畫面的檢查用入口：用假的 API 回應把每個畫面狀態叫出來（不連後端）。
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AttendPage, AttendanceBanner, MyAttendancePage } from '../../src/Attendance';
import App from '../../src/App';
import { ATTENDANCE_GRACE_MS, stepIndex, stepRemainingMs, taipeiDate } from '../../shared/attendance';
import { memoryApi } from '../../src/service';
import TeachingControl from '../../src/TeachingControl';
import AttendanceAdmin from '../../src/AttendanceAdmin';
import '../../src/style.css';
import '../../src/attendance.css';

const q = new URLSearchParams(location.search);
const screen = q.get('screen') || '';
document.documentElement.style.setProperty('--font-scale', q.get('scale') || '1');
const T = Date.parse('2026-11-16T01:10:12Z');
const course: any = {
  id: '115-1-AP2',
  title: '解剖生理學（二）',
  term: '115-1',
  classIds: ['demo-a', 'demo-b', 'test'],
  classNames: { 'demo-a': '示範甲班', 'demo-b': '示範乙班' },
  features: { attendance: true },
};
const student: any = {
  uid: 'demo-07',
  email: 's0990007@example.edu',
  name: '示範學生 07',
  studentId: '0990007',
  classId: 'demo-a',
  teacher: false,
  enabled: true,
};
const refuse = (reason: string, message: string, extra = {}) =>
  Object.assign(new Error(message), { details: { reason, ...extra } });
const session = (over = {}) => ({
  id: '2026-11-16-p03-aaaa',
  kind: 'roll',
  date: '2026-11-16',
  period: 3,
  classIds: ['demo-a'],
  status: 'closed',
  startedAt: T - 12000,
  endsAt: T + 48000,
  expected: 60,
  counts: { present: 5, absent: 3 },
  backfilled: false,
  confirmedAt: T,
  durationSec: 60,
  codeSec: 60,
  qrSec: 15,
  ...over,
});
const rows = Array.from({ length: 8 }, (_, i) => ({
  email: `s099000${i + 1}@example.edu`,
  studentId: `099000${i + 1}`,
  name: `示範學生 0${i + 1}`,
  classId: 'demo-a',
  status: i < 3 ? 'absent' : 'present',
  signedAt: i < 3 ? 0 : T + i * 1000,
  via: i < 3 ? 'auto' : i === 7 ? 'teacher' : 'qr',
  edited: i === 7,
  editedAt: i === 7 ? T + 600000 : 0,
  locked: i === 2,
  sameDevice: i === 4 ? ['示範學生 06'] : i === 5 ? ['示範學生 05'] : [],
  pendingMail: i < 3 ? 'absent' : null,
  reopened: i === 4,
}));
const draftText = (name: string) =>
  `${name} 同學：\n\n示範課程　2026-11-16（一）第 3 節，本節紀錄為未到。\n\n如果對紀錄有疑問，請直接洽老師。\n\n示範教師`;
const notifyDrafts = {
  date: '2026-11-16',
  student: rows.slice(0, 3).map((r) => ({
    draftId: `x__${r.email}`,
    kind: 'absent',
    sessionId: 'x',
    date: '2026-11-16',
    period: 3,
    classId: 'demo-a',
    to: r.email,
    name: r.name,
    subject: '【示範課程】11/16（一）第 3 節紀錄為未到',
    text: draftText(r.name),
    expect: { status: 'absent', notifySeq: 0 },
  })),
  digest: [
    {
      draftId: 'digest__2026-11-16__demo-a',
      kind: 'digest',
      classId: 'demo-a',
      date: '2026-11-16',
      to: 'mentor-a@example.edu',
      name: '示範導師甲',
      subject: '【示範課程】demo-a 2026-11-16 出缺席彙整',
      text: '示範導師甲 老師您好：\n\n第 3 節\n應到 48 人，準時 45 人，未到 3 人。\n\n示範教師',
      periods: [3],
      supplement: false,
      unconfirmed: [4],
      ready: false,
      expect: { periods: [3] },
    },
  ],
  noMentor: ['demo-b'],
  unconfirmedToday: [session({ period: 4, confirmedAt: 0 })],
  gmailAccount: 'teacher@example.edu',
  log: [
    {
      id: 'm1',
      key: 'm1',
      kind: 'absent',
      to: 's0990001@example.edu',
      name: '示範學生 01',
      date: '2026-11-16',
      period: 2,
      status: 'marked',
      markedAt: T,
      byName: '示範教師',
      canUndo: true,
    },
    {
      id: 'm2',
      key: 'm2',
      kind: 'absent',
      to: 's0990002@example.edu',
      name: '示範學生 02',
      date: '2026-11-16',
      period: 2,
      status: 'undone',
      markedAt: T - 60000,
      byName: '示範教師',
      canUndo: false,
    },
  ],
};
const attendanceCalls: string[] = [];
const openedAt = Date.now();
const liveSession = session({
  status: 'open',
  id: '2026-11-16-t102000-aaaa-2',
  date: taipeiDate(openedAt),
  period: 4,
  startedAt: openedAt - 6000,
  endsAt: openedAt + 42000,
  codeSec: 18,
});
const liveMock = {
  requests: [] as number[],
  token: '',
  rejectNext: false,
  delayMs: 0,
  active: 0,
  maxActive: 0,
};
let endedByTeacher = false;
let liveActive = screen === 'admin-live';
const stored = [
  session({ id: '2026-11-16-t101500-aaaa-2', startedAt: T + 3900000, period: 4, confirmedAt: 0 }),
  session({ notified: true, reopenCount: 1 }),
];
const deleted: ReturnType<typeof session>[] = [];
const requests: { name: string; data: unknown }[] = [];
Object.assign(window, {
  attendanceFixture: {
    drafts: notifyDrafts,
    calls: attendanceCalls,
    requests,
    live: liveMock,
    unmount: () => root.unmount(),
  },
});
if (screen === 'control-disabled') course.features.attendance = false;
const api: any = {
  preview: screen === 'control-preview',
  async call(name: string, data: any) {
    if (name.startsWith('attendance')) { attendanceCalls.push(name); requests.push({ name, data: structuredClone(data) }); }
    if (name === 'getTeachingDeck') return { title: '示範簡報', slides: [{ id: 'demo', title: '示範', html: '<section>示範簡報</section>', notes: '', answerPage: false }] };
    if (name === 'attendanceCheckIn') {
      if (data.code) {
        if (screen === 'attend-wrong' || screen === 'banner-wrong')
          throw refuse('wrong-code', '數字碼不對', { left: 3 });
        return { result: 'ok', signedAt: T, date: '2026-11-16', period: 3 };
      }
      const kind = screen.replace('attend-', '');
      if (kind === 'makeup') return { result: 'ok', signedAt: T + 1920000, startedAt: T, reopened: true, date: '2026-11-16', period: 3 };
      if (kind === 'ok' || kind === 'duplicate' || kind === 'trial')
        return { result: kind, signedAt: T, date: '2026-11-16', period: 3 };
      const messages: Record<string, string> = {
        expired: 'QR 已過期，請再掃一次',
        'not-in-class': '這一節點名的名單裡沒有你',
        closed: '點名已經結束',
        locked: '已經輸入錯誤 5 次',
      };
      throw refuse(kind, messages[kind] || '此課程尚未開放此功能');
    }
    if (name === 'attendanceCurrent')
      return screen === 'banner-idle'
        ? { session: null }
        : {
            session: {
              id: 's',
              kind: 'roll',
              date: '2026-11-16',
              period: 4,
              endsAt: Date.now() + 42000,
            },
            now: Date.now(),
            signedAt: screen === 'banner-done' ? T : 0,
            locked: screen === 'banner-locked',
          };
    if (name === 'attendanceMine')
      return {
        counts: { total: 3, present: 2, absent: 1 },
        rows: [
          { id: 'mine2', date: '2026-11-16', period: 4, startedAt: T + 600000, status: 'present', signedAt: T + 1920000, reopened: true },
          { id: 'mine1', date: '2026-11-16', period: 3, startedAt: T, status: 'present', signedAt: T, edited: true },
          { id: 'mine0', date: '2026-11-04', period: 5, status: 'absent', signedAt: 0 },
        ],
      };
    if (name === 'attendanceClassCards') {
      return {
        classes: course.classIds.map((classId: string) => ({
          classId, members: classId === 'demo-a' ? rows.length : 0, test: classId === 'test',
          pendingConfirm: classId === 'demo-a' ? stored.filter(s => !s.confirmedAt).length : 0,
          pending: classId === 'demo-a' ? 3 : 0, todayCount: 0, live: liveActive && classId === 'demo-a',
          rate: classId === 'demo-a' ? 5 / 8 : null,
        })),
        now: Date.now(), expired: false, open: liveActive && !endedByTeacher && Date.now() <= liveSession.endsAt + ATTENDANCE_GRACE_MS ? liveSession : null,
      };
    }
    if (name === 'attendanceStart') {
      liveActive = true;
      endedByTeacher = false;
      liveSession.kind = data.trial ? 'trial' : 'roll';
      liveSession.startedAt = Date.now();
      liveSession.endsAt = liveSession.startedAt + data.durationSec * 1000;
      return { session: liveSession };
    }
    if (name === 'attendanceReopen') {
      liveActive = true;
      endedByTeacher = false;
      liveSession.id = data.sessionId;
      liveSession.endsAt = Date.now() + data.minutes * 60000;
      return { session: liveSession };
    }
    if (name === 'attendanceControl' && liveActive) {
      if (data.action === 'end') endedByTeacher = true;
      if (data.action === 'extend') liveSession.endsAt = Math.max(liveSession.endsAt, Date.now()) + 60000;
      return { session: liveSession };
    }
    if (name === 'attendanceLive') {
      if (!liveActive) return { session: null };
      liveMock.requests.push(Date.now() - openedAt);
      liveMock.active++;
      liveMock.maxActive = Math.max(liveMock.active, liveMock.maxActive);
      try {
        if (liveMock.delayMs) await new Promise((resolve) => setTimeout(resolve, liveMock.delayMs));
        if (liveMock.rejectNext) {
          liveMock.rejectNext = false;
          throw new Error('合成連線失敗');
        }
        const now = Date.now();
        const { startedAt, endsAt, qrSec, codeSec } = liveSession;
        if (endedByTeacher || now > endsAt + ATTENDANCE_GRACE_MS) return { session: null };
        liveMock.token = `${liveSession.id}.${stepIndex(now, startedAt, qrSec)}.AAAAAAAAAAAAAAAAAAAAAA`;
        return {
          session: liveSession,
          now,
          remainingMs: Math.max(0, endsAt - now),
          signed: 45 + Math.floor((now - openedAt) / 5000),
          code: String(4729 + stepIndex(now, startedAt, codeSec)),
          codeRemainingMs: stepRemainingMs(now, startedAt, codeSec),
          token: liveMock.token,
          qrRemainingMs: stepRemainingMs(now, startedAt, qrSec),
        };
      } finally {
        liveMock.active--;
      }
    }
    if (name === 'attendanceSessions')
      return {
        sessions: data.classId !== 'demo-a' ? [] : [...stored],
        deleted: data.classId !== 'demo-a' ? [] : [...deleted],
        open: liveActive && !endedByTeacher ? liveSession : null,
      };
    if (name === 'attendanceDeleteSession') {
      const index = stored.findIndex(s => s.id === data.sessionId);
      const item = stored.splice(index, 1)[0];
      deleted.push({ ...item, ...{ deletedAt: Date.now(), deletedReason: data.reason } });
      return { session: item };
    }
    if (name === 'attendanceRestoreSession') {
      const index = deleted.findIndex(s => s.id === data.sessionId);
      const item = deleted.splice(index, 1)[0];
      stored.push(item);
      return { session: item };
    }
    if (name === 'attendanceRoster') {
      const selected = stored.find(s => s.id === data.sessionId);
      return { session: selected || { ...liveSession, status: 'closed', confirmedAt: 0 }, rows };
    }
    if (name === 'attendanceSetStatus') {
      const affected = rows.filter(r => data.emails.includes(r.email));
      for (const r of affected) { r.status = data.status; r.edited = true; }
      return { changed: affected.length };
    }
    if (name === 'attendanceConfirm') {
      const item = stored.find(s => s.id === data.sessionId);
      if (item) item.confirmedAt = data.confirmed ? T : 0;
      return { session: item };
    }
    if (name === 'attendanceExport')
      return { filename: '點名合成.csv', csv: '班級,姓名\r\n示範甲班,示範學生 01\r\n' };
    if (name === 'attendanceNotifyDrafts') return notifyDrafts;
    if (name === 'attendanceMailConfig')
      return {
        mentors: { 'demo-a': { name: '示範導師甲', email: 'mentor-a@example.edu' } },
        platformUrl: '',
        teacherName: '示範教師',
        gmailAccount: '',
      };
    if (name === 'attendanceSummary')
      return {
        sessions: stored,
        rows: rows.map((r) => ({
          ...r,
          present: r.status === 'present' ? 2 : 0,
          absent: r.status === 'absent' ? 2 : 0,
          cells: [
            { status: r.status, edited: r.edited, makeupAt: 0 },
            { status: r.status, edited: false, makeupAt: r.reopened ? r.signedAt : 0 },
          ],
        })),
      };
    if (name === 'attendanceAuditLog')
      return {
        rows: [
          {
            at: T + 600000,
            date: '2026-11-16',
            period: 3,
            name: '示範學生 08',
            studentId: '0990008',
            from: 'absent',
            to: 'present',
            reason: '手機沒電，當面確認',
            byName: '示範教師',
          },
        ],
      };
    throw new Error('未模擬：' + name);
  },
};
function AdminAt() {
  return (
    <div style={{ padding: 12 }}>
      <AttendanceAdmin
        api={api}
        course={course}
        notify={(s) => {
          document.title = s;
        }}
      />
    </div>
  );
}
function installProjectionProbe() {
  let hidden = false;
  Object.defineProperty(document, 'hidden', { get: () => hidden });
  const timers = new Map<number, string>();
  const browserWindow: Window = window;
  const { setInterval, clearInterval, setTimeout, clearTimeout } = browserWindow;
  browserWindow.setInterval = (callback, delay, ...args) => {
    const id = setInterval(callback, delay, ...args);
    if (Number(delay) >= 1000) timers.set(id, 'interval');
    return id;
  };
  browserWindow.setTimeout = (callback, delay, ...args) => {
    if (typeof callback !== 'function') return setTimeout(callback, delay, ...args);
    const id = setTimeout(() => {
      timers.delete(id);
      callback(...args);
    }, delay);
    if (Number(delay) >= 1000) timers.set(id, 'timeout');
    return id;
  };
  browserWindow.clearInterval = (id) => {
    if (id !== undefined) timers.delete(id);
    clearInterval(id);
  };
  browserWindow.clearTimeout = (id) => {
    if (id !== undefined) timers.delete(id);
    clearTimeout(id);
  };
  window.projectionTest = {
    timers,
    setHidden(value) {
      hidden = value;
      document.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

if (q.has('projection-probe')) installProjectionProbe();

const root = createRoot(document.getElementById('root')!);
if (screen === 'feature-toggle') {
  const initial = { ...course, description: '合成測試', sheetsUrl: '', units: [], chapters: {},
    features: { assessments: false, teachingConsole: false, classroomInteraction: true, attendance: false },
  };
  const memory = memoryApi(initial, []);
  const calls: { name: string; data: any }[] = [];
  const featureApi: any = { preview: true, async call(name: string, data = {}) {
    calls.push({ name, data: structuredClone(data) });
    if (name.startsWith('attendance')) return api.call(name, data);
    return memory.call(name, data);
  } };
  Object.assign(window, { attendanceToggleTest: { calls, read: () => memory.call('bootstrap') } });
  root.render(<App initialApi={featureApi} />);
}
else if (screen.startsWith('attend-'))
  root.render(
    <AttendPage
      api={api}
      profile={screen === 'attend-login' || screen === 'attend-inapp' ? null : student}
      courses={[course]}
      loading={false}
      error=""
      onLogin={() => {}}
    />,
  );
else if (screen.startsWith('banner-'))
  root.render(
    <div className="student-interaction-host">
      <AttendanceBanner api={api} course={course} />
    </div>,
  );
else if (screen === 'my') root.render(<MyAttendancePage api={api} course={course} />);
else if (screen.startsWith('control-')) root.render(<TeachingControl api={api} course={course} notify={() => {}} changed={async () => {}} progress={null} />);
else if (screen.startsWith('admin-')) root.render(<AdminAt />);
else root.render(<p>未知的畫面</p>);
