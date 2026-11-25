import { useCallback, useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { quizHash, quizLeaveCsv, summarizeQuizLeaves, type QuizLeaveSummary, type QuizMonitor, type QuizState } from '../shared/platformQuiz';
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

function SmallQr({ courseId, sittingId }: { courseId: string; sittingId: string }) {
  const { data } = useQrData(courseId, sittingId, 4);
  return <img className="pq-live-qr-img" src={data} alt="進入小考 QR code" />;
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

function useQrData(courseId: string, sittingId: string, scale: number) {
  const url = location.origin + location.pathname + quizHash(courseId, sittingId);
  const data = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createDataURL(scale, scale * 3);
  }, [url, scale]);
  return { url, data };
}

/** 投影用全螢幕 QR（#73）：大 QR＋倒數；按鈕或 Esc 關閉。 */
function QrOverlay({ courseId, sittingId, remaining, close }: {
  courseId: string; sittingId: string; remaining: string; close: () => void;
}) {
  const { url, data } = useQrData(courseId, sittingId, 10);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [close]);
  return <div className="pq-qr-overlay" role="dialog" aria-modal="true" aria-label="掃描進入小考">
    <img src={data} alt="進入小考 QR code" />
    <div>
      <p className="pq-qr-overlay-time">剩餘 <strong>{remaining}</strong></p>
      <p>手機掃描 → 用學校帳號登入 → 直接打開本場小考</p>
      <p><a href={url}>進入小考</a></p>
      <button type="button" onClick={close} autoFocus>關閉（Esc）</button>
    </div>
  </div>;
}

function LeaveReport({ events, name, round }: {
  events: { studentId: string; round: number; episode: number; kind: 'leave' | 'return'; at: number; seconds?: number; visit?: string }[];
  name: (id: string) => string; round?: number;
}) {
  const summary = summarizeQuizLeaves(events, round);
  const rows = Object.entries(summary).sort((a, b) => b[1].count - a[1].count || b[1].seconds - a[1].seconds);
  const total = rows.reduce((sum, [, row]) => sum + row.count, 0);
  const download = () => {
    const csv = quizLeaveCsv(rows.map(([id, row]) => ({ name: name(id), summary: row })), time);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = '切出畫面紀錄.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  };
  return <section className="z-card pq-leave-report" data-quiz-leaves>
    <h3>切出畫面紀錄（{rows.length} 人・{total} 次）</h3>
    {!rows.length ? <p>這一場沒有切出畫面的紀錄。</p> : <>
      <table className="z-table"><thead><tr><th>姓名</th><th>次數</th><th>總秒數</th><th>各次</th></tr></thead>
        <tbody>{rows.map(([id, row]) => <tr key={id}>
          <td>{name(id)}</td><td>{row.count}</td><td>{row.seconds}</td>
          <td>{row.episodes.map((episode) => time(episode.at) + '（' + (episode.seconds === undefined ? '未記到返回' : episode.seconds + ' 秒') + '）').join('、')}</td>
        </tr>)}</tbody></table>
      <button type="button" onClick={download}>下載 CSV</button>
    </>}
  </section>;
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

type Group = 'pending' | 'active' | 'done';
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
  const [custom, setCustom] = useState(2);
  // 延長面板：null＝關閉；''＝全場；學號＝個別延長該生（#73）
  const [extendFor, setExtendFor] = useState<string | null>(null);
  const [masked, setMasked] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [bigQr, setBigQr] = useState(false);
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
      setExtendFor(null);
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
  const scoreById = new Map(data.scores?.map((row) => [row.studentId, row]) || []);
  const pending = students.filter(([, person]) => groupFor(person) === 'pending');
  const customOk = Number.isInteger(custom) && custom >= 1 && custom <= 60;
  const extend = (add: number) => {
    if (busy || extendFor === null) return;
    void control(extendFor ? 'extendStudent' : 'extend', { seconds: add * 60, ...(extendFor ? { studentId: extendFor } : {}) });
  };
  const leaveSummary: Record<string, QuizLeaveSummary> = state === 'open' ? summarizeQuizLeaves(stream.events, monitor.round) : {};
  const remainingSeconds = Math.max(0, Math.ceil((monitor.deadline - now) / 1000));
  const pre = state === 'prepared' || state === 'announced';
  return <div className="pq-teacher" data-ui data-quiz-teacher={pre ? 'prepare' : state === 'released' ? 'results' : 'monitor'}>
    <div className="pq-teacher-actions">
      <button type="button" onClick={back}>← {className}的小考</button>
      {state !== 'open' && <h3>{row.exam.title}・{row.sitting.label}</h3>}
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
    {state === 'open' && (() => {
      const byGroup = (group: Group) => students.filter(([, person]) => groupFor(person) === group);
      const pendingRows = byGroup('pending');
      const activeRows = byGroup('active');
      const doneRows = byGroup('done');
      const away = (id: string) => leaveSummary[id]?.awaySince !== undefined && groupFor(monitor.students[id]) === 'active';
      const awayRows = activeRows.filter(([id]) => away(id));
      const repeatRows = students.filter(([id]) => (leaveSummary[id]?.count || 0) >= 2 && !away(id))
        .sort((a, b) => leaveSummary[b[0]].count - leaveSummary[a[0]].count);
      const leaveTotal = Object.values(leaveSummary).reduce((sum, row) => sum + row.count, 0);
      const total = students.length || 1;
      const sortedActive = [...awayRows, ...activeRows.filter(([id]) => !away(id))];
      const remaining = quizDuration(remainingSeconds);
      const attention = pendingRows.length + awayRows.length + repeatRows.length;
      return <section className="pq-live" data-quiz-live>
        <div className="pq-live-head">
          <h3>{row.exam.title}・{row.sitting.label}</h3>
          <span className="pq-live-pill">{monitor.round ? '補考第 ' + monitor.round + ' 輪' : '開放中'}</span>
          <span className="pq-live-spacer" />
          <label className="pq-live-mask"><input type="checkbox" checked={masked} onChange={(event) => setMasked(event.target.checked)} /> 遮名</label>
          <button type="button" aria-expanded={extendFor === ''} onClick={() => setExtendFor(extendFor === '' ? null : '')}>延長…</button>
          <button type="button" className="pq-live-end" disabled={busy}
            onClick={() => { if (window.confirm('結束這一輪並批改最後存檔的答案？')) void control('end'); }}>結束測驗</button>
          <button type="button" className="pq-live-quiet" onClick={() => setMonitorVisible((visible) => !visible)}>{monitorVisible ? '關閉監看' : '開啟監看'}</button>
          <button type="button" className="pq-live-quiet" onClick={() => { void read(); stream.reconnect(); }}>重新整理</button>
        </div>
        {extendFor !== null && <div className="pq-live-extend" role="group" aria-label="延長時間">
          <strong>{extendFor ? '個別延長：' + displayName(extendFor) : '延長全場'}</strong>
          <button type="button" disabled={busy} onClick={() => extend(1)}>＋1 分</button>
          <button type="button" disabled={busy} onClick={() => extend(3)}>＋3 分</button>
          <label>自訂 <input type="number" min="1" max="60" value={custom} onChange={(event) => setCustom(Number(event.target.value))} /> 分</label>
          <button type="button" disabled={busy || !customOk} onClick={() => extend(custom)}>套用</button>
          <button type="button" className="pq-live-quiet" onClick={() => setExtendFor(null)}>取消</button>
        </div>}
        <div className="pq-live-progress">
          <div className="pq-live-clock">
            <span>剩餘・{time(monitor.deadline)} 截止</span>
            <strong aria-label="全班剩餘時間">{remaining}</strong>
            {monitor.finalDeadline > monitor.deadline && <span>個別延長最晚 {time(monitor.finalDeadline)}</span>}
          </div>
          <div className="pq-live-bar-wrap">
            <div className="pq-live-bar" role="img" aria-label={'已交卷 ' + doneRows.length + '、作答中 ' + activeRows.length + '、未進入 ' + pendingRows.length + '，共 ' + students.length + ' 人'}>
              <span data-status="done" style={{ width: doneRows.length / total * 100 + '%' }} />
              <span data-status="active" style={{ width: activeRows.length / total * 100 + '%' }} />
              <span data-status="pending" style={{ width: pendingRows.length / total * 100 + '%' }} />
            </div>
            <div className="pq-live-counts">
              <span data-status="done"><strong>{doneRows.length}</strong> 已交卷</span>
              <span data-status="active"><strong>{activeRows.length}</strong> 作答中</span>
              <span data-status="pending"><strong>{pendingRows.length}</strong> 未進入</span>
              <span className="pq-live-total">共 {students.length} 人</span>
            </div>
          </div>
          <div className="pq-live-qr">
            <SmallQr courseId={courseId} sittingId={sittingId} />
            <button type="button" onClick={() => setBigQr(true)}>放大 QR</button>
          </div>
        </div>
        {monitor.prep === 'pending' && <p role="status">正在建立考前練習快照。</p>}
        {monitor.prep === 'incomplete' && <p role="status">考前練習快照未完整。</p>}
        {monitorVisible ? <div className="pq-live-main">
          <section className="pq-live-attention" aria-label="需要注意">
            <h4>需要注意</h4>
            {!attention && <p>目前沒有需要處理的人。</p>}
            {!!pendingRows.length && <div>
              <span className="pq-live-label">還沒進入（{pendingRows.length}）</span>
              <ul className="pq-live-chips">{pendingRows.map(([id]) => <li key={id} className="pq-chip-pending">{displayName(id)}</li>)}</ul>
            </div>}
            {!!awayRows.length && <div>
              <span className="pq-live-label">現在離開畫面（{awayRows.length}）</span>
              <ul className="pq-live-away">{awayRows.map(([id]) => <li key={id}>
                <span>{displayName(id)}</span>
                <span>已離開 {quizDuration(Math.max(0, Math.floor((now - (leaveSummary[id].awaySince || now)) / 1000)))}</span>
              </li>)}</ul>
            </div>}
            {!!repeatRows.length && <div>
              <span className="pq-live-label">離開 2 次以上（{repeatRows.length}）</span>
              <ul className="pq-live-repeat">{repeatRows.map(([id]) => <li key={id}>
                <span>{displayName(id)}</span><span>{leaveSummary[id].count} 次・{leaveSummary[id].seconds} 秒</span>
              </li>)}</ul>
            </div>}
            <p className="pq-live-foot">全部切出紀錄：{Object.keys(leaveSummary).length} 人・{leaveTotal} 次（結束後在成績頁保留）</p>
          </section>
          <section className="pq-live-active" aria-label="作答中">
            <div className="pq-live-active-head"><h4>作答中 {activeRows.length}</h4><span>點名字可個別延長</span></div>
            {!activeRows.length && <p>目前沒有作答中的學生。</p>}
            <ul className="pq-live-chips">{sortedActive.map(([id, person]) => <li key={id}>
              <button type="button" className={away(id) ? 'pq-chip-away' : 'pq-chip-active'} disabled={busy}
                aria-label={'個別延長 ' + displayName(id) + (away(id) ? '（離開中）' : '')}
                onClick={() => setExtendFor(id)}>
                {displayName(id)}
                {away(id) ? <em> 離開中</em> : leaveSummary[id] ? <em> 離{leaveSummary[id].count}</em> : null}
                {(person.startedRound ?? 0) > 0 && <small> 補考</small>}
                {!!person.extendedSeconds && <small> ＋{person.extendedSeconds / 60} 分</small>}
              </button>
            </li>)}</ul>
            <div className="pq-live-done">
              <strong>已交卷 {doneRows.length}</strong>
              <span>名單收合，交卷者不需處理</span>
              <button type="button" aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>{showDone ? '收合名單' : '展開名單'}</button>
            </div>
            {showDone && <p className="pq-live-done-list">{doneRows.map(([id]) => displayName(id)).join('、') || '—'}</p>}
          </section>
        </div> : <p>監看已關閉，不會接收即時更新。</p>}
        {bigQr && <QrOverlay courseId={courseId} sittingId={sittingId} remaining={remaining} close={() => setBigQr(false)} />}
      </section>;
    })()}
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
      <LeaveReport events={data.events || []} name={displayName} />
    </>}
  </div>;
}
