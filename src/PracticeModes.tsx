import { useEffect, useRef, useState } from 'react';
import {
  Attempt,
  Course,
  Unit,
  Question,
  Progress,
  WrongSummary,
  wrongEntries,
  wrongGroups,
  reviewIds,
  reviewCounts,
  shuffle,
} from '../shared/model';
import { API, cachedBank } from './service';
import { Explanations, QuestionImage } from './QuestionContent';
export interface PracticeRowData {
  q: Question;
  unit: Unit;
}
export function WrongResult({
  summary,
  review = false,
}: {
  summary: WrongSummary;
  review?: boolean;
}) {
  return (
    <p className="notice" aria-live="polite">
      {review
        ? `已移除 ${summary.removed} 題・仍答錯 ${summary.wrong} 題`
        : `移除錯題 ${summary.removed} 題・今天已答對 ${summary.todayCorrect} 題（明天以後再答對就會移除）`}
    </p>
  );
}
export function Flashcards({
  rows,
  onBack,
  onPractice,
}: {
  rows: PracticeRowData[];
  onBack: () => void;
  onPractice?: () => void;
}) {
  const [queue, setQueue] = useState(rows),
    [flipped, setFlipped] = useState(false),
    [selected, setSelected] = useState('');
  const [seen, setSeen] = useState(0),
    [again, setAgain] = useState<Set<string>>(new Set());
  const answerRef = useRef<HTMLDivElement>(null);
  const row = queue[0],
    q = row?.q;
  useEffect(() => {
    if (flipped) answerRef.current?.focus();
  }, [flipped]);
  function next(repeat: boolean) {
    if (!row) return;
    const key = `${row.unit.id}:${q.id}`;
    // 同一張本輪最多多排一次，避免連續「再看一次」永遠無法結束。
    if (repeat && !again.has(key)) {
      setAgain(new Set([...again, key]));
      setQueue([...queue.slice(1), row]);
    } else setQueue(queue.slice(1));
    setSeen(seen + 1);
    setFlipped(false);
    setSelected('');
  }
  if (!q)
    return (
      <main className="quiz flashcards">
        <h1>閃卡已看完</h1>
        <p>
          看了 {seen} 張，其中 {again.size} 張標記再看一次
        </p>
        <button
          onClick={() => {
            setQueue(rows);
            setSeen(0);
            setAgain(new Set());
          }}
        >
          再翻一輪
        </button>
        <button onClick={onBack}>回到單元</button>
        {again.size > 0 && onPractice && <button onClick={onPractice}>用抽題練習測一下</button>}
      </main>
    );
  const letter = (id: string) => String.fromCharCode(65 + q.options.findIndex((o) => o.id === id));
  return (
    <main className="quiz flashcards">
      <div className="sectionhead">
        <button onClick={onBack}>離開閃卡</button>
        <strong>閃卡・還有 {queue.length} 張</strong>
      </div>
      <p>翻卡看答案，不記錄</p>
      <p>先在心裡選好答案，再翻面</p>
      <article
        className="panel flashcard"
        onClick={() => setFlipped(true)}
        onKeyDown={(e) => {
          if (e.code === 'Space' && e.target === e.currentTarget) {
            e.preventDefault();
            setFlipped(true);
          }
        }}
        tabIndex={0}
        aria-label="閃卡，按空白鍵翻面"
      >
        <p>{row.unit.title}</p>
        <h2>{q.text}</h2>
        <QuestionImage url={q.image} />
        <div className="options">
          {q.options.map((o) => (
            <button
              key={o.id}
              aria-pressed={selected === o.id}
              className={flipped && o.id === q.answer ? 'right' : selected === o.id ? 'chosen' : ''}
              disabled={flipped}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(o.id);
              }}
            >
              {letter(o.id)}. {o.text}
              {flipped && o.id === q.answer && ' ✓ 正解'}
            </button>
          ))}
        </div>
        {flipped && (
          <div ref={answerRef} tabIndex={-1} className="flashcard-answer">
            <p>
              {selected
                ? selected === q.answer
                  ? `你選的是 ${letter(selected)}，正確`
                  : `你選的是 ${letter(selected)}，正解是 ${letter(q.answer)}`
                : `正解是 ${letter(q.answer)}`}
            </p>
            <Explanations q={q} />
          </div>
        )}
      </article>
      {!flipped && (
        <button className="primary" onClick={() => setFlipped(true)}>
          翻面
        </button>
      )}
      <div className="flashcard-actions">
        <button disabled={!flipped} onClick={() => next(false)}>
          我會
        </button>
        <button disabled={!flipped} onClick={() => next(true)}>
          再看一次
        </button>
      </div>
    </main>
  );
}
/** 單元與綜合練習共用逐題作答；摘要和成績只採用伺服器回應。 */
export function PracticeSession({
  api,
  course,
  rows,
  mode,
  mixed = false,
  onBack,
  onProgress,
}: {
  api: API;
  course: Course;
  rows: PracticeRowData[];
  mode: 'quiz' | 'review';
  mixed?: boolean;
  onBack: () => void;
  onProgress: (p: Progress) => void;
}) {
  const [i, setI] = useState(0),
    [selected, setSelected] = useState<Record<string, string>>({}),
    [locked, setLocked] = useState(false);
  const [result, setResult] = useState<{ attempts: Attempt[]; summary: WrongSummary } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const start = useRef(Date.now()),
    ids = useRef(new Map<string, string>());
  const row = rows[i],
    key = row && `${row.unit.id}:${row.q.id}`;
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    const grouped = new Map<string, PracticeRowData[]>();
    rows.forEach((r) => grouped.set(r.unit.id, [...(grouped.get(r.unit.id) || []), r]));
    const attempts: Attempt[] = [...grouped.values()].map((rs) => {
      const unit = rs[0].unit;
      if (!ids.current.has(unit.id)) ids.current.set(unit.id, crypto.randomUUID());
      return {
        id: ids.current.get(unit.id)!,
        courseId: course.id,
        unitId: unit.id,
        version: unit.bankVersion,
        mode,
        full: false,
        score: 0,
        clientAt: start.current,
        duration: Math.round((Date.now() - start.current) / 1000),
        answers: rs.map((r) => ({
          questionId: r.q.id,
          selected: selected[`${unit.id}:${r.q.id}`],
          correct: false,
          seconds: 0,
        })),
      };
    });
    try {
      const r: any = await api.call(
        mixed ? 'submitMixedAttempts' : 'submitAttempt',
        mixed ? { attempts } : { attempt: attempts[0] },
      );
      onProgress(r.progress);
      const saved = mixed ? r.attempts : [r.attempt];
      if (!saved?.every((a: Attempt) => a?.answers))
        throw new Error('伺服器未回傳批改結果，請重試');
      const summaries: WrongSummary[] = mixed ? r.summaries : [r.wrongSummary];
      const summary = summaries.reduce(
        (s, v) => ({
          removed: s.removed + (v?.removed || 0),
          todayCorrect: s.todayCorrect + (v?.todayCorrect || 0),
          wrong: s.wrong + (v?.wrong || 0),
        }),
        { removed: 0, todayCorrect: 0, wrong: 0 },
      );
      setResult({ attempts: saved, summary });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <main className="quiz">
        <h1>{mode === 'review' ? '錯題複習結果' : '抽題練習結果'}</h1>
        <p>練習不計入最高分與完成度</p>
        <WrongResult summary={result.summary} review={mode === 'review'} />
        <ul>
          {result.attempts.map((a) => (
            <li key={a.unitId}>
              {rows.find((r) => r.unit.id === a.unitId)?.unit.title}：答對{' '}
              {a.answers.filter((x) => x.correct).length} / {a.answers.length} 題
            </li>
          ))}
        </ul>
        <button onClick={onBack}>返回單元</button>
      </main>
    );
  if (!row)
    return (
      <main className="quiz">
        <p>目前沒有可用題目</p>
        <button onClick={onBack}>返回單元</button>
      </main>
    );
  const { q } = row;
  return (
    <main className="quiz">
      <div className="sectionhead">
        <button disabled={busy} onClick={onBack}>
          離開練習
        </button>
        <strong>
          {mode === 'review' ? '錯題複習' : '抽題練習'} {i + 1} / {rows.length}
        </strong>
      </div>
      <p>練習・不計分</p>
      {mode === 'review' && <p>答錯後隔天以上再答對，才會從錯題移除。</p>}
      <p>{row.unit.title}</p>
      <h2>{q.text}</h2>
      <QuestionImage url={q.image} />
      <div className="options">
        {q.options.map((o) => (
          <button
            key={o.id}
            disabled={locked || busy}
            className={
              locked && o.id === q.answer ? 'right' : selected[key] === o.id ? 'chosen' : ''
            }
            onClick={() => setSelected({ ...selected, [key]: o.id })}
          >
            {o.text}
            {locked && o.id === q.answer && ' ✓ 正解'}
          </button>
        ))}
      </div>
      {locked && (
        <div>
          <p>{selected[key] === q.answer ? '答對' : '答錯'}（交卷後由伺服器重批）</p>
          <Explanations q={q} />
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {!locked ? (
        <button className="primary" disabled={!selected[key]} onClick={() => setLocked(true)}>
          送出答案
        </button>
      ) : i < rows.length - 1 ? (
        <button
          className="primary"
          onClick={() => {
            setI(i + 1);
            setLocked(false);
          }}
        >
          下一題
        </button>
      ) : (
        <button className="primary" disabled={busy} onClick={submit}>
          {busy ? '正在保存…' : '查看結果'}
        </button>
      )}
    </main>
  );
}
export function ReviewChoices({
  count,
  onChoose,
  disabled = false,
}: {
  count: number;
  onChoose: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="review-counts" aria-label="錯題複習題數">
      {reviewCounts(count).map((n) => (
        <button key={n} disabled={disabled || n > count} onClick={() => onChoose(n)}>
          {[10, 20, 30, 50].includes(n) ? `${n} 題` : `全部 ${n} 題`}
        </button>
      ))}
    </div>
  );
}
export function UnitWrongPractice({
  api,
  course,
  unit,
  progress,
  onBack,
  onProgress,
}: {
  api: API;
  course: Course;
  unit: Unit;
  progress: Progress;
  onBack: () => void;
  onProgress: (p: Progress) => void;
}) {
  const [now] = useState(Date.now),
    [rows, setRows] = useState<PracticeRowData[] | null>(null),
    [flash, setFlash] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const entries = wrongEntries(progress, unit.id, unit.bankVersion, unit),
    groups = wrongGroups(entries, now),
    count = Object.keys(groups.due).length,
    today = Object.keys(groups.today).length;
  async function load(n: number, asFlash = false) {
    setBusy(true);
    setError('');
    try {
      const all = await cachedBank(api, course.id, unit.id, unit.bankVersion);
      const ids = asFlash ? Object.keys(groups.today) : reviewIds(entries, n, now);
      const picked = shuffle(all.filter((q) => ids.includes(q.id))).map((q) => ({
        q: { ...q, options: shuffle(q.options) },
        unit,
      }));
      setFlash(asFlash);
      setRows(picked);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (rows)
    return flash ? (
      <Flashcards rows={rows} onBack={onBack} />
    ) : (
      <PracticeSession
        api={api}
        course={course}
        rows={rows}
        mode="review"
        onBack={onBack}
        onProgress={onProgress}
      />
    );
  return (
    <main className="quiz">
      <button onClick={onBack}>返回單元</button>
      <h1>錯題複習（{count} 題）</h1>
      <p>答錯後隔天以上再答對，才會從錯題移除。</p>
      {count > 0 && <ReviewChoices count={count} onChoose={load} disabled={busy} />}
      {today > 0 && (
        <p>
          {count
            ? `另有 ${today} 題今天剛錯，明天起可重做`
            : `這 ${today} 題今天剛錯，先用閃卡看解析，明天再來重做`}
        </p>
      )}
      {today > 0 && !isReview(unit) && (
        <button disabled={busy} onClick={() => load(today, true)}>
          用閃卡看解析
        </button>
      )}
      {!count && !today && <p>目前沒有錯題</p>}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
function isReview(unit: Unit) {
  return !!unit.review;
}
