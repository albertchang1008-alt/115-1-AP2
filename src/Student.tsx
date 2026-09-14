import { QuestionImage, Explanations } from './QuestionContent';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Play,
  RotateCcw,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  Course,
  Unit,
  Question,
  Progress,
  Mode,
  Attempt,
  emptyProgress,
  completion,
  complete,
  phases,
  modes,
  grade,
  shuffle,
  orderForPractice,
} from '../shared/model';
import { API, cachedBank, enqueue, dequeue, pending } from './service';
import { Youtube, HtmlMaterial } from './Player';
type Props = {
  api: API;
  course: Course;
  uid: string;
  preview?: boolean;
  classLabel?: string;
  initialUnit?: string;
  initialActivity?: string;
  sim?: string;
  notify: (s: string) => void;
};
export default function Student({
  api,
  course,
  uid,
  preview = false,
  classLabel = '',
  initialUnit,
  initialActivity,
  sim = 'none',
  notify,
}: Props) {
  const [progress, setProgress] = useState<Progress>(emptyProgress()),
    [unitId, setUnitId] = useState(initialUnit || ''),
    [activityId, setActivityId] = useState(initialActivity || ''),
    [questions, setQuestions] = useState<Question[]>([]),
    [mode, setMode] = useState<Mode>('quiz'),
    [taking, setTaking] = useState(false),
    [full, setFull] = useState(true),
    [busy, setBusy] = useState(false),
    [history, setHistory] = useState<Attempt[]>([]),
    [next, setNext] = useState<any>(null),
    [historyOpen, setHistoryOpen] = useState(false),
    [queueCount, setQueueCount] = useState(preview ? 0 : pending(uid).length);
  const pRef = useRef(progress);
  pRef.current = progress;
  const unit = course.units.find((u) => u.id === unitId);
  const activity = unit?.activities.find((a) => a.id === activityId);
  const ratio = completion(course, progress);
  useEffect(() => {
    let active = true;
    api
      .call<Progress>('getProgress', { courseId: course.id })
      .then((p) => {
        if (!active) return;
        if (preview && sim !== 'none') {
          p = emptyProgress();
          course.units.forEach((u, i) => {
            if (sim === 'complete' || i === 0)
              p.units[u.id] = {
                best: sim === 'complete' ? 100 : 40,
                attempts: 1,
                updatedAt: Date.now(),
              };
          });
        }
        if (preview) void api.call('setPreviewProgress', { progress: p });
        setProgress(p);
      })
      .catch((e) => notify(e.message));
    return () => {
      active = false;
    };
  }, [api, course.id, sim]);
  async function sync() {
    if (preview) return;
    setBusy(true);
    try {
      for (const a of pending(uid)) {
        if (a.courseId !== course.id) continue;
        const r = await api.call('submitAttempt', { attempt: a });
        dequeue(uid, a.id);
        setProgress(r.progress);
      }
      notify('待同步紀錄已保存');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setQueueCount(pending(uid).length);
      setBusy(false);
    }
  }
  async function loadHistory(more = false) {
    setBusy(true);
    try {
      const r = await api.call('getHistory', {
        courseId: course.id,
        ...(more ? { after: next } : {}),
      });
      setHistory(more ? [...history, ...r.rows] : r.rows);
      setNext(r.next);
      setHistoryOpen(true);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function start(m: Mode, practiceCount?: number) {
    if (!unit?.bankVersion) {
      notify('此單元尚未發布題庫');
      return;
    }
    setBusy(true);
    try {
      let qs = await cachedBank(api, course.id, unit.id, unit.bankVersion);
      if (m === 'review') {
        const wrong = new Set<string>(progress.units[unit.id]?.wrong?.[unit.bankVersion] || []);
        qs = qs.filter((q) => wrong.has(q.id));
        if (!qs.length) {
          notify('目前沒有此題庫版本的歷史錯題。');
          return;
        }
        qs = shuffle(qs);
      } else if (practiceCount) {
        // 抽題練習：不計分、不計完成度。已考過的題目自然排到後面（仿 v1.9），不是每次重置重洗。
        const attemptedIds = new Set(Object.keys(progress.attempted?.[unit.id] || {}));
        qs = orderForPractice(qs, attemptedIds).slice(0, Math.min(practiceCount, qs.length));
      } else {
        qs = shuffle(qs); // 完整測驗：出全部題目，只洗牌不減量
      }
      if (!qs.length) {
        notify('題庫沒有可用題目');
        return;
      }
      setFull(!practiceCount && m !== 'review');
      qs = qs.map((q) => ({ ...q, options: shuffle(q.options) }));
      setQuestions(qs);
      setMode(m);
      setTaking(true);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(a: Attempt) {
    if (!preview) enqueue(uid, a);
    try {
      const r = await api.call('submitAttempt', { attempt: a });
      if (!preview) dequeue(uid, a.id);
      setProgress(r.progress);
      setQueueCount(preview ? 0 : pending(uid).length);
      return preview ? '預覽已完成，不會寫入正式紀錄' : '已保存，完成度已更新';
    } catch (e) {
      setQueueCount(preview ? 0 : pending(uid).length);
      throw e;
    }
  }
  async function saveActivity(position: number, completed: boolean) {
    if (!unit || !activity) return;
    const key = unit.id + '_' + activity.id;
    const old = pRef.current.activities[key];
    const done = completed || old?.completed || false;
    try {
      if (activity.tracking !== 'interactive') await api.call('saveActivity', {
        courseId: course.id,
        unitId: unit.id,
        activityId: activity.id,
        position,
        completed: done,
      });
      setProgress((p) => ({
        ...p,
        activities: {
          ...p.activities,
          [key]: { position, completed: done, updatedAt: Date.now() },
        },
      }));
    } catch (e) {
      notify('參與紀錄未同步：' + (e as Error).message);
    }
  }
  if (taking && unit)
    return (
      <Quiz
        questions={questions}
        full={full}
        mode={mode}
        course={course}
        unit={unit}
        onSubmit={submit}
        onClose={() => setTaking(false)}
      />
    );
  return (
    <div className="student">
      <div className="student-top">
        <span className="eyebrow">LEARNING SPACE</span>
        <span>
          {course.term} / {classLabel}
        </span>
      </div>
      <header className="pageheading">
        <div>
          <h1>{unit ? unit.title : course.title}</h1>
          <p>{unit ? unit.description : course.description}</p>
        </div>
        <button onClick={() => loadHistory()} disabled={busy}>
          <Clock size={17} />
          學習紀錄
        </button>
      </header>
      {queueCount > 0 && (
        <div className="notice warning">
          {queueCount} 組作答待同步，尚未列入雲端完成度。
          <button disabled={busy} onClick={sync}>
            重新同步
          </button>
        </div>
      )}
      {!unit ? (
        <>
          <div className="learning-summary">
            <div>
              <span className="eyebrow">我的單元完成度</span>
              <h2>
                {ratio.done}
                <small> / {ratio.total} 個必做單元</small>
              </h2>
              <p>完整測驗或閃卡達到門檻，即可完成單元。</p>
            </div>
            <div
              className="ring"
              style={{ '--pct': `${ratio.total ? (ratio.done / ratio.total) * 100 : 0}%` } as any}
            >
              <span>{ratio.total ? Math.round((ratio.done / ratio.total) * 100) : 0}%</span>
            </div>
          </div>
          {groupUnits(course.units).map(([group, units]) => (
            <div className="unit-group" key={group || '__ungrouped'}>
              {group && <h3 className="unit-group-title">{group}</h3>}
              <div className="unitgrid">
                {units.map(([u, i]) => {
                  const locked = !!u.opensAt && Date.parse(u.opensAt) > Date.now();
                  return (
                    <button
                      className="unitcard"
                      key={u.id}
                      disabled={locked}
                      onClick={() => {
                        setUnitId(u.id);
                        setActivityId('');
                      }}
                    >
                      <span className="unitnumber">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <span className={'badge ' + (complete(u, progress) ? 'green' : '')}>
                          {complete(u, progress)
                            ? '已達標'
                            : locked
                              ? '尚未開放'
                              : u.required
                                ? '必做單元'
                                : '選修活動'}
                        </span>
                        <h3>{u.title}</h3>
                        <p>{u.description}</p>
                        <footer>
                          {u.activities.length} 項活動 · 達標 {u.threshold} 分{' '}
                          <ChevronRight size={16} />
                        </footer>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <button
            className="back"
            onClick={() => {
              setUnitId('');
              setActivityId('');
            }}
          >
            <ArrowLeft size={16} />
            返回課程
          </button>
          <div className="unit-meta">
            <span>
              最高有效成績：
              {(progress.units[unit.id]?.best ?? -1) < 0
                ? '尚無'
                : progress.units[unit.id].best + ' 分'}
            </span>
            <span>達標門檻 {unit.threshold} 分</span>
            {unit.dueAt && (
              <span>
                期限 {new Date(unit.dueAt).toLocaleDateString()}
                {Date.parse(unit.dueAt) < Date.now() ? ' · 已逾期，仍可練習' : ''}
              </span>
            )}
          </div>
          <div className="learning-layout">
            <div className="activitylist">
              {Object.entries(phases).map(([phase, title]) => (
                <section key={phase}>
                  <h3>{title}</h3>
                  {unit.activities
                    .filter((a) => a.phase === phase)
                    .map((a) => (
                      <button
                        className={activityId === a.id ? 'selected' : ''}
                        key={a.id}
                        onClick={() => setActivityId(a.id)}
                      >
                        {a.type === 'youtube' ? <Play size={17} /> : <BookOpen size={17} />}
                        <span>{a.title}</span>
                        {a.type === 'youtube' && <span className="badge">選看</span>}
                        {a.type !== 'youtube' && progress.activities[unit.id + '_' + a.id]?.completed && (
                          <CheckCircle2 size={16} />
                        )}
                      </button>
                    ))}
                </section>
              ))}
              <section>
                <h3>練習與複習</h3>
                <button disabled={busy} onClick={() => start('quiz')}>
                  <BookOpen size={17} />
                  完整測驗
                </button>
                <button disabled={busy} onClick={() => start('flashcard')}>
                  <RotateCcw size={17} />
                  完整閃卡
                </button>
                <div className="practice-picker">
                  <span className="muted">抽題練習（不計完成度，未考過的題目優先出現）：</span>
                  {[10, 20, 30].map((n) => (
                    <button key={n} disabled={busy} onClick={() => start('quiz', n)}>
                      抽 {n} 題
                    </button>
                  ))}
                </div>
                <button disabled={busy} onClick={() => start('review')}>
                  錯題複習
                </button>
              </section>
            </div>
            <section className="panel activitycontent">
              {!activity ? (
                <div className="empty">
                  <BookOpen />
                  <h2>選擇一項學習活動</h2>
                  <p>先完成課前準備，再進行練習。</p>
                </div>
              ) : (
                <>
                  <span className="eyebrow">{phases[activity.phase]}</span>
                  <h2>{activity.title}</h2>
                  <p>{activity.description}</p>
                  {activity.type === 'youtube' ? (
                    <Youtube
                      activity={activity}
                      position={progress.activities[unit.id + '_' + activity.id]?.position || 0}
                      onSave={saveActivity}
                    />
                  ) : activity.type === 'html' ? (
                    <HtmlMaterial activity={activity} onSave={saveActivity} api={api} courseId={course.id} unitId={unit.id} uid={uid} />
                  ) : activity.type === 'link' ? (
                    <>
                      <a
                        className="button primary"
                        href={activity.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => saveActivity(0, false)}
                      >
                        開啟教材 ↗
                      </a>
                      <button onClick={() => saveActivity(0, true)}>確認已閱讀</button>
                    </>
                  ) : (
                    <div className="actions">
                      <button className="primary" onClick={() => start('quiz')}>
                        開始測驗
                      </button>
                      <button onClick={() => start('flashcard')}>開始閃卡</button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
      {historyOpen && (
        <div className="modalshade">
          <section className="modal wide">
            <div className="sectionhead">
              <h2>我的學習紀錄</h2>
              <button onClick={() => setHistoryOpen(false)}>關閉</button>
            </div>
            <p className="muted">每次載入 20 組；錯題複習不計入完成度。</p>
            {history.length === 0 ? (
              <p className="empty">尚無作答紀錄</p>
            ) : (
              history.map((a) => (
                <details key={a.id}>
                  <summary>
                    {new Date(a.receivedAt || a.clientAt).toLocaleString()} · {modes[a.mode]} ·{' '}
                    {a.score} 分
                  </summary>
                  <p>
                    單元：{course.units.find((u) => u.id === a.unitId)?.title || a.unitId} ·{' '}
                    {a.full ? '完整作答' : '練習'} · {a.answers.length} 題
                  </p>
                  {a.answers.map((r) => (
                    <p key={r.questionId}>
                      {r.questionId}：{r.selected || '未作答'} · {r.correct ? '答對' : '答錯'}
                    </p>
                  ))}
                </details>
              ))
            )}
            {next && (
              <button onClick={() => loadHistory(true)} disabled={busy}>
                載入更多
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Quiz({
  questions,
  full,
  mode,
  course,
  unit,
  onSubmit,
  onClose,
}: {
  questions: Question[];
  full: boolean;
  mode: Mode;
  course: Course;
  unit: Unit;
  onSubmit: (a: Attempt) => Promise<string>;
  onClose: () => void;
}) {
  const [i, setI] = useState(0),
    [selections, setSelections] = useState<Record<string, string>>({}),
    [times, setTimes] = useState<Record<string, number>>({}),
    [locked, setLocked] = useState<Record<string, boolean>>({}),
    [result, setResult] = useState<Attempt | null>(null),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false),
    [remaining, setRemaining] = useState(questions.length * 60),
    [leave, setLeave] = useState(false);
  const start = useRef(Date.now()),
    qStart = useRef(Date.now()),
    attemptId = useRef(crypto.randomUUID()),
    submitted = useRef(false);
  const q = questions[i];
  const latest = useRef({ selections, times });
  latest.current = { selections, times };
  async function finish() {
    if (submitted.current) return;
    submitted.current = true;
    const answers = grade(questions, latest.current.selections, latest.current.times);
    const a: Attempt = {
      id: attemptId.current,
      courseId: course.id,
      unitId: unit.id,
      version: unit.bankVersion,
      mode,
      answers,
      score: Math.round((answers.filter((x) => x.correct).length / answers.length) * 100),
      full,
      clientAt: start.current,
      duration: Math.round((Date.now() - start.current) / 1000),
    };
    setResult(a);
    setBusy(true);
    try {
      setStatus(await onSubmit(a));
    } catch (e) {
      setStatus('尚未保存，請稍後同步。' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (mode !== 'quiz') return;
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        questions.length * 60 - Math.floor((Date.now() - start.current) / 1000),
      );
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        void finish();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  function choose(value: string) {
    if (result || locked[q.id]) return;
    setSelections((s) => ({ ...s, [q.id]: value }));
    setTimes((t) => ({ ...t, [q.id]: Math.round((Date.now() - qStart.current) / 1000) }));
    if (mode !== 'quiz') setLocked((l) => ({ ...l, [q.id]: true }));
  }
  function move(n: number) {
    setI(n);
    qStart.current = Date.now();
  }
  if (result)
    return (
      <section className="panel quizresult">
        <CheckCircle2 size={48} />
        <span className="eyebrow">{modes[mode]}完成</span>
        <h1>
          {result.score}
          <small> 分</small>
        </h1>
        <p>
          答對 {result.answers.filter((a) => a.correct).length} / {questions.length} 題
        </p>
        <p className="notice">{busy ? '正在保存…' : status}</p>
        {mode === 'review' && <p>本次複習不更動正式成績或完成度。</p>}
        <button className="primary" disabled={busy} onClick={onClose}>
          返回單元
        </button>
        <div className="reviewanswers">
          {questions.map((q, j) => (
            <details key={q.id}>
              <summary>
                {result.answers[j].correct ? '✓' : '✕'} {q.text}
              </summary>
              <p>正確答案：{q.options.find((o) => o.id === q.answer)?.text}</p>
              <QuestionImage key={q.image} url={q.image} /><Explanations q={q} />
            </details>
          ))}
        </div>
      </section>
    );
  return (
    <section className="quiz">
      <div className="sectionhead">
        <button onClick={() => setLeave(true)}>
          <ArrowLeft size={16} />
          離開
        </button>
        <span>
          {modes[mode]} · {unit.title}
        </span>
        <span className="badge">
          {mode === 'quiz'
            ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
            : '逐題即時回饋'}
        </span>
      </div>
      <div className="progressline">
        <div style={{ width: `${((i + 1) / questions.length) * 100}%` }} />
      </div>
      <span className="eyebrow">
        QUESTION {String(i + 1).padStart(2, '0')} / {questions.length}
      </span>
      <h2>{q.text}</h2>
      <QuestionImage key={q.image} url={q.image} />
      <div className="options">
        {q.options.map((o, j) => (
          <button
            key={o.id}
            className={
              (selections[q.id] === o.id ? 'chosen ' : '') +
              (locked[q.id]
                ? q.answer === o.id
                  ? 'correct'
                  : selections[q.id] === o.id
                    ? 'incorrect'
                    : ''
                : '')
            }
            disabled={!!locked[q.id]}
            onClick={() => choose(o.id)}
          >
            <b>{String.fromCharCode(65 + j)}</b>
            {o.text}
          </button>
        ))}
      </div>
      {locked[q.id] && (
        <div className="feedback">
          <h3>{selections[q.id] === q.answer ? '答對了' : '再理解一次'}</h3>
          <p>正確答案：{q.options.find((o) => o.id === q.answer)?.text}</p>
          <Explanations q={q} />
        </div>
      )}
      <div className="sectionhead">
        <button disabled={i === 0} onClick={() => move(i - 1)}>
          上一題
        </button>
        <span>{Object.keys(selections).length} 題已作答</span>
        {i < questions.length - 1 ? (
          <button
            className="primary"
            disabled={mode !== 'quiz' && !locked[q.id]}
            onClick={() => move(i + 1)}
          >
            下一題
          </button>
        ) : (
          <button
            className="primary"
            disabled={mode !== 'quiz' && Object.keys(locked).length < questions.length}
            onClick={finish}
          >
            完成並提交
          </button>
        )}
      </div>
      {leave && (
        <div className="modalshade">
          <section className="modal">
            <h2>離開這次作答？</h2>
            <p>本次尚未提交，不會計入成績或完成度。</p>
            <div className="actions">
              <button onClick={() => setLeave(false)}>繼續作答</button>
              <button onClick={onClose}>離開</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

// 依「單元」大分類分組顯示；沒有任何次單元設了 group 時回傳單一未分組區塊，維持原本平鋪外觀。
function groupUnits(units: Unit[]): [string, [Unit, number][]][] {
  const indexed = units.map((u, i) => [u, i] as [Unit, number]);
  if (!units.some((u) => u.group)) return [['', indexed]];
  const order: string[] = [];
  const map = new Map<string, [Unit, number][]>();
  for (const [u, i] of indexed) {
    const key = u.group || '未分類';
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push([u, i]);
  }
  return order.map((key) => [key, map.get(key)!]);
}
function Socratic({ q }: { q: Question }) {
  return (
    <>
      {q.socratic && (
        <details>
          <summary>思考引導</summary>
          {Object.entries(q.socratic)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <p key={k}>{v}</p>
            ))}
        </details>
      )}
      {q.remedialUrl?.startsWith('https://') && (
        <a href={q.remedialUrl} target="_blank" rel="noreferrer">
          查看補強教材 ↗
        </a>
      )}
    </>
  );
}
