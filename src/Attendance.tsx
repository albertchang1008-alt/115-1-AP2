// 課堂點名（#67）學生端：掃 QR 簽到頁、首頁橫幅（數字碼備用）、我的出缺席。
// 文字與版面沿用教師 2026-11-16 核可的樣張（src/AttendanceSample.tsx）。
import { useEffect, useRef, useState } from 'react';
import type { API } from './service';
import type { Course, Profile } from '../shared/model';
import { featureEnabled } from '../shared/features';
import {
  attendUrl,
  attendanceStatusLabel,
  inAppBrowserName,
  parseAttendHash,
  sessionLabel,
  taipeiTime,
  taipeiDate,
  type AttendanceStatus,
} from '../shared/attendance';

type CheckIn = {
  result: 'ok' | 'duplicate' | 'trial';
  signedAt: number;
  reopened?: boolean;
  startedAt?: number;
  date: string;
  period: number;
};
type Failure = { reason: string; message: string; left?: number };

/** 同裝置提醒用的隨機編號：只存在這個瀏覽器，不是手機序號，也不讀其他資料。 */
export function attendanceDeviceId() {
  try {
    const saved = localStorage.getItem('attendance-device-id');
    if (saved && /^[A-Za-z0-9_-]{8,64}$/.test(saved)) return saved;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('attendance-device-id', id);
    return id;
  } catch {
    return undefined;
  }
}
function failure(e: unknown): Failure {
  const err = e as { details?: { reason?: string; left?: number }; message?: string };
  return {
    reason: err?.details?.reason || 'error',
    message: err?.message || '簽到沒有成功，請再試一次',
    left: err?.details?.left,
  };
}
async function checkIn(api: API, courseId: string, by: { token?: string; code?: string }) {
  const deviceId = attendanceDeviceId();
  return api.call<CheckIn>('attendanceCheckIn', {
    courseId,
    ...by,
    ...(deviceId ? { deviceId } : {}),
  });
}
const myUrl = (courseId: string) => `#/course/${encodeURIComponent(courseId)}/attendance`;
const homeUrl = (courseId: string) => `#/course/${encodeURIComponent(courseId)}`;

/** 4 格數字輸入：手機數字鍵盤、自動跳下一格、可整串貼上。 */
function CodeInput({
  value,
  onChange,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return onChange(value.slice(0, i) + value.slice(i + 1));
    const next = (value.slice(0, i) + digits + value.slice(i + digits.length)).slice(0, 4);
    onChange(next);
    refs.current[Math.min(3, i + digits.length)]?.focus();
  };
  return (
    <div
      className={'att-digits' + (invalid ? ' att-digits-wrong' : '')}
      role="group"
      aria-label="4 位數字碼"
    >
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={value[i] ? 'filled' : ''}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={4}
          aria-label={`第 ${i + 1} 位`}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

const submitted = new Set<string>(); // 同一個憑證只自動送出一次（含開發模式的重複執行）

/** 掃 QR 打開的簽到頁：#/attend?c=課程&t=憑證。已登入就自動送出；未登入先登入再送出。 */
export function AttendPage({
  api,
  profile,
  courses,
  loading,
  error,
  onLogin,
}: {
  api: API;
  profile: Profile | null;
  courses: Course[];
  loading: boolean;
  error: string;
  onLogin: () => void;
}) {
  const route = parseAttendHash(location.hash);
  const courseId = route?.courseId || '';
  const token = route?.token || '';
  const course = courses.find((c) => c.id === courseId);
  const inApp = inAppBrowserName(navigator.userAgent);
  const [state, setState] = useState<
    | { kind: 'idle' | 'sending' }
    | { kind: 'done'; result: CheckIn }
    | { kind: 'failed'; failure: Failure }
  >({ kind: 'idle' });
  const [useCode, setUseCode] = useState(!token);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const send = async (by: { token?: string; code?: string }) => {
    setState({ kind: 'sending' });
    try {
      setState({ kind: 'done', result: await checkIn(api, courseId, by) });
    } catch (e) {
      setState({ kind: 'failed', failure: failure(e) });
      setCode('');
    }
  };
  useEffect(() => {
    if (!profile || profile.teacher || !token || submitted.has(token)) return;
    submitted.add(token);
    void send({ token });
  }, [profile?.uid, token]);
  const plainUrl = attendUrl(location.origin + location.pathname, courseId);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = plainUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setCopied(true);
  };
  const who = profile
    ? `${profile.name || ''}${profile.studentId ? `（${profile.studentId}）` : ''}`
    : '';
  const codeForm = (
    <>
      <p>請輸入投影幕上的 4 位數字碼。</p>
      <CodeInput
        value={code}
        onChange={setCode}
        invalid={state.kind === 'failed' && state.failure.reason === 'wrong-code'}
        disabled={state.kind === 'sending'}
      />
      {state.kind === 'failed' && state.failure.reason === 'wrong-code' && (
        <p className="att-error" role="alert">
          數字碼不對，請看投影幕再輸入一次。還可以再試 {state.failure.left} 次。
        </p>
      )}
      <button
        className="att-btn primary"
        disabled={code.length !== 4 || state.kind === 'sending'}
        onClick={() => void send({ code })}
      >
        {state.kind === 'sending' ? '簽到中…' : '簽到'}
      </button>
    </>
  );
  let body: React.ReactNode;
  if (!route)
    body = (
      <>
        <div className="att-mark att-mark-warn" aria-hidden="true">
          !
        </div>
        <h1>簽到網址不完整</h1>
        <p>請用手機相機再掃一次投影幕上的 QR。</p>
      </>
    );
  else if (!profile && inApp)
    body = (
      <>
        <div className="att-mark att-mark-warn" aria-hidden="true">
          !
        </div>
        <h1>請改用 Safari 或 Chrome 開啟</h1>
        <p>還沒有簽到。你現在是在 {inApp} 裡面打開的，這裡不能登入學校帳號。</p>
        <ol className="att-steps">
          <li>按下面的〔複製網址〕。</li>
          <li>打開 Safari 或 Chrome，貼上網址。</li>
          <li>登入後，輸入投影幕上的 4 位數字碼。</li>
        </ol>
        <button className="att-btn primary" onClick={() => void copy()}>
          {copied ? '已複製網址' : '複製網址'}
        </button>
        <p className="att-note" data-secondary>
          下次請直接用手機內建的相機掃 QR。
        </p>
      </>
    );
  else if (!profile)
    body = (
      <>
        <h1>課堂點名</h1>
        <p>還沒有簽到。請先用學校 Google 帳號登入，登入後會自動簽到。</p>
        {error && (
          <p className="att-error" role="alert">
            {error}
          </p>
        )}
        <button className="att-btn primary" disabled={loading} onClick={onLogin}>
          {loading ? '登入中…' : '用學校 Google 帳號登入'}
        </button>
      </>
    );
  else if (profile.teacher)
    body = (
      <>
        <div className="att-mark att-mark-stop" aria-hidden="true">
          ×
        </div>
        <h1>教師帳號不能簽到</h1>
        <p>這是學生的簽到頁。</p>
        <a className="att-btn" href="#attendance">
          回點名後台
        </a>
      </>
    );
  else if (state.kind === 'done') {
    const r = state.result;
    const where = sessionLabel(r);
    body =
      r.result === 'trial' ? (
        <>
          <div className="att-mark att-mark-trial" aria-hidden="true">
            ✓
          </div>
          <h1>試簽成功</h1>
          <p className="att-where">這次不算點名</p>
          <p>{who}</p>
          <p>你的手機已經登入。之後上課用手機相機掃投影幕上的 QR，就會直接簽到。</p>
        </>
      ) : r.result === 'duplicate' ? (
        <>
          <div className="att-mark att-mark-ok" aria-hidden="true">
            ✓
          </div>
          <h1>你已經簽到過了</h1>
          <p className="att-where">
            已簽到 {taipeiTime(r.signedAt)}・{where}
          </p>
          <p>{who}</p>
          <p>不用再掃一次，紀錄只會算一次。</p>
          <a className="att-btn" href={myUrl(courseId)}>
            看我的出缺席
          </a>
        </>
      ) : (
        <>
          <div className="att-mark att-mark-ok" aria-hidden="true">
            ✓
          </div>
          <h1>
            {r.reopened
              ? `已補點（${taipeiTime(r.signedAt)}）`
              : `已簽到 ${taipeiTime(r.signedAt)}`}
          </h1>
          <p className="att-where">{where}</p>
          <p>{who}</p>
          <a className="att-btn primary" href={myUrl(courseId)}>
            看我的出缺席
          </a>
          <p className="att-note" data-secondary>
            可以關閉這個頁面了。
          </p>
        </>
      );
  } else if (state.kind === 'failed' && state.failure.reason === 'not-in-class')
    body = (
      <>
        <div className="att-mark att-mark-stop" aria-hidden="true">
          ×
        </div>
        <h1>你不在這一節點名的班級</h1>
        <p>沒有簽到。這一節點名的名單裡沒有你。</p>
        <p>你登入的帳號：{who}。</p>
        <p>如果有錯誤，請直接告訴老師。</p>
        <a className="att-btn" href={myUrl(courseId)}>
          看我的出缺席
        </a>
      </>
    );
  else if (state.kind === 'failed' && state.failure.reason === 'locked')
    body = (
      <>
        <div className="att-mark att-mark-stop" aria-hidden="true">
          ×
        </div>
        <h1>這一節不能再輸入數字碼</h1>
        <p>已經輸入錯誤 5 次。請直接告訴老師，老師可以在後台幫你處理。</p>
      </>
    );
  else if (state.kind === 'failed' && state.failure.reason === 'closed')
    body = (
      <>
        <div className="att-mark att-mark-warn" aria-hidden="true">
          !
        </div>
        <h1>點名已經結束</h1>
        <p>沒有簽到。如果你有到課，請直接告訴老師。</p>
        <a className="att-btn" href={myUrl(courseId)}>
          看我的出缺席
        </a>
      </>
    );
  else if (state.kind === 'failed' && state.failure.reason === 'expired' && !useCode)
    body = (
      <>
        <div className="att-mark att-mark-warn" aria-hidden="true">
          !
        </div>
        <h1>QR 已過期</h1>
        <p>
          還沒有簽到。請用手機相機<strong>再掃一次</strong>投影幕上的 QR。
        </p>
        <p>QR 每隔幾秒就會更換，掃到後請馬上打開。</p>
        <button
          className="att-btn primary"
          onClick={() => {
            setUseCode(true);
            setState({ kind: 'idle' });
          }}
        >
          改用 4 位數字碼簽到
        </button>
      </>
    );
  else if (
    state.kind === 'failed' &&
    state.failure.reason !== 'wrong-code' &&
    state.failure.reason !== 'expired'
  )
    body = (
      <>
        <div className="att-mark att-mark-warn" aria-hidden="true">
          !
        </div>
        <h1>沒有簽到成功</h1>
        <p>{state.failure.message}</p>
        <button
          className="att-btn primary"
          onClick={() => {
            setUseCode(true);
            setState({ kind: 'idle' });
          }}
        >
          改用 4 位數字碼簽到
        </button>
      </>
    );
  else if (useCode)
    body = (
      <>
        <h1>課堂點名</h1>
        {codeForm}
      </>
    );
  else
    body = (
      <>
        <h1>簽到中…</h1>
        <p>請稍候。</p>
      </>
    );
  return (
    <main className="att-scan">
      <header className="att-brand" data-secondary>
        <span>{courseId}</span>
        {course?.title || ''}
      </header>
      <section className="att-scan-body" aria-live="polite">
        {body}
      </section>
    </main>
  );
}

type Current = {
  session: {
    id: string;
    kind: 'roll' | 'trial';
    date: string;
    period: number;
    startedAt?: number;
    endsAt: number;
  } | null;
  now?: number;
  signedAt?: number;
  reopened?: boolean;
  locked?: boolean;
};

/** 學生首頁頂端：平常只有「我的出缺席」入口；老師正在點名時顯示 4 格數字碼輸入與倒數。 */
export function AttendanceBanner({ api, course }: { api: API; course: Course }) {
  const enabled = featureEnabled(course, 'attendance') && !api.preview;
  const [cur, setCur] = useState<Current>({ session: null });
  const [offset, setOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<Failure | null>(null);
  const [done, setDone] = useState<CheckIn | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let version = 0;
    let pending = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const refresh = async () => {
      if (document.hidden || pending) return;
      const requestVersion = version;
      pending = true;
      try {
        const r = await api.call<Current>('attendanceCurrent', { courseId: course.id });
        if (requestVersion !== version) return;
        setCur(r);
        if (r.now) setOffset(r.now - Date.now());
      } catch {
        /* 暫時離線時維持原畫面 */
      } finally {
        if (requestVersion === version) pending = false;
      }
    };
    const stop = () => {
      clearInterval(timer);
      version++;
      pending = false;
    };
    const visible = () => {
      stop();
      if (document.hidden) return;
      void refresh();
      timer = setInterval(() => void refresh(), 15000);
    };
    visible();
    document.addEventListener('visibilitychange', visible);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', visible);
    };
  }, [api, enabled, course.id]);
  const s = cur.session;
  useEffect(() => {
    if (!s) return;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [s?.id]);
  if (!enabled) return null;
  void tick;
  const remain = s ? Math.max(0, Math.ceil((s.endsAt - (Date.now() + offset)) / 1000)) : 0;
  const signedAt = done?.signedAt || cur.signedAt || 0;
  const locked = cur.locked || fail?.reason === 'locked';
  const submit = async () => {
    setBusy(true);
    setFail(null);
    try {
      setDone(await checkIn(api, course.id, { code }));
    } catch (e) {
      setFail(failure(e));
      setCode('');
    } finally {
      setBusy(false);
    }
  };
  if (!s || (remain <= 0 && !signedAt))
    return (
      <div className="att-entry">
        <a className="att-entry-link" href={myUrl(course.id)}>
          我的出缺席 ›
        </a>
      </div>
    );
  const label = sessionLabel(s);
  return (
    <section
      className={`att-banner att-banner-${signedAt ? 'done' : locked ? 'locked' : fail ? 'wrong' : 'input'}`}
      aria-label="課堂點名"
    >
      {signedAt || done?.result === 'trial' ? (
        <>
          <h2>
            {done?.result === 'trial' || s.kind === 'trial'
              ? '試簽成功（不算點名）'
              : done?.reopened || cur.reopened
                ? `已補點（${taipeiTime(signedAt)}）`
                : `已簽到 ${taipeiTime(signedAt)}`}
          </h2>
          <p>{sessionLabel(s)}</p>
          <a className="att-btn" href={myUrl(course.id)}>
            看我的出缺席
          </a>
        </>
      ) : locked ? (
        <>
          <h2>這一節不能再輸入數字碼</h2>
          <p>已經輸入錯誤 5 次。請直接告訴老師，老師可以在後台幫你處理。</p>
        </>
      ) : (
        <>
          <div className="att-banner-head">
            <h2>{s.kind === 'trial' ? '老師正在試簽' : '老師正在點名'}</h2>
            <span className="att-count" aria-label="剩餘時間">
              剩 {Math.floor(remain / 60)}:{String(remain % 60).padStart(2, '0')}
            </span>
          </div>
          <p>{label}。請輸入投影幕上的 4 位數字碼。</p>
          <CodeInput
            value={code}
            onChange={setCode}
            invalid={fail?.reason === 'wrong-code'}
            disabled={busy}
          />
          {fail?.reason === 'wrong-code' && (
            <p className="att-error" role="alert">
              數字碼不對，請看投影幕再輸入一次。還可以再試 {fail.left} 次。
            </p>
          )}
          {fail && fail.reason !== 'wrong-code' && (
            <p className="att-error" role="alert">
              {fail.reason === 'not-in-class'
                ? '這一節點名的名單裡沒有你。'
                : fail.reason === 'closed'
                  ? '點名已經結束。'
                  : fail.message}
            </p>
          )}
          <button
            className="att-btn primary"
            disabled={code.length !== 4 || busy}
            onClick={() => void submit()}
          >
            {busy ? '簽到中…' : '簽到'}
          </button>
          <p className="att-note" data-secondary>
            也可以用手機相機掃投影幕上的 QR。
          </p>
        </>
      )}
    </section>
  );
}

function makeupLabel(signedAt: number) {
  const [, month, day] = taipeiDate(signedAt).split('-');
  return `補點 ${Number(month)}/${Number(day)} ${taipeiTime(signedAt)}`;
}

type MineRow = {
  id: string;
  date: string;
  period: number;
  startedAt: number;
  status: AttendanceStatus;
  signedAt: number;
  reopened: boolean;
  edited: boolean;
};
type Mine = { rows: MineRow[]; counts: { total: number; present: number; absent: number } };
/** 我的出缺席：只看得到自己的。 */
export function MyAttendancePage({ api, course }: { api: API; course: Course }) {
  const [mine, setMine] = useState<Mine | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    api
      .call<Mine>('attendanceMine', { courseId: course.id })
      .then((result) => {
        if (alive) setMine(result);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [api, course.id]);
  return (
    <main className="att-my">
      <header className="att-brand" data-secondary>
        <span>{course.id}</span>
        {course.title}
      </header>
      <a className="att-back" href={homeUrl(course.id)}>
        ‹ 回首頁
      </a>
      <h1>我的出缺席</h1>
      {error ? (
        <p className="att-error" role="alert">
          {error}
        </p>
      ) : !mine ? (
        <p>讀取中…</p>
      ) : (
        <>
          <div className="att-stats att-mine-stats">
            <div>
              <b>{mine.counts.total}</b>
              <span>全部</span>
            </div>
            <div>
              <b>{mine.counts.present}</b>
              <span>準時</span>
            </div>
            <div>
              <b>{mine.counts.absent}</b>
              <span>未到</span>
            </div>
          </div>
          {mine.rows.length ? (
            <ul className="att-list att-mine-list">
              {mine.rows.map((r) => (
                <li key={r.id}>
                  <strong>{sessionLabel(r)}</strong>
                  <span className={`att-pill att-${r.status}`}>
                    {attendanceStatusLabel[r.status]}
                    {r.signedAt
                      ? r.reopened
                        ? `（${makeupLabel(r.signedAt)}）`
                        : `（簽到 ${taipeiTime(r.signedAt)}）`
                      : ''}
                  </span>
                  {r.edited && <span className="att-corrected">老師已更正</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p>目前還沒有點名紀錄。</p>
          )}
          <p>對紀錄有疑問，請直接洽老師。</p>
        </>
      )}
    </main>
  );
}
export function isMyAttendanceHash(hash: string, courseId: string) {
  return (
    hash.replace(/^#/, '').split('?')[0] === `/course/${encodeURIComponent(courseId)}/attendance`
  );
}
