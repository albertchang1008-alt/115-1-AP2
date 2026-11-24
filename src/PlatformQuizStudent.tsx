import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, ClipboardCheck } from 'lucide-react';
import { inAppBrowserName } from '../shared/attendance';
import { quizHash, type QuizSignal, type QuizStudentView } from '../shared/platformQuiz';
import { MOOD_STUDENT_STATES, type MoodCode } from '../shared/zuvioExt';
import type { API } from './service';
import { createLeaveTracker } from './leaveTracker';
import { quizLive, quizStudent, type QuizLive } from './platformQuizApi';
import { MoodLineIcon } from './ZuvioMoodCard';
import FontSizePicker from './FontSizePicker';

type Answers = Record<string, string>;
export const quizDuration = (seconds: number) => [Math.floor(seconds / 60), seconds % 60]
  .map((n) => String(n).padStart(2, '0')).join(':');
const errorText = (e: unknown) => e instanceof Error ? e.message : '連線失敗，請重試';
const courseHash = (courseId: string) => '#/course/' + encodeURIComponent(courseId);

export type QuizStudentScreen = 'waiting' | 'ready' | 'answering' | 'confirm' | 'submitted' | 'mood' | 'feedback' | 'released';
type StudentCardProps = {
  screen: QuizStudentScreen;
  view: QuizStudentView;
  seconds?: number;
  answers?: Answers;
  busy?: boolean;
  saving?: boolean;
  error?: string;
  feedback?: string;
  choose?: (id: string, option: string) => void;
  primary?: () => void;
  secondary?: () => void;
  mood?: (value: MoodCode) => void;
};

export function QuizStudentCard({
  screen, view, seconds = 0, answers = {}, busy, saving, error, feedback, choose, primary, secondary, mood,
}: StudentCardProps) {
  const [index, setIndex] = useState(0);
  const [selectedMood, setSelectedMood] = useState<MoodCode>();
  const question = view.questions?.[index];
  const answered = Object.values(answers).filter(Boolean).length;
  const taking = screen === 'answering' || screen === 'confirm';
  return <section className="pq-student" data-quiz-screen={screen} data-ui>
    <header className="pq-student-header">
      <h1>{view.title}</h1>
      {taking && <span className="pq-time" aria-label="剩餘時間"><Clock aria-hidden="true" size={18} />{quizDuration(seconds)}</span>}
    </header>
    {error && <p className="pq-error" role="alert">{error}</p>}
    {screen === 'waiting' && <>
      <h2>等待老師開放</h2>
      <p>老師開放後，這裡會出現開始作答按鈕。</p>
      <div className="pq-actions">
        <button disabled>等待開放</button>
        <button type="button" onClick={secondary}>重新檢查</button>
      </div>
    </>}
    {screen === 'ready' && <>
      <p>共 {view.count} 題。全班使用同一個截止時間，目前剩 {quizDuration(seconds)}。</p>
      <p>離開作答畫面會被記錄。</p>
      <div className="pq-actions">
        <button className="primary" type="button" onClick={primary} disabled={busy || !view.canStart || seconds === 0}>開始作答</button>
        <button type="button" onClick={secondary}>重新檢查</button>
      </div>
    </>}
    {screen === 'answering' && question && <>
      <p className="pq-progress">第 {index + 1} 題，共 {view.count} 題</p>
      <h2 className="pq-question">{question.text}</h2>
      <div className="pq-options" role="group" aria-label="作答選項">
        {question.options.map((option, i) => <button
          key={option.id} type="button" aria-pressed={answers[question.id] === option.id}
          disabled={busy || seconds === 0} onClick={() => choose?.(question.id, option.id)}
        ><span aria-hidden="true">{String.fromCharCode(65 + i)}</span>{option.text}</button>)}
      </div>
      <p>離開作答畫面會被記錄。</p>
      <p role="status">{saving ? '儲存中…' : error ? '請重新儲存或交卷' : '作答已儲存'}</p>
      <div className="pq-actions">
        <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>上一題</button>
        <button type="button" disabled={index + 1 >= view.count} onClick={() => setIndex(index + 1)}>下一題</button>
        <button className="primary" type="button" disabled={busy || seconds === 0} onClick={primary}>交卷</button>
      </div>
    </>}
    {screen === 'confirm' && <>
      <h2>確認交卷</h2>
      <p>已作答 {answered}／{view.count} 題。交卷後答案就會鎖定。</p>
      <div className="pq-actions">
        <button type="button" disabled={busy} onClick={secondary}>回到作答</button>
        <button className="primary" type="button" disabled={busy || seconds === 0} onClick={primary}>確認交卷</button>
      </div>
    </>}
    {screen === 'mood' && <>
      <h2>剛寫完小考，你現在的內在狀態最像哪一種？</h2>
      <p>這題不計分，只有老師會看到。</p>
      <div className="pq-options" role="group" aria-label="情緒選項">
        {MOOD_STUDENT_STATES.map((state) => <button key={state.code} type="button" aria-pressed={selectedMood === state.code}
          onClick={() => setSelectedMood(state.code)} disabled={busy}>
          <MoodLineIcon code={state.code} color={state.color} />{state.label}
        </button>)}
      </div>
      <button className="primary" type="button" disabled={!selectedMood || busy} onClick={() => { if (selectedMood) mood?.(selectedMood); }}>送出</button>
    </>}
    {screen === 'feedback' && <>
      <h2>情緒簽到已送出</h2>
      <p>{feedback}</p>
      <button className="primary" type="button" onClick={primary}>繼續</button>
    </>}
    {screen === 'submitted' && <>
      <h2><ClipboardCheck aria-hidden="true" size={20} /> {view.session ? '已交卷' : '小考已結束'}</h2>
      <p>{view.session ? '老師結束小考後，系統批改完成就會公布成績。' : '本次作答時間已結束。'}</p>
      <div className="pq-actions">
        <button type="button" onClick={secondary}>重新檢查</button>
        {primary && <button type="button" onClick={primary}>回到課程</button>}
      </div>
    </>}
    {screen === 'released' && view.result && <>
      <h2>小考成績</h2>
      <p className="pq-score">{view.result.score}／{view.result.max} 分</p>
      <p>答對 {view.result.correct}／{view.count} 題{view.result.makeup ? '・補考' : ''}
        {view.result.extendedSeconds ? '・個別延長 ' + view.result.extendedSeconds / 60 + ' 分鐘' : ''}</p>
      <ol className="pq-review">
        {view.result.questions.map((question) => <li key={question.id}>
          <h3 className="pq-question">{question.text}</h3>
          <p>你的答案：{question.options.find((option) => option.id === question.selected)?.text || '未作答'}</p>
          <p>正確答案：{question.options.find((option) => option.id === question.answer)?.text}</p>
          {question.explanation && <p>{question.explanation}</p>}
        </li>)}
      </ol>
      {primary && <button type="button" onClick={primary}>回到課程</button>}
    </>}
  </section>;
}

export function QuizEntry({ api, courseId, classId, sittingId, live = quizLive }: {
  api: API; courseId: string; classId: string; sittingId?: string; live?: QuizLive;
}) {
  const [signal, setSignal] = useState<QuizSignal | null>(null);
  const [hidden, setHidden] = useState(document.hidden);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const terminal = useRef(false);
  useEffect(() => {
    const visibility = () => {
      setHidden(document.hidden);
      if (!document.hidden) terminal.current = false;
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => {
    if (hidden || terminal.current) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    const update = (next: QuizSignal | null) => {
      if (disposed) return;
      setSignal(next);
      setError('');
      if (next?.state === 'released' && (!sittingId || next.sittingId === sittingId)) {
        terminal.current = true;
        stop?.();
      }
    };
    try {
      stop = live.signal(courseId, classId)(update, (e) => { if (!disposed) setError(errorText(e)); });
      if (terminal.current) stop();
    } catch (e) {
      setError(errorText(e));
    }
    return () => { disposed = true; stop?.(); };
  }, [live, courseId, classId, sittingId, hidden, retry]);
  const recheck = useCallback(() => {
    terminal.current = false;
    void live.recheck(courseId, classId).then((next) => {
      setSignal(next);
      setError('');
    }).catch((e) => setError(errorText(e)));
    setRetry((n) => n + 1);
  }, [live, courseId, classId]);
  const activeId = sittingId || signal?.sittingId;
  if (!activeId) return error ? <section className="pq-student" data-ui>
    <h1>小考</h1><p role="alert">{error}</p><button type="button" onClick={recheck}>重新檢查</button>
  </section> : null;
  return <QuizRun key={activeId} api={api} courseId={courseId} sittingId={activeId}
    deep={!!sittingId} signal={signal?.sittingId === activeId ? signal : null} retry={retry} recheck={recheck} />;
}

function QuizRun({ api, courseId, sittingId, deep, signal, retry, recheck }: {
  api: API; courseId: string; sittingId: string; deep: boolean; signal: QuizSignal | null; retry: number; recheck: () => void;
}) {
  const transport = useMemo(() => quizStudent(api, courseId, sittingId), [api, courseId, sittingId]);
  const [view, setView] = useState<QuizStudentView>();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [display, setDisplay] = useState<Answers>({});
  const [now, setNow] = useState(Date.now);
  const skew = useRef(0);
  const seq = useRef(0);
  const answers = useRef<Answers>({});
  const reading = useRef(0);
  const lastAutomatic = useRef(0);
  const writing = useRef<Promise<unknown>>(Promise.resolve());
  const ingest = useCallback((next: QuizStudentView) => {
    skew.current = next.serverAt - Date.now();
    const currentSeq = next.session?.seq ?? 0;
    if (currentSeq >= seq.current && next.session) {
      seq.current = currentSeq;
      answers.current = next.session.answers;
      setDisplay(answers.current);
    }
    setView(next);
  }, []);
  const refresh = useCallback(async () => {
    const request = ++reading.current;
    try {
      const next = await transport.get();
      if (request === reading.current) {
        ingest(next);
        setError('');
      }
    } catch (e) {
      if (request === reading.current) setError(errorText(e));
    }
  }, [transport, ingest]);
  useEffect(() => {
    void refresh();
    return () => { reading.current++; };
  }, [refresh, signal?.state, signal?.deadline, retry]);
  useEffect(() => {
    if (!view || (view.state !== 'open' && !view.canStart)) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [view?.state, view?.canStart]);
  const taking = deep && view?.session?.state === 'active';
  useEffect(() => {
    if (!taking || !view) return;
    const round = view.round;
    const visit = crypto.randomUUID();
    let lastSeconds = 0;
    const send = (kind: 'leave' | 'return', episode: number, seconds?: number) =>
      transport.leave(round, visit, episode, kind, seconds);
    const leaves = new Map<number, Promise<boolean>>();
    const tracker = createLeaveTracker(document, window, (metrics) => {
      const seconds = Math.max(0, metrics.leaveSeconds - lastSeconds);
      lastSeconds = metrics.leaveSeconds;
      void (leaves.get(metrics.leaveCount) || Promise.resolve(false)).then(async (saved) => {
        if (!saved) await send('leave', metrics.leaveCount);
        await send('return', metrics.leaveCount, seconds);
      }).catch(() => {});
    }, undefined, (episode) => {
      leaves.set(episode, send('leave', episode).then(() => true, () => false));
    });
    return () => { tracker.stop(); };
  }, [taking, view?.round, transport]);

  const seconds = Math.max(0, Math.ceil(((view?.deadline || 0) - (now + skew.current)) / 1000));
  const mutate = async (kind: 'start' | 'submit' | 'automatic') => {
    if (!view || busy) return;
    setBusy(true);
    setError('');
    reading.current++;
    try {
      if (kind === 'start') ingest(await transport.start(view.round));
      else {
        await writing.current;
        const snapshot = answers.current;
        const next = await transport.save(view.round, ++seq.current, snapshot, true, kind === 'automatic');
        if (next.session?.state !== 'active') ingest(next);
        else {
          skew.current = next.serverAt - Date.now();
          setView((old) => old && { ...old, deadline: next.deadline });
        }
        setConfirming(false);
      }
    } catch (e) {
      const message = errorText(e);
      if (kind !== 'start') await refresh();
      setError(message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (deep && view?.session?.state === 'active' && view.deadline && !seconds && lastAutomatic.current !== view.deadline && !busy) {
      lastAutomatic.current = view.deadline;
      void mutate('automatic');
    }
  }, [seconds, deep, view?.session?.state, view?.deadline, busy]);

  const choose = (id: string, option: string) => {
    if (!view || busy || seconds === 0) return;
    const snapshot = { ...answers.current, [id]: option };
    answers.current = snapshot;
    setDisplay(snapshot);
    const request = ++seq.current;
    setSaving(true);
    setError('');
    writing.current = writing.current.then(async () => {
      const response = await transport.save(view.round, request, snapshot);
      skew.current = response.serverAt - Date.now();
      if (response.session?.state === 'active') {
        setView((old) => old && { ...old, deadline: response.deadline });
        if (response.savedSeq > seq.current) {
          ingest({ ...response, questions: view.questions });
          setError('答案已在另一個畫面更新');
        }
      } else {
        await refresh();
      }
    }).catch((e) => { if (request === seq.current) setError(errorText(e)); })
      .finally(() => { if (request === seq.current) setSaving(false); });
  };

  if (!view) return deep ? <section className="pq-student" data-ui>
    <h1>平台小考</h1>
    {error ? <p role="alert">{error}</p> : <p role="status">正在確認小考…</p>}
    {error && <button type="button" onClick={recheck}>重新檢查</button>}
  </section> : null;

  const home = () => { location.hash = courseHash(courseId); };
  const open = () => { location.hash = quizHash(courseId, sittingId); };
  const screen: QuizStudentScreen = view.moodRequired && feedback ? 'feedback' :
    feedback ? 'feedback' : view.moodRequired ? 'mood' : view.result ? 'released' :
    taking ? (confirming ? 'confirm' : 'answering') :
    view.session?.state === 'active' ? 'ready' :
    view.session || ['closing', 'released'].includes(view.state) ? 'submitted' : view.canStart ? 'ready' : 'waiting';
  if (!deep && ['released', 'submitted'].includes(screen)) {
    if (!view.session) return null;
    return <section className="pq-student" data-ui>
      <h1>{view.title}</h1>
      <p>{view.moodRequired ? '請完成交卷後的情緒簽到。' : view.result ? '小考成績已公布。' : '已交卷。'}</p>
      <button type="button" className="primary" onClick={open}>{view.moodRequired ? '情緒簽到' : view.result ? '查看成績' : '查看小考'}</button>
    </section>;
  }
  const studentCard = <QuizStudentCard screen={screen} view={!deep && view.session?.state === 'active' ? { ...view, canStart: true } : view}
    seconds={seconds} answers={display} busy={busy} saving={saving} error={error} feedback={feedback}
    choose={choose}
    primary={screen === 'ready' ? (deep ? () => void mutate('start')
      : view.session?.state === 'active' ? open : () => {
        setBusy(true);
        void transport.start(view.round).then(open).catch((e) => setError(errorText(e))).finally(() => setBusy(false));
      })
      : screen === 'answering' ? () => setConfirming(true)
      : screen === 'confirm' ? () => void mutate('submit')
      : screen === 'feedback' ? () => { setFeedback(''); void refresh(); }
      : deep && ['released', 'submitted'].includes(screen) ? home : undefined}
    secondary={screen === 'confirm' ? () => setConfirming(false) : recheck}
    mood={(value) => {
      setBusy(true);
      void transport.mood(value).then((res) => { setFeedback(res.feedback); setError(''); })
        .catch((e) => setError(errorText(e))).finally(() => setBusy(false));
    }} />;
  return !deep && (screen === 'mood' || screen === 'feedback') ? <div className="pq-mood-overlay" role="dialog"
    aria-modal="true" aria-label="交卷後情緒簽到">{studentCard}</div> : studentCard;
}

export function QuizLinkPage({ api, courseId, classId, sittingId, signedIn, loading, error, login }: {
  api: API; courseId: string; classId?: string; sittingId: string;
  signedIn: boolean; loading: boolean; error: string; login: () => void;
}) {
  const embedded = inAppBrowserName(navigator.userAgent);
  return <main className="pq-link-page">
    <FontSizePicker />
    {!signedIn ? <section className="pq-student" data-ui>
      <h1>進入小考</h1>
      {error && <p role="alert">{error}</p>}
      {embedded ? <>
        <p>請在 Safari 或 Chrome 開啟連結，再用學校 Google 帳號登入。</p>
        <button type="button" onClick={() => void navigator.clipboard.writeText(location.href)}>複製小考連結</button>
      </> : <button className="primary" type="button" disabled={loading} onClick={login}>使用學校 Google 帳號登入</button>}
    </section> : loading && !classId ? <section className="pq-student" data-ui><h1>正在確認課程</h1></section>
      : classId ? <QuizEntry api={api} courseId={courseId} classId={classId} sittingId={sittingId} />
      : <section className="pq-student" data-ui><h1>無法進入小考</h1><p>請確認課程與登入帳號。</p></section>}
  </main>;
}
