// 課堂點名（#67）教師端：開始點名與投影、節次與單節名冊、總表、修改紀錄、通知（半自動，系統不寄信）。
// 版面沿用教師 2026-11-16 核可的樣張（src/AttendanceSample.tsx）。
import { useEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import type { API } from './service';
import type { Course } from '../shared/model';
import {
  attendUrl,
  attendanceLimits,
  attendanceStatusLabel,
  gmailComposeUrl,
  pendingNotificationCount,
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
  endsAt: number;
  expected: number;
  counts: { present: number; absent: number };
  backfilled: boolean;
  confirmedAt: number;
  durationSec: number;
  codeSec: number;
  qrSec: number;
};
type Live = {
  session: Session | null;
  now?: number;
  remainingMs?: number;
  signed?: number;
  code?: string;
  codeRemainingMs?: number;
  token?: string;
  qrRemainingMs?: number;
};
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
  classId?: string;
  sessionId?: string;
  periods?: number[];
  ready?: boolean;
  supplement?: boolean;
  unconfirmed?: number[];
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
    periods?: number[];
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
function saveCsv(filename: string, csv: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
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
function LiveView({
  api,
  course,
  notify,
  onEnded,
}: Props & { onEnded: (kind: 'roll' | 'trial') => void }) {
  const [live, setLive] = useState<Live | null>(null);
  const [offset, setOffset] = useState(0);
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [classIds, setClassIds] = useState<string[]>(course.classIds.slice(0, 1));
  const [period, setPeriod] = useState(1);
  const [minutes, setMinutes] = useState(1);
  const [codeSec, setCodeSec] = useState<number>(attendanceLimits.codeSec.default);
  const [qrSec, setQrSec] = useState<number>(attendanceLimits.qrSec.default);
  const stage = useRef<HTMLDivElement>(null);
  const wasOpen = useRef<'' | 'roll' | 'trial'>('');
  const load = async () => {
    try {
      const r = await api.call<Live>('attendanceLive', { courseId: course.id });
      if (r.now) setOffset(r.now - Date.now());
      if (wasOpen.current && !r.session) onEnded(wasOpen.current);
      wasOpen.current = r.session?.kind || '';
      setLive(r);
    } catch (e) {
      if (!live) notify((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [course.id]);
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
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const start = (trial: boolean) =>
    act(() =>
      api.call('attendanceStart', {
        courseId: course.id,
        classIds,
        period,
        durationSec: Math.round(minutes * 60),
        codeSec,
        qrSec,
        ...(trial ? { trial: true } : {}),
      }),
    );
  if (!live) return <p className="muted">讀取中…</p>;
  const s = live.session;
  if (!s)
    return (
      <section className="panel att-start">
        <h2>開始點名</h2>
        <div className="att-start-grid">
          <fieldset className="att-classes">
            <legend>班級（可多選一起點）</legend>
            {course.classIds.map((id) => (
              <label key={id} className="check">
                <input
                  type="checkbox"
                  checked={classIds.includes(id)}
                  onChange={(e) =>
                    setClassIds(
                      e.target.checked ? [...classIds, id] : classIds.filter((x) => x !== id),
                    )
                  }
                />
                {course.classNames?.[id] || id}
              </label>
            ))}
          </fieldset>
          <label>
            節次
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              {Array.from({ length: attendanceLimits.period.max }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  今天第 {i + 1} 節
                </option>
              ))}
            </select>
          </label>
          <label>
            點名時間（分鐘）
            <input
              type="number"
              min={0.5}
              max={30}
              step={0.5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <label>
            數字碼更換（秒，15–300）
            <input
              type="number"
              min={15}
              max={300}
              value={codeSec}
              onChange={(e) => setCodeSec(Number(e.target.value))}
            />
          </label>
          <label>
            QR 更換（秒，10–60）
            <input
              type="number"
              min={10}
              max={60}
              value={qrSec}
              onChange={(e) => setQrSec(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="att-start-actions">
          <button
            className="primary"
            disabled={busy || !classIds.length}
            onClick={() => void start(false)}
          >
            開始點名
          </button>
          <button disabled={busy || !classIds.length} onClick={() => void start(true)}>
            試簽（不算點名）
          </button>
          <span className="muted">
            試簽：第一堂課讓全班先掃一次，把登入狀態留在手機裡。同一節重新按〔開始點名〕會沿用原紀錄，已簽到的保留。
          </span>
        </div>
      </section>
    );
  const elapsed = Date.now() + offset - (live.now || 0);
  const remain = (live.remainingMs || 0) - elapsed;
  const step = (left: number | undefined, sec: number) => {
    const ms = (left || 0) - elapsed;
    return ms > 0 ? ms : sec * 1000 + (ms % (sec * 1000));
  };
  return (
    <div className="att-proj-fit" ref={stage}>
      <section className="att-proj" aria-label="投影畫面">
        <div className="att-proj-top">
          <strong>
            {course.title}　{s.kind === 'trial' ? '試簽（不算點名）' : '課堂點名'}
          </strong>
          <span>
            {sessionLabel(s)}・{classLabel(course, s.classIds)}
          </span>
        </div>
        <div className="att-proj-main">
          <div className="att-proj-qr">
            <Qr text={attendUrl(location.origin + location.pathname, course.id, live.token)} />
            <p>
              用<b>手機相機</b>掃描（不要用 LINE、IG 掃）
            </p>
            <small>QR {Math.ceil(step(live.qrRemainingMs, s.qrSec) / 1000)} 秒後更換</small>
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
              <b>{(live.code || '').split('').join(' ')}</b>
              <small>{Math.ceil(step(live.codeRemainingMs, s.codeSec) / 1000)} 秒後更換</small>
            </div>
          </div>
        </div>
        <div className="att-proj-actions">
          <button onClick={() => void stage.current?.requestFullscreen?.()}>全螢幕</button>
          <button
            disabled={busy}
            onClick={() =>
              void act(() => api.call('attendanceControl', { courseId: course.id, action: 'end' }))
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
  );
}

/* ───────── 節次列表＋單節名冊 ───────── */
function SessionsView({
  api,
  course,
  notify,
  onGoNotify,
  onChanged,
}: Props & { onGoNotify: () => void; onChanged: () => void }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [sid, setSid] = useState('');
  const [roster, setRoster] = useState<{ session: Session; rows: RosterRow[] } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<RosterRow | null>(null);
  const [reason, setReason] = useState('');
  const [backfill, setBackfill] = useState<{
    date: string;
    period: number;
    classIds: string[];
  } | null>(null);
  const loadSessions = async (keep = sid) => {
    try {
      const r = await api.call<{ sessions: Session[] }>('attendanceSessions', {
        courseId: course.id,
      });
      setSessions(r.sessions);
      const next =
        r.sessions.find((s) => s.id === keep && s.status === 'closed') ||
        r.sessions.find((s) => s.status === 'closed');
      setSid(next?.id || '');
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const loadRoster = async (id: string) => {
    if (!id) return setRoster(null);
    try {
      setRoster(await api.call('attendanceRoster', { courseId: course.id, sessionId: id }));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  useEffect(() => {
    void loadSessions('');
  }, [course.id]);
  useEffect(() => {
    setPicked(new Set());
    setEditing(null);
    void loadRoster(sid);
  }, [sid]);
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
      setPicked(new Set());
      await loadSessions();
      await loadRoster(sid);
      onChanged();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const confirm = async (confirmed: boolean) => {
    try {
      await api.call('attendanceConfirm', { courseId: course.id, sessionId: sid, confirmed });
      await loadSessions();
      await loadRoster(sid);
      onChanged();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const s = roster?.session;
  const flagged = roster?.rows.filter((r) => r.sameDevice.length) || [];
  const pending = roster?.rows.filter((r) => r.pendingMail).length || 0;
  return (
    <div className="att-admin">
      <aside className="panel att-sessions">
        <div className="att-row-head">
          <h2>節次</h2>
          <button
            onClick={() =>
              setBackfill({
                date: taipeiDate(Date.now()),
                period: 1,
                classIds: course.classIds.slice(0, 1),
              })
            }
          >
            補建節次
          </button>
        </div>
        {backfill && (
          <div className="att-confirm">
            <strong>補建漏開的節次（全班先記未到，再逐一改）</strong>
            <label>
              日期{' '}
              <input
                type="date"
                value={backfill.date}
                max={taipeiDate(Date.now())}
                onChange={(e) => setBackfill({ ...backfill, date: e.target.value })}
              />
            </label>
            <label>
              節次{' '}
              <select
                value={backfill.period}
                onChange={(e) => setBackfill({ ...backfill, period: Number(e.target.value) })}
              >
                {Array.from({ length: attendanceLimits.period.max }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    第 {i + 1} 節
                  </option>
                ))}
              </select>
            </label>
            {course.classIds.map((id) => (
              <label key={id} className="check">
                <input
                  type="checkbox"
                  checked={backfill.classIds.includes(id)}
                  onChange={(e) =>
                    setBackfill({
                      ...backfill,
                      classIds: e.target.checked
                        ? [...backfill.classIds, id]
                        : backfill.classIds.filter((x) => x !== id),
                    })
                  }
                />
                {course.classNames?.[id] || id}
              </label>
            ))}
            <div>
              <button
                className="primary"
                disabled={!backfill.classIds.length}
                onClick={async () => {
                  try {
                    const r = await api.call<{ session: Session }>('attendanceBackfill', {
                      courseId: course.id,
                      ...backfill,
                    });
                    setBackfill(null);
                    await loadSessions(r.session.id);
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                建立
              </button>
              <button onClick={() => setBackfill(null)}>取消</button>
            </div>
          </div>
        )}
        {!sessions ? (
          <p className="muted">讀取中…</p>
        ) : !sessions.length ? (
          <p className="muted">還沒有點名紀錄。</p>
        ) : (
          <ul>
            {sessions.map((x) => (
              <li key={x.id} className={x.id === sid ? 'current' : ''}>
                <button
                  className="att-session-pick"
                  disabled={x.status === 'open'}
                  onClick={() => setSid(x.id)}
                >
                  <strong>{sessionLabel(x)}</strong>
                  <span>
                    {classLabel(course, x.classIds)}
                    {x.backfilled ? '・補建' : ''}
                  </span>
                  {x.status === 'open' ? (
                    <em className="att-tag live">點名中</em>
                  ) : (
                    <>
                      <span>
                        準時 {x.counts.present}　未到 {x.counts.absent}
                      </span>
                      <em className={`att-tag ${x.confirmedAt ? 'sent' : 'todo'}`}>
                        {x.confirmedAt ? '已確認' : '尚未確認'}
                      </em>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      {!s || !roster ? (
        <section className="panel">
          <p className="muted">
            {sessions && !sessions.length ? '先到〔點名〕分頁開始第一次點名。' : '請從左邊選一節。'}
          </p>
        </section>
      ) : (
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
                  {s.backfilled ? '・補建的節次' : ''}
                </span>
              </p>
            </div>
            <div className="att-actions">
              <button
                onClick={async () => {
                  try {
                    const r = await api.call<{ filename: string; csv: string }>(
                      'attendanceExport',
                      { courseId: course.id, kind: 'session', sessionId: sid },
                    );
                    saveCsv(r.filename, r.csv);
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                匯出本節 CSV
              </button>
              {s.confirmedAt ? (
                <button onClick={() => void confirm(false)}>取消確認</button>
              ) : (
                <button className="primary" onClick={() => void confirm(true)}>
                  確認這一節（未到 {s.counts.absent} 人）
                </button>
              )}
            </div>
          </div>
          {s.confirmedAt ? (
            pending ? (
              <div className="att-notice-bar">
                <strong>這一節已確認：{pending} 位待通知</strong>
                <span>系統不會自己寄信；到〔通知〕複製信件內容或開啟 Gmail 寄出。</span>
                <button className="primary" onClick={onGoNotify}>
                  前往通知
                </button>
              </div>
            ) : (
              <p className="muted">這一節已確認，沒有待通知的學生。</p>
            )
          ) : (
            <p className="muted">確認後，這一節的未到通知才會出現在〔通知〕；確認前可以先修改狀態。</p>
          )}
          {!!flagged.length && (
            <div className="notice warning att-device">
              ⚠ 同裝置提醒：{flagged.map((r) => r.name).join('、')}{' '}
              用同一台手機簽到。只是提醒，請自行判斷；不會擋下簽到，也不會寫進通知信。
            </div>
          )}
          <div className="att-bulk">
            <span>已選 {picked.size} 人</span>
            <button disabled={!picked.size} onClick={() => void change([...picked], 'present')}>
              改為準時
            </button>
            <button disabled={!picked.size} onClick={() => void change([...picked], 'absent')}>
              改為未到
            </button>
          </div>
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
                      {editing?.email === r.email && (
                        <div className="att-pop" role="dialog" aria-label="修改狀態">
                          <strong>
                            {r.name}：{attendanceStatusLabel[r.status]} →{' '}
                            {attendanceStatusLabel[r.status === 'present' ? 'absent' : 'present']}
                          </strong>
                          <label>
                            原因（可不填，只有老師看得到）
                            <input
                              value={reason}
                              maxLength={200}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </label>
                          <div>
                            <button
                              className="primary"
                              onClick={() =>
                                void change(
                                  [r.email],
                                  r.status === 'present' ? 'absent' : 'present',
                                  reason,
                                )
                              }
                            >
                              改為
                              {attendanceStatusLabel[r.status === 'present' ? 'absent' : 'present']}
                            </button>
                            <button onClick={() => setEditing(null)}>不改</button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {r.status === 'present' && r.signedAt && r.via !== 'teacher'
                        ? taipeiTime(r.signedAt, true)
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
                        r.sameDevice.length ? `⚠ 與 ${r.sameDevice.join('、')} 同裝置` : '',
                        r.locked ? '🔒 數字碼錯 5 次，已鎖住' : '',
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
      )}
    </div>
  );
}

/* ───────── 總表、修改紀錄 ───────── */
function SummaryView({ api, course, notify }: Props) {
  const [classId, setClassId] = useState('');
  const [data, setData] = useState<{
    sessions: Session[];
    rows: {
      email: string;
      studentId: string;
      name: string;
      classId: string;
      present: number;
      absent: number;
      cells: ({ status: AttendanceStatus; edited: boolean } | null)[];
    }[];
  } | null>(null);
  const [audit, setAudit] = useState<
    {
      at: number;
      date: string;
      period: number;
      name: string;
      studentId: string;
      from: AttendanceStatus;
      to: AttendanceStatus;
      reason: string;
      byName: string;
    }[]
  >([]);
  useEffect(() => {
    setData(null);
    api
      .call('attendanceSummary', { courseId: course.id, ...(classId ? { classId } : {}) })
      .then(setData)
      .catch((e) => notify((e as Error).message));
  }, [course.id, classId]);
  useEffect(() => {
    api
      .call<{ rows: typeof audit }>('attendanceAuditLog', { courseId: course.id })
      .then((r) => setAudit(r.rows))
      .catch(() => {});
  }, [course.id]);
  const exportCsv = async (kind: 'summary' | 'detail') => {
    try {
      const r = await api.call<{ filename: string; csv: string }>('attendanceExport', {
        courseId: course.id,
        kind,
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
          <div>
            <h2>總表</h2>
            <p className="att-chips">
              <label>
                班級{' '}
                <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">全部</option>
                  {course.classIds.map((id) => (
                    <option key={id} value={id}>
                      {course.classNames?.[id] || id}
                    </option>
                  ))}
                </select>
              </label>
              <span className="muted">依未到次數排序。● 準時　✕ 未到　外框＝老師修改過</span>
            </p>
          </div>
          <div className="att-actions">
            <button onClick={() => void exportCsv('summary')}>總表 CSV</button>
            <button onClick={() => void exportCsv('detail')}>累加用明細檔</button>
          </div>
        </div>
        {!data ? (
          <p className="muted">讀取中…</p>
        ) : !data.rows.length ? (
          <p className="muted">還沒有點名紀錄。</p>
        ) : (
          <div className="att-table-wrap att-scroll">
            <table className="att-matrix">
              <thead>
                <tr>
                  <th>班級</th>
                  <th>學號</th>
                  <th>姓名</th>
                  {data.sessions.map((s) => (
                    <th key={s.id}>
                      {Number(s.date.slice(5, 7))}/{Number(s.date.slice(8))}
                      <br />第{s.period}節
                    </th>
                  ))}
                  <th>準時</th>
                  <th>未到</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.email}>
                    <td>{course.classNames?.[r.classId] || r.classId}</td>
                    <td>{r.studentId}</td>
                    <td>{r.name}</td>
                    {r.cells.map((c, i) => (
                      <td
                        key={i}
                        className={
                          c ? `att-sym att-sym-${c.status}${c.edited ? ' att-sym-edited' : ''}` : ''
                        }
                        title={
                          c
                            ? attendanceStatusLabel[c.status] + (c.edited ? '（老師修改過）' : '')
                            : '不在這一節的名單'
                        }
                      >
                        {c ? (c.status === 'present' ? '●' : '✕') : ''}
                      </td>
                    ))}
                    <td>{r.present}</td>
                    <td className={r.absent >= 2 ? 'att-many' : ''}>{r.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">
          累加用明細檔每學期欄位與順序完全相同，不同學期的檔案可以直接往下貼；學號以文字輸出，不含修改原因與同裝置提醒。
        </p>
      </section>
      <section className="panel">
        <h2>修改紀錄（學生看不到）</h2>
        {!audit.length ? (
          <p className="muted">還沒有修改紀錄。</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>修改時間</th>
                <th>節次</th>
                <th>學生</th>
                <th>改前 → 改後</th>
                <th>原因</th>
                <th>修改人</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a, i) => (
                <tr key={i}>
                  <td>{taipeiDateTime(a.at)}</td>
                  <td>{sessionLabel(a)}</td>
                  <td>
                    {a.name}（{a.studentId}）
                  </td>
                  <td>
                    <StatusPill status={a.from} /> → <StatusPill status={a.to} />
                  </td>
                  <td>{a.reason || '（未填）'}</td>
                  <td>{a.byName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
function NotifyView({ api, course, notify, onCount }: Props & { onCount: (n: number) => void }) {
  const [st, setSt] = useState<Drafts | null>(null);
  const [cfg, setCfg] = useState<NotifyConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const d = await api.call<Drafts>('attendanceNotifyDrafts', { courseId: course.id });
      setSt(d);
      onCount(pendingNotificationCount(d));
      setCfg(await api.call<NotifyConfig>('attendanceMailConfig', { courseId: course.id }));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [course.id]);
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
          mentors: cfg.mentors,
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
    const key = `${m.date}（${m.period}）`;
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
          按〔開啟 Gmail〕會開一封新信，收件人、主旨、內文已帶入，檢查後按寄出；也可以分別複製再貼上。寄出後回來按〔已寄，標記已通知〕。
        </p>
        {!!st.unconfirmedToday.length && (
          <div className="notice warning">
            今天還有 {st.unconfirmedToday.length} 節尚未確認（
            {st.unconfirmedToday.map((s) => `第 ${s.period} 節`).join('、')}
            ），確認後才會出現在這裡。請先到〔節次與名冊〕確認。
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
                這一節全部標記已通知
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
                {className(g.classId || '')}今天的節次都已確認，彙整可以寄了
                {g.supplement ? '（補充先前寄出後新確認的節次）' : ''}。
              </div>
            ) : (
              <p className="muted">
                {className(g.classId || '')}今天還有第 {(g.unconfirmed || []).join('、')}{' '}
                節未確認。可以先寄；之後確認的節次會另外出一封補充彙整。
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
            {st.noMentor.map(className).join('、')} 還沒填導師信箱，無法產生彙整（到右邊〔通知設定〕填寫）。
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
          <table>
            <thead>
              <tr>
                <th>標記時間</th>
                <th>收件人</th>
                <th>種類</th>
                <th>節次</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {st.log.map((l) => (
                <tr key={l.key}>
                  <td>{taipeiDateTime(l.markedAt).slice(5)}</td>
                  <td>{l.name || l.to}</td>
                  <td>{kindLabel[l.kind] || l.kind}</td>
                  <td>
                    {l.kind === 'digest'
                      ? `${l.date.slice(5)} 第 ${(l.periods || []).join('、')} 節`
                      : `${l.date.slice(5)} 第 ${l.period} 節`}
                  </td>
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
        )}
        <p className="muted">按錯可在 24 小時內撤銷；撤銷後這封回到待通知，紀錄保留為「已撤銷」。</p>
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
          {course.classIds.map((id) => (
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

export default function AttendanceAdmin(props: Props) {
  const [view, setView] = useState<'live' | 'sessions' | 'summary' | 'notify'>('live');
  const [pending, setPending] = useState(0);
  const refreshCount = async () => {
    try {
      const d = await props.api.call<Drafts>('attendanceNotifyDrafts', { courseId: props.course.id });
      setPending(pendingNotificationCount(d));
    } catch {
      // 數字只是提示；讀不到時不打擾老師
    }
  };
  useEffect(() => {
    if (view !== 'notify') void refreshCount();
  }, [props.course.id, view]);
  const tabs = [
    ['live', '點名'],
    ['sessions', '節次與名冊'],
    ['summary', '總表與修改紀錄'],
    ['notify', '通知'],
  ] as const;
  return (
    <div className="att-sheet att-page">
      <div className="att-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            className={view === id ? 'active' : ''}
            onClick={() => setView(id)}
          >
            {label}
            {id === 'notify' && pending > 0 && (
              <span className="att-badge" aria-label={`待通知 ${pending} 封`}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>
      {view === 'live' ? (
        <LiveView
          {...props}
          onEnded={(kind) => {
            if (kind === 'trial') return props.notify('試簽已結束（不算點名）');
            props.notify('點名已結束，未簽到的記為未到');
            setView('sessions');
          }}
        />
      ) : view === 'sessions' ? (
        <SessionsView
          {...props}
          onGoNotify={() => setView('notify')}
          onChanged={() => void refreshCount()}
        />
      ) : view === 'summary' ? (
        <SummaryView {...props} />
      ) : (
        <NotifyView {...props} onCount={setPending} />
      )}
    </div>
  );
}
