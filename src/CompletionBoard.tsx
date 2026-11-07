import { CompletionDailyPanel } from './CompletionDailyPanel';
import { ClassUsagePanel } from './ClassUsagePanel';
import { AnswerIntegrityOverview } from './AnswerIntegrityPanel';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import {
  Activity,
  Course,
  Unit,
  completion,
  emptyProgress,
  forClass,
  orderedChapters,
  parseCourseTime,
} from '../shared/model';
import {
  CompletionStudent,
  ChapterCellStatus,
  ChapterRate,
  allClassCompletionSummary,
  boardStatuses,
  chapterCellLabel,
  chapterCellState,
  chapterDetailItems,
  chapterStateLabels,
  classCompletionSummary,
  completionBoardCourse,
  detailItemVisible,
  filteredClassCompletionSummary,
  markFirstPass,
  maskStudentId,
  matrixCsv,
  recordedMaterial,
  projectionName,
  readBoardPreferences,
  saveBoardPreferences,
  statusMatrix,
} from '../shared/completionBoard';
import type { API } from './service';

interface ClassCache {
  course: Course;
  rows: CompletionStudent[];
  loadedAt: number;
}
export async function loadCompletionClass(
  api: API,
  courseId: string,
  classId: string,
  onPage: (n: number) => void,
): Promise<ClassCache> {
  const rows: CompletionStudent[] = [],
    cursors = new Set<string>();
  let after = '',
    published: Course | undefined;
  do {
    const page = await api.call<{ course: Course; rows: CompletionStudent[]; next: string | null }>(
      'getCompletion',
      { courseId, classId, after },
    );
    if (!page.course) throw Error('完成度回應缺少學生端課程，請重新更新。');
    if (published && JSON.stringify(page.course) !== JSON.stringify(published))
      throw Error('載入期間課程已重新更新到學生端，請重新更新。');
    published = page.course;
    rows.push(
      ...page.rows.map((r) => ({ ...r, classId, progress: r.progress || emptyProgress() })),
    );
    onPage(rows.length);
    after = page.next || '';
    if (after && cursors.has(after)) throw Error('完成度分頁游標重複，請重新更新。');
    cursors.add(after);
  } while (after);
  return { course: published!, rows, loadedAt: Date.now() };
}
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const url = URL.createObjectURL(
    new Blob(['\ufeff' + Papa.unparse(rows)], { type: 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
const symbols = { notOpen: '⊘', done: '●', inProgress: '◐', notStarted: '○' };
const shortDue = (date: string) =>
  date
    ? new Date(parseCourseTime(date)).toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei',
        month: 'numeric',
        day: 'numeric',
      })
    : '無期限';
const fullTime = (time: number) =>
  new Date(time).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
function rateText(rate?: ChapterRate) {
  return rate?.percent == null ? '—' : `${Math.round(rate.percent)}%`;
}
function rateStyle(rate?: ChapterRate) {
  return rate?.percent == null || !rate.required
    ? undefined
    : { backgroundColor: `hsl(200 55% ${97 - rate.percent * 0.28}%)`, color: '#17384c' };
}

const weekday = '日一二三四五六',
  pad = (n: number) => String(n).padStart(2, '0');
/** 11/5（四）20:31（台北時間）。 */
export function shortTime(time: number) {
  const d = new Date(time + 8 * 3600 * 1000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${weekday[d.getUTCDay()]}）${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
const clock = (time: number) => shortTime(time).replace(/^.*）/, ''),
  rowTime = (time: number) => shortTime(time).replace(/（.）/, ' ');
function Summary({ parts }: { parts: (string | false | undefined | null)[] }) {
  const shown = parts.filter(Boolean) as string[];
  return shown.length ? (
    <p className="history-summary">
      {shown.map((x, i) => (
        <span key={i}>
          {i > 0 && <span className="history-sep">｜</span>}
          {x}
        </span>
      ))}
    </p>
  ) : null;
}
/** 點「▼ 細目」才呼叫後端；同一次開啟明細只讀一次。 */
function useDetail<T>(load: () => Promise<T>) {
  const [open, setOpen] = useState(false),
    [data, setData] = useState<T | null>(null),
    [error, setError] = useState('');
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !data) {
      setError('');
      load().then(setData, (e) => setError((e as Error).message || '讀取失敗'));
    }
  };
  return { open, data, error, toggle };
}
function DetailToggle({ open, toggle, label }: { open: boolean; toggle: () => void; label: string }) {
  return (
    <button type="button" className="history-toggle" aria-expanded={open} aria-label={`${open ? '收起' : '展開'}${label}細目`} onClick={toggle}>
      {open ? '▲ 收起' : '▼ 細目'}
    </button>
  );
}
interface AttemptRow { clientAt: number; score: number; mode: string; full: boolean; leftScreen?: boolean }
const attemptKind = (r: AttemptRow) =>
  r.mode === 'quiz' ? (r.full ? (r.leftScreen ? '離開畫面' : '完整') : '部分') : r.mode === 'flashcard' ? '閃卡' : '複習';
export function CategoryHistory({ api, courseId, uid, unit, entry }: {
  api: API; courseId: string; uid?: string | null; unit: Unit;
  entry?: { best: number; attempts: number; updatedAt: number; passedAt?: number };
}) {
  const passed = !!unit.bankVersion && (entry?.best ?? -1) >= unit.threshold;
  const detail = useDetail(() =>
    api.call<{ rows: AttemptRow[]; total: number; truncated: boolean }>('getStudentUnitAttempts', { courseId, uid, unitId: unit.id }),
  );
  const rows = detail.data ? markFirstPass(detail.data.rows, unit.threshold) : [];
  const offset = detail.data ? detail.data.total - detail.data.rows.length : 0;
  return (
    <section>
      <div className="history-head">
        <h4>{unit.title}</h4>
        {!!uid && !!entry?.attempts && <DetailToggle open={detail.open} toggle={detail.toggle} label={unit.title} />}
      </div>
      <p>
        <span className={`history-pill ${passed ? 'is-done' : 'is-todo'}`}>{passed ? '已達標' : '未達標'}</span>
      </p>
      {entry?.attempts ? (
        <Summary
          parts={[
            !!entry.passedAt && `首次達標：${shortTime(entry.passedAt)}`,
            `作答 ${entry.attempts} 次`,
            `最高 ${entry.best < 0 ? '—' : entry.best} 分${passed ? '' : `（門檻 ${unit.threshold}）`}`,
            !!entry.updatedAt && `最近 ${shortTime(entry.updatedAt)}`,
          ]}
        />
      ) : (
        <p className="muted">尚未作答（門檻 {unit.threshold}）</p>
      )}
      {!unit.bankVersion && <p className="muted">題庫未更新到學生端，不列入測驗完成條件。</p>}
      {detail.open && (
        <div className="history-detail">
          {detail.error ? <p className="muted">讀取失敗：{detail.error}</p> : !detail.data ? <p className="muted">讀取中…</p> : !rows.length ? <p className="muted">沒有作答紀錄。</p> : (
            <table>
              <thead><tr><th>次</th><th>時間</th><th>分數</th><th>方式</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{offset + i + 1}</td>
                    <td>{rowTime(r.clientAt)}</td>
                    <td className={r.firstPass ? 'history-ok' : undefined}>{r.score}{r.firstPass && ' ✓ 達標'}</td>
                    <td>{attemptKind(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {detail.data?.truncated && <p className="muted">只列最近 {detail.data.rows.length} 次。</p>}
        </div>
      )}
    </section>
  );
}
interface SessionRow { startedAt: number; lastAt: number; completedAt?: number; maxLevel?: number; estimated?: true }
export function ActivityHistory({ api, courseId, uid, chapterName, activity, done, updatedAt, position, history, legacyUnitId }: {
  api: API; courseId: string; uid?: string | null; chapterName: string; activity: Activity; done: boolean; updatedAt?: number; position: number;
  history?: { opens: number; completions: number; firstCompletedAt?: number; lastAt?: number; estimated?: true };
  legacyUnitId?: string;
}) {
  const interactive = activity.type === 'html' && activity.tracking === 'interactive';
  const recorded = interactive && recordedMaterial(activity.materialVersion);
  const detail = useDetail(() =>
    api.call<{ found: boolean; sessions: SessionRow[]; nodeTotal?: number }>('getActivitySessions', {
      courseId, uid, chapterName, activityId: activity.id, ...(legacyUnitId ? { unitId: legacyUnitId } : {}),
    }),
  );
  const pill = <span className={`history-pill ${done ? 'is-done' : 'is-todo'}`}>{done ? '已完成' : '未完成'}</span>;
  const progressText = !done && activity.type === 'html' && position > 0 ? `節點 ${position}${activity.nodeTotal ? `／${activity.nodeTotal}` : ''}` : '';
  return (
    <section>
      <div className="history-head">
        <h4>
          {activity.title || activity.id}
          {activity.type === 'youtube' && <small className="muted">（YouTube）</small>}
        </h4>
        {recorded && !!uid && !!history?.opens && <DetailToggle open={detail.open} toggle={detail.toggle} label={activity.title || activity.id} />}
      </div>
      {!interactive ? (
        <p>
          {done ? '已完成' : '未完成'}
          {done && !!updatedAt && `｜紀錄時間：${fullTime(updatedAt)}`}
        </p>
      ) : !recorded ? (
        <>
          <p>{pill}</p>
          <p className="muted">次數與時間：上線前未記錄{progressText && `｜進度：${progressText}`}</p>
        </>
      ) : (
        <>
          <p>{pill}</p>
          {history?.opens ? (
            <Summary
              parts={[
                !!history.firstCompletedAt && `首次完成：${shortTime(history.firstCompletedAt)}`,
                `開啟 ${history.opens} 次${history.estimated ? '（含推估）' : ''}`,
                `走完 ${history.completions} 次`,
                !!history.lastAt && `最近 ${shortTime(history.lastAt)}`,
                progressText,
              ]}
            />
          ) : (
            <p className="muted">{done || position > 0 ? '次數尚未補登' : '尚未開啟'}{progressText && `｜進度：${progressText}`}</p>
          )}
        </>
      )}
      {detail.open && (
        <div className="history-detail">
          {detail.error ? <p className="muted">讀取失敗：{detail.error}</p> : !detail.data ? <p className="muted">讀取中…</p> : !detail.data.sessions.length ? <p className="muted">上線前未記錄。</p> : (
            <table>
              <thead><tr><th>次</th><th>開始</th><th>結果</th></tr></thead>
              <tbody>
                {detail.data.sessions.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{rowTime(r.startedAt)}{r.estimated && <small className="history-est">推估</small>}</td>
                    <td className={r.completedAt ? 'history-ok' : undefined}>
                      {r.completedAt ? `走完 ${clock(r.completedAt)}` : r.maxLevel ? `停在第 ${r.maxLevel} 關` : '已開始'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!!detail.data?.sessions.length && detail.data.sessions.length >= 50 && <p className="muted">只保留最近 50 次。</p>}
        </div>
      )}
    </section>
  );
}

function BoardDialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const origin = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'Tab') {
        const controls = [
          ...(panel.current?.querySelectorAll<HTMLElement>(
            'button,a,input,select,[tabindex="0"]',
          ) || []),
        ];
        if (!controls.length) return;
        const first = controls[0],
          last = controls.at(-1)!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      origin?.focus();
    };
  }, []);
  return (
    <div
      className="modalshade completion-shade"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={panel}
        className="modal completion-popover"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sectionhead">
          <h2>{title}</h2>
          <button onClick={close}>關閉</button>
        </div>
        {children}
      </section>
    </div>
  );
}
export default function CompletionBoard({
  course,
  api,
  notify,
  renderStudentDetail,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
  renderStudentDetail: (course: Course, student: CompletionStudent, close: () => void) => ReactNode;
}) {
  const [cache, setCache] = useState<Record<string, ClassCache>>({}),
    [cl, setCl] = useState<string | null>(null);
  const [published, setPublished] = useState(course),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState('');
  const [search, setSearch] = useState(''),
    [sort, setSort] = useState('studentId'),
    [onlyOverdue, setOnlyOverdue] = useState(false);
  const [student, setStudent] = useState<CompletionStudent | null>(null),
    [cell, setCell] = useState<{ student: CompletionStudent; name: string } | null>(null);
  const [due, setDue] = useState<{ name: string; classId: string; date: string } | null>(null);
  const [statuses, setStatuses] = useState<ChapterCellStatus[]>(
      () => readBoardPreferences(() => window.localStorage).statuses,
    ),
    // 遮名預設開啟且不記憶：重新整理或下次開啟一律回到遮名。
    [showNames, setShowNames] = useState(false);
  const displayName = (name: string) => (showNames ? name : projectionName(name)),
    displayId = (id: string) => (showNames ? id : maskStudentId(id));
  function toggleStatus(status: ChapterCellStatus, on: boolean) {
    const next = boardStatuses.filter((s) => (s === status ? on : statuses.includes(s)));
    if (!next.length) return;
    setStatuses(next);
    saveBoardPreferences(() => window.localStorage, { statuses: next });
  }
  const allStatuses = boardStatuses.every((s) => statuses.includes(s)),
    statusText = statuses.map((s) => chapterStateLabels[s]).join('、');
  const request = useRef(0),
    active = useRef(false);
  useEffect(() => {
    request.current++;
    active.current = false;
    setCache({});
    setCl(null);
    setPublished(course);
    setBusy(false);
    setLoading('');
    setStudent(null);
    setCell(null);
    setDue(null);
    setSearch('');
    setOnlyOverdue(false);
    setShowNames(false);
    return () => {
      request.current++;
      active.current = false;
    };
  }, [course.id]);
  async function load(classes: string[]) {
    if (active.current) return;
    active.current = true;
    const generation = ++request.current;
    setBusy(true);
    setCell(null);
    setDue(null);
    setStudent(null);
    try {
      for (const classId of classes) {
        const result = await loadCompletionClass(api, course.id, classId, (n) => {
          if (generation === request.current)
            setLoading(`載入中：${course.classNames?.[classId] || classId} ${n} 人`);
        });
        if (generation !== request.current) return;
        setPublished(result.course);
        setCache((current) => ({
          ...Object.fromEntries(
            Object.entries(current).filter(
              ([, v]) => JSON.stringify(v.course) === JSON.stringify(result.course),
            ),
          ),
          [classId]: result,
        }));
      }
    } catch (e) {
      if (generation === request.current) notify((e as Error).message);
    } finally {
      if (generation === request.current) {
        active.current = false;
        setBusy(false);
        setLoading('');
      }
    }
  }
  const now = Date.now(),
    comparisonChapters = orderedChapters(published);
  const summaries = published.classIds
    .filter((id) => cache[id])
    .map((id) => filteredClassCompletionSummary(cache[id].course, id, cache[id].rows, statuses, now));
  const allLoaded = published.classIds.length > 0 && published.classIds.every((id) => !!cache[id]);
  const total = allClassCompletionSummary(summaries);
  const selected = cl ? cache[cl] : undefined,
    visible = forClass(selected?.course || published, cl || ''),
    boardCourse = completionBoardCourse(selected?.course || published, cl || '');
  const classSummary =
    cl && selected
      ? filteredClassCompletionSummary(selected.course, cl, selected.rows, statuses, now)
      : undefined;
  const searched = (selected?.rows || []).filter((r) =>
    `${r.name} ${r.studentId}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const matrix = statusMatrix(boardCourse, searched, statuses, now, onlyOverdue),
    chapters = matrix.chapters;
  const fraction = (row: (typeof matrix.rows)[number]) =>
    allStatuses ? completion(boardCourse, row.student.progress) : { done: row.done, total: row.total };
  const filtered = [...matrix.rows].sort((a, b) => {
    const byId = a.student.studentId.localeCompare(b.student.studentId, 'zh-TW', { numeric: true });
    return sort === 'done'
      ? fraction(a).done - fraction(b).done || byId
      : sort === 'overdue'
        ? b.overdue - a.overdue || byId
        : byId;
  });
  const columnDue = (name: string) => {
    const values = published.classIds
      .map(
        (id) =>
          orderedChapters(forClass(published, id)).find((x) => x.name === name)?.chapter.dueAt,
      )
      .filter((d): d is string => d !== undefined);
    return new Set(values).size > 1 ? '各班不同' : shortDue(values[0] || '');
  };
  // CSV 不受狀態篩選影響，一律以完整名冊計算。
  const comparisonCsv = () => {
    const full = published.classIds
      .filter((id) => cache[id])
      .map((id) => classCompletionSummary(cache[id].course, id, cache[id].rows, now));
    return [allClassCompletionSummary(full), ...full].map((s) => ({
      班級: s.classId === '全部班級' ? '全部班級' : published.classNames?.[s.classId] || s.classId,
      人數: s.count,
      全部完成: s.allDone,
      有逾期: s.overdue,
      平均完成:
        s.averageDone == null ? '—' : `${s.averageDone.toFixed(1)}/${s.requiredTotal?.toFixed(1)}`,
      ...Object.fromEntries(
        comparisonChapters.map(({ name, chapter }) => [
          chapter.title || name,
          s.rates[name] ? (s.rates[name].required ? '' : '選看 ') + rateText(s.rates[name]) : '—',
        ]),
      ),
    }));
  };
  const boardFilters = (
    <div className="toolbar completion-toolbar completion-status-filter">
      <fieldset>
        <legend>顯示狀態</legend>
        {boardStatuses.map((status) => (
          <label key={status} className="completion-filter">
            <input
              type="checkbox"
              checked={statuses.includes(status)}
              disabled={statuses.length === 1 && statuses.includes(status)}
              onChange={(e) => toggleStatus(status, e.target.checked)}
            />
            {symbols[status]} {chapterStateLabels[status]}
          </label>
        ))}
      </fieldset>
      <label className="completion-filter">
        <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
        顯示姓名
      </label>
    </div>
  );
  function cellDetail(student: CompletionStudent, name: string) {
    const chapter = chapters.find((c) => c.name === name)?.chapter,
      { categories, activities } = chapterDetailItems(boardCourse, name, student.progress),
      shownCategories = categories.filter((x) => detailItemVisible(x.done, statuses)),
      shownActivities = activities.filter((x) => detailItemVisible(x.done, statuses)),
      passed = categories.filter((x) => x.done).length,
      completed = activities.filter((x) => x.done).length,
      allDone = categories.every((x) => x.done || !x.unit.bankVersion) && completed === activities.length;
    const hiddenNote = (n: number, what: string) =>
      n > 0 && <p className="muted">依篩選隱藏 {n} 項{what}。</p>;
    return (
      <>
        <p>狀態：{chapterCellLabel(chapterCellState(boardCourse, name, student.progress, now))}</p>
        <p>期限：{chapter?.dueAt ? fullTime(parseCourseTime(chapter.dueAt)) : '無期限'}</p>
        {!allStatuses && allDone && !statuses.includes('done') && <p>本章已全部完成。</p>}
        <h3>
          題目分類（已達標 {passed}／{categories.length}）
        </h3>
        <div className="completion-category-list">
          {shownCategories.map(({ unit: u, entry: p }) => (
            <CategoryHistory key={u.id} api={api} courseId={course.id} uid={student.uid} unit={u} entry={p} />
          ))}
        </div>
        {hiddenNote(categories.length - shownCategories.length, '題目分類')}
        <h3>
          必做活動（已完成 {completed}／{activities.length}）
        </h3>
        {!activities.length ? (
          <p className="muted">本章沒有必做活動。</p>
        ) : (
          <div className="completion-category-list">
            {shownActivities.map(({ activity, done, updatedAt, position, history, legacyUnitId }) => (
              <ActivityHistory key={activity.id} api={api} courseId={course.id} uid={student.uid} chapterName={name}
                activity={activity} done={done} updatedAt={updatedAt} position={position} history={history} legacyUnitId={legacyUnitId} />
            ))}
          </div>
        )}
        {hiddenNote(activities.length - shownActivities.length, '必做活動')}
      </>
    );
  }
  function enter(classId: string) {
    setCl(classId);
    setSearch('');
    setSort('studentId');
    setOnlyOverdue(false);
    setCell(null);
    setStudent(null);
  }
  function summaryRow(classId: string, all = false) {
    const s = all ? (allLoaded ? total : undefined) : summaries.find((s) => s.classId === classId),
      loaded = all ? allLoaded : !!cache[classId];
    return (
      <tr
        key={classId}
        className={all ? 'completion-total' : 'completion-classrow'}
        onClick={all ? undefined : () => enter(classId)}
      >
        <th scope="row" className="completion-identity">
          {all ? (
            '全部班級'
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                enter(classId);
              }}
            >
              {published.classNames?.[classId] || classId}
            </button>
          )}
        </th>
        <td>
          {s == null
            ? '—'
            : allStatuses
              ? s.count
              : `${all ? summaries.reduce((n, x) => n + x.matched, 0) : (summaries.find((x) => x.classId === classId)?.matched ?? 0)}／${s.count}`}
        </td>
        <td>{s?.allDone ?? '—'}</td>
        <td>{s?.overdue ?? '—'}</td>
        <td>
          {s?.averageDone == null
            ? '—'
            : `${s.averageDone.toFixed(1)}／${Number(s.requiredTotal?.toFixed(1))}`}
        </td>
        {comparisonChapters.map(({ name }) => {
          const rate = s?.rates[name];
          return (
            <td key={name} style={rateStyle(rate)}>
              {!loaded ? (
                '未載入'
              ) : !rate ? (
                '—'
              ) : (
                <button
                  className={'completion-rate ' + (!rate.required ? 'completion-optional' : '')}
                  aria-label={`${classId} ${name} ${rateText(rate)} 期限`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDue({ name, classId, date: rate.dueAt });
                  }}
                  title={`期限：${rate.dueAt === '各班不同' ? '各班不同' : rate.dueAt ? fullTime(parseCourseTime(rate.dueAt)) : '無期限'}`}
                >
                  {!rate.required && <small>選看 </small>}
                  {rateText(rate)}
                </button>
              )}
            </td>
          );
        })}
      </tr>
    );
  }
  return (
    <div className="completion-board">
      <header className="pageheading">
        <div>
          <span className="eyebrow">LEARNING PROGRESS</span>
          <h1>完成度看板</h1>
          <p>按更新讀取學生端課程與學生進度；包含尚未登入的名冊學生。</p>
        </div>
      </header>
      <section className="panel">
        <CompletionDailyPanel api={api} course={published} />
      {!cl ? (
          <>
            <div className="sectionhead">
              <h2>各班比較</h2>
            </div>
            <div className="toolbar completion-toolbar">
              <button
                disabled={busy || !course.classIds.length}
                onClick={() => load(course.classIds)}
              >
                <RefreshCw size={16} />
                更新全部班級
              </button>
              <small className="muted">會讀取全部學生的進度</small>
              <button
                disabled={busy || !allLoaded}
                onClick={() => downloadCsv('各班比較.csv', comparisonCsv())}
              >
                <Download size={16} />
                匯出各班比較 CSV
              </button>
            </div>
            {boardFilters}
            <p className="muted">
              {allLoaded
                ? '平均完成為每人已完成／應完成單元數；各班應完成數不同時，全部班級顯示人數加權的平均。'
                : `已載入 ${summaries.length}／${published.classIds.length} 班；全部讀完才顯示加總。`}
              {!allStatuses && ` 目前依狀態篩選（${statusText}）：人數欄為「符合篩選人數／全班人數」，各章比率為符合篩選的人數占全班比例；全部完成與平均完成仍以完整名冊計算。`}
            </p>
            <div className="tablewrap completion-tablewrap">
              <table aria-label="各班完成度比較">
                <thead>
                  <tr>
                    <th className="completion-identity">班級</th>
                    <th>人數</th>
                    <th>全部完成</th>
                    <th>有逾期</th>
                    <th>平均完成</th>
                    {comparisonChapters.map(({ name, chapter }) => (
                      <th key={name}>
                        {chapter.title || name}
                        <small className="block">{columnDue(name)}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryRow('全部班級', true)}
                  {published.classIds.map((id) => summaryRow(id))}
                </tbody>
              </table>
            </div>
            {!published.classIds.length && <p>課程尚無班級。</p>}
          </>
        ) : (
          <>
            <div className="toolbar completion-toolbar">
              <button
                disabled={busy}
                onClick={() => {
                  setCl(null);
                  setStudent(null);
                  setCell(null);
                }}
              >
                <ArrowLeft size={16} />
                各班比較
              </button>
              <h2>
                {published.classNames?.[cl] || cl}（{selected?.rows.length ?? '尚未載入'}
                {selected ? ' 人' : ''}）
              </h2>
              <button disabled={busy} onClick={() => load([cl])}>
                <RefreshCw size={16} />
                更新
              </button>
              <button
                disabled={busy || !selected}
                onClick={() =>
                  downloadCsv(
                    `${cl}完成度.csv`,
                    // CSV 不受狀態篩選影響：沿用搜尋與「只看有逾期」，全部章節、全部狀態。
                    matrixCsv(
                      selected!.course,
                      cl,
                      statusMatrix(boardCourse, searched, boardStatuses, now, onlyOverdue).rows.map(
                        (row) => row.student,
                      ),
                      now,
                    ),
                  )
                }
              >
                <Download size={16} />
                匯出 CSV
              </button>
            </div>
            <div className="toolbar completion-toolbar">
              <input
                aria-label="搜尋學生"
                placeholder="搜尋姓名／學號"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label>
                排序：
                <select aria-label="排序" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="studentId">學號</option>
                  <option value="done">完成數少→多</option>
                  <option value="overdue">逾期數多→少</option>
                </select>
              </label>
              <label className="completion-filter">
                <input
                  type="checkbox"
                  checked={onlyOverdue}
                  onChange={(e) => setOnlyOverdue(e.target.checked)}
                />
                只看有逾期
              </label>
            </div>
            {boardFilters}
            <p className="completion-legend">
              <span>● 完成</span>
              <span>◐ 進行中</span>
              <span>○ 未開始</span>
              <span>⊘ 未開放</span>
              <span className="completion-overdue-label">逾：逾期未完成</span>
              <span className="muted">● 逾：逾期完成</span>
              {!allStatuses && <span>空白：依篩選隱藏</span>}
            </p>
            {!selected ? (
              <p>按「更新」載入此班全部學生。</p>
            ) : (
              <>
                <div className="tablewrap completion-tablewrap">
                  <table aria-label={`${cl}學生單元矩陣`}>
                    <thead>
                      <tr>
                        <th className="completion-identity">姓名／學號</th>
                        {chapters.map(({ name, chapter }) => (
                          <th key={name}>
                            {chapter.title || name}
                            {!chapter.required && <small className="block">選看</small>}
                            <small className="block" title={chapter.dueAt}>
                              {shortDue(chapter.dueAt)}
                            </small>
                          </th>
                        ))}
                        <th>完成度</th>
                        <th>紀錄</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="completion-total">
                        <th className="completion-identity">
                          全班完成率
                          {!allStatuses && <small className="block">篩選：{statusText}</small>}
                        </th>
                        {chapters.map(({ name }) => (
                          <td key={name} style={rateStyle(classSummary?.rates[name])}>
                            {rateText(classSummary?.rates[name])}
                          </td>
                        ))}
                        <td>—</td>
                        <td>—</td>
                      </tr>
                      {filtered.map((row) => {
                        const r = row.student,
                          n = fraction(row);
                        return (
                          <tr key={r.email || r.studentId}>
                            <th scope="row" className="completion-identity">
                              <span className="completion-board-name">
                                {displayName(r.name)}
                                {!r.enabled && <small className="muted"> 停用</small>}
                              </span>
                              <small className="block">{displayId(r.studentId)}</small>
                            </th>
                            {chapters.map(({ name, chapter }) => {
                              const state = row.cells.get(name);
                              if (!state) return <td key={name} className="completion-hidden-cell" />;
                              const label = chapterCellLabel(state);
                              return (
                                <td key={name}>
                                  <button
                                    className={`completion-cell state-${state.state}${state.overdue ? ' is-overdue' : ''}${!chapter.required ? ' completion-optional' : ''}`}
                                    aria-label={`${displayName(r.name)} ${chapter.title || name}：${label}`}
                                    title={label}
                                    onClick={() => setCell({ student: r, name })}
                                  >
                                    <span aria-hidden="true">{symbols[state.state]}</span>
                                    {state.overdue && <small>逾</small>}
                                    {state.lateDone && <small className="muted">逾</small>}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="completion-fraction">
                              {n.done}／{n.total}
                            </td>
                            <td>
                              <button className="completion-view" onClick={() => setStudent(r)}>
                                查看
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="muted">
                  更新時間：{fullTime(selected.loadedAt)}。顯示 {filtered.length}／
                  {selected.rows.length} 人。
                  {!allStatuses && `依狀態篩選（${statusText}）：顯示 ${filtered.length} 位學生、${chapters.length} 個章節。`}
                  全班完成率以完整名冊計算，不隨搜尋改變。
                </p>
                {!filtered.length && (
                  <p>{selected.rows.length ? '沒有符合篩選條件的學生。' : '此班名冊沒有學生。'}</p>
                )}
              </>
            )}
          </>
        )}
        {loading && <p role="status">{loading}</p>}
      </section>
      {cell && (
        <BoardDialog
          title={`${displayName(cell.student.name)} · ${chapters.find((c) => c.name === cell.name)?.chapter.title || cell.name}`}
          close={() => setCell(null)}
        >
          {cellDetail(cell.student, cell.name)}
        </BoardDialog>
      )}
      {due && (
        <BoardDialog
          title={`${due.classId === '全部班級' ? '全部班級' : published.classNames?.[due.classId] || due.classId} · ${due.name}期限`}
          close={() => setDue(null)}
        >
          {due.date === '各班不同' ? (
            <ul>
              {published.classIds
                .filter((id) => cache[id])
                .map((id) => {
                  const date = classCompletionSummary(cache[id].course, id, cache[id].rows, now)
                    .rates[due.name]?.dueAt;
                  return (
                    <li key={id}>
                      {published.classNames?.[id] || id}：
                      {date ? fullTime(parseCourseTime(date)) : '無期限／未開放此單元'}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p>{due.date ? fullTime(parseCourseTime(due.date)) : '無期限'}</p>
          )}
        </BoardDialog>
      )}
      {cl && selected && <ClassUsagePanel key={`usage:${cl}:${selected.loadedAt}`} courseId={course.id} api={api} classId={cl} maskNames={!showNames} />}
      {cl && selected && <AnswerIntegrityOverview key={`${cl}:${selected.loadedAt}`} course={visible} api={api} classId={cl} maskNames={!showNames} />}
      {student && selected && renderStudentDetail(visible, student, () => setStudent(null))}
    </div>
  );
}
