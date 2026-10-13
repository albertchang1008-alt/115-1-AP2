import { useEffect, useState, useRef } from 'react';
import { API } from './service';
import { Course } from '../shared/model';
import {
  Interaction,
  MI_CLASSROOM_COURSE,
  PollRound,
  Responses,
  interactions,
  validateResponses,
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
  useEffect(() => {
    let disposed = false,
      timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      try {
        if (!disposed) await task(() => !disposed);
      } finally {
        if (!disposed) timer = setTimeout(run, delay);
      }
    };
    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, dependencies);
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
type StudentRound = Omit<PollRound, 'counts' | 'total'>;
type StudentState = {
  round: StudentRound | null;
  submitted?: boolean;
  answers?: Responses | null;
  results?: PollRound;
  serverNow?: number;
};
export function StudentInteraction({ api, course }: { api: API; course: Course }) {
  const [state, setState] = useState<StudentState>({ round: null }),
    [expanded, setExpanded] = useState(false),
    [failure, setFailure] = useState('');
  const now = useInteractionClock(state.serverNow);
  const expired = !!state.round && interactionExpired(state.round, now);
  useEffect(() => {
    setState({ round: null });
    setExpanded(false);
    setFailure('');
  }, [api, course.id]);
  usePoll(
    async (alive) => {
      if (course.id !== MI_CLASSROOM_COURSE || api.preview) return;
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
    state.round?.status === 'open' ? 2000 : 5000,
  );
  if (course.id !== MI_CLASSROOM_COURSE || api.preview) return null;
  return (
    <section className="panel classroom-student" aria-label="目前課堂互動">
      <div className="classroom-heading">
        <div>
          <span className="eyebrow">個人作答 · 不計分</span>
          <h2>目前課堂互動</h2>
        </div>
        {state.round && (
          <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? '收合' : state.submitted ? '查看我的作答' : '進入互動'}
          </button>
        )}
      </div>
      {failure && <p role="alert">{failure}</p>}
      {state.round ? (
        <>
          <p>
            {state.round.title} · 第{state.round.number}輪 ·{' '}
            {state.round.status === 'open'
              ? state.submitted
                ? '已送出，作答已鎖定'
                : expired
                  ? '時間到，等待老師公布結果'
                  : '開放作答中'
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
              onSaved={(answers) =>
                setState((v) =>
                  v.round?.id === state.round?.id ? { ...v, submitted: true, answers } : v,
                )
              }
            />
          )}
          {expanded && state.results && <PollResults round={state.results} />}
        </>
      ) : (
        <p>等待教師開放互動。登入自己的課序即可參加。</p>
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
}: {
  round: StudentRound;
  api: API;
  courseId: string;
  submitted: boolean;
  expired?: boolean;
  saved?: Responses;
  onSaved: (answers: Responses) => void;
}) {
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
            <div className="interaction-options">
              {f.options!.map((o, i) => (
                <label key={o}>
                  <input
                    type="radio"
                    name={round.id + '-' + f.id}
                    checked={values[f.id] === o}
                    onChange={() => set(f.id, o)}
                  />
                  <span>
                    {String.fromCharCode(65 + i)}　{o}
                  </span>
                </label>
              ))}
            </div>
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
      {submitted ? (
        <p role="status">已送出，作答已鎖定。等待教師統整。</p>
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
  return (
    <div className="poll-results">
      <div className="poll-results-head">
        <h2>
          {round.title} · 第{round.number}輪
        </h2>
        <p className="poll-total">
          已回覆 <strong>{round.total}</strong> 人 ·{' '}
          {round.status === 'open' ? (expired ? '時間到，等待統整' : '即時收票中') : '已結束'} ·
          每人每輪一份作答
        </p>
      </div>
      <div className="poll-stat-grid">
        {round.fields.map((f) => (
          <section key={f.id} className="poll-stat">
            <h3>{f.label}</h3>
            {(f.kind === 'order' ? f.options!.map((_, i) => i) : [0]).map((position) => (
              <div key={position}>
                {f.kind === 'order' && <h4>第{position + 1}步</h4>}
                {f.options!.map((o, i) => {
                  const n =
                      round.counts[f.kind === 'order' ? f.id + '-' + position : f.id]?.[i] || 0,
                    percent = round.total ? Math.round((n * 100) / round.total) : 0;
                  return (
                    <div className="poll-option" key={o}>
                      <div>
                        <span>{o}</span>
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
            ))}
          </section>
        ))}
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
  const def = interactions.find((d) => d.slideId === slideId);
  const [state, setState] = useState<TeacherState>({ round: null, activeRound: null });
  const [history, setHistory] = useState<PollRound[]>([]),
    [selected, setSelected] = useState('');
  const [classes, setClasses] = useState<string[]>(
    course.classIds.filter((id) => id === 'N551' || id === 'N552'),
  );
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
      if (api.preview || course.id !== MI_CLASSROOM_COURSE) return;
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
    2000,
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
  if (course.id !== MI_CLASSROOM_COURSE || api.preview) return null;
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
            {pageOpen ? '開放中' : pageRound ? `已結束 · 第${pageRound.number}輪` : '未開放'}
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
export function interactiveSlideHTML(html: string, slideId: string) {
  const replacements: Record<string, [string, string][]> = {
    'c1-spread': [
      [
        '在紙上畫出細菌從 A 床走到 B 床的所有可能路徑，再<b>圈出你會攔截的那一步</b>。',
        '在自己的課序選擇可能的傳播途徑，以及你會優先加強的攔截步驟。',
      ],
      ['個人任務｜4 分鐘', '個人任務｜選擇途徑與攔截步驟'],
    ],
    'c1-resist': [
      ['30 秒，寫下一句衛教說明', '個別選擇衛教說明'],
      [
        '一人當王先生，一人當護理師：用上面的機制解釋為什麼不能自己停藥，以及醫院可以怎麼減少抗藥菌。',
        '在自己的課序選擇適當的衛教說明、基因傳遞方式，以及醫院減少抗藥菌的做法。',
      ],
    ],
    'c2-tcell': [
      [
        '每人選一張角色卡，用一句話自我介紹：「我是＿＿，在醫院負責＿＿。」',
        '每人選一張角色卡，再於課序選擇該角色負責的工作。',
      ],
      ['負責：＿＿＿＿', '在課序選擇角色的工作'],
    ],
    'c2-hiv': [['30 秒，寫下衛教重點', '個別選擇受器與衛教說明']],
    'c2-first': [['加碼：補體加熱到幾度就失效？', '加碼：在課序選擇補體失效的溫度。']],
    reflect: [
      ['原本我以為＿＿＿＿＿＿＿＿，', '選擇今天最需要加強的概念，'],
      ['現在我知道＿＿＿＿＿＿＿＿。', '再選擇目前的掌握情形。'],
      ['寫在 [Zuvio 開放題／小卡] 上，一兩句就好。', '在自己的課序「目前課堂互動」選擇後送出。'],
    ],
    'c1-sterile': [
      ['每題舉手：對的舉一隻手，錯的舉兩隻手。', '在自己的課序逐題選擇對或錯，完成後送出。'],
    ],
  };
  for (const [before, after] of replacements[slideId] || []) html = html.split(before).join(after);
  if (slideId === 'c1-toxin')
    html = html.replace(
      /<table\b[\s\S]*?<\/table>/i,
      '<div style="display:flex;gap:40px;margin-top:60px"><div style="flex:1;border:3px solid #ba4609;border-radius:20px;padding:65px;font-size:54px">A　內毒素</div><div style="flex:1;border:3px solid #ba4609;border-radius:20px;padding:65px;font-size:54px">B　外毒素</div></div>',
    );
  return html;
}
export function interactiveSlideNotes(notes: string, slideId: string) {
  if (!interactions.some((d) => d.slideId === slideId)) return notes;
  return (
    '本頁操作：學生在自己的課序選擇作答，沒有自由填答、不分組。教師手動開放、結束，查看票數後統整；不計分。\n原教材醫學講解參考（原有書寫／分組操作指示不適用）：\n' +
    notes
  );
}
