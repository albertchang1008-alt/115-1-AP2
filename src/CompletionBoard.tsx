import { ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import {
  Course,
  chapterCompletion,
  chapterName,
  completion,
  emptyProgress,
  forClass,
  orderedChapters,
  parseCourseTime,
} from '../shared/model';
import {
  CompletionStudent,
  ChapterRate,
  allClassCompletionSummary,
  chapterCellLabel,
  chapterCellState,
  classCompletionSummary,
  matrixChapters,
  matrixCsv,
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
    if (!page.course) throw Error('完成度回應缺少已發布課程，請重新更新。');
    if (published && JSON.stringify(page.course) !== JSON.stringify(published))
      throw Error('載入期間課程已重新發布，請重新更新。');
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
    .map((id) => classCompletionSummary(cache[id].course, id, cache[id].rows, now));
  const allLoaded = published.classIds.length > 0 && published.classIds.every((id) => !!cache[id]);
  const total = allClassCompletionSummary(summaries);
  const selected = cl ? cache[cl] : undefined,
    visible = forClass(selected?.course || published, cl || ''),
    chapters = matrixChapters(visible);
  const classSummary =
    cl && selected ? classCompletionSummary(selected.course, cl, selected.rows, now) : undefined;
  const overdueCount = (r: CompletionStudent) =>
    chapters.filter(({ name }) => chapterCellState(visible, name, r.progress, now).overdue).length;
  const filtered = (selected?.rows || [])
    .filter(
      (r) =>
        `${r.name} ${r.studentId}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()) &&
        (!onlyOverdue || overdueCount(r) > 0),
    )
    .sort((a, b) => {
      const byId = a.studentId.localeCompare(b.studentId, 'zh-TW', { numeric: true });
      return sort === 'done'
        ? completion(visible, a.progress).done - completion(visible, b.progress).done || byId
        : sort === 'overdue'
          ? overdueCount(b) - overdueCount(a) || byId
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
  const comparisonCsv = () =>
    [total, ...summaries].map((s) => ({
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
        <td>{s?.count ?? '—'}</td>
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
          <p>按更新讀取已發布課程與學生進度；包含尚未登入的名冊學生。</p>
        </div>
      </header>
      <section className="panel">
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
            <p className="muted">
              {allLoaded
                ? '平均完成為每人已完成／應完成單元數；各班應完成數不同時，全部班級顯示人數加權的平均。'
                : `已載入 ${summaries.length}／${published.classIds.length} 班；全部讀完才顯示加總。`}
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
                  downloadCsv(`${cl}完成度.csv`, matrixCsv(selected!.course, cl, filtered, now))
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
            <p className="completion-legend">
              <span>● 完成</span>
              <span>◐ 進行中</span>
              <span>○ 未開始</span>
              <span>⊘ 未開放</span>
              <span className="completion-overdue-label">逾：逾期未完成</span>
              <span className="muted">● 逾：逾期完成</span>
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
                        <th className="completion-identity">全班完成率</th>
                        {chapters.map(({ name }) => (
                          <td key={name} style={rateStyle(classSummary?.rates[name])}>
                            {rateText(classSummary?.rates[name])}
                          </td>
                        ))}
                        <td>—</td>
                        <td>—</td>
                      </tr>
                      {filtered.map((r) => {
                        const n = completion(visible, r.progress);
                        return (
                          <tr key={r.email || r.studentId}>
                            <th scope="row" className="completion-identity">
                              <span className="completion-board-name">
                                {r.name}
                                {!r.enabled && <small className="muted"> 停用</small>}
                              </span>
                              <small className="block">{r.studentId}</small>
                            </th>
                            {chapters.map(({ name, chapter }) => {
                              const state = chapterCellState(visible, name, r.progress, now),
                                label = chapterCellLabel(state);
                              return (
                                <td key={name}>
                                  <button
                                    className={`completion-cell state-${state.state}${state.overdue ? ' is-overdue' : ''}${!chapter.required ? ' completion-optional' : ''}`}
                                    aria-label={`${r.name} ${chapter.title || name}：${label}`}
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
                  {selected.rows.length} 人。全班完成率以完整名冊計算，不隨搜尋改變。
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
          title={`${cell.student.name} · ${chapters.find((c) => c.name === cell.name)?.chapter.title || cell.name}`}
          close={() => setCell(null)}
        >
          <p>
            狀態：
            {chapterCellLabel(chapterCellState(visible, cell.name, cell.student.progress, now))}
          </p>
          <p>
            期限：
            {chapters.find((c) => c.name === cell.name)?.chapter.dueAt
              ? fullTime(parseCourseTime(chapters.find((c) => c.name === cell.name)!.chapter.dueAt))
              : '無期限'}
          </p>
          <h3>題目分類</h3>
          <div className="completion-category-list">
            {visible.units
              .filter((u) => chapterName(u) === cell.name)
              .map((u) => {
                const p = cell.student.progress.units[u.id];
                return (
                  <section key={u.id}>
                    <h4>{u.title}</h4>
                    <p>
                      最高分 {p?.best == null || p.best < 0 ? '尚無' : p.best}／門檻 {u.threshold}
                      ｜作答 {p?.attempts || 0} 次
                    </p>
                    {!u.bankVersion && <p className="muted">題庫未發布，不列入測驗完成條件。</p>}
                    {!!p?.passedAt && <p>首次達標：{fullTime(p.passedAt)}</p>}
                  </section>
                );
              })}
          </div>
          <p>
            必做活動：已完成{' '}
            {chapterCompletion(visible, cell.name, cell.student.progress).completedActivities}／
            {chapterCompletion(visible, cell.name, cell.student.progress).totalRequired -
              visible.units.filter((u) => chapterName(u) === cell.name && !!u.bankVersion).length}
          </p>
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
      {student && selected && renderStudentDetail(visible, student, () => setStudent(null))}
    </div>
  );
}
