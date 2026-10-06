import { useEffect, useRef, useState } from 'react';
import { Course, Progress, orderedChapters, shuffle } from '../shared/model';
import {
  PracticeMode,
  PracticeRow,
  mixedScope,
  mixedCandidates,
  selectPracticeRows,
} from '../shared/practice';
import { API, cachedBank } from './service';
import { Flashcards, PracticeSession, ReviewChoices } from './PracticeModes';
export function scopeKey(courseId: string, uid: string) {
  return `practice-scope:${courseId}:${uid}`;
}
export function readExclusions(courseId: string, uid: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(scopeKey(courseId, uid)) || '[]');
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}
function ScopeCheckbox({
  partial,
  ...props
}: {
  partial: boolean;
  checked: boolean;
  onChange: () => void;
  'aria-label': string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = partial;
  }, [partial]);
  return (
    <input ref={ref} type="checkbox" aria-checked={partial ? 'mixed' : props.checked} {...props} />
  );
}
export function MixedScopeCard({
  course,
  progress,
  uid,
  onStart,
}: {
  course: Course;
  progress: Progress;
  uid: string;
  onStart: (mode: PracticeMode, n: number, ids: string[]) => void;
}) {
  const [excluded, setExcluded] = useState(() => readExclusions(course.id, uid)),
    [expanded, setExpanded] = useState<string[]>([]),
    [now] = useState(Date.now);
  const scope = mixedScope(course.units, progress, excluded, now);
  const order = orderedChapters(course).map((row) => row.name);
  const groups = [...scope.groups].sort(
    (a, b) =>
      (order.indexOf(a.name) < 0 ? Infinity : order.indexOf(a.name)) -
      (order.indexOf(b.name) < 0 ? Infinity : order.indexOf(b.name)),
  );
  function save(ids: string[]) {
    setExcluded(ids);
    try {
      localStorage.setItem(scopeKey(course.id, uid), JSON.stringify(ids));
    } catch {}
  }
  function toggle(ids: string[], selected: boolean) {
    const next = new Set(scope.excluded);
    for (const id of ids)
      if (selected) next.add(id);
      else next.delete(id);
    save([...next]);
  }
  function begin(mode: PracticeMode, n: number) {
    onStart(
      mode,
      n,
      scope.selected.map((u) => u.id),
    );
  }
  const disabled = scope.count === 0;
  return (
    <section className="panel mixed-scope-card">
      <h2>綜合練習</h2>
      <p>只練習目前學習的分類，不影響最高成績與完成度。</p>
      <fieldset className="mixed-scope">
        <legend>練習範圍</legend>
        <div className="scope-summary">
          <span aria-live="polite">
            已選 {scope.count} 個分類・共 {scope.total} 題（待複習 {scope.due}、今天剛錯{' '}
            {scope.today}、未作答 {scope.unseen}）
          </span>
          <div>
            <button onClick={() => save([])}>全選</button>
            <button onClick={() => save(scope.rows.map((r) => r.unit.id))}>全不選</button>
          </div>
        </div>
        {groups.map((group) => (
          <div key={group.name}>
            <div className="scope-group">
              <label>
                <ScopeCheckbox
                  partial={group.partial}
                  checked={group.checked}
                  aria-label={`選取${group.name}單元`}
                  onChange={() =>
                    toggle(
                      group.rows.map((r) => r.unit.id),
                      group.checked,
                    )
                  }
                />
                <strong>{group.name}</strong>
                <span>
                  已選 {group.selected} / {group.total} 個分類
                </span>
              </label>
              <button
                aria-label={`展開${group.name}`}
                aria-expanded={expanded.includes(group.name)}
                aria-controls={`scope-${encodeURIComponent(group.name)}`}
                onClick={() =>
                  setExpanded(
                    expanded.includes(group.name)
                      ? expanded.filter((n) => n !== group.name)
                      : [...expanded, group.name],
                  )
                }
              >
                {expanded.includes(group.name) ? '▴' : '▾'}
              </button>
            </div>
            {expanded.includes(group.name) && (
              <div id={`scope-${encodeURIComponent(group.name)}`}>
                {group.rows.map((row) => (
                  <label className="scope-category" key={row.unit.id}>
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggle([row.unit.id], row.selected)}
                    />
                    <span>
                      {row.unit.title}
                      <small>
                        {row.total} 題・錯題 {row.wrong}・未作答 {row.unseen}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </fieldset>
      {disabled && <p role="status">請至少勾選一個分類</p>}
      <p>練習・不計分</p>
      <div className="mixed-practice-buttons">
        <div>
          <strong>閃卡</strong>
          {(scope.total > 0 && scope.total < 10 ? [scope.total] : [10, 20, 30]).map((n) => (
            <button
              key={n}
              disabled={disabled || n > scope.total}
              onClick={() => begin('flashcard', n)}
            >
              {scope.total > 0 && scope.total < 10 ? `全部 ${n} 張` : `${n} 張`}
            </button>
          ))}
        </div>
        <div>
          <strong>抽題</strong>
          {(scope.total > 0 && scope.total < 10 ? [scope.total] : [10, 20, 30, 50]).map((n) => (
            <button key={n} disabled={disabled || n > scope.total} onClick={() => begin('quiz', n)}>
              {scope.total > 0 && scope.total < 10 ? `全部 ${n} 題` : `${n} 題`}
            </button>
          ))}
        </div>
        <div>
          <strong>錯題複習（待複習 {scope.due} 題）</strong>
          {scope.due > 0 ? (
            <ReviewChoices
              count={scope.due}
              disabled={disabled}
              onChoose={(n) => begin('review', n)}
            />
          ) : (
            <button
              className="practice-wrong empty"
              disabled={disabled}
              onClick={() => begin('review', 0)}
            >
              錯題複習（0 題）
            </button>
          )}
        </div>
      </div>
      {scope.today > 0 && <p>另有 {scope.today} 題今天剛錯，明天起可重做</p>}
    </section>
  );
}
export function MixedPractice({
  api,
  course,
  progress,
  uid,
  mode,
  count,
  selectedIds,
  onBack,
  onProgress,
}: {
  api: API;
  course: Course;
  progress: Progress;
  uid: string;
  mode: PracticeMode;
  count: number;
  selectedIds: string[] | null;
  onBack: () => void;
  onProgress: (p: Progress) => void;
}) {
  const [activeMode, setActiveMode] = useState(mode),
    [initialProgress] = useState(progress),
    [now] = useState(Date.now),
    [rows, setRows] = useState<PracticeRow[] | null>(null),
    [error, setError] = useState(''),
    [todayFlash, setTodayFlash] = useState(false);
  const [selected] = useState(() =>
    selectedIds
      ? mixedCandidates(course.units).filter((u) => selectedIds.includes(u.id))
      : mixedScope(course.units, progress, readExclusions(course.id, uid), now).selected,
  );
  const scope = mixedScope(selected, initialProgress, [], now);
  async function load(asTodayFlash = false) {
    setError('');
    try {
      const all = (
        await Promise.all(
          selected.map(async (unit) =>
            (await cachedBank(api, course.id, unit.id, unit.bankVersion)).map((q) => ({ q, unit })),
          ),
        )
      ).flat();
      let picked = selectPracticeRows(
        all,
        initialProgress,
        asTodayFlash ? 'flashcard' : mode,
        count || scope.today,
        now,
      );
      if (asTodayFlash)
        picked = selectPracticeRows(all, initialProgress, 'flashcard', scope.today, now);
      setTodayFlash(asTodayFlash);
      setRows(picked.map((r) => ({ ...r, q: { ...r.q, options: shuffle(r.q.options) } })));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (mode !== 'review' || scope.due) void load();
  }, []);
  if (error)
    return (
      <main className="quiz">
        <p role="alert">{error}</p>
        <button onClick={() => load(todayFlash)}>重試載入</button>
        <button onClick={onBack}>返回首頁</button>
      </main>
    );
  if (mode === 'review' && !scope.due && !rows)
    return (
      <main className="quiz">
        <h1>
          {scope.today
            ? `這 ${scope.today} 題今天剛錯，先用閃卡看解析，明天再來重做`
            : '目前沒有錯題'}
        </h1>
        {scope.today > 0 && <button onClick={() => load(true)}>用閃卡看解析</button>}
        <button onClick={onBack}>返回首頁</button>
      </main>
    );
  if (!rows)
    return (
      <main className="quiz">
        <p role="status">正在載入練習題目…</p>
        <button onClick={onBack}>返回首頁</button>
      </main>
    );
  return activeMode === 'flashcard' || todayFlash ? (
    <Flashcards
      rows={rows}
      onBack={onBack}
      onPractice={() => {
        setActiveMode('quiz');
        setTodayFlash(false);
        setRows(selectPracticeRows(rows, initialProgress, 'quiz', Math.min(10, rows.length), now));
      }}
    />
  ) : (
    <PracticeSession
      api={api}
      course={course}
      rows={rows}
      mode={activeMode === 'review' ? 'review' : 'quiz'}
      mixed
      onBack={onBack}
      onProgress={onProgress}
    />
  );
}
