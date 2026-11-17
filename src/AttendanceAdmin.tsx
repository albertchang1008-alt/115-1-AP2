// 課堂點名（#67）教師端：開始點名與投影、節次與單節名冊、總表、修改紀錄、寄信。
// 版面沿用教師 2026-11-16 核可的樣張（src/AttendanceSample.tsx）。
import { useEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import type { API } from './service';
import type { Course } from '../shared/model';
import {
  attendUrl,
  attendanceLimits,
  attendanceStatusLabel,
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
type MailStatus = {
  student: {
    sessionId: string;
    date: string;
    period: number;
    email: string;
    name: string;
    kind: 'absent' | 'correction';
  }[];
  digest: { classId: string; mentorName: string; mentorEmail: string; periods: number[] }[];
  unconfirmedToday: Session[];
  dailyTime: string;
  scheduledAt: number;
  nextSendAt: number;
  mailerReady: boolean;
  lastAuto?: { at: number; sent: number; failed: number; error: string } | null;
  log: {
    id: string;
    kind: string;
    to: string;
    name: string;
    status: string;
    createdAt: number;
    sentAt: number;
    error: string;
  }[];
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

/* ───────── 寄出／排定（寄信時間由老師決定） ───────── */
function SendControls({
  api,
  course,
  notify,
  status,
  sessionId,
  onDone,
}: Props & { status: MailStatus; sessionId?: string; onDone: () => void }) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [time, setTime] = useState(status.dailyTime || '17:00');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      if (mode === 'now') {
        const r = await api.call<{ sent: number; failed: number }>('attendanceSendMail', {
          courseId: course.id,
          mode: 'now',
          ...(sessionId ? { sessionId, kinds: ['student'] } : {}),
        });
        notify(`已寄出 ${r.sent} 封${r.failed ? `，${r.failed} 封失敗（留在待寄，可再寄）` : ''}`);
      } else {
        const [h, m] = time.split(':').map(Number);
        let at = Date.parse(taipeiDate(Date.now()) + 'T00:00:00+08:00') + (h * 60 + m) * 60000;
        if (at <= Date.now()) at += 86400000;
        await api.call('attendanceSendMail', { courseId: course.id, mode: 'schedule', at });
        notify(`已排定 ${taipeiDateTime(at)} 寄出全部待寄的信`);
      }
      onDone();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="att-send">
      <label>
        <input
          type="radio"
          name={'when' + (sessionId || '')}
          checked={mode === 'now'}
          onChange={() => setMode('now')}
        />{' '}
        現在寄出{sessionId ? '（這一節）' : ''}
      </label>
      <label>
        <input
          type="radio"
          name={'when' + (sessionId || '')}
          checked={mode === 'schedule'}
          onChange={() => setMode('schedule')}
        />{' '}
        設定時間{' '}
        <input
          type="time"
          value={time}
          aria-label="寄送時間"
          onChange={(e) => {
            setTime(e.target.value);
            setMode('schedule');
          }}
        />
      </label>
      <button className="primary" disabled={busy || !status.mailerReady} onClick={() => void run()}>
        {mode === 'now' ? '寄出' : `排定 ${time} 寄出全部待寄`}
      </button>
      {!status.mailerReady && (
        <span className="att-fail">尚未設定寄信程式（到〔寄信〕分頁設定）</span>
      )}
    </div>
  );
}

/* ───────── 節次列表＋單節名冊 ───────── */
function SessionsView({ api, course, notify }: Props) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [sid, setSid] = useState('');
  const [roster, setRoster] = useState<{ session: Session; rows: RosterRow[] } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<RosterRow | null>(null);
  const [reason, setReason] = useState('');
  const [mail, setMail] = useState<MailStatus | null>(null);
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
      setMail(await api.call<MailStatus>('attendanceMailStatus', { courseId: course.id }));
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
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const confirm = async (confirmed: boolean) => {
    try {
      await api.call('attendanceConfirm', { courseId: course.id, sessionId: sid, confirmed });
      await loadSessions();
      await loadRoster(sid);
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
            <div className="att-confirm">
              <strong>這一節已確認：待寄 {pending} 封</strong>
              <p>
                只寄給「未到」的學生；寄過未到通知後改成準時的，會寄更正通知。什麼時候寄由你決定。
              </p>
              {mail && (
                <SendControls
                  api={api}
                  course={course}
                  notify={notify}
                  status={mail}
                  sessionId={sid}
                  onDone={() => void loadRoster(sid)}
                />
              )}
            </div>
          ) : (
            <p className="muted">確認後，這一節的未到通知才會列入待寄；確認前可以先修改狀態。</p>
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
                          ? '待寄未到通知'
                          : r.pendingMail === 'correction'
                            ? '待寄更正通知'
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

/* ───────── 寄信 ───────── */
function MailView({ api, course, notify }: Props) {
  const [st, setSt] = useState<MailStatus | null>(null);
  const [cfg, setCfg] = useState<{
    mentors: Record<string, { name: string; email: string }>;
    dailyTime: string;
    teacherName: string;
    mailerReady: boolean;
  } | null>(null);
  const [mailerUrl, setMailerUrl] = useState('');
  const [mailerKey, setMailerKey] = useState('');
  const load = async () => {
    try {
      setSt(await api.call<MailStatus>('attendanceMailStatus', { courseId: course.id }));
      setCfg(await api.call('attendanceMailConfig', { courseId: course.id }));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [course.id]);
  if (!st || !cfg) return <p className="muted">讀取中…</p>;
  const save = async () => {
    const base = location.origin + location.pathname;
    try {
      await api.call('attendanceMailConfig', {
        courseId: course.id,
        set: {
          mentors: cfg.mentors,
          dailyTime: cfg.dailyTime,
          teacherName: cfg.teacherName,
          ...(/^https:\/\//.test(base) ? { platformUrl: base } : {}),
          ...(mailerUrl || mailerKey
            ? { mailerUrl: mailerUrl.trim(), mailerKey: mailerKey.trim() }
            : {}),
        },
      });
      setMailerUrl('');
      setMailerKey('');
      notify('寄信設定已儲存');
      await load();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const kindLabel: Record<string, string> = {
    absent: '未到通知',
    correction: '更正通知',
    digest: '導師彙整',
  };
  const statusLabel: Record<string, string> = { sent: '成功', failed: '失敗', sending: '寄送中' };
  return (
    <div className="att-mails">
      <section className="att-mail">
        <h2>寄送時間由老師決定（系統不會自己寄）</h2>
        {!!st.unconfirmedToday.length && (
          <div className="notice warning">
            今天還有 {st.unconfirmedToday.length} 節尚未確認（
            {st.unconfirmedToday.map((s) => `第 ${s.period} 節`).join('、')}
            ），不會放進通知與導師彙整。請先到〔節次與名冊〕確認。
          </div>
        )}
        <div className="att-confirm">
          <strong>待寄 {st.student.length + st.digest.length} 封</strong>
          <p>
            未到通知 {st.student.filter((m) => m.kind === 'absent').length} 封、更正通知{' '}
            {st.student.filter((m) => m.kind === 'correction').length} 封、導師彙整{' '}
            {st.digest.length} 封（
            {st.digest
              .map(
                (d) =>
                  `${course.classNames?.[d.classId] || d.classId}→${d.mentorName || d.mentorEmail}`,
              )
              .join('、') || '今天沒有，或尚未填導師信箱'}
            ）。改狀態後要寄的信也會先排在這裡。
          </p>
          <SendControls
            api={api}
            course={course}
            notify={notify}
            status={st}
            onDone={() => void load()}
          />
          <p className="muted">
            {st.scheduledAt ? (
              <>
                已排定 {taipeiDateTime(st.scheduledAt)} 寄出。
                <button
                  onClick={async () => {
                    await api.call('attendanceSendMail', { courseId: course.id, mode: 'cancel' });
                    await load();
                  }}
                >
                  取消排定
                </button>
              </>
            ) : (
              '目前沒有排定的寄送。'
            )}
            {st.dailyTime ? `　每日預設 ${st.dailyTime} 自動寄出已確認節次的待寄信。` : ''}
          </p>
          {st.lastAuto && (
            <p className={st.lastAuto.error || st.lastAuto.failed ? 'att-fail' : 'muted'}>
              上次自動寄送：{taipeiDateTime(st.lastAuto.at)}，
              {st.lastAuto.error
                ? `沒有寄出（${st.lastAuto.error}）`
                : `寄出 ${st.lastAuto.sent} 封${st.lastAuto.failed ? `、失敗 ${st.lastAuto.failed} 封（留在待寄）` : ''}`}
            </p>
          )}
        </div>
        <h2>寄送紀錄</h2>
        {!st.log.length ? (
          <p className="muted">還沒有寄過信。</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>時間</th>
                <th>收件人</th>
                <th>種類</th>
                <th>結果</th>
              </tr>
            </thead>
            <tbody>
              {st.log.map((m) => (
                <tr key={m.id}>
                  <td>{taipeiDateTime(m.sentAt || m.createdAt).slice(5)}</td>
                  <td>{m.name || m.to}</td>
                  <td>{kindLabel[m.kind] || m.kind}</td>
                  <td className={m.status === 'sent' ? '' : 'att-fail'}>
                    {statusLabel[m.status] || m.status}
                    {m.error ? `：${m.error}` : ''}
                    {m.status === 'sending' && Date.now() - m.createdAt > 600000 && (
                      <button
                        onClick={async () => {
                          try {
                            await api.call('attendanceSendMail', {
                              courseId: course.id,
                              mode: 'requeue',
                              mailId: m.id,
                            });
                            await load();
                          } catch (e) {
                            notify((e as Error).message);
                          }
                        }}
                      >
                        放回待寄
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          信件只寫點名資訊，不含成績、情緒、關心標記與同裝置提醒。同一封不重複寄；失敗的信會留在待寄。
        </p>
      </section>
      <section className="att-mail">
        <h2>寄信設定</h2>
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
            每日預設寄送時間（留空＝不自動寄）
            <input
              type="time"
              value={cfg.dailyTime}
              onChange={(e) => setCfg({ ...cfg, dailyTime: e.target.value })}
            />
          </label>
          {course.classIds.map((id) => (
            <fieldset key={id}>
              <legend>{course.classNames?.[id] || id} 導師</legend>
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
          <fieldset>
            <legend>寄信程式：{cfg.mailerReady ? '已設定' : '尚未設定'}</legend>
            <p className="muted">
              照 docs/attendance/APPS_SCRIPT_SETUP.md
              建立後貼上。密鑰存進去之後不會再顯示；要更換時兩欄一起重填。
            </p>
            <label>
              寄信程式網址
              <input
                value={mailerUrl}
                placeholder="https://script.google.com/macros/s/…/exec"
                onChange={(e) => setMailerUrl(e.target.value)}
              />
            </label>
            <label>
              密鑰
              <input
                type="password"
                value={mailerKey}
                autoComplete="off"
                onChange={(e) => setMailerKey(e.target.value)}
              />
            </label>
          </fieldset>
          <button className="primary" onClick={() => void save()}>
            儲存
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AttendanceAdmin(props: Props) {
  const [view, setView] = useState<'live' | 'sessions' | 'summary' | 'mail'>('live');
  const tabs = [
    ['live', '點名'],
    ['sessions', '節次與名冊'],
    ['summary', '總表與修改紀錄'],
    ['mail', '寄信'],
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
        <SessionsView {...props} />
      ) : view === 'summary' ? (
        <SummaryView {...props} />
      ) : (
        <MailView {...props} />
      )}
    </div>
  );
}
