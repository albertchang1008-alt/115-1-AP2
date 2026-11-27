// 課堂點名（#67）教師端：開始點名與投影、節次與單節名冊、總表、修改紀錄、通知（半自動，系統不寄信）。
// 版面沿用教師 2026-11-16 核可的樣張（src/AttendanceSample.tsx）。
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import qrcode from 'qrcode-generator';
import type { API } from './service';
import { warmCallables } from './warmCallables';
import { attendanceClassDirectory, type AttendanceClassCards } from './teacherClassDirectories';
import type { Course } from '../shared/model';
import { exportWorkbook } from './xlsxWorkbook';
import {
  ATTENDANCE_GRACE_MS,
  attendUrl,
  attendanceLimits,
  attendanceStatusLabel,
  gmailComposeUrl,
  ATTENDANCE_RESTORE_MS,
  sessionDateTime,
  sessionLabel,
  taipeiDate,
  taipeiDateTime,
  taipeiTime,
  type AttendanceStatus,
} from '../shared/attendance';

type Session = {
  id: string;
  kind: 'roll' | 'trial';
  date: string;
  period: number;
  classIds: string[];
  status: 'open' | 'closed';
  startedAt: number;
  endsAt: number;
  expected: number;
  counts: { present: number; absent: number };
  deleteCounts?: { present: number; absent: number };
  backfilled: boolean;
  confirmedAt: number;
  durationSec: number;
  codeSec: number;
  qrSec: number;
  reopenCount?: number;
  deletedAt?: number;
  deletedReason?: string;
  notified?: boolean;
};
type LiveData = {
  session: Session;
  now: number;
  remainingMs: number;
  signed: number;
  code: string;
  token: string;
  nextCode: string;
  nextCodeAt: number;
  nextToken: string;
  nextTokenAt: number;
};
type Live = { session: null } | LiveData;
type LiveSnapshot = LiveData & { receivedAt: number };
type Projection = { session?: Session; live?: LiveSnapshot };
type RosterRow = {
  email: string;
  studentId: string;
  name: string;
  classId: string;
  status: AttendanceStatus;
  signedAt: number;
  via: string;
  edited: boolean;
  editedAt: number;
  reopened?: boolean;
  locked: boolean;
  sameDevice: string[];
  pendingMail: 'absent' | 'correction' | null;
};
type Draft = {
  draftId: string;
  kind: 'absent' | 'correction' | 'digest';
  to: string;
  name: string;
  subject: string;
  text: string;
  date: string;
  period: number;
  startedAt?: number;
  classId?: string;
  sessionId?: string;
  periods?: number[];
  ready?: boolean;
  supplement?: boolean;
  unconfirmed?: string[];
  expect: unknown;
};
type Drafts = {
  date: string;
  student: Draft[];
  digest: Draft[];
  noMentor: string[];
  unconfirmedToday: Session[];
  gmailAccount: string;
  log: {
    id: string;
    key: string;
    kind: string;
    to: string;
    name: string;
    date: string;
    period?: number;
    labels?: string[];
    status: 'marked' | 'undone';
    markedAt: number;
    byName: string;
    canUndo: boolean;
  }[];
};
type NotifyConfig = {
  mentors: Record<string, { name: string; email: string }>;
  teacherName: string;
  gmailAccount: string;
};
type Props = { api: API; course: Course; notify: (s: string) => void };
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const classLabel = (course: Course, ids: string[]) =>
  ids.map((id) => course.classNames?.[id] || id).join('、');
function saveFile(filename: string, data: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(data);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const saveCsv = (filename: string, csv: string) =>
  saveFile(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
function Qr({ text }: { text: string }) {
  const svg = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ scalable: true, margin: 2 });
  }, [text]);
  return (
    <div
      className="att-qr"
      role="img"
      aria-label="簽到 QR"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
function StatusPill({ status }: { status: AttendanceStatus }) {
  return <span className={`att-pill att-${status}`}>{attendanceStatusLabel[status]}</span>;
}

/* ───────── 開始點名＋投影 ───────── */
const LIVE_POLL_MS = 5000;
type LiveAction = () => Promise<unknown>;

function LiveView({
  api,
  course,
  notify,
  onEnded,
  initial,
  onBack,
  inFlight,
}: Props & {
  onEnded: (session?: Session) => void;
  initial: Projection;
  onBack: () => void;
  inFlight: MutableRefObject<Promise<void> | undefined>;
}) {
  const [live, setLive] = useState<LiveSnapshot | null>(initial.live || null);
  const [now, setNow] = useState(() => performance.now());
  const [reconnecting, setReconnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const updateLive = useRef<(action?: LiveAction) => Promise<void>>();
  const callbacks = useRef({ onEnded, notify });
  useEffect(() => {
    callbacks.current = { onEnded, notify };
  }, [onEnded, notify]);
  useEffect(() => {
    let disposed = false;
    let previous = initial.live;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let tickTimer: ReturnType<typeof setTimeout> | undefined;
    const stopTick = () => clearTimeout(tickTimer);
    const tick = () => {
      stopTick();
      if (!previous || document.hidden) return;
      const time = performance.now();
      setNow(time);
      const serverNow = previous.now + time - previous.receivedAt;
      const deadlines = [
        previous.nextCodeAt, previous.nextTokenAt,
        previous.nextCodeAt + previous.session.codeSec * 1000,
        previous.nextTokenAt + previous.session.qrSec * 1000,
      ].filter((at) => at > serverNow);
      tickTimer = setTimeout(tick, Math.ceil(Math.min(1000, ...deadlines.map((at) => at - serverNow))));
    };
    const schedule = (delay: number) => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void refresh(), Math.ceil(delay));
    };
    const scheduleNext = () => {
      let delay = LIVE_POLL_MS;
      if (previous?.session) {
        const elapsed = performance.now() - previous.receivedAt;
        // 歸零時查一次；若仍在後端的簽到寬限內，等寬限結束再確認。
        const endCheck =
          previous.remainingMs || previous.session.endsAt + ATTENDANCE_GRACE_MS + 1 - previous.now;
        if (endCheck > elapsed) delay = Math.min(delay, endCheck - elapsed);
      }
      schedule(delay);
    };
    const read = async () => {
      let response: Live;
      try {
        response = await api.call<Live>('attendanceLive', { courseId: course.id });
      } catch {
        if (!disposed && !document.hidden) {
          setReconnecting(true);
          scheduleNext();
        }
        return;
      }
      if (disposed || document.hidden) return;
      const receivedAt = performance.now();
      const ended = previous?.session || initial.session;
      previous = response.session ? { ...response, receivedAt } : undefined;
      setLive(previous || null);
      setNow(receivedAt);
      setReconnecting(false);
      if (response.session) {
        tick();
        scheduleNext();
      } else {
        stopTick();
        callbacks.current.onEnded(ended);
      }
    };
    const refresh = async (action?: LiveAction) => {
      // 手動操作與回前景的查詢需要新回應，先等已發出的請求完成。
      while (inFlight.current) await inFlight.current;
      if (disposed || (!action && document.hidden)) return;
      clearTimeout(refreshTimer);
      const request = (async () => {
        if (action) {
          try {
            await action();
          } catch (error) {
            if (!disposed) callbacks.current.notify((error as Error).message);
          }
        }
        if (!disposed && !document.hidden) await read();
      })();
      inFlight.current = request;
      try {
        await request;
      } finally {
        inFlight.current = undefined;
      }
    };
    updateLive.current = refresh;
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(refreshTimer);
        stopTick();
      } else {
        tick();
        void refresh();
      }
    };
    if (!document.hidden) {
      if (previous) {
        tick();
        scheduleNext();
      } else schedule(0);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      updateLive.current = undefined;
      clearTimeout(refreshTimer);
      stopTick();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [api, course.id, inFlight, initial]);
  const open = !!live?.session;
  // 投影畫面以 1840×1035 設計，整塊依可用空間等比例縮放（小視窗與全螢幕都不會溢出）。
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const full = document.fullscreenElement === el;
      el.style.setProperty(
        '--proj',
        String(
          Math.max(
            0.2,
            full ? Math.min(el.clientWidth / 1840, el.clientHeight / 1035) : el.clientWidth / 1840,
          ),
        ),
      );
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.addEventListener('fullscreenchange', fit);
    return () => {
      ro.disconnect();
      document.removeEventListener('fullscreenchange', fit);
    };
  }, [open]);
  const act = async (fn: LiveAction) => {
    setBusy(true);
    try {
      await updateLive.current?.(fn);
    } finally {
      setBusy(false);
    }
  };
  const connectionStatus = reconnecting && <span role="status">連線中…</span>;
  if (!live?.session) return <p className="muted">{connectionStatus || '讀取中…'}</p>;
  const s = live.session;
  const elapsed = now - live.receivedAt;
  const remain = live.remainingMs - elapsed;
  const serverNow = live.now + elapsed;
  const display = (current: string, next: string, switchAt: number, seconds: number) => {
    const changed = serverNow >= switchAt;
    const until = changed ? switchAt + seconds * 1000 : switchAt;
    return { value: serverNow < until ? (changed ? next : current) : '', left: Math.ceil((until - serverNow) / 1000) };
  };
  const code = display(live.code, live.nextCode, live.nextCodeAt, s.codeSec);
  const qr = display(live.token, live.nextToken, live.nextTokenAt, s.qrSec);
  return (
    <div>
      <button type="button" onClick={onBack}>
        ← 班級列表
      </button>
      <div className="att-proj-fit" ref={stage}>
        <section className="att-proj" aria-label="投影畫面">
          <div className="att-proj-top">
            <strong>
              {course.title}　{s.kind === 'trial' ? '試簽（不算點名）' : '課堂點名'}
            </strong>
            <span>
              {sessionLabel(s)}・{classLabel(course, s.classIds)}
              {reconnecting && <>・{connectionStatus}</>}
            </span>
          </div>
          <div className="att-proj-main">
            <div className="att-proj-qr">
              {qr.value
                ? <Qr text={attendUrl(location.origin + location.pathname, course.id, qr.value)} />
                : <p>正在更新 QR…</p>}
              <p>
                用<b>手機相機</b>掃描（不要用 LINE、IG 掃）
              </p>
              <small>{qr.value && `QR ${qr.left} 秒後更換`}</small>
            </div>
            <div className="att-proj-side">
              <div className="att-proj-box">
                <span>剩餘時間</span>
                <b className="att-proj-time">{clock(remain)}</b>
              </div>
              <div className="att-proj-box">
                <span>已簽到</span>
                <b>
                  {live.signed}
                  {s.kind === 'roll' && <i>／{s.expected}</i>}
                </b>
              </div>
              <div className="att-proj-box att-proj-code">
                <span>掃不到？在平台首頁輸入數字碼</span>
                <b>{code.value ? code.value.split('').join(' ') : '—'}</b>
                <small>{code.value && `${code.left} 秒後更換`}</small>
              </div>
            </div>
          </div>
          <div className="att-proj-actions">
            <button onClick={() => void stage.current?.requestFullscreen?.()}>全螢幕</button>
            <button
              disabled={busy}
              onClick={() =>
                void act(() =>
                  api.call('attendanceControl', { courseId: course.id, action: 'end' }),
                )
              }
            >
              提前結束
            </button>
            <button
              disabled={busy}
              onClick={() =>
                void act(() =>
                  api.call('attendanceControl', { courseId: course.id, action: 'extend' }),
                )
              }
            >
              延長 1 分鐘
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ───────── 單筆名冊 ───────── */
function RecordDetail({
  api,
  course,
  notify,
  sid,
  onGoNotify,
  onChanged,
  onReopened,
  onDelete,
}: Props & {
  sid: string;
  onGoNotify: () => void;
  onChanged: () => void;
  onReopened: (session: Session) => void;
  onDelete: (session: Session) => void;
}) {
  const [roster, setRoster] = useState<{ session: Session; rows: RosterRow[] } | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<RosterRow | null>(null);
  const [reason, setReason] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [reopenMin, setReopenMin] = useState(3);
  const [reopening, setReopening] = useState(false);
  const load = async () => {
    const payload = { courseId: course.id, sessionId: sid };
    try {
      const [data, history] = await Promise.all([
        api.call<{ session: Session; rows: RosterRow[] }>('attendanceRoster', payload),
        api.call<{ rows: AuditRow[] }>('attendanceAuditLog', payload),
      ]);
      setRoster(data);
      setAudit(history.rows);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [api, course.id, sid]);
  const change = async (emails: string[], status: AttendanceStatus, why = '') => {
    try {
      const r = await api.call<{ changed: number }>('attendanceSetStatus', {
        courseId: course.id,
        sessionId: sid,
        emails,
        status,
        ...(why.trim() ? { reason: why.trim() } : {}),
      });
      notify(`已修改 ${r.changed} 人，並留下修改紀錄`);
      setEditing(null);
      setReason('');
      setBulkReason('');
      setPicked(new Set());
      await load();
      onChanged();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const confirm = async (confirmed: boolean) => {
    try {
      await api.call('attendanceConfirm', { courseId: course.id, sessionId: sid, confirmed });
      await load();
      onChanged();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const reopen = async () => {
    const cur = roster?.session;
    if (!cur || reopening) return;
    const note = cur.confirmedAt
      ? '這筆點名已確認。再開放會撤銷確認（留下修改紀錄），結束後需要重新確認。\n'
      : '';
    if (!window.confirm(`${note}再開放 ${reopenMin} 分鐘？已簽到的保留，未到的可以補簽。`)) return;
    setReopening(true);
    try {
      const { session } = await api.call<{ session: Session }>('attendanceReopen', {
        courseId: course.id,
        sessionId: cur.id,
        minutes: reopenMin,
      });
      notify(`已再開放 ${reopenMin} 分鐘`);
      onChanged();
      onReopened(session);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setReopening(false);
    }
  };
  const s = roster?.session;
  const reopenable =
    !!s && s.kind === 'roll' && s.status === 'closed' && s.date === taipeiDate(Date.now());
  const flagged = roster?.rows.filter((r) => r.sameDevice.length) || [];
  const pending = roster?.rows.filter((r) => r.pendingMail).length || 0;
  if (!s || !roster)
    return error ? (
      <p role="alert">
        {error}{' '}
        <button type="button" onClick={() => void load()}>
          重新讀取
        </button>
      </p>
    ) : (
      <p role="status">讀取點名明細…</p>
    );
  return (
    <div className="att-admin-col">
      {error && <p role="alert">{error}</p>}
      <section className="panel att-roster">
        <div className="att-row-head">
          <div>
            <h2>
              {sessionLabel(s)}　{classLabel(course, s.classIds)}
            </h2>
            <p className="att-chips">
              <span className="att-pill att-present">準時 {s.counts.present}</span>
              <span className="att-pill att-absent">未到 {s.counts.absent}</span>
              <span className="muted">
                應到 {s.expected}
                {s.backfilled ? '・補建紀錄' : ''}
              </span>
            </p>
          </div>
          <div className="att-actions">
            <button
              onClick={async () => {
                try {
                  const r = await api.call<{ filename: string; csv: string }>('attendanceExport', {
                    courseId: course.id,
                    kind: 'session',
                    sessionId: sid,
                  });
                  saveCsv(r.filename, r.csv);
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              匯出本筆 CSV
            </button>
            {reopenable && (
              <span className="att-reopen">
                <label>
                  再開放{' '}
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={reopenMin}
                    aria-label="再開放分鐘數"
                    onChange={(e) => setReopenMin(Number(e.target.value))}
                  />{' '}
                  分鐘
                </label>
                <button
                  disabled={
                    reopening || !Number.isInteger(reopenMin) || reopenMin < 1 || reopenMin > 30
                  }
                  onClick={() => void reopen()}
                >
                  再開放
                </button>
              </span>
            )}
            {s.confirmedAt ? (
              <button onClick={() => void confirm(false)}>取消確認</button>
            ) : (
              <button className="primary" onClick={() => void confirm(true)}>
                確認這筆點名（未到 {s.counts.absent} 人）
              </button>
            )}
          </div>
        </div>
        {s.confirmedAt ? (
          pending ? (
            <div className="att-notice-bar">
              <strong>這筆點名已確認：{pending} 位待通知</strong>
              <span>系統不會自己寄信；到〔通知〕複製信件內容或開啟 Gmail 寄出。</span>
              <button className="primary" onClick={onGoNotify}>
                前往通知
              </button>
            </div>
          ) : (
            <p className="muted">這筆點名已確認，沒有待通知的學生。</p>
          )
        ) : (
          <p className="muted">
            確認後，這筆點名的未到通知才會出現在〔通知〕；確認前可以先修改狀態。
          </p>
        )}
        {!!flagged.length && (
          <div className="notice warning att-device">
            同裝置提醒：{flagged.map((r) => r.name).join('、')}{' '}
            用同一台手機簽到。只是提醒，請自行判斷；不會擋下簽到，也不會寫進通知信。
          </div>
        )}
        <div className="att-bulk">
          <span>已選 {picked.size} 人</span>
          {picked.size > 0 && (
            <label>
              批次修改原因（選填）
              <input
                maxLength={200}
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
              />
            </label>
          )}
          <button
            disabled={!picked.size}
            onClick={() => void change([...picked], 'present', bulkReason)}
          >
            改為準時
          </button>
          <button
            disabled={!picked.size}
            onClick={() => void change([...picked], 'absent', bulkReason)}
          >
            改為未到
          </button>
        </div>
        {editing && (
          <section className="att-record-form att-inline-edit" aria-label="修改狀態">
            <strong>
              {editing.name}：{attendanceStatusLabel[editing.status]} →{' '}
              {attendanceStatusLabel[editing.status === 'present' ? 'absent' : 'present']}
            </strong>
            <label>
              原因（選填）
              <input
                autoFocus
                value={reason}
                maxLength={200}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="att-actions">
              <button
                className="primary"
                type="button"
                onClick={() =>
                  void change(
                    [editing.email],
                    editing.status === 'present' ? 'absent' : 'present',
                    reason,
                  )
                }
              >
                改為{attendanceStatusLabel[editing.status === 'present' ? 'absent' : 'present']}
              </button>
              <button type="button" onClick={() => setEditing(null)}>
                取消修改
              </button>
            </div>
          </section>
        )}
        <div className="att-table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>班級</th>
                <th>學號</th>
                <th>姓名</th>
                <th>狀態（點一下就能改）</th>
                <th>簽到時間</th>
                <th>方式</th>
                <th>提醒</th>
              </tr>
            </thead>
            <tbody>
              {roster.rows.map((r) => (
                <tr key={r.email} className={r.sameDevice.length ? 'flag' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`選取 ${r.name}`}
                      checked={picked.has(r.email)}
                      onChange={(e) => {
                        const next = new Set(picked);
                        if (e.target.checked) next.add(r.email);
                        else next.delete(r.email);
                        setPicked(next);
                      }}
                    />
                  </td>
                  <td>{course.classNames?.[r.classId] || r.classId}</td>
                  <td>{r.studentId}</td>
                  <td>{r.name}</td>
                  <td className="att-status-cell">
                    <button
                      className={`att-pill att-${r.status}`}
                      onClick={() => {
                        setEditing(editing?.email === r.email ? null : r);
                        setReason('');
                      }}
                    >
                      {attendanceStatusLabel[r.status]} ▾
                    </button>
                  </td>
                  <td>
                    {r.status === 'present' && r.signedAt
                      ? r.reopened
                        ? `補 ${taipeiTime(r.signedAt)}`
                        : taipeiTime(r.signedAt, true)
                      : '—'}
                  </td>
                  <td>
                    {r.via === 'qr'
                      ? '掃 QR'
                      : r.via === 'code'
                        ? '數字碼'
                        : r.via === 'teacher'
                          ? '老師修改'
                          : '—'}
                  </td>
                  <td>
                    {[
                      r.sameDevice.length ? `與 ${r.sameDevice.join('、')} 同裝置` : '',
                      r.locked ? '數字碼錯 5 次，已鎖住' : '',
                      r.edited ? `已修改 ${taipeiDateTime(r.editedAt).slice(5)}` : '',
                      r.pendingMail === 'absent'
                        ? '待通知（未到）'
                        : r.pendingMail === 'correction'
                          ? '待通知（更正）'
                          : '',
                    ]
                      .filter(Boolean)
                      .join('；')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AuditHistory rows={audit || []} />
      <section className="panel att-danger-zone">
        <button className="att-danger" type="button" onClick={() => onDelete(s)}>
          刪除這筆點名
        </button>
      </section>
    </div>
  );
}

type AuditRow = {
  at: number;
  name?: string;
  studentId?: string;
  from?: AttendanceStatus;
  to?: AttendanceStatus;
  reason?: string;
  byName: string;
  action?: 'reopen' | 'confirm' | 'unconfirm' | 'delete' | 'restore';
  minutes?: number;
  unconfirmed?: number;
};
function AuditHistory({ rows }: { rows: AuditRow[] }) {
  const label = { confirm: '確認', unconfirm: '取消確認', delete: '刪除點名', restore: '復原點名' };
  return (
    <section className="panel">
      <h2>本筆修改紀錄</h2>
      {rows.length ? (
        <div className="att-scroll">
          <table>
            <thead>
              <tr>
                <th>修改時間</th>
                <th>學生</th>
                <th>修改</th>
                <th>原因</th>
                <th>修改人</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={i}>
                  <td>{taipeiDateTime(a.at)}</td>
                  <td>{a.name ? `${a.name}（${a.studentId}）` : '整筆'}</td>
                  <td>
                    {a.action === 'reopen'
                      ? `再開放 ${a.minutes} 分鐘${a.unconfirmed ? '，取消原確認' : ''}`
                      : a.action
                        ? label[a.action]
                        : a.from &&
                          a.to && (
                            <>
                              <StatusPill status={a.from} /> → <StatusPill status={a.to} />
                            </>
                          )}
                  </td>
                  <td>{a.reason || '—'}</td>
                  <td>{a.byName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">還沒有修改紀錄。</p>
      )}
    </section>
  );
}

type Summary = {
  sessions: Session[];
  rows: {
    email: string;
    studentId: string;
    name: string;
    present: number;
    absent: number;
    cells: ({ status: AttendanceStatus; edited: boolean; makeupAt: number } | null)[];
  }[];
};
const identityHead = ['編號', '學號', '姓名'];
const statsHead = [...identityHead, '全部', '準時', '未到'];
function SummaryView({
  api,
  course,
  notify,
  classId,
  onDetail,
}: Props & {
  classId: string;
  onDetail: (sid: string) => void;
}) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    api
      .call<Summary>('attendanceSummary', { courseId: course.id, classId })
      .then((r) => {
        if (alive) setData(r);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [api, course.id, classId]);
  const stats =
    data?.rows.map((r, i) => [
      i + 1,
      r.studentId,
      r.name,
      r.present + r.absent,
      r.present,
      r.absent,
    ]) || [];
  const matrix =
    data?.rows.map((r, i) => [
      i + 1,
      r.studentId,
      r.name,
      ...r.cells.map((c) => (c ? attendanceStatusLabel[c.status] : '')),
    ]) || [];
  const hasMakeup = data?.rows.some((r) => r.cells.some((c) => c?.makeupAt));
  const columns = data?.sessions.map(sessionDateTime) || [];
  const saveExcel = () => {
    if (!data) return;
    const workbook = exportWorkbook('學生總表', [
      ['學生統計'],
      statsHead,
      ...stats,
      [],
      ['每次點名'],
      [...identityHead, ...columns],
      ...matrix,
      [],
      ...(hasMakeup
        ? [
            ['補點時間'],
            ['學號', '姓名', '點名時間', '補點時間'],
            ...data.rows.flatMap((r) =>
              r.cells.flatMap((c, i) =>
                c?.makeupAt ? [[r.studentId, r.name, columns[i], taipeiDateTime(c.makeupAt)]] : [],
              ),
            ),
          ]
        : []),
    ]);
    saveFile(
      `學生總表_${course.id}_${classId}.xlsx`,
      new Blob([workbook], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
  };
  const exportCsv = async () => {
    try {
      const r = await api.call<{ filename: string; csv: string }>('attendanceExport', {
        courseId: course.id,
        classId,
        kind: 'detail',
      });
      saveCsv(r.filename, r.csv);
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <div className="att-admin-col">
      <section className="panel">
        <div className="att-row-head">
          <h2>學生總表</h2>
          <div className="att-actions">
            <button type="button" disabled={!data} onClick={saveExcel}>
              匯出 Excel
            </button>
            <button type="button" onClick={() => void exportCsv()}>
              累加用明細 CSV
            </button>
          </div>
        </div>
        {error ? (
          <p role="alert">{error}</p>
        ) : !data ? (
          <p role="status">讀取學生總表…</p>
        ) : !stats.length ? (
          <p className="muted">目前沒有學生。</p>
        ) : (
          <div className="att-scroll">
            <table className="att-numeric">
              <thead>
                <tr>
                  {statsHead.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={row[0]}>
                    {row.map((v, j) => (
                      <td key={j}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {data && (
        <section className="panel">
          <h2>每次點名</h2>
          {!columns.length ? (
            <p className="muted">還沒有點名紀錄。</p>
          ) : (
            <div className="att-scroll att-matrix-frame">
              <table className="att-matrix">
                <thead>
                  <tr>
                    {identityHead.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                    {data.sessions.map((s, i) => (
                      <th key={s.id}>
                        <button type="button" onClick={() => onDetail(s.id)}>
                          {columns[i]}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={r.email}>
                      <td>{i + 1}</td>
                      <td>{r.studentId}</td>
                      <th scope="row">{r.name}</th>
                      {r.cells.map((c, j) => (
                        <td
                          key={data.sessions[j].id}
                          title={c?.edited ? '老師已更正' : undefined}
                          className={
                            c ? `att-matrix-${c.status}${c.edited ? ' att-sym-edited' : ''}` : ''
                          }
                        >
                          {c
                            ? c.makeupAt
                              ? `補 ${taipeiTime(c.makeupAt)}`
                              : attendanceStatusLabel[c.status]
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ───────── 通知（半自動：系統不寄信；產生信件內容，老師自己貼到 Gmail 寄出後標記已通知） ───────── */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // iOS／部分內建瀏覽器不給 clipboard API：退回選取隱藏文字框再複製
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}
function CopyButton({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        }
      }}
    >
      {done ? '已複製' : `複製${label}`}
    </button>
  );
}
const kindLabel: Record<string, string> = {
  absent: '未到通知',
  correction: '更正通知',
  digest: '導師彙整',
};
function DraftCard({
  draft,
  title,
  gmailAccount,
  open,
  busy,
  onMark,
}: {
  draft: Draft;
  title: string;
  gmailAccount: string;
  open: boolean;
  busy: boolean;
  onMark: () => void;
}) {
  return (
    <details className="att-draft" open={open}>
      <summary>
        {title}
        <span className="att-draft-kind">{kindLabel[draft.kind] || draft.kind}</span>
      </summary>
      <p className="att-draft-field">收件人</p>
      <pre>{draft.to}</pre>
      <p className="att-draft-field">主旨</p>
      <pre>{draft.subject}</pre>
      <p className="att-draft-field">內文</p>
      <pre>{draft.text}</pre>
      <div className="att-draft-actions">
        <CopyButton label="收件人" text={draft.to} />
        <CopyButton label="主旨" text={draft.subject} />
        <CopyButton label="內文" text={draft.text} />
      </div>
      <div className="att-draft-actions">
        <a href={gmailComposeUrl(gmailAccount, draft)} target="_blank" rel="noopener noreferrer">
          開啟 Gmail
        </a>
        <button className="primary" disabled={busy} onClick={onMark}>
          已寄，標記已通知
        </button>
      </div>
    </details>
  );
}
function NotifyView({
  api,
  course,
  notify,
  classId,
  onChanged,
}: Props & { classId: string; onChanged: () => void }) {
  const [st, setSt] = useState<Drafts | null>(null);
  const [cfg, setCfg] = useState<NotifyConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const d = await api.call<Drafts>('attendanceNotifyDrafts', { courseId: course.id, classId });
      setSt(d);
      onChanged();
      setCfg(await api.call<NotifyConfig>('attendanceMailConfig', { courseId: course.id }));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [api, course.id, classId]);
  if (!st || !cfg) return <p className="muted">讀取中…</p>;
  const mark = async (list: Draft[]) => {
    setBusy(true);
    try {
      const r = await api.call<{ marked: number; already: number; stale: number }>(
        'attendanceMarkNotified',
        { courseId: course.id, items: list.map((m) => ({ draftId: m.draftId, expect: m.expect })) },
      );
      notify(
        `已標記 ${r.marked + r.already} 封` +
          (r.stale ? `；${r.stale} 封的點名狀態已變，請看更新後的內容` : ''),
      );
      await load();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const undo = async (logId: string) => {
    setBusy(true);
    try {
      await api.call('attendanceUndoNotified', { courseId: course.id, logId });
      notify('已撤銷，這封回到待通知');
      await load();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    const base = location.origin + location.pathname;
    try {
      await api.call('attendanceMailConfig', {
        courseId: course.id,
        set: {
          mentors: { [classId]: cfg.mentors[classId] || { name: '', email: '' } },
          teacherName: cfg.teacherName,
          gmailAccount: cfg.gmailAccount,
          ...(/^https:\/\//.test(base) ? { platformUrl: base } : {}),
        },
      });
      notify('通知設定已儲存');
      await load();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const groups = new Map<string, Draft[]>();
  for (const m of st.student) {
    const key = m.sessionId || sessionDateTime(m);
    groups.set(key, [...(groups.get(key) || []), m]);
  }
  const className = (id: string) => course.classNames?.[id] || id;
  let first = true;
  const openOnce = () => {
    const o = first;
    first = false;
    return o;
  };
  return (
    <div className="att-mails">
      <section className="att-mail">
        <h2>待通知（系統不會自己寄信）</h2>
        <p className="muted">
          按〔開啟
          Gmail〕會開一封新信，收件人、主旨、內文已帶入，檢查後按寄出；也可以分別複製再貼上。寄出後回來按〔已寄，標記已通知〕。
        </p>
        {!!st.unconfirmedToday.length && (
          <div className="notice warning">
            今天還有 {st.unconfirmedToday.length} 筆點名尚未確認（
            {st.unconfirmedToday.map(sessionLabel).join('、')}
            ），確認後才會出現在這裡。請先到點名明細確認。
          </div>
        )}
        <h3>學生（{st.student.length} 封）</h3>
        {!st.student.length && <p className="muted">目前沒有待通知的學生。</p>}
        {[...groups.entries()].map(([key, list]) => (
          <div key={key} className="att-draft-group">
            <div className="att-row-head">
              <strong>
                {sessionLabel(list[0])}：{list.length} 封
              </strong>
              <button disabled={busy} onClick={() => void mark(list)}>
                本筆全部標記已通知
              </button>
            </div>
            {list.map((m) => (
              <DraftCard
                key={m.draftId}
                draft={m}
                title={`${m.name}（${className(m.classId || '')}）`}
                gmailAccount={st.gmailAccount}
                open={openOnce()}
                busy={busy}
                onMark={() => void mark([m])}
              />
            ))}
          </div>
        ))}
        <h3>導師彙整（{st.digest.length} 封）</h3>
        {!st.digest.length && <p className="muted">今天沒有待寄的導師彙整。</p>}
        {st.digest.map((g) => (
          <div key={g.draftId}>
            {g.ready ? (
              <div className="att-notice-bar">
                {className(g.classId || '')}今天的點名都已確認，彙整可以寄了
                {g.supplement ? '（補充先前寄出後新確認的點名）' : ''}。
              </div>
            ) : (
              <p className="muted">
                {className(g.classId || '')}尚未確認的點名：{(g.unconfirmed || []).join('、')}
                。可以先寄；之後確認的點名會另外出一封補充彙整。
              </p>
            )}
            <DraftCard
              draft={g}
              title={`${className(g.classId || '')} → ${g.name || g.to}`}
              gmailAccount={st.gmailAccount}
              open={!!g.ready && openOnce()}
              busy={busy}
              onMark={() => void mark([g])}
            />
          </div>
        ))}
        {!!st.noMentor.length && (
          <p className="att-fail">
            {st.noMentor.map(className).join('、')}{' '}
            還沒填導師信箱，無法產生彙整（到右邊〔通知設定〕填寫）。
          </p>
        )}
        <p className="muted">
          信件只寫點名資訊，不含成績、情緒、關心標記、同裝置提醒與修改原因。內文不會存進系統，通知紀錄只記收件人與時間。
        </p>
      </section>
      <section className="att-mail">
        <h2>通知紀錄</h2>
        {!st.log.length ? (
          <p className="muted">還沒有標記過。</p>
        ) : (
          <div className="att-scroll">
            <table>
              <thead>
                <tr>
                  <th>標記時間</th>
                  <th>收件人</th>
                  <th>種類</th>
                  <th>點名時間</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {st.log.map((l) => (
                  <tr key={l.key}>
                    <td>{taipeiDateTime(l.markedAt).slice(5)}</td>
                    <td>{l.name || l.to}</td>
                    <td>{kindLabel[l.kind] || l.kind}</td>
                    <td>{l.labels?.join('、') || l.date}</td>
                    <td>
                      {l.status === 'undone' ? '已撤銷' : `已通知（${l.byName}）`}
                      {l.canUndo && (
                        <button disabled={busy} onClick={() => void undo(l.id)}>
                          撤銷
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">
          按錯可在 24 小時內撤銷；撤銷後這封回到待通知，紀錄保留為「已撤銷」。
        </p>
        <h2>通知設定</h2>
        <div className="att-settings">
          <label>
            信件署名
            <input
              value={cfg.teacherName}
              maxLength={40}
              onChange={(e) => setCfg({ ...cfg, teacherName: e.target.value })}
            />
          </label>
          <label>
            開啟 Gmail 用的帳號（留空＝目前登入平台的帳號）
            <input
              type="email"
              value={cfg.gmailAccount}
              placeholder={st.gmailAccount}
              onChange={(e) => setCfg({ ...cfg, gmailAccount: e.target.value })}
            />
          </label>
          {[classId].map((id) => (
            <fieldset key={id}>
              <legend>{className(id)} 導師</legend>
              <label>
                姓名
                <input
                  value={cfg.mentors[id]?.name || ''}
                  maxLength={40}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      mentors: {
                        ...cfg.mentors,
                        [id]: { name: e.target.value, email: cfg.mentors[id]?.email || '' },
                      },
                    })
                  }
                />
              </label>
              <label>
                信箱
                <input
                  type="email"
                  value={cfg.mentors[id]?.email || ''}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      mentors: {
                        ...cfg.mentors,
                        [id]: { name: cfg.mentors[id]?.name || '', email: e.target.value },
                      },
                    })
                  }
                />
              </label>
            </fieldset>
          ))}
          <button className="primary" onClick={() => void save()}>
            儲存
          </button>
        </div>
      </section>
    </div>
  );
}

type ActiveRoll = NonNullable<AttendanceClassCards['active']>;
type ClassRecords = {
  sessions: Session[];
  deleted: Session[];
  open: Session | null;
  stats?: { members: number; pending: number; todayCount: number; pendingConfirm: number; rate: number | null };
};
const durationKey = 'attendance-last-open-minutes';
function lastDuration() {
  try {
    const saved = Number(localStorage.getItem(durationKey));
    if (saved >= 0.5 && saved <= 30) return saved;
  } catch {
    /* Device storage may be disabled. */
  }
  return 1;
}

function StartForm({
  trial,
  onSubmit,
  onCancel,
}: {
  trial: boolean;
  onSubmit: (values: {
    durationSec: number;
    codeSec: number;
    qrSec: number;
    trial: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [minutes, setMinutes] = useState(() => String(lastDuration()));
  const [codeSec, setCodeSec] = useState<number>(attendanceLimits.codeSec.default);
  const [qrSec, setQrSec] = useState<number>(attendanceLimits.qrSec.default);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel att-record-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
          await onSubmit({ durationSec: Math.round(Number(minutes) * 60), codeSec, qrSec, trial });
          try {
            localStorage.setItem(durationKey, minutes);
          } catch {
            /* Start succeeded. */
          }
        } catch {
          // The caller displays the failure and leaves the form open.
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>{trial ? '試簽（不算點名）' : '新增點名'}</h3>
      <fieldset disabled={busy}>
        <label>
          開放幾分鐘{' '}
          <input
            type="number"
            min={0.5}
            max={30}
            step={0.5}
            required
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <details>
          <summary>進階</summary>
          <label>
            數字碼更換（秒）{' '}
            <input
              type="number"
              min={15}
              max={300}
              required
              value={codeSec}
              onChange={(e) => setCodeSec(Number(e.target.value))}
            />
          </label>
          <label>
            QR 更換（秒）{' '}
            <input
              type="number"
              min={10}
              max={60}
              required
              value={qrSec}
              onChange={(e) => setQrSec(Number(e.target.value))}
            />
          </label>
        </details>
        <div className="att-actions">
          <button className="primary" type="submit">
            {trial ? '開始試簽' : '開始點名'}
          </button>
          <button type="button" onClick={onCancel}>
            取消
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function DeleteDialog({
  session,
  course,
  onCancel,
  onDelete,
}: {
  session: Session;
  course: Course;
  onCancel: () => void;
  onDelete: (reason: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const counts = session.deleteCounts || session.counts;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="att-delete-dialog"
      aria-labelledby="att-delete-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            await onDelete(reason);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <h2 id="att-delete-title">刪除這筆點名？</h2>
        <p>
          {sessionLabel(session)}・{classLabel(course, session.classIds)}
        </p>
        <p>
          準時 {counts.present} 人，未到 {counts.absent} 人。
        </p>
        <p>刪除後會從學生總表、學生的出缺席紀錄與匯出移除。180 天內可以復原，之後自動永久刪除。</p>
        {session.classIds.length > 1 && <p>這是舊的合班紀錄，刪除會套用到上方所有班級。</p>}
        {session.notified && <p className="att-danger">已寄出的學生或導師通知無法撤回。</p>}
        <label>
          刪除原因（選填）
          <input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="att-actions">
          <button type="button" autoFocus disabled={busy} onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="att-danger" disabled={busy}>
            確定刪除
          </button>
        </div>
      </form>
    </dialog>
  );
}

function ClassRecordsView({
  api,
  course,
  notify,
  classId,
  onOpen,
  onDetail,
  onSummary,
  onNotify,
  onChanged,
  active,
}: Props & {
  classId: string;
  onOpen: (session: Session, live?: LiveData) => void;
  onDetail: (sid: string) => void;
  onSummary: () => void;
  onNotify: () => void;
  onChanged: () => void;
  active: ActiveRoll | null;
}) {
  const [data, setData] = useState<ClassRecords | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState<'roll' | 'trial' | 'backfill'>();
  const [date, setDate] = useState(() => taipeiDate(Date.now()));
  const [time, setTime] = useState(() => taipeiTime(Date.now()));
  const [deleting, setDeleting] = useState<Session>();
  const [restoring, setRestoring] = useState('');
  const [menu, setMenu] = useState('');
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    let alive = true;
    api
      .call<ClassRecords>('attendanceSessions', { courseId: course.id, classId })
      .then((r) => {
        if (alive) {
          setData(r);
          setError('');
        }
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [api, course.id, classId, revision]);
  const refresh = () => {
    setRevision((value) => value + 1);
    onChanged();
  };
  const mutate = (method: string, payload: Record<string, unknown>) =>
    api.call<{ session: Session }>(method, { courseId: course.id, ...payload });
  const stats = data?.stats;
  return (
    <>
    {creating && <section className="att-proj" aria-label="投影畫面">
      <div className="att-proj-top"><strong role="status">點名建立中…</strong></div>
    </section>}
    <div className="att-admin-col" style={creating ? { display: 'none' } : undefined}>
      <div className="att-actions">
        <button
          className="primary"
          type="button"
          disabled={!!active || !!data?.open}
          onClick={() => setForm(form === 'roll' ? undefined : 'roll')}
        >
          新增點名
        </button>
        <button
          type="button"
          disabled={!!active || !!data?.open}
          onClick={() => setForm(form === 'trial' ? undefined : 'trial')}
        >
          試簽（不算點名）
        </button>
      </div>
      {(form === 'roll' || form === 'trial') && (
        <StartForm
          key={form}
          trial={form === 'trial'}
          onCancel={() => setForm(undefined)}
          onSubmit={async (values) => {
            setCreating(true);
            try {
              const { session, live } = await api.call<{ session: Session; live: LiveData }>('attendanceStart', {
                courseId: course.id, ...values, classIds: [classId],
              });
              onOpen(session, live);
            } catch (e) {
              notify((e as Error).message);
              throw e;
            } finally {
              setCreating(false);
            }
          }}
        />
      )}
      <div className="att-class-tools">
        <button type="button" className="att-summary-link" onClick={onSummary}>
          <strong>學生總表</strong>
          {stats && <span>
            {stats.members} 人・本學期出席率 {stats.rate === null ? '—' : `${Math.round(stats.rate * 100)}%`}
          </span>}
        </button>
        <button type="button" onClick={onNotify}>
          通知{stats && `（${stats.pending}）`}
        </button>
      </div>
      <section className="panel">
        <div className="att-row-head">
          <h2>已點紀錄</h2>
          <button
            type="button"
            onClick={() => setForm(form === 'backfill' ? undefined : 'backfill')}
          >
            補建一筆點名
          </button>
        </div>
        {form === 'backfill' && (
          <form
            className="att-record-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (backfillBusy) return;
              setBackfillBusy(true);
              try {
                const { session } = await mutate('attendanceBackfill', {
                  classIds: [classId],
                  date,
                  time,
                });
                onDetail(session.id);
                onChanged();
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBackfillBusy(false);
              }
            }}
          >
            <p>先將全班記為未到，再到明細修改。</p>
            <label>
              日期{' '}
              <input
                type="date"
                required
                max={taipeiDate(Date.now())}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              點名時間{' '}
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <div className="att-actions">
              <button className="primary" type="submit" disabled={backfillBusy}>
                建立
              </button>
              <button type="button" onClick={() => setForm(undefined)}>
                取消
              </button>
            </div>
          </form>
        )}
        {error && (
          <p role="alert">
            {error}{' '}
            <button type="button" onClick={refresh}>
              重新讀取
            </button>
          </p>
        )}
        {stats && <p>今天已點 {stats.todayCount} 次・待確認 {stats.pendingConfirm} 筆</p>}
        {!data ? (
          <p role="status">讀取點名紀錄…</p>
        ) : !data.sessions.length ? (
          <p className="muted">還沒有點名紀錄。</p>
        ) : (
          <ul className="att-record-list">
            {data.sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="att-record-link"
                  onClick={() => (s.status === 'open' ? onOpen(s) : onDetail(s.id))}
                >
                  <strong>{sessionDateTime(s)}</strong>
                  {s.status === 'open' ? (
                    <span>點名中</span>
                  ) : (
                    <>
                      <span>
                        準時 {s.counts.present}・未到 {s.counts.absent}
                      </span>
                      <span className={s.confirmedAt ? 'muted' : 'att-pending-text'}>
                        {s.confirmedAt ? '已確認' : '待確認'}
                      </span>
                    </>
                  )}
                  {!!s.reopenCount && <span>曾再開放</span>}
                  {s.backfilled && <span>補建</span>}
                </button>
                {s.status === 'closed' && (
                  <div className="att-record-menu">
                    <button
                      type="button"
                      aria-expanded={menu === s.id}
                      aria-label={`${sessionDateTime(s)} 的操作`}
                      onClick={() => setMenu(menu === s.id ? '' : s.id)}
                    >
                      ⋯
                    </button>
                    {menu === s.id && (
                      <button
                        type="button"
                        className="att-danger"
                        onClick={() => {
                          setMenu('');
                          setDeleting(s);
                        }}
                      >
                        刪除這筆點名
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {data && (
          <details className="att-deleted">
            <summary>已刪除（{data.deleted.length}）</summary>
            {data.deleted.length ? (
              <ul className="att-record-list">
                {data.deleted.map((s) => (
                  <li key={s.id}>
                    <div className="att-record-link">
                      <strong>{sessionDateTime(s)}</strong>
                      <span>可復原至 {taipeiDateTime(s.deletedAt! + ATTENDANCE_RESTORE_MS)}</span>
                      {s.deletedReason && <span>{s.deletedReason}</span>}
                    </div>
                    <button
                      type="button"
                      disabled={!!restoring}
                      onClick={async () => {
                        setRestoring(s.id);
                        try {
                          await mutate('attendanceRestoreSession', { sessionId: s.id });
                          refresh();
                        } catch (e) {
                          notify((e as Error).message);
                        } finally {
                          setRestoring('');
                        }
                      }}
                    >
                      復原
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">沒有可復原的紀錄。</p>
            )}
          </details>
        )}
      </section>
      {deleting && (
        <DeleteDialog
          session={deleting}
          course={course}
          onCancel={() => setDeleting(undefined)}
          onDelete={async (reason) => {
            await mutate('attendanceDeleteSession', { sessionId: deleting.id, reason });
            setDeleting(undefined);
            refresh();
          }}
        />
      )}
    </div>
    </>
  );
}

export default function AttendanceAdmin({ classDirectory, ...props }: Props & {
  classDirectory?: ReturnType<typeof attendanceClassDirectory>;
}) {
  const { api, course, notify } = props;
  const directory = useMemo(() => classDirectory ?? attendanceClassDirectory(api, course.id), [classDirectory, api, course.id]);
  const [classId, setClassId] = useState('');
  const [view, setView] = useState<'records' | 'detail' | 'summary' | 'notify'>('records');
  const [sid, setSid] = useState('');
  const [classes, setClasses] = useState(directory.snapshot);
  const [activeState, setActiveState] = useState<Pick<AttendanceClassCards, 'active' | 'now'>>();
  const [revision, setRevision] = useState(0);
  const [projecting, setProjecting] = useState<Projection>();
  const [deleting, setDeleting] = useState<Session>();
  const [error, setError] = useState('');
  const liveRequest = useRef<Promise<void>>();
  const refresh = () => setRevision((value) => value + 1);
  const card = classes?.find((c) => c.classId === classId);
  useEffect(() => {
    let alive = true;
    const load = async (afterPending = false) => {
      try {
        const r = await directory.refresh({ afterPending });
        if (alive) {
          setClasses(r.classes);
          setActiveState({ active: r.active, now: r.now });
          setError('');
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    // Reconcile the banner when a teacher returns from another tab.
    const visible = () => {
      if (!document.hidden) void load();
    };
    void load(revision > 0);
    document.addEventListener('visibilitychange', visible);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', visible);
    };
  }, [directory, revision]);
  const back = () => {
    setView('records');
    setClassId('');
  };
  const detail = (id: string) => {
    setSid(id);
    setView('detail');
  };
  const open = (session: Session, live?: LiveData) => {
    if (!classId || !session.classIds.includes(classId)) setClassId(session.classIds[0]);
    setProjecting({ session, live: live && { ...live, receivedAt: performance.now() } });
  };
  const ended = (session?: Session) => {
    setProjecting(undefined);
    refresh();
    if (session?.kind === 'roll') {
      if (!session.classIds.includes(classId)) setClassId(session.classIds[0]);
      detail(session.id);
      notify('點名已結束，未簽到的記為未到');
    } else {
      setView('records');
      if (session) notify('試簽已結束（不算點名）');
    }
  };
  const active = activeState?.active || null;
  useEffect(() => {
    if (!active?.endsAt || projecting) return;
    const timer = setTimeout(
      refresh,
      Math.max(0, active.endsAt + ATTENDANCE_GRACE_MS + 250 - (activeState?.now || Date.now())),
    );
    return () => clearTimeout(timer);
  }, [active, projecting, activeState?.now]);
  useEffect(() => {
    if (card && !api.preview) warmCallables(api, 'attendance-class', ['attendanceStart', 'attendanceLive', 'attendanceCheckIn']);
  }, [api, card?.classId]);
  return (
    <div className="att-sheet att-page att-class-first">
      {projecting ? (
        <LiveView
          {...props}
          inFlight={liveRequest}
          initial={projecting}
          onEnded={ended}
          onBack={() => {
            setProjecting(undefined);
            back();
            refresh();
          }}
        />
      ) : (
        <>
          {active && (
            <div className="att-live-banner">
              <strong>
                {active.kind === 'trial' ? '試簽中' : '點名中'}
                {!!active.classIds.length && `・${classLabel(course, active.classIds)}`}
              </strong>
              <button type="button" onClick={() => setProjecting({})}>
                回到投影
              </button>
            </div>
          )}
          {error && (
            <p role="alert">
              {error}{' '}
              <button type="button" onClick={refresh}>
                重新讀取
              </button>
            </p>
          )}
          {!classId || !card ? (
            <>
              <h2>點名班級</h2>
              {!classes && !error && <p role="status">載入中…</p>}
              {classes?.length === 0 && <p className="muted">這門課程還沒有班級。</p>}
              {classes?.map((c) => (
                <button
                  type="button"
                  key={c.classId}
                  className="att-class-card"
                  onClick={() => {
                    setClassId(c.classId);
                    setView('records');
                  }}
                >
                  <strong>{c.name || c.classId}{c.test ? '（測試班）' : ''}</strong>
                  <span aria-hidden="true" className="att-class-chevron">
                    ›
                  </span>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="att-class-head">
                <button
                  type="button"
                  onClick={view === 'records' ? back : () => setView('records')}
                >
                  {view === 'records' ? '← 班級列表' : '← 班級紀錄'}
                </button>
                <h2>
                  {classLabel(course, [classId])}
                  {view === 'notify' ? '・通知' : ''}
                </h2>
              </div>
              {view === 'records' && (
                <ClassRecordsView
                  key={classId}
                  {...props}
                  classId={classId}
                  active={active}
                  onOpen={open}
                  onDetail={detail}
                  onSummary={() => setView('summary')}
                  onNotify={() => setView('notify')}
                  onChanged={refresh}
                />
              )}
              {view === 'detail' && (
                <RecordDetail
                  key={sid}
                  {...props}
                  sid={sid}
                  onGoNotify={() => setView('notify')}
                  onChanged={refresh}
                  onReopened={open}
                  onDelete={setDeleting}
                />
              )}
              {view === 'summary' && <SummaryView {...props} classId={classId} onDetail={detail} />}
              {view === 'notify' && <NotifyView {...props} classId={classId} onChanged={refresh} />}
            </>
          )}
          {deleting && (
            <DeleteDialog
              session={deleting}
              course={course}
              onCancel={() => setDeleting(undefined)}
              onDelete={async (reason) => {
                await api.call('attendanceDeleteSession', {
                  courseId: course.id,
                  sessionId: deleting.id,
                  reason,
                });
                setDeleting(undefined);
                setView('records');
                refresh();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
