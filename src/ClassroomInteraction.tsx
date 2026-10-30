import { useUpdateProtection } from './updateActivity';
import { featureEnabled } from '../shared/features';
import { visiblePoll } from './VisiblePoll';
import { useEffect, useState, useRef, useId } from 'react';
import { API } from './service';
import { Course } from '../shared/model';
import {
  AnswerKeys,
  Interaction,
  InteractionField,
  PollRound,
  Responses,
  RoundJudgement,
  RoundReveal,
  StudentHistoryItem,
  validateInteractions,
  validateAnswerKeys,
  extractValidSlideKey,
  validateResponses,
  judgeResponses,
  interactionSeconds,
  interactionExpired,
  interactionTimeLabel,
} from '../shared/classroom';

/** Serial polling: never overlap requests or apply a late response after unmount/course change. */
function usePoll(
  task: (alive: () => boolean) => Promise<void>,
  dependencies: unknown[],
  delay: number,
) {
  useEffect(() => visiblePoll(task, delay), [...dependencies, delay]);
}

/** Anchor to server time and a monotonic local clock; device wall-clock changes do not affect countdown. */
export function useInteractionClock(serverNow?: number) {
  const anchor = useRef({ server: serverNow ?? Date.now(), local: performance.now() });
  const [now, setNow] = useState(anchor.current.server);
  useEffect(() => {
    if (serverNow !== undefined) anchor.current = { server: serverNow, local: performance.now() };
    const tick = () => setNow(anchor.current.server + performance.now() - anchor.current.local);
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [serverNow]);
  return now;
}

export function StudentRevealFeedback({
  fields,
  reveal,
  submitted,
  answers,
  judgement,
}: {
  fields: InteractionField[];
  reveal: RoundReveal;
  submitted: boolean;
  answers?: Responses | null;
  judgement?: RoundJudgement | null;
}) {
  const judge = judgement || judgeResponses({ fields }, reveal.key, answers);
  return (
    <div className="reveal-feedback" aria-label="公佈答案與回饋">
      <div
        className={
          'reveal-summary ' +
          (submitted ? (judge.allCorrect ? 'correct' : 'wrong') : 'unanswered')
        }
      >
        {submitted
          ? judge.allCorrect
            ? '✓ 本題答對'
            : '✗ 本題答錯'
          : '未作答（以下為正解與解析）'}
      </div>
      {fields.map((f) => {
        const fk = reveal.key?.[f.id];
        if (!fk) return null;
        if (f.kind === 'choice') {
          const expected = String(fk.answer);
          const actual =
            submitted && typeof answers?.[f.id] === 'string'
              ? String(answers[f.id])
              : null;
          return (
            <div key={f.id} className="reveal-field">
              <h3>{f.label}</h3>
              {submitted && actual !== null ? (
                <>
                  <ul className="reveal-options">
                    {f.options.map((o) => {
                      const isMine = actual === o;
                      const isExpected = expected === o;
                      return (
                        <li
                          key={o}
                          className={
                            'reveal-option' +
                            (isMine
                              ? isExpected
                                ? ' mine-correct'
                                : ' mine-wrong'
                              : '') +
                            (isExpected ? ' is-expected' : '')
                          }
                        >
                          <span>{o}</span>
                          <span className="reveal-tags">
                            {isMine && (
                              <strong
                                className={
                                  isExpected ? 'tag-correct' : 'tag-wrong'
                                }
                              >
                                {isExpected ? '✓ 你的作答' : '✗ 你的作答'}
                              </strong>
                            )}
                            {isExpected && (
                              <span className="tag-expected">正解</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="reveal-answer-line">
                    <strong>我的作答：</strong>
                    {actual} {actual === expected ? '✓' : '✗'}
                  </p>
                </>
              ) : (
                <p className="reveal-answer-line">
                  <strong>我的作答：</strong>未作答
                </p>
              )}
              <p className="reveal-expected-line">
                <strong>正解：</strong>
                {expected}
              </p>
              {fk.explanation && (
                <p className="reveal-explanation">
                  <strong>解析：</strong>
                  {fk.explanation}
                </p>
              )}
            </div>
          );
        }
        const expected = Array.isArray(fk.answer) ? fk.answer : [];
        const actualArr =
          submitted && Array.isArray(answers?.[f.id])
            ? (answers![f.id] as string[])
            : null;
        return (
          <div key={f.id} className="reveal-field">
            <h3>{f.label}</h3>
            {submitted && actualArr ? (
              <ol className="reveal-order-steps">
                {expected.map((exp, idx) => {
                  const act = actualArr[idx] || '（未選）';
                  const ok = act === exp;
                  return (
                    <li
                      key={idx}
                      className={ok ? 'step-correct' : 'step-wrong'}
                    >
                      <span>
                        第{idx + 1}步：{act}
                      </span>
                      <strong className={ok ? 'tag-correct' : 'tag-wrong'}>
                        {ok ? '✓' : '✗'}
                      </strong>
                      {!ok && (
                        <small className="step-expected">
                          （正解：{exp}）
                        </small>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="reveal-answer-line">
                <strong>我的作答：</strong>未作答
              </p>
            )}
            <p className="reveal-expected-line">
              <strong>完整正確順序：</strong>
              {expected.map((s, idx) => `${idx + 1}. ${s}`).join(' → ')}
            </p>
            {fk.explanation && (
              <p className="reveal-explanation">
                <strong>解析：</strong>
                {fk.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StudentClassroomHistory({
  rounds,
  loading,
  onClose,
  onRefresh,
}: {
  rounds: StudentHistoryItem[];
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="classroom-history" aria-label="課堂互動紀錄">
      <div className="classroom-heading">
        <div>
          <span className="eyebrow">課後複習 · 不計分</span>
          <h3>課堂互動紀錄（已公佈 {rounds.length} 題）</h3>
        </div>
        <div className="actions">
          <button type="button" onClick={onRefresh} disabled={loading}>
            重新整理
          </button>
          <button type="button" onClick={onClose}>
            關閉紀錄
          </button>
        </div>
      </div>
      {loading && !rounds.length ? (
        <p>載入互動紀錄中…</p>
      ) : !rounds.length ? (
        <p>目前尚無已公佈答案的課堂互動紀錄。</p>
      ) : (
        <div className="history-round-list">
          {rounds.map((item) => (
            <article key={item.id} className="history-round-card">
              <div className="classroom-heading">
                <strong>
                  {item.title} · 第{item.number}輪
                </strong>
                <span
                  className={
                    'pill ' +
                    (item.submitted
                      ? item.judgement.allCorrect
                        ? 'correct'
                        : 'wrong'
                      : 'unanswered')
                  }
                >
                  {item.submitted
                    ? item.judgement.allCorrect
                      ? '✓ 答對'
                      : '✗ 答錯'
                    : '未作答'}
                </span>
              </div>
              <StudentRevealFeedback
                fields={item.fields}
                reveal={item.reveal}
                submitted={item.submitted}
                answers={item.answers}
                judgement={item.judgement}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

type StudentRound = Omit<PollRound, 'counts' | 'total'>;
type StudentState = {
  round: StudentRound | null;
  submitted?: boolean;
  answers?: Responses | null;
  results?: PollRound;
  reveal?: RoundReveal;
  judgement?: RoundJudgement;
  serverNow?: number;
};
export function StudentInteraction({ api, course }: { api: API; course: Course }) {
  const [state, setState] = useState<StudentState>({ round: null }),
    [expanded, setExpanded] = useState(false),
    [failure, setFailure] = useState(''),
    [showHistory, setShowHistory] = useState(false),
    [historyRounds, setHistoryRounds] = useState<StudentHistoryItem[]>([]),
    [historyLoading, setHistoryLoading] = useState(false);
  useUpdateProtection(state.round?.status === 'open' && !state.submitted);
  const now = useInteractionClock(state.serverNow);
  const expired = !!state.round && interactionExpired(state.round, now);
  const reveal = state.reveal || state.round?.reveal;

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.call<{ rounds: StudentHistoryItem[] }>(
        'studentClassroomHistory',
        { courseId: course.id },
      );
      if (Array.isArray(res?.rounds)) {
        setHistoryRounds(res.rounds);
      }
    } catch {
      // Ignore if test mock does not implement studentClassroomHistory
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    setState({ round: null });
    setExpanded(false);
    setFailure('');
    setShowHistory(false);
    setHistoryRounds([]);
  }, [api, course.id]);

  useEffect(() => {
    if (showHistory) {
      void loadHistory();
    }
  }, [showHistory, state.round?.id, reveal?.revealedAt]);

  usePoll(
    async (alive) => {
      if (!featureEnabled(course, 'classroomInteraction') || api.preview) return;
      try {
        const r = await api.call<StudentState>('getClassroomInteraction', { courseId: course.id });
        if (alive()) {
          setState((old) =>
            old.round?.id === r.round?.id && old.submitted && !r.submitted
              ? { ...r, submitted: true, answers: old.answers }
              : r,
          );
          setFailure('');
        }
      } catch {
        if (alive()) setFailure('連線中斷，正在重新連線…');
      }
    },
    [api, course.id, state.round?.status],
    // 學生閒置維持 5 秒：教師開題後學生最慢約 5 秒看到題目（教師 2026-10-21 決定）。
    state.round?.status === 'open' ? 2000 : 5000,
  );
  if (!featureEnabled(course, 'classroomInteraction') || api.preview) return null;
  return (
    <section className="panel classroom-student" aria-label="目前課堂互動">
      <div className="classroom-heading">
        <div>
          <span className="eyebrow">個人作答 · 不計分</span>
          <h2>目前課堂互動</h2>
        </div>
        <div className="actions">
          {state.round && (
            <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
              {expanded ? '收合' : state.submitted ? '查看我的作答' : '進入互動'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
          >
            {showHistory ? '收合互動紀錄' : '課堂互動紀錄'}
          </button>
        </div>
      </div>
      {failure && <p role="alert">{failure}</p>}
      {state.round ? (
        <>
          <p>
            {state.round.title} · 第{state.round.number}輪 ·{' '}
            {reveal
              ? '已公佈答案'
              : state.round.status === 'open'
                ? state.submitted
                  ? '已送出，等待老師公佈答案'
                  : expired
                    ? '時間到，等待老師公布結果'
                    : '開放作答中'
                : state.submitted
                  ? '已結束 · 已送出，等待老師公佈答案'
                  : '已結束'}
          </p>
          {state.round.status === 'open' && (
            <p
              className={
                'interaction-timer' +
                (expired
                  ? ' expired'
                  : interactionSeconds(state.round, now) <= 10 &&
                      state.round.deadlineAt !== undefined
                    ? ' urgent'
                    : '')
              }
              role="timer"
              aria-label="互動時間"
            >
              {state.round.deadlineAt === undefined ? '已開放 ' : '剩餘 '}
              {interactionTimeLabel(interactionSeconds(state.round, now))}
            </p>
          )}
          {expanded && (
            <InteractionForm
              key={state.round.id}
              round={state.round}
              api={api}
              expired={expired}
              courseId={course.id}
              submitted={!!state.submitted}
              saved={state.answers || undefined}
              reveal={reveal}
              judgement={state.judgement}
              onSaved={(answers) =>
                setState((v) =>
                  v.round?.id === state.round?.id ? { ...v, submitted: true, answers } : v,
                )
              }
            />
          )}
          {expanded && state.results && (
            <PollResults round={reveal ? { ...state.results, reveal } : state.results} />
          )}
        </>
      ) : (
        <p>等待教師開放互動。登入自己的課序即可參加。</p>
      )}
      {showHistory && (
        <StudentClassroomHistory
          rounds={historyRounds}
          loading={historyLoading}
          onClose={() => setShowHistory(false)}
          onRefresh={() => void loadHistory()}
        />
      )}
    </section>
  );
}
export function InteractionForm({
  round,
  api,
  courseId,
  submitted,
  saved,
  onSaved,
  expired = false,
  reveal,
  judgement,
}: {
  round: StudentRound;
  api: API;
  courseId: string;
  submitted: boolean;
  expired?: boolean;
  saved?: Responses;
  reveal?: RoundReveal;
  judgement?: RoundJudgement;
  onSaved: (answers: Responses) => void;
}) {
  const formId = useId();
  const [answers, setAnswers] = useState<Responses>({}),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState('');
  const locked = submitted || round.status === 'closed' || expired || busy;
  const values = submitted ? saved || {} : answers;
  const set = (key: string, value: string | string[]) =>
    setAnswers((old) => ({ ...old, [key]: value }));
  async function send() {
    if (locked) return;
    setFailure('');
    try {
      const input = validateResponses(round, answers);
      setBusy(true);
      const r = await api.call<{ submitted: boolean; answers: Responses }>(
        'submitClassroomInteraction',
        { courseId, roundId: round.id, answers: input },
      );
      if (!r.submitted) throw Error('尚未收到送出確認，請重試');
      onSaved(r.answers);
    } catch (e) {
      const message = (e as Error).message;
      setFailure(message.includes('時間到') ? message : message + '；未確認成功時，請重試送出。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="interaction-form">
      <p>請逐項選擇答案，排序題使用下拉選單。送出後不能修改，每人每輪只計一次。</p>
      {round.fields.map((f) => (
        <fieldset key={f.id} disabled={locked} className="interaction-field">
          <legend>{f.label}</legend>
          {f.kind === 'choice' ? (
            (() => {
              const isTrueFalse =
                f.options?.length === 2 &&
                f.options[0] === '○ 對' &&
                f.options[1] === '✕ 錯';
              return (
                <div
                  className={
                    'interaction-options' + (isTrueFalse ? ' true-false-options' : '')
                  }
                >
                  {f.options!.map((o, i) => (
                    <label
                      key={o}
                      className={
                        (isTrueFalse ? 'true-false-btn ' : '') +
                        (values[f.id] === o ? 'selected' : '')
                      }
                    >
                      <input
                        type="radio"
                        name={formId + '-' + round.id + '-' + f.id}
                        checked={values[f.id] === o}
                        onChange={() => set(f.id, o)}
                      />
                      <span>{isTrueFalse ? o : `${String.fromCharCode(65 + i)}　${o}`}</span>
                    </label>
                  ))}
                </div>
              );
            })()
          ) : (
            <div>
              {f.options!.map((_, i) => (
                <label className="order-position" key={i}>
                  第{i + 1}步
                  <select
                    aria-label={`第${i + 1}步`}
                    value={((values[f.id] as string[]) || [])[i] || ''}
                    onChange={(e) => {
                      const next = [...((values[f.id] as string[]) || f.options!.map(() => ''))];
                      next[i] = e.target.value;
                      set(f.id, next);
                    }}
                  >
                    <option value="">選擇事件</option>
                    {f.options!.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ))}
      {failure && <p role="alert">{failure}</p>}
      {reveal ? (
        <StudentRevealFeedback
          fields={round.fields}
          reveal={reveal}
          submitted={submitted}
          answers={saved || null}
          judgement={judgement}
        />
      ) : submitted ? (
        <p role="status">
          <span>已送出，等待老師公佈答案</span>
          <span className="sr-only">已送出，作答已鎖定。等待教師統整。</span>
        </p>
      ) : expired && round.status === 'open' ? (
        <p role="status">時間到，等待老師公布結果</p>
      ) : round.status === 'closed' ? (
        <p>教師已結束作答，未送出的內容不列入統計。</p>
      ) : (
        <button className="primary" disabled={busy} onClick={() => void send()}>
          {busy ? '正在送出…' : '確認送出並鎖定'}
        </button>
      )}
    </div>
  );
}
export function PollResults({ round, expired = false }: { round: PollRound; expired?: boolean }) {
  const revealKey = round.reveal?.key;
  return (
    <div className="poll-results">
      <div className="poll-results-head">
        <h2>
          {round.title} · 第{round.number}輪
        </h2>
        <p className="poll-total">
          已回覆 <strong>{round.total}</strong> 人 ·{' '}
          {round.reveal
            ? '已公佈答案'
            : round.status === 'open'
              ? expired
                ? '時間到，等待統整'
                : '即時收票中'
              : '已結束'}{' '}
          · 每人每輪一份作答
        </p>
      </div>
      <div className="poll-stat-grid">
        {round.fields.map((f) => {
          const fk = revealKey?.[f.id];
          return (
            <section key={f.id} className="poll-stat">
              <h3>{f.label}</h3>
              {(f.kind === 'order' ? f.options!.map((_, i) => i) : [0]).map((position) => {
                const expectedOpt = fk
                  ? f.kind === 'order'
                    ? Array.isArray(fk.answer)
                      ? fk.answer[position]
                      : null
                    : String(fk.answer)
                  : null;
                return (
                  <div key={position}>
                    {f.kind === 'order' && <h4>第{position + 1}步</h4>}
                    {f.options!.map((o, i) => {
                      const n =
                          round.counts[f.kind === 'order' ? f.id + '-' + position : f.id]?.[i] ||
                          0,
                        percent = round.total ? Math.round((n * 100) / round.total) : 0;
                      const isExpected = expectedOpt === o;
                      return (
                        <div
                          className={'poll-option' + (isExpected ? ' is-expected' : '')}
                          key={o}
                        >
                          <div>
                            <span>
                              {o}{' '}
                              {isExpected && (
                                <strong className="tag-expected">✓ 正解</strong>
                              )}
                            </span>
                            <strong>
                              {n}票 · {percent}%
                            </strong>
                          </div>
                          <div className="poll-bar-track">
                            <div style={{ width: percent + '%' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {fk && f.kind === 'order' && Array.isArray(fk.answer) && (
                <p className="reveal-expected-line">
                  <strong>完整正確順序：</strong>
                  {fk.answer.map((s, idx) => `${idx + 1}. ${s}`).join(' → ')}
                </p>
              )}
              {fk?.explanation && (
                <p className="reveal-explanation">
                  <strong>解析：</strong>
                  {fk.explanation}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
type TeacherState = {
  round: PollRound | null;
  activeRound: PollRound | null;
  serverNow?: number;
  rounds?: PollRound[];
};
export function TeacherInteraction({
  api,
  course,
  slideId,
  black,
  privateRecords = false,
}: {
  api: API;
  course: Course;
  slideId: string;
  black: boolean;
  privateRecords?: boolean;
}) {
  const [interactions, setInteractions] = useState<import('../shared/classroom').Interaction[]>([]);
  const [answerKeys, setAnswerKeys] = useState<AnswerKeys | null>(null);
  const [state, setState] = useState<TeacherState>({ round: null, activeRound: null });
  useEffect(() => {
    let alive = true;
    if (featureEnabled(course, 'classroomInteraction') && !api.preview)
      api
        .call<{ interactions: import('../shared/classroom').Interaction[]; answerKeys?: AnswerKeys }>(
          'getClassroomConfig',
          { courseId: course.id },
        )
        .then((r) => {
          if (alive) {
            setInteractions(r.interactions);
            setAnswerKeys(r.answerKeys !== undefined ? r.answerKeys : null);
          }
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, [api, course.id, slideId, state.round?.hasAnswerKey]);
  const def = interactions.find((d) => d.slideId === slideId);
  const [history, setHistory] = useState<PollRound[]>([]),
    [selected, setSelected] = useState('');
  const [classes, setClasses] = useState<string[]>(course.classIds);
  const [duration, setDuration] = useState(60),
    [show, setShow] = useState(false);
  const [failure, setFailure] = useState(''),
    [busy, setBusy] = useState(false);
  const [records, setRecords] = useState<any[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<{
    round: PollRound;
    slideId: string;
    classIds: string[];
    durationSeconds: number;
  } | null>(null);
  const epoch = useRef(0),
    controls = useRef<HTMLDivElement>(null),
    recordRequest = useRef(0),
    privateAllowed = useRef(privateRecords);
  privateAllowed.current = privateRecords;
  const [footerHeight, setFooterHeight] = useState(220);
  const now = useInteractionClock(state.serverNow);
  const { round, activeRound } = state;
  const pageRound = round?.slideId === slideId ? round : null;
  const pageOpen = activeRound?.slideId === slideId;
  const expired = !!activeRound && interactionExpired(activeRound, now);
  const configHasValidKey =
    pageRound && answerKeys !== null
      ? Boolean(extractValidSlideKey(pageRound, answerKeys))
      : false;
  const pageHasAnswerKey = Boolean(
    pageRound &&
      (pageRound.reveal ||
        (answerKeys !== null
          ? configHasValidKey && Boolean(pageRound.hasAnswerKey)
          : Boolean(pageRound.hasAnswerKey))),
  );
  useEffect(() => {
    const root = controls.current,
      playback = root?.parentElement?.querySelector('.teaching-playback');
    if (!root || !playback) return;
    const resize = () =>
      setFooterHeight(
        root.getBoundingClientRect().height + playback.getBoundingClientRect().height,
      );
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    observer.observe(playback);
    resize();
    return () => observer.disconnect();
  }, [privateRecords, api, course.id]);
  useEffect(() => {
    recordRequest.current++;
    setRecords(null);
  }, [privateRecords, round?.id, api, course.id]);
  useEffect(() => {
    epoch.current++;
    setSelected('');
    setShow(false);
    setConfirmOpen(null);
    setState((s) => ({ ...s, round: null }));
  }, [slideId]);
  useEffect(() => {
    setState({ round: null, activeRound: null });
    setHistory([]);
    setSelected('');
    setShow(false);
  }, [api, course.id]);
  usePoll(
    async (alive) => {
      if (api.preview || !featureEnabled(course, 'classroomInteraction')) return;
      const version = epoch.current;
      try {
        const r = await api.call<TeacherState>('classroomInteractionReport', {
          courseId: course.id,
          slideId,
          ...(selected ? { roundId: selected } : {}),
        });
        if (alive() && version === epoch.current) {
          setState(r);
          setFailure('');
        }
      } catch {
        if (alive() && version === epoch.current) setFailure('連線中斷，正在重新連線…');
      }
    },
    [api, course.id, slideId, selected],
    state.activeRound?.status === 'open' ? 2000 : 10000,
  );
  async function action(action: string, target?: PollRound, replacement?: typeof confirmOpen) {
    if (busy) return;
    epoch.current++;
    setBusy(true);
    setFailure('');
    try {
      const r = await api.call<{ round: PollRound; serverNow?: number }>(
        'controlClassroomInteraction',
        {
          courseId: course.id,
          action,
          slideId: replacement?.slideId || slideId,
          classIds: replacement?.classIds || classes,
          durationSeconds: replacement?.durationSeconds ?? duration,
          roundId: target?.id,
          ...(replacement ? { replaceRoundId: replacement.round.id } : {}),
        },
      );
      setState((old) => ({
        ...old,
        serverNow: r.serverNow,
        round: r.round.slideId === slideId ? r.round : old.round,
        activeRound:
          r.round.status === 'open'
            ? r.round
            : old.activeRound?.id === r.round.id
              ? null
              : old.activeRound,
      }));
      setSelected('');
      setConfirmOpen(null);
      if (action === 'open') setShow(false);
      if (action === 'reveal') setShow(true);
      return true;
    } catch (e) {
      setFailure((e as Error).message);
      setConfirmOpen(null);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function open() {
    if (activeRound) {
      if (activeRound.slideId !== slideId)
        setConfirmOpen({
          round: activeRound,
          slideId,
          classIds: [...classes],
          durationSeconds: duration,
        });
      return;
    }
    void action('open');
  }
  async function loadRecords() {
    const version = ++recordRequest.current;
    try {
      const r = await api.call<{ rows: any[] }>('classroomInteractionRecords', {
        courseId: course.id,
        roundId: pageRound?.id,
      });
      if (privateAllowed.current && version === recordRequest.current) setRecords(r.rows);
    } catch (e) {
      setFailure((e as Error).message);
    }
  }
  async function refreshHistory() {
    try {
      const r = await api.call<TeacherState>('classroomInteractionReport', {
        courseId: course.id,
        slideId,
        history: true,
      });
      setHistory(r.rounds || []);
    } catch (e) {
      setFailure((e as Error).message);
    }
  }
  if (!featureEnabled(course, 'classroomInteraction') || api.preview) return null;
  return (
    <div className="teacher-interaction" ref={controls}>
      {!black && (
        <aside
          className={
            'classroom-statusbar ' + (!activeRound ? 'idle' : expired ? 'expired' : 'open')
          }
          aria-label="互動常駐狀態"
        >
          {activeRound ? (
            <>
              <span>
                <strong>
                  {expired ? '時間到 · ' : '開放中 · '}
                  {activeRound.title} · 第{activeRound.number}輪
                </strong>
                <br />
                已收 {activeRound.total}／{activeRound.eligibleCount ?? '—'} 人 ·{' '}
                {activeRound.deadlineAt === undefined ? '已開放' : '剩餘'}{' '}
                <span role="timer">
                  {interactionTimeLabel(interactionSeconds(activeRound, now))}
                </span>
              </span>
              <button disabled={busy} onClick={() => void action('close', activeRound)}>
                結束作答
              </button>
              {activeRound.deadlineAt !== undefined && (
                <button disabled={busy} onClick={() => void action('extend', activeRound)}>
                  ＋30 秒
                </button>
              )}
            </>
          ) : (
            <span>目前沒有開放的互動</span>
          )}
        </aside>
      )}
      {def && (
        <div className="interaction-control" aria-label="本頁互動控制">
          <strong>本頁互動：{def.title}</strong>
          <span>
            {pageOpen
              ? '開放中'
              : pageRound
                ? `${pageRound.reveal ? '已公佈' : '已結束'} · 第${pageRound.number}輪`
                : '未開放'}
          </span>
          <details>
            <summary>參與班級（{classes.length}）</summary>
            {course.classIds.map((id) => (
              <label key={id}>
                <input
                  type="checkbox"
                  disabled={busy || pageOpen}
                  checked={classes.includes(id)}
                  onChange={(e) =>
                    setClasses((old) =>
                      e.target.checked ? [...old, id] : old.filter((x) => x !== id),
                    )
                  }
                />
                {id}
              </label>
            ))}
          </details>
          {!pageOpen && (
            <>
              <label>
                倒數時間{' '}
                <select
                  aria-label="倒數時間"
                  disabled={busy}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {[
                    ['0', '不限時'],
                    ['30', '30 秒'],
                    ['60', '60 秒'],
                    ['90', '90 秒'],
                    ['120', '2 分鐘'],
                    ['180', '3 分鐘'],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {pageRound &&
                pageRound.status === 'closed' &&
                pageHasAnswerKey &&
                (pageRound.reveal ? (
                  <button disabled>已公佈</button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => void action('reveal', pageRound)}
                  >
                    公佈答案
                  </button>
                ))}
              <button disabled={busy || !classes.length} onClick={open}>
                {pageRound ? '再投一輪' : '開放作答'}
              </button>
            </>
          )}
          {pageRound && (
            <button
              onClick={() => {
                if (activeRound?.id === pageRound.id && interactionExpired(activeRound, now))
                  void action('close', activeRound).then((ok) => {
                    if (ok) setShow(true);
                  });
                else setShow((v) => !v);
              }}
            >
              {show ? '回投影片' : '顯示結果'}
            </button>
          )}
          <details
            onToggle={(e) => {
              if (e.currentTarget.open) void refreshHistory();
            }}
          >
            <summary>歷次結果</summary>
            <select
              aria-label="歷次互動"
              value={selected}
              onChange={(e) => {
                epoch.current++;
                setSelected(e.target.value);
                setShow(true);
              }}
            >
              <option value="">本頁最新互動</option>
              {history
                .filter((r) => r.slideId === slideId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} · 第{r.number}輪 · {r.total}人
                  </option>
                ))}
            </select>
          </details>
        </div>
      )}
      {confirmOpen && !black && (
        <div
          className="interaction-confirm"
          role="dialog"
          aria-modal="true"
          aria-label="切換本頁互動"
        >
          <p>
            「{confirmOpen.round.title}」仍在開放中（已收{' '}
            {activeRound?.id === confirmOpen.round.id ? activeRound.total : confirmOpen.round.total}{' '}
            人）。要結束它並開放本頁嗎？
          </p>
          <button
            disabled={busy}
            className="primary"
            onClick={() => void action('open', undefined, confirmOpen)}
          >
            結束並開放本頁
          </button>
          <button disabled={busy} onClick={() => setConfirmOpen(null)}>
            取消
          </button>
        </div>
      )}
      {privateRecords && pageRound && (
        <div className="classroom-private">
          <button onClick={() => (records ? setRecords(null) : void loadRecords())}>
            {records ? '隱藏私人紀錄' : '私人參與紀錄（請先暫停投影）'}
          </button>
          {records && (
            <div>
              <p>僅教師可見；全螢幕時隱藏。</p>
              {records.map((r) => (
                <p key={r.uid}>
                  {r.classId} · {r.studentId} · {r.name} · 已送出
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {failure && (
        <p className="interaction-failure" role="alert">
          {failure}
        </p>
      )}
      {show && pageRound && !black && (
        <div
          className="interaction-projection"
          style={{ bottom: footerHeight }}
          aria-label="即時投票結果"
        >
          <PollResults round={pageRound} expired={interactionExpired(pageRound, now)} />
        </div>
      )}
    </div>
  );
}
/** Only presentation instructions change; the approved private source asset stays intact. */
export function interactiveSlideHTML(html: string, _slideId: string) {
  return html;
}
export function interactiveSlideNotes(notes: string, _slideId: string) {
  return notes;
}

export function ClassroomConfigEditor({
  api,
  course,
  notify,
}: {
  api: API;
  course: Course;
  notify: (s: string) => void;
}) {
  const [text, setText] = useState('[]'),
    [answerKeysText, setAnswerKeysText] = useState('{}'),
    [defs, setDefs] = useState<import('../shared/classroom').Interaction[]>([]),
    [selected, setSelected] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    api
      .call<{
        interactions: import('../shared/classroom').Interaction[];
        answerKeys?: AnswerKeys;
      }>('getClassroomConfig', { courseId: course.id, includeAnswerKeys: true })
      .then((r) => {
        if (alive) {
          setDefs(r.interactions);
          setText(JSON.stringify(r.interactions, null, 2));
          if (r.answerKeys !== undefined) {
            setAnswerKeysText(JSON.stringify(r.answerKeys, null, 2));
          }
          setSelected((s) => s || r.interactions[0]?.slideId || '');
        }
      })
      .catch((e) => notify(e.message));
    return () => {
      alive = false;
    };
  }, [api, course.id, revision]);
  const save = async () => {
    try {
      const interactions = JSON.parse(text);
      await api.call('saveClassroomConfig', { courseId: course.id, interactions });
      setRevision((r) => r + 1);
      notify('互動題目已保存；已開放輪次保留原題快照');
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const saveAnswerKeys = async () => {
    try {
      const currentDefs = validateInteractions(JSON.parse(text));
      const answerKeys = validateAnswerKeys(currentDefs, JSON.parse(answerKeysText));
      await api.call('saveClassroomConfig', { courseId: course.id, answerKeys });
      setRevision((r) => r + 1);
      notify('答案與解析已保存；已公佈輪次保留原快照');
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <section className="panel">
      <h1>課堂互動</h1>
      <p>
        互動只記參與，不計成績或完成度。題目以 slideId 綁定簡報頁；也可在此直接開放。
      </p>
      <label className="field">
        選擇互動題
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">請選擇</option>
          {defs.map((d) => (
            <option key={d.slideId} value={d.slideId}>
              {d.title}
            </option>
          ))}
        </select>
      </label>
      <TeacherInteraction
        key={revision}
        api={api}
        course={course}
        slideId={selected}
        black={false}
        privateRecords
      />
      <details>
        <summary>設定互動題目</summary>
        <p>
          JSON 陣列：每題包含 slideId、title、fields；欄位包含 id、label、kind（choice 或 order）、options。只輸入選項，不填答案。
        </p>
        <textarea
          aria-label="互動題目設定 JSON"
          rows={14}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={() => void save()}>保存互動題目</button>
      </details>
      <details>
        <summary>設定答案與解析</summary>
        <p>
          JSON 物件：依 slideId 與欄位 id 設定 answer（choice 為正確選項字串、order 為完整正確順序陣列）及選填 explanation（300 字內）。沒有答案的題目不顯示「公佈答案」按鈕。
        </p>
        <textarea
          aria-label="答案與解析設定 JSON"
          rows={14}
          value={answerKeysText}
          onChange={(e) => setAnswerKeysText(e.target.value)}
        />
        <button onClick={() => void saveAnswerKeys()}>保存答案與解析</button>
      </details>
    </section>
  );
}
