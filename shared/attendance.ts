// 課堂點名（#67）共用的純函式：前端、後端與測試都用這一份。
// 狀態只有兩種（教師 2026-11-16 23:10）：準時／未到；老師可互改，每次修改留時間紀錄。

export type AttendanceStatus = 'present' | 'absent';
export const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  present: '準時',
  absent: '未到',
};
export const ATTENDANCE_FORMAT_VERSION = 1;
export const ATTENDANCE_GRACE_MS = 5000; // 網路延遲寬限
export const ATTENDANCE_MAX_WRONG = 5;
export const ATTENDANCE_RESTORE_MS = 180 * 86400000; // 教師 2026-11-26：保留 180 天
export const attendanceLimits = {
  durationSec: { min: 30, max: 1800, default: 60 },
  codeSec: { min: 15, max: 300, default: 60 },
  qrSec: { min: 10, max: 60, default: 15 },
  period: { min: 1, max: 15 },
} as const;

export type AttendanceSession = {
  id: string;
  kind: 'roll' | 'trial';
  date: string; // YYYY-MM-DD（Asia/Taipei）
  period: number;
  classIds: string[];
  status: 'open' | 'closed';
  startedAt: number;
  endsAt: number;
  closedAt?: number;
  durationSec: number;
  codeSec: number;
  qrSec: number;
  expected?: number;
  counts?: { present: number; absent: number };
  settled?: boolean;
  backfilled?: boolean;
  confirmedAt?: number;
  trialCount?: number;
  /** 教師再開放的次數與最後一次時間（2026-11-25，#73）；舊資料沒有。 */
  reopenCount?: number;
  reopenedAt?: number;
  deletedAt?: number;
  deletedBy?: string;
  deletedReason?: string;
};
export type AttendanceRecord = {
  email: string;
  uid?: string;
  studentId: string;
  name: string;
  classId: string;
  status: AttendanceStatus;
  signedAt?: number;
  via?: 'qr' | 'code' | 'teacher' | 'auto';
  deviceId?: string;
  edited?: boolean;
  editedAt?: number;
  lastNotified?: AttendanceStatus;
  notifySeq?: number;
  /** 在教師再開放後才簽到（#73）。 */
  reopened?: boolean;
};

const TAIPEI_OFFSET = 8 * 3600 * 1000;
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
export function taipeiDate(ms: number) {
  const d = new Date(ms + TAIPEI_OFFSET);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export function taipeiTime(ms: number, seconds = false) {
  const d = new Date(ms + TAIPEI_OFFSET);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}${seconds ? ':' + pad(d.getUTCSeconds()) : ''}`;
}
export function taipeiDateTime(ms: number) {
  return `${taipeiDate(ms)} ${taipeiTime(ms)}`;
}
export function validAttendanceDate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(v + 'T00:00:00Z');
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}
export function weekdayLabel(date: string) {
  return '日一二三四五六'[new Date(date + 'T00:00:00Z').getUTCDay()];
}
type SessionTime = Pick<AttendanceSession, 'date' | 'period'> & { startedAt?: number };
export function sessionDateTime(s: SessionTime) {
  return s.startedAt ? `${s.date} ${taipeiTime(s.startedAt)}` : `${s.date} 第 ${s.period} 節`;
}
export function sessionLabel(s: SessionTime) {
  const date = `${Number(s.date.slice(5, 7))}/${Number(s.date.slice(8))}（${weekdayLabel(s.date)}）`;
  return s.startedAt ? `${date}${taipeiTime(s.startedAt)}` : `${date}第 ${s.period} 節`;
}
export function compareAttendanceSessions(a: SessionTime, b: SessionTime) {
  return (
    a.date.localeCompare(b.date) || (a.startedAt || 0) - (b.startedAt || 0) || a.period - b.period
  );
}

/** 動態碼與 QR 憑證的時間區段：第幾組。 */
export function stepIndex(now: number, startedAt: number, stepSec: number) {
  return Math.max(0, Math.floor((now - startedAt) / (stepSec * 1000)));
}
/** 目前這組與上一組都接受（網路延遲）。 */
export function acceptedSteps(now: number, startedAt: number, stepSec: number) {
  const cur = stepIndex(now, startedAt, stepSec);
  return cur > 0 ? [cur, cur - 1] : [cur];
}
export function stepRemainingMs(now: number, startedAt: number, stepSec: number) {
  const step = stepSec * 1000;
  return step - (Math.max(0, now - startedAt) % step);
}
export function sessionAcceptsCheckIn(
  s: Pick<AttendanceSession, 'status' | 'endsAt'> | undefined,
  now: number,
) {
  return !!s && s.status === 'open' && now <= s.endsAt + ATTENDANCE_GRACE_MS;
}
export function sessionExpired(s: Pick<AttendanceSession, 'status' | 'endsAt'>, now: number) {
  return s.status === 'open' && now > s.endsAt + ATTENDANCE_GRACE_MS;
}

function intIn(v: unknown, range: { min: number; max: number; default?: number }, name: string) {
  if (v === undefined && range.default !== undefined) return range.default;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < range.min || v > range.max)
    throw new Error(`${name}需為 ${range.min}–${range.max} 的整數`);
  return v;
}
/** 輸入白名單：出現沒列出的欄位就拒絕。 */
export function onlyKeys(data: unknown, allowed: readonly string[]) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('輸入格式無效');
  for (const k of Object.keys(data as object))
    if (!allowed.includes(k)) throw new Error(`不支援的欄位：${k.slice(0, 40)}`);
  return data as Record<string, unknown>;
}
export function validateAttendanceClass(v: unknown, courseClassIds: string[]) {
  if (!Array.isArray(v) || v.length !== 1) throw new Error('一次只能選擇一個班級');
  if (typeof v[0] !== 'string' || !courseClassIds.includes(v[0])) throw new Error('班級不屬於課程');
  return [v[0]] as [string];
}
export function validateStartInput(data: unknown, courseClassIds: string[]) {
  const d = onlyKeys(data, ['courseId', 'classIds', 'durationSec', 'codeSec', 'qrSec', 'trial']);
  if (d.trial !== undefined && typeof d.trial !== 'boolean') throw new Error('試簽設定無效');
  return {
    classIds: validateAttendanceClass(d.classIds, courseClassIds),
    durationSec: intIn(d.durationSec, attendanceLimits.durationSec, '開放秒數'),
    codeSec: intIn(d.codeSec, attendanceLimits.codeSec, '數字碼秒數'),
    qrSec: intIn(d.qrSec, attendanceLimits.qrSec, 'QR 秒數'),
    trial: d.trial === true,
  };
}
export function validEmailKey(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    v.length <= 200 &&
    /^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(v) &&
    v === v.toLowerCase()
  );
}
export function validDeviceId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);
}

/** 簽到網址：#/attend?c=課程&t=憑證（t 可省略，省略時改輸入數字碼）。 */
export function parseAttendHash(hash: string) {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  if (path !== '/attend') return null;
  const q = new URLSearchParams(query);
  const courseId = q.get('c') || '';
  if (!courseId || courseId.length > 120) return null;
  const token = q.get('t') || '';
  return { courseId, token: /^[A-Za-z0-9._-]{1,200}$/.test(token) ? token : '' };
}
export function attendUrl(base: string, courseId: string, token?: string) {
  return `${base.replace(/#.*$/, '')}#/attend?c=${encodeURIComponent(courseId)}${token ? `&t=${encodeURIComponent(token)}` : ''}`;
}
/** LINE、IG、FB、微信等 App 內建瀏覽器：Google 常不允許在裡面登入。 */
export function inAppBrowserName(ua: string) {
  if (/\bLine\//i.test(ua)) return 'LINE';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  if (/MicroMessenger/i.test(ua)) return '微信';
  if (/; wv\)/.test(ua)) return 'App';
  return '';
}

/** 同裝置提醒：同一節、同一個隨機編號、兩個以上不同帳號。只提醒，不影響簽到結果。 */
export function sameDeviceGroups(records: Pick<AttendanceRecord, 'email' | 'deviceId'>[]) {
  const byDevice = new Map<string, string[]>();
  for (const r of records) {
    if (!r.deviceId) continue;
    const list = byDevice.get(r.deviceId) || [];
    if (!list.includes(r.email)) list.push(r.email);
    byDevice.set(r.deviceId, list);
  }
  const flagged: Record<string, string[]> = {};
  for (const emails of byDevice.values())
    if (emails.length > 1) for (const e of emails) flagged[e] = emails.filter((x) => x !== e);
  return flagged;
}

export function countStatuses(records: Pick<AttendanceRecord, 'status'>[]) {
  return {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
  };
}

/** 現在該寄哪一種信給這位學生：只在紀錄與上次通知不一致時才寄。 */
export function pendingStudentMail(
  r: Pick<AttendanceRecord, 'status' | 'lastNotified'>,
): 'absent' | 'correction' | null {
  if (r.status === 'absent' && r.lastNotified !== 'absent') return 'absent';
  if (r.status === 'present' && r.lastNotified === 'absent') return 'correction';
  return null;
}

/* ───────── CSV ───────── */
export function csvCell(v: unknown) {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
/** 學號以文字輸出：Excel 會把 ="0990001" 當文字，保留開頭的 0。 */
export function csvText(v: string) {
  return `"=""${v.replace(/"/g, '""')}"""`;
}
export const ATTENDANCE_DETAIL_HEADER = [
  '格式版本',
  '學期',
  '課程代碼',
  '課程名稱',
  '班級',
  '日期',
  '節次',
  '學號',
  '姓名',
  '狀態',
  '簽到時間',
  '是否修改過',
  '匯出時間',
] as const;
export type AttendanceCourseInfo = { term: string; code: string; name: string };
export function termOf(courseId: string) {
  return courseId.match(/^\d{2,3}-\d/)?.[0] || '';
}
const byStudent = (a: AttendanceRecord, b: AttendanceRecord) =>
  a.classId.localeCompare(b.classId) ||
  a.studentId.localeCompare(b.studentId) ||
  a.email.localeCompare(b.email);
/** 累加用明細檔：欄位與順序固定；每列的（課程代碼、日期、節次、學號）唯一，可用來去重。 */
export function attendanceDetailCsv(
  course: AttendanceCourseInfo,
  sessions: { session: AttendanceSession; records: AttendanceRecord[] }[],
  exportedAt: number,
) {
  const lines = [ATTENDANCE_DETAIL_HEADER.join(',')];
  const sorted = [...sessions].sort(
    (a, b) =>
      a.session.date.localeCompare(b.session.date) ||
      a.session.period - b.session.period ||
      a.session.id.localeCompare(b.session.id),
  );
  for (const { session, records } of sorted)
    for (const r of [...records].sort(byStudent))
      lines.push(
        [
          ATTENDANCE_FORMAT_VERSION,
          csvCell(course.term),
          csvCell(course.code),
          csvCell(course.name),
          csvCell(r.classId),
          session.date,
          session.period,
          csvText(r.studentId),
          csvCell(r.name),
          attendanceStatusLabel[r.status],
          r.status === 'present' && r.signedAt && r.via !== 'teacher'
            ? taipeiTime(r.signedAt, true)
            : '',
          r.edited ? '是' : '否',
          taipeiDateTime(exportedAt),
        ].join(','),
      );
  return '﻿' + lines.join('\r\n') + '\r\n';
}
export function attendanceSessionCsv(session: AttendanceSession, records: AttendanceRecord[]) {
  const lines = ['點名時間,班級,學號,姓名,狀態,簽到時間,方式,是否修改過,補點時間'];
  const via = { qr: '掃 QR', code: '數字碼', teacher: '老師修改', auto: '' };
  for (const r of [...records].sort(byStudent))
    lines.push(
      [
        sessionDateTime(session),
        csvCell(r.classId),
        csvText(r.studentId),
        csvCell(r.name),
        attendanceStatusLabel[r.status],
        r.status === 'present' && r.signedAt && r.via !== 'teacher'
          ? taipeiTime(r.signedAt, true)
          : '',
        via[r.via || 'auto'],
        r.edited ? '是' : '否',
        r.status === 'present' && r.reopened && r.signedAt ? taipeiDateTime(r.signedAt) : '',
      ].join(','),
    );
  return '﻿' + lines.join('\r\n') + '\r\n';
}
export type AttendanceSummaryRow = {
  email: string;
  studentId: string;
  name: string;
  classId: string;
  cells: (AttendanceRecord | null)[];
  present: number;
  absent: number;
};
export function attendanceSummary(
  sessions: { session: AttendanceSession; records: AttendanceRecord[] }[],
) {
  const sorted = [...sessions].sort((a, b) => compareAttendanceSessions(b.session, a.session));
  const rows = new Map<string, AttendanceSummaryRow>();
  // 由舊到新更新姓名與班級，矩陣仍以新紀錄在左。
  [...sorted].reverse().forEach(({ records }, i) => {
    for (const r of records) {
      const row = rows.get(r.email) || {
        email: r.email,
        studentId: r.studentId,
        name: r.name,
        classId: r.classId,
        cells: sorted.map(() => null),
        present: 0,
        absent: 0,
      };
      row.cells[sorted.length - 1 - i] = r;
      row[r.status]++;
      Object.assign(row, { studentId: r.studentId, name: r.name, classId: r.classId });
      rows.set(r.email, row);
    }
  });
  return {
    sessions: sorted.map((x) => x.session),
    rows: [...rows.values()].sort(
      (a, b) =>
        b.absent - a.absent ||
        a.classId.localeCompare(b.classId) ||
        a.studentId.localeCompare(b.studentId),
    ),
  };
}
export function attendanceSummaryCsv(
  sessions: { session: AttendanceSession; records: AttendanceRecord[] }[],
) {
  const s = attendanceSummary(sessions);
  const lines = [
    [
      '班級',
      '學號',
      '姓名',
      ...s.sessions.map((x) => csvCell(sessionDateTime(x))),
      '準時',
      '未到',
    ].join(','),
  ];
  for (const r of [...s.rows].sort(
    (a, b) => a.classId.localeCompare(b.classId) || a.studentId.localeCompare(b.studentId),
  ))
    lines.push(
      [
        csvCell(r.classId),
        csvText(r.studentId),
        csvCell(r.name),
        ...r.cells.map((c) => (c ? attendanceStatusLabel[c.status] : '')),
        r.present,
        r.absent,
      ].join(','),
    );
  return '﻿' + lines.join('\r\n') + '\r\n';
}

/* ───────── 通知信內容（只寫點名資訊；不含成績、情緒、關心標記、同裝置提醒、修改原因） ───────── */
export type AttendanceMailContext = { courseName: string; teacherName: string; link: string };
export type AttendanceMail = { subject: string; text: string };

export function absentMail(
  ctx: AttendanceMailContext,
  s: SessionTime,
  studentName: string,
): AttendanceMail {
  return {
    subject: `【${ctx.courseName}】${sessionLabel(s)}紀錄為未到`,
    text: [
      `${studentName} 同學：`,
      '',
      `${ctx.courseName}　${sessionDateTime(s)}，本次紀錄為未到。`,
      '',
      '如果對紀錄有疑問，請直接洽老師。',
      ...(ctx.link ? ['', `查看我的出缺席：${ctx.link}`] : []),
      '',
      ctx.teacherName,
    ].join('\n'),
  };
}
export function correctionMail(
  ctx: AttendanceMailContext,
  s: SessionTime,
  studentName: string,
): AttendanceMail {
  return {
    subject: `【${ctx.courseName}】${sessionLabel(s)}的紀錄已改為準時`,
    text: [
      `${studentName} 同學：`,
      '',
      `${ctx.courseName}　${sessionDateTime(s)} 的紀錄已改為準時。先前寄出的未到通知請不用理會。`,
      ...(ctx.link ? ['', `查看我的出缺席：${ctx.link}`] : []),
      '',
      ctx.teacherName,
    ].join('\n'),
  };
}
export function mentorDigestMail(
  ctx: Omit<AttendanceMailContext, 'link'>,
  className: string,
  mentorName: string,
  date: string,
  sessions: {
    session: SessionTime;
    records: Pick<AttendanceRecord, 'status' | 'name' | 'studentId' | 'classId'>[];
  }[],
): AttendanceMail {
  const lines = [
    `${mentorName ? mentorName + ' ' : ''}老師您好：`,
    '',
    `以下是 ${className} ${date}（${weekdayLabel(date)}）在「${ctx.courseName}」的出缺席紀錄。`,
  ];
  for (const { session, records } of [...sessions].sort((a, b) =>
    compareAttendanceSessions(a.session, b.session),
  )) {
    const mine = records.filter((r) => r.classId === className);
    const absent = mine
      .filter((r) => r.status === 'absent')
      .sort((a, b) => a.studentId.localeCompare(b.studentId));
    lines.push(
      '',
      sessionDateTime(session),
      `應到 ${mine.length} 人，準時 ${mine.length - absent.length} 人，未到 ${absent.length} 人。`,
    );
    if (absent.length)
      lines.push('未到名單：', ...absent.map((r) => `・${r.name}（${r.studentId}）`));
  }
  lines.push('', ctx.teacherName);
  return {
    subject: `【${ctx.courseName}】${className} ${date} 出缺席彙整`,
    text: lines.join('\n'),
  };
}

/* ───────── 半自動通知（教師 2026-11-19 12:42）：開啟 Gmail 新信，收件人／主旨／內文已帶入，老師檢查後自己按寄出 ───────── */
export function gmailComposeUrl(
  account: string,
  mail: { to: string; subject: string; text: string },
) {
  const q = [
    'view=cm',
    'fs=1',
    ...(account ? [`authuser=${encodeURIComponent(account)}`] : []),
    `to=${encodeURIComponent(mail.to)}`,
    `su=${encodeURIComponent(mail.subject)}`,
    `body=${encodeURIComponent(mail.text)}`,
  ];
  return `https://mail.google.com/mail/?${q.join('&')}`;
}

/* ───────── 給其他功能的接點（#65 關心名單、研究 CSV、Zuvio 缺考標示；本件只提供讀取，不接線） ───────── */
/** 最近 lastN 節（依日期、節次）裡未到的次數；不在名單的節次不算。 */
export function recentAbsentCount(
  sessions: {
    session: Pick<AttendanceSession, 'date' | 'period' | 'id'>;
    records: Pick<AttendanceRecord, 'email' | 'status'>[];
  }[],
  email: string,
  lastN = 3,
) {
  const mine = [...sessions]
    .sort(
      (a, b) => b.session.date.localeCompare(a.session.date) || b.session.period - a.session.period,
    )
    .map((x) => x.records.find((r) => r.email === email))
    .filter((r): r is Pick<AttendanceRecord, 'email' | 'status'> => !!r)
    .slice(0, lastN);
  return mine.filter((r) => r.status === 'absent').length;
}
/** 某一天某一節未到的學生信箱（Zuvio 場次標「缺考」用）。 */
export function absentEmailsAt(
  sessions: {
    session: SessionTime;
    records: Pick<AttendanceRecord, 'email' | 'status'>[];
  }[],
  date: string,
  period: number,
) {
  return sessions
    .filter((x) => x.session.date === date && x.session.period === period)
    .flatMap((x) => x.records.filter((r) => r.status === 'absent').map((r) => r.email));
}

/** 通知分頁與授課控制台共用：學生信＋全部節次確認後可提示的導師信。 */
export function pendingNotificationCount(drafts: {
  student: unknown[];
  digest: { ready?: boolean }[];
}) {
  return drafts.student.length + drafts.digest.filter((g) => g.ready).length;
}

/** 再開放分鐘數：1–30 的整數。 */
export const ATTENDANCE_REOPEN_MAX_MIN = 30;
export function validReopenMinutes(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= ATTENDANCE_REOPEN_MAX_MIN;
}
/** 只有今天、已結束的正式點名節次可以再開放（已確認者會撤銷確認）。 */
export function canReopenSession(
  s: Pick<AttendanceSession, 'kind' | 'status' | 'date' | 'deletedAt'> | undefined,
  today: string,
) {
  return !!s && s.kind === 'roll' && s.status === 'closed' && !s.deletedAt && s.date === today;
}
