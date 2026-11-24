import { useCallback, useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { quizHash, type QuizMonitor, type QuizState } from '../shared/platformQuiz';
import { maskStudentName } from '../shared/zuvioExt';
import { quizLive, type LiveLeaveEvent, type QuizLive, type QuizTeacherView } from './platformQuizApi';
import { quizDuration } from './PlatformQuizStudent';
import type { API } from './service';
import type { ExamSummary, Sitting } from './zuvioApi';

export type QuizClass = { classId: string; name: string; count: number | null };
export type ListedQuiz = { exam: ExamSummary; sitting: Sitting };
type TeacherAction = 'duration' | 'announce' | 'open' | 'extend' | 'extendStudent' | 'end' | 'makeup';
const statusLabels: Record<QuizState, string> = {
  prepared: '待公告', announced: '等待開放', open: '作答中', closing: '批改中', released: '成績已公布',
};
const showScore = (value?: number | null) => value == null ? '—' : Number(value.toFixed(2)).toLocaleString('zh-TW');
const time = (value: number) => new Date(value).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
const rowState = (row: ListedQuiz) => row.exam.answerMode === 'platform'
  ? statusLabels[row.sitting.platformState || 'prepared']
  : row.sitting.results ? '已有成績' : '待匯入';

export function QuizClassDirectory({ classes, exams, selected, select, open, back }: {
  classes: QuizClass[]; exams: ExamSummary[]; selected: string;
  select: (id: string) => void; open: (row: ListedQuiz) => void; back: () => void;
}) {
  const byClass = (id: string) => exams.flatMap((exam) =>
    exam.sittings.filter((sitting) => sitting.classIds.includes(id)).map((sitting) => ({ exam, sitting })))
    .sort((a, b) => b.sitting.date.localeCompare(a.sitting.date) || (b.sitting.startsAt || 0) - (a.sitting.startsAt || 0));
  const activeClass = classes.find((row) => row.classId === selected);
  if (!activeClass) return <section className="z-card pq-teacher" data-quiz-teacher="classes" data-ui>
    <h3>選擇班級</h3>
    {!classes.length && <p>目前沒有已發布的班級。</p>}
    <div className="pq-class-grid">{classes.map((row) => {
      const quizzes = byClass(row.classId);
      const recent = quizzes[0];
      return <button key={row.classId} type="button" onClick={() => select(row.classId)}>
        <strong>{row.name}</strong>
        <span>{row.count ?? '—'} 人・{quizzes.length} 場小考</span>
        {recent && <span>最近一場 {recent.exam.title}・平均 {recent.sitting.classIds.length === 1 ? showScore(recent.sitting.results?.average) : '—'}</span>}
      </button>;
    })}</div>
  </section>;
  const rows = byClass(activeClass.classId);
  return <section className="z-card pq-teacher" data-quiz-teacher="class-quizzes" data-ui>
    <button type="button" onClick={back}>← 班級列表</button>
    <h3>{activeClass.name}的小考</h3>
    {!rows.length && <p>這個班級還沒有小考。</p>}
    <ul className="pq-quiz-list">{rows.map((row) => {
      const { exam, sitting } = row;
      const single = sitting.classIds.length === 1;
      return <li key={sitting.id}><button type="button" onClick={() => open(row)}>
        <strong>{exam.title}・{sitting.label}</strong>
        <span>{sitting.date}・{exam.answerMode === 'platform' ? '平台作答' : 'Zuvio 匯入'}・{rowState(row)}</span>
        <span>完成／應考 {single ? (sitting.results?.matched ?? 0) : '—'}／{activeClass.count ?? '—'}・平均 {single ? showScore(sitting.results?.average) : '—'}</span>
      </button></li>;
    })}</ul>
  </section>;
}

function QuizQr({ courseId, sittingId }: { courseId: string; sittingId: string }) {
  const [large, setLarge] = useState(false);
  const url = location.origin + location.pathname + quizHash(courseId, sittingId);
  const data = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createDataURL(5, 16);
  }, [url]);
  return <div>
    <button type="button" className={'pq-qr' + (large ? ' pq-qr-large' : '')} onClick={() => setLarge(!large)}
      aria-expanded={large} aria-label={large ? '縮小 QR code' : '放大 QR code'}>
      <img src={data} alt="進入小考 QR code" />
    </button>
    <p><a href={url}>進入小考</a></p>
  </div>;
}

// Only a visible, active monitor can own these subscriptions. A terminal snapshot disposes both.
function useQuizMonitor(live: QuizLive, courseId: string, sittingId: string, enabled: boolean) {
  const [monitor, setMonitor] = useState<QuizMonitor>();
  const [events, setEvents] = useState<LiveLeaveEvent[]>([]);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let stops: (() => void)[] = [];
    let disposed = false;
    let stoppedByServer = false;
    const stop = () => {
      stops.forEach((unsubscribe) => unsubscribe());
      stops = [];
    };
    const failure = (e: Error) => {
      if (!disposed) setError(e.message);
      stop();
    };
    const watch = () => {
      stop();
      if (disposed || document.hidden || stoppedByServer) return;
      try {
        stops.push(live.monitor(courseId, sittingId)((next) => {
          if (disposed || document.hidden) return;
          setMonitor(next);
          setError('');
          if (next.state !== 'open') {
            stoppedByServer = true;
            stop();
          }
        }, failure));
        if (!stoppedByServer) stops.push(live.events(courseId, sittingId)((rows) => {
          if (!disposed && !document.hidden && !stoppedByServer) setEvents(rows);
        }, failure));
        else stop();
      } catch (e) {
        failure(e as Error);
      }
    };
    watch();
    document.addEventListener('visibilitychange', watch);
    return () => {
      disposed = true;
      stop();
      document.removeEventListener('visibilitychange', watch);
    };
  }, [live, courseId, sittingId, enabled, retry]);
  return { monitor, events, error, reconnect: () => setRetry((n) => n + 1) };
}

const groups = [
  { id: 'pending', label: '未進入' }, { id: 'active', label: '作答中' }, { id: 'done', label: '已完成' },
] as const;
type Group = typeof groups[number]['id'];
function groupFor(student: QuizMonitor['students'][string]): Group {
  if (student.submittedRound !== undefined) return 'done';
  if (student.startedRound !== undefined) return 'active';
  return 'pending';
}

export function PlatformQuizTeacher({ api, live = quizLive, courseId, className, row, reload, back, report }: {
  api: API; live?: QuizLive; courseId: string; className: string; row: ListedQuiz;
  reload: () => void; back: () => void; report: () => React.ReactNode;
}) {
  const sittingId = row.sitting.id;
  const [data, setData] = useState<QuizTeacherView>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(2);
  const [masked, setMasked] = useState(false);
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [monitorVisible, setMonitorVisible] = useState(true);
  const [now, setNow] = useState(Date.now);
  const read = useCallback(async () => {
    try {
      const view = await api.call<QuizTeacherView>('quizTeacherGet', { courseId, sittingId });
      setData(view);
      setSeconds(view.quiz.baseSeconds);
      setFailure('');
    } catch (e) {
      setFailure((e as Error).message);
    }
  }, [api, courseId, sittingId]);
  useEffect(() => { void read(); }, [read]);
  const subscribed = monitorVisible && data?.quiz.state === 'open';
  const stream = useQuizMonitor(live, courseId, sittingId, subscribed);
  const monitor = data && subscribed && stream.monitor && stream.monitor.ctl >= data.monitor.ctl ? stream.monitor : data?.monitor;
  const state = monitor?.state || data?.quiz.state;
  useEffect(() => {
    if (state !== 'open' && state !== 'announced' && state !== 'prepared') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state]);
  const control = async (action: TeacherAction, values = {}) => {
    if (!data || !monitor || busy) return;
    setBusy(true);
    setFailure('');
    try {
      await api.call('quizControl', { courseId, sittingId, action, ctl: monitor.ctl, round: monitor.round, ...values });
      setSelected([]);
      await read();
      reload();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!data || !monitor || !state) return <section className="z-card pq-teacher" data-ui>
    <button type="button" onClick={back}>← {className}的小考</button>
    {failure ? <><p role="alert">{failure}</p><button type="button" onClick={() => void read()}>重新整理</button></> : <p>正在讀取場次…</p>}
  </section>;
  const students = Object.entries(monitor.students || {});
  const displayName = (id: string) => {
    const name = monitor.students[id]?.name || '名冊外';
    return masked ? maskStudentName(name).replaceAll('○', 'O') : name;
  };
  const received = new Map<string, number>();
  const eventKey = (event: LiveLeaveEvent) => [event.studentId, event.round, event.visit, event.episode].join('/');
  for (const event of stream.events) if (event.kind === 'return' && event.seconds !== undefined) received.set(eventKey(event), event.seconds);
  const leaves = stream.events.filter((event) => event.kind === 'leave' && (!eventFilter || event.studentId === eventFilter));
  const scoreById = new Map(data.scores?.map((row) => [row.studentId, row]) || []);
  const pending = students.filter(([, person]) => groupFor(person) === 'pending');
  const allowed = !busy && Number.isInteger(minutes) && minutes >= 1 && minutes <= 60;
  const pre = state === 'prepared' || state === 'announced';
  return <div className="pq-teacher" data-ui data-quiz-teacher={pre ? 'prepare' : state === 'released' ? 'results' : 'monitor'}>
    <div className="pq-teacher-actions">
      <button type="button" onClick={back}>← {className}的小考</button>
      <h3>{row.exam.title}・{row.sitting.label}</h3>
    </div>
    {(failure || stream.error) && <p className="pq-error" role="alert">{failure || stream.error}</p>}
    {pre && <section className="z-card">
      <h3>開考前</h3>
      <p>{statusLabels[state]}・{row.exam.count} 題・應考 {students.length} 人</p>
      <div className="pq-teacher-actions">
        <label>作答限時（秒） <input type="number" min="1" max="14400" value={seconds}
          onChange={(event) => setSeconds(Number(event.target.value))} /></label>
        <button type="button" disabled={busy || data.quiz.baseSeconds === seconds} onClick={() => void control('duration', { seconds })}>儲存限時</button>
        <span>現在開放預估 {time(now + seconds * 1000)} 截止</span>
        {state === 'prepared'
          ? <button type="button" className="primary" disabled={busy || data.quiz.baseSeconds !== seconds} onClick={() => void control('announce')}>公告給學生</button>
          : <button type="button" className="primary" disabled={busy || data.quiz.baseSeconds !== seconds} onClick={() => void control('open')}>開放作答</button>}
      </div>
      <QuizQr courseId={courseId} sittingId={sittingId} />
      <details><summary>應考名冊（{students.length} 人）</summary><p>{students.map(([id]) => displayName(id)).join('、')}</p></details>
    </section>}
    {state === 'open' && <section className="z-card">
      <div className="pq-teacher-actions">
        <h3>即時監看</h3>
        <strong>全班截止 {time(monitor.deadline)}・{quizDuration(Math.max(0, Math.ceil((monitor.deadline - now) / 1000)))}</strong>
        <button type="button" onClick={() => setMonitorVisible((visible) => !visible)}>{monitorVisible ? '關閉監看' : '開啟監看'}</button>
        <button type="button" onClick={() => { void read(); stream.reconnect(); }}>重新整理監看</button>
      </div>
      <p>{monitor.round ? '補考第 ' + monitor.round + ' 輪' : '正式場次'}{monitor.finalDeadline > monitor.deadline ? '・個別延長最晚 ' + time(monitor.finalDeadline) : ''}</p>
      {monitor.prep === 'pending' && <p role="status">正在建立考前練習快照。</p>}
      {monitor.prep === 'incomplete' && <p role="status">考前練習快照未完整。</p>}
      <div className="pq-teacher-actions">
        <label>延長（分鐘） <input type="number" min="1" max="60" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label>
        <button type="button" disabled={!allowed} onClick={() => void control('extend', { seconds: minutes * 60 })}>全場延長</button>
        <button type="button" disabled={busy} onClick={() => { if (window.confirm('結束這一輪並批改最後存檔的答案？')) void control('end'); }}>結束</button>
      </div>
      <QuizQr courseId={courseId} sittingId={sittingId} />
      {monitorVisible && <>
        <div className="pq-teacher-actions">
          <label><input type="checkbox" checked={masked} onChange={(event) => setMasked(event.target.checked)} /> 遮名</label>
          <label>名冊狀態 <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">全部</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
          </select></label>
        </div>
        <div className="pq-status-grid">{groups.filter((group) => !statusFilter || group.id === statusFilter).map((group) => {
          const names = students.filter(([, person]) => groupFor(person) === group.id);
          return <div key={group.id} className="pq-status-column" data-status={group.id}>
            <h3>{group.label}・{names.length} 人</h3>
            {!names.length && <p>—</p>}
            <ul>{names.map(([id, person]) => <li key={id}>
              {group.id === 'active' ? <>
                <button type="button" disabled={!allowed} onClick={() => void control('extendStudent', { studentId: id, seconds: minutes * 60 })}
                  aria-label={'個別延長 ' + displayName(id)}>{displayName(id)}</button>
                {'・' + quizDuration(Math.max(0, Math.ceil((monitor.deadline + (person.extendedSeconds || 0) * 1000 - now) / 1000)))}
              </> : displayName(id)}
              {(person.startedRound ?? person.submittedRound ?? 0) > 0 && '・補考'}
              {!!person.extendedSeconds && '・個別延長 ' + person.extendedSeconds / 60 + ' 分鐘'}
            </li>)}</ul>
          </div>;
        })}</div>
        <h3>切出畫面</h3>
        <label>篩選學生 <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
          <option value="">全部</option>{students.map(([id]) => <option key={id} value={id}>{displayName(id)}</option>)}
        </select></label>
        {leaves.length ? <ul>{leaves.map((event) => <li key={event.id}>
          {time(event.at)}・{displayName(event.studentId)}・第 {event.episode} 次・{received.has(eventKey(event)) ? received.get(eventKey(event)) + ' 秒' : '尚未記到返回'}
        </li>)}</ul> : <p>目前沒有切出紀錄。</p>}
      </>}
    </section>}
    {state === 'closing' && <section className="z-card">
      <h3>正在批改</h3><p>成績會在結算後公布。</p><button type="button" onClick={() => void read()}>重新檢查</button>
    </section>}
    {state === 'released' && <>
      {report()}
      <section className="z-card">
        <h3>班級成績</h3>
        <ul>{students.map(([id]) => {
          const score = scoreById.get(id);
          return <li key={id}>{displayName(id)}・{score ? showScore(score.score) + ' 分' : '缺考'}
            {score?.blankStart && '・全卷空白'}{score?.makeup ? '・補考' : ''}
            {score?.extendedSeconds ? '・個別延長 ' + score.extendedSeconds / 60 + ' 分鐘' : ''}
          </li>;
        })}</ul>
        {!!pending.length && <fieldset>
          <legend>補考名單</legend>
          {pending.map(([id]) => <label className="z-check" key={id}><input type="checkbox" checked={selected.includes(id)}
            onChange={(event) => setSelected((old) => event.target.checked ? [...old, id] : old.filter((value) => value !== id))} /> {displayName(id)}</label>)}
          <button type="button" disabled={!selected.length || busy} onClick={() => void control('makeup', { studentIds: selected })}>開放補考</button>
        </fieldset>}
      </section>
    </>}
  </div>;
}
