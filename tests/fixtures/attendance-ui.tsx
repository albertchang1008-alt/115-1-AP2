// 課堂點名正式畫面的檢查用入口：用假的 API 回應把每個畫面狀態叫出來（不連後端）。
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AttendPage, AttendanceBanner, MyAttendancePage } from '../../src/Attendance';
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
  classIds: ['demo-a', 'demo-b'],
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
  endsAt: T + 48000,
  expected: 60,
  counts: { present: 54, absent: 6 },
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
}));
const mailStatus = {
  student: rows
    .slice(0, 3)
    .map((r) => ({
      sessionId: 'x',
      date: '2026-11-16',
      period: 3,
      email: r.email,
      name: r.name,
      kind: 'absent',
    })),
  digest: [
    {
      classId: 'demo-a',
      mentorName: '示範導師甲',
      mentorEmail: 'mentor-a@example.edu',
      periods: [3],
    },
  ],
  unconfirmedToday: [session({ period: 4, confirmedAt: 0 })],
  dailyTime: '17:00',
  scheduledAt: 0,
  nextSendAt: 0,
  mailerReady: true,
  lastAuto: { at: T + 28000000, sent: 5, failed: 1, error: '' },
  log: [
    {
      id: 'm1',
      kind: 'absent',
      to: 's0990001@example.edu',
      name: '示範學生 01',
      status: 'sent',
      createdAt: T,
      sentAt: T,
      error: '',
    },
    {
      id: 'm2',
      kind: 'absent',
      to: 's0990002@example.edu',
      name: '示範學生 02',
      status: 'failed',
      createdAt: T,
      sentAt: 0,
      error: '模擬失敗',
    },
  ],
};
const api: any = {
  preview: false,
  async call(name: string, data: any) {
    if (name === 'attendanceCheckIn') {
      if (data.code) {
        if (screen === 'attend-wrong' || screen === 'banner-wrong')
          throw refuse('wrong-code', '數字碼不對', { left: 3 });
        return { result: 'ok', signedAt: T, date: '2026-11-16', period: 3 };
      }
      const kind = screen.replace('attend-', '');
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
        rows: [
          { date: '2026-11-16', period: 3, status: 'present', signedAt: T },
          { date: '2026-11-11', period: 5, status: 'present', signedAt: 0 },
          { date: '2026-11-04', period: 5, status: 'absent', signedAt: 0 },
        ],
      };
    if (name === 'attendanceLive')
      return screen === 'admin-live'
        ? {
            session: session({ status: 'open', period: 4, endsAt: Date.now() + 42000 }),
            now: Date.now(),
            remainingMs: 42000,
            signed: 45,
            code: '4729',
            codeRemainingMs: 42000,
            token: '2026-11-16-p04-aaaa.3.AAAAAAAAAAAAAAAAAAAAAA',
            qrRemainingMs: 9000,
          }
        : { session: null };
    if (name === 'attendanceSessions')
      return {
        sessions: [session({ id: '2026-11-16-p04-aaaa', period: 4, confirmedAt: 0 }), session()],
        open: null,
      };
    if (name === 'attendanceRoster') return { session: session(), rows };
    if (name === 'attendanceMailStatus') return mailStatus;
    if (name === 'attendanceMailConfig')
      return {
        mentors: { 'demo-a': { name: '示範導師甲', email: 'mentor-a@example.edu' } },
        dailyTime: '17:00',
        scheduledAt: 0,
        platformUrl: '',
        teacherName: '示範教師',
        mailerReady: true,
      };
    if (name === 'attendanceSummary')
      return {
        sessions: [session(), session({ id: 'b', date: '2026-11-11', period: 5 })],
        rows: rows.map((r) => ({
          ...r,
          present: r.status === 'present' ? 2 : 0,
          absent: r.status === 'absent' ? 2 : 0,
          cells: [
            { status: r.status, edited: r.edited },
            { status: r.status, edited: false },
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
function AdminAt({ view }: { view: string }) {
  React.useEffect(() => {
    const label = { sessions: '節次與名冊', summary: '總表與修改紀錄', mail: '寄信' }[view];
    if (label)
      [...document.querySelectorAll<HTMLButtonElement>('.att-tabs button')]
        .find((b) => b.textContent === label)
        ?.click();
  }, []);
  return (
    <div style={{ padding: 24 }}>
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
const root = createRoot(document.getElementById('root')!);
if (screen.startsWith('attend-'))
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
else if (screen.startsWith('admin-')) root.render(<AdminAt view={screen.slice(6)} />);
else root.render(<p>未知的畫面</p>);
