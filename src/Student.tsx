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
  Settings2,
  X,
} from 'lucide-react';
import {
  Course,
  Unit,
  Question,
  Progress,
  Mode,
  Attempt,
  ExplanationResearchEvent,
  emptyProgress,
  completion,
  complete,
  unitCompletion,
  unitVisibility,
  phases,
  modes,
  grade,
  shuffle,
  orderForPractice,
  wrongEntries,
  wrongCardIds,
  Chapter,
  chaptersOf,
  orderedChapters,
  chapterName,
  chapterCompletion,
  chapterActivityKey,
} from '../shared/model';
import { API, cachedBank, enqueue, dequeue, pending } from './service';
import { Youtube, HtmlMaterial } from './Player';
import { parseStudentRoute } from './studentRoute';
import ThemePicker from './ThemePicker';
import FontSizePicker from './FontSizePicker';
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
    [archiveOpen, setArchiveOpen] = useState(false),
    [outstandingAll, setOutstandingAll] = useState(false),
    [exitRequested, setExitRequested] = useState(false),
    [tab, setTab] = useState<'pre' | 'class' | 'post' | 'practice'>('pre'),
    [queueCount, setQueueCount] = useState(preview ? 0 : pending(uid).length);
  const pRef = useRef(progress);
  const takingRef = useRef(taking);
  pRef.current = progress;
  takingRef.current = taking;
  const unit = course.units.find((u) => u.id === unitId);
  const selectedChapterName = unit ? chapterName(unit) : '';
  const chapter = selectedChapterName ? chaptersOf(course)[selectedChapterName] : undefined;
  const chapterUnits = selectedChapterName ? course.units.filter((u) => chapterName(u) === selectedChapterName) : [];
  const activity = chapter?.activities.find((a) => a.id === activityId);
  const ratio = completion(course, progress);
  const currentUnits = course.units.filter((u) => unitVisibility(u) === 'current');
  const archivedUnits = course.units.filter((u) => unitVisibility(u) === 'archived');
  const currentChapters = orderedChapters(course).filter(({ units }) => units.some((u) => unitVisibility(u) === 'current'));
  const archivedChapters = orderedChapters(course).filter(({ units }) => units.length > 0 && units.every((u) => unitVisibility(u) === 'archived'));
  const route = (path = '') => {
    if (preview) {
      if (!path) { setUnitId(''); setActivityId(''); setTaking(false); return; }
      const parsed = parseStudentRoute(`#/course/${encodeURIComponent(course.id)}${path}`, course.id);
      if (!parsed) return;
      if (parsed.kind === 'mixed') { setUnitId(''); setActivityId(`__mixed_${parsed.count}`); setTaking(false); return; }
      if (parsed.kind === 'home') { setUnitId(''); setActivityId(''); setTaking(false); return; }
      const nextUnit = course.units.find((u) => u.id === parsed.unitId);
      if (!nextUnit) return;
      setUnitId(nextUnit.id);
      setActivityId(parsed.kind === 'activity' ? parsed.activityId : parsed.kind === 'wrongcards' ? '__wrongcards' : '');
      if (parsed.kind === 'unit') setTab(parsed.tab || defaultTab(chaptersOf(course)[chapterName(nextUnit)], pRef.current, `chapter:${chapterName(nextUnit)}`));
      if (!['quiz', 'flashcard'].includes(parsed.kind)) setTaking(false);
      return;
    }
    location.hash = `#/course/${encodeURIComponent(course.id)}${path}`;
  };
  useEffect(() => {
    if (preview) return;
    const read = () => {
      const parsed = parseStudentRoute(location.hash, course.id);
      if (!parsed) { if (location.hash) { route(); notify('此單元目前未開放'); } return; }
      if (takingRef.current && !['quiz', 'flashcard'].includes(parsed.kind)) { setExitRequested(true); return; }
      if (parsed.kind === 'home') { setUnitId(''); setActivityId(''); setTaking(false); return; }
      if (parsed.kind === 'mixed') { setUnitId(''); setActivityId(`__mixed_${parsed.count}`); setTaking(false); return; }
      const nextUnit = parsed.unitId;
      const nextActivity = parsed.kind === 'activity' ? parsed.activityId : parsed.kind === 'wrongcards' ? '__wrongcards' : '';
      const allowed = course.units.find((u) => u.id === nextUnit);
      if (!allowed) { route(); notify('此單元目前未開放'); return; }
      setUnitId(nextUnit);
      setActivityId(nextActivity);
      if (parsed.kind === 'unit') setTab(location.hash.includes('?tab=') ? parsed.tab : defaultTab(chaptersOf(course)[chapterName(allowed)], pRef.current, `chapter:${chapterName(allowed)}`));
      if (parsed.kind === 'quiz') void start('quiz', parsed.mode === 'draw' ? parsed.count : undefined, allowed);
      else if (parsed.kind === 'flashcard') void start('flashcard', undefined, allowed);
      // 作答路由由 start() 載入題庫後開啟；不要讓 hashchange 把剛開啟的全螢幕作答關掉。
      if (!['quiz', 'flashcard'].includes(parsed.kind)) setTaking(false);
    };
    if (!location.hash) route();
    read();
    addEventListener('hashchange', read);
    return () => removeEventListener('hashchange', read);
  }, [course.id, preview]);
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
  async function start(m: Mode, practiceCount?: number, target = unit) {
    if (!target?.bankVersion) {
      notify('此單元尚未發布題庫');
      return;
    }
    setBusy(true);
    try {
      let qs = await cachedBank(api, course.id, target.id, target.bankVersion);
      if (practiceCount) {
        // 抽題練習：不計分、不計完成度。已考過的題目自然排到後面（仿 v1.9），不是每次重置重洗。
        const attemptedIds = new Set(Object.keys(progress.attempted?.[target.id] || {}));
        qs = orderForPractice(qs, attemptedIds).slice(0, Math.min(practiceCount, qs.length));
      } else {
        qs = shuffle(qs); // 完整測驗：出全部題目，只洗牌不減量
      }
      if (!qs.length) {
        notify('題庫沒有可用題目');
        return;
      }
      setFull(!practiceCount);
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
    if (!unit || !chapter || !activity) return;
    const key = chapterActivityKey(selectedChapterName, activity.id);
    const old = pRef.current.activities[key];
    const done = completed || old?.completed || false;
    try {
      if (activity.tracking !== 'interactive') await api.call('saveActivity', {
        courseId: course.id,
        unitId: unit.id,
        chapterName: selectedChapterName,
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
  async function saveResearch(events: ExplanationResearchEvent[]) {
    if (preview || !unit || unit.research?.enabled === false || !events.length) return;
    try { await api.call('saveExplanationResearchEvents', { courseId: course.id, unitId: unit.id, version: unit.bankVersion, events }); }
    catch (e) { notify('研究資料未同步：' + (e as Error).message); }
  }
  if (activityId.startsWith('__mixed_')) return <><StudentSettings /><MixedPractice api={api} course={course} progress={progress} count={Number(activityId.slice(8))} onBack={() => route()} notify={notify} /></>;
  if (unit && activityId === '__wrongcards') return <><StudentSettings /><WrongCards api={api} course={course} unit={unit} progress={progress} onBack={() => route(`/unit/${encodeURIComponent(unit.id)}?tab=practice`)} /></>;
  if (activity && unit && chapter)
    return <><StudentSettings /><ReadingPage course={course} unit={unit} chapterName={selectedChapterName} activity={activity} api={api} uid={uid} progress={progress} onSave={saveActivity} onBack={() => route(`/unit/${encodeURIComponent(unit.id)}?tab=${phaseTab(activity.phase)}`)} /></>;
  if (taking && unit)
    return (<><StudentSettings /><Quiz
        questions={questions}
        full={full}
        mode={mode}
        course={course}
        unit={unit}
        onSubmit={submit}
        researchEnabled={unit.research?.enabled !== false}
        onResearch={saveResearch}
        forceLeave={exitRequested}
        onClose={() => { setTaking(false); setExitRequested(false); if (/\/(quiz|flashcard)(?:\?|$)/.test(location.hash)) route(`/unit/${encodeURIComponent(unit.id)}?tab=practice`); else setTimeout(() => dispatchEvent(new HashChangeEvent('hashchange')), 0); }}
      /></>);
  return (
    <><StudentSettings /><div className="student">
      <div className="student-top">
        <span className="eyebrow">LEARNING SPACE</span>
        <span>
          {course.term} / {classLabel}
        </span>
      </div>
      <header className="pageheading">
        <div>
          <h1>{chapter ? chapter.title : course.title}</h1>
          <p>{chapter ? chapter.description : course.description}</p>
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
      {course.studentNotice && <div className="notice">{course.studentNotice}</div>}
      {!unit ? (
        <>
          <div className="learning-summary">
            <div>
              <span className="eyebrow">我的單元完成度</span>
              <h2>
                {ratio.done}
                <small> / {ratio.total} 個必做單元</small>
              </h2>
              <p>達標後，仍須完成本單元的互動教材與外部連結。</p>
            </div>
            <div
              className="ring"
              style={{ '--pct': `${ratio.total ? (ratio.done / ratio.total) * 100 : 0}%` } as any}
            >
              <span>{ratio.total ? Math.round((ratio.done / ratio.total) * 100) : 0}%</span>
            </div>
          </div>
          <section className="panel"><h2>還沒完成</h2>{currentChapters.filter(({ name, chapter }) => chapter.required && !chapterCompletion(course, name, progress).done).length ? <><ul>{currentChapters.filter(({ name, chapter }) => chapter.required && !chapterCompletion(course, name, progress).done).slice(0, outstandingAll ? undefined : 5).map(({ name, chapter, units }) => { const state = chapterCompletion(course, name, progress); return <li key={name}><button onClick={() => route(`/unit/${encodeURIComponent(units[0].id)}?tab=${state.scoreDone ? 'pre' : 'practice'}`)}>{!state.scoreDone ? `尚有題目分類未達 ${chapter.threshold} 分` : '尚有必做活動未完成'}｜{chapter.title}</button></li>; })}</ul>{!outstandingAll && currentChapters.filter(({ name, chapter }) => chapter.required && !chapterCompletion(course, name, progress).done).length > 5 && <button onClick={() => setOutstandingAll(true)}>查看全部 {currentChapters.filter(({ name, chapter }) => chapter.required && !chapterCompletion(course, name, progress).done).length} 項</button>}</> : <p>目前學習的內容都完成了。</p>}</section>
          {currentUnits.some((u) => Object.keys(wrongEntries(progress, u.id, u.bankVersion)).length) && <section className="panel"><h2>建議複習｜錯題</h2>{currentUnits.filter((u) => Object.keys(wrongEntries(progress, u.id, u.bankVersion)).length).map((u) => <button key={u.id} onClick={() => route(`/unit/${encodeURIComponent(u.id)}/wrongcards?range=7d`)}>{u.title}　{Object.keys(wrongEntries(progress, u.id, u.bankVersion)).length} 題</button>)}</section>}
          {currentUnits.length > 0 && <section className="panel"><h2>綜合練習</h2><p>錯題優先，接著是尚未作答的題目；不影響最高成績與完成度。</p>{[10,20,30,50].map((n) => <button key={n} onClick={() => route(`/mixed?n=${n}`)}>練習 {n} 題</button>)}</section>}
          {currentChapters.length ? <div className="unitgrid">{currentChapters.map(({ name, chapter, units }, i) => {
                  const locked = !!chapter.opensAt && Date.parse(chapter.opensAt) > Date.now();
                  const state = chapterCompletion(course, name, progress);
                  return (
                    <button
                      className="unitcard"
                      key={name}
                      disabled={locked}
                      onClick={() => route(`/unit/${encodeURIComponent(units[0].id)}?tab=pre`)}
                    >
                      <span className="unitnumber">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <span className={'badge ' + (state.done ? 'green' : '')}>
                          {state.done
                            ? '已達標'
                            : locked
                              ? '尚未開放'
                              : chapter.required
                                ? '必做單元'
                                : '選修活動'}
                        </span>
                        <h3>{chapter.title}</h3>
                        <p>{chapter.description}</p>
                        <footer>
                          已達標分類 {units.filter((u) => !u.bankVersion || (progress.units[u.id]?.best ?? -1) >= chapter.threshold).length} / {units.length} · 活動 {state.completedActivities} / {chapter.activities.length}{' '}
                          <ChevronRight size={16} />
                        </footer>
                      </div>
                    </button>
                  );
                })}</div> : null}
          {!currentUnits.length && <section className="panel empty"><h2>老師尚未開放新的單元</h2></section>}
          {!!archivedChapters.length && <details className="panel" open={archiveOpen} onToggle={(e) => setArchiveOpen((e.target as HTMLDetailsElement).open)}><summary>已考完的單元（{archivedChapters.length}）</summary><div className="unitgrid">{archivedChapters.map(({ name, chapter, units }, i) => { const state = chapterCompletion(course, name, progress); return <button className="unitcard" key={name} onClick={() => route(`/unit/${encodeURIComponent(units[0].id)}?tab=pre`)}><span className="unitnumber">{String(i + 1).padStart(2, '0')}</span><div><span className={'badge ' + (state.done ? 'green' : '')}>{state.done ? '已完成' : '尚未完成'}</span><h3>{chapter.title}</h3><p>{units[0]?.archiveLabel || '其他'}</p></div></button>; })}</div></details>}
        </>
      ) : chapter ? (
        <>
          <button
            className="back"
            onClick={() => {
              route();
            }}
          >
            <ArrowLeft size={16} />
            返回課程
          </button>
          <div className="unit-meta"><span>已達標分類 {chapterUnits.filter((u) => !u.bankVersion || (progress.units[u.id]?.best ?? -1) >= chapter.threshold).length} / {chapterUnits.length}</span><span>達標門檻 {chapter.threshold} 分</span>
            {chapter.dueAt && (
              <span>
                期限 {new Date(chapter.dueAt).toLocaleDateString()}
                {Date.parse(chapter.dueAt) < Date.now() ? ' · 已逾期，仍可練習' : ''}
              </span>
            )}
          </div>
          <div className="unit-tabs" role="tablist" aria-label="學習階段">
            {([['pre', '課前', 'before'], ['class', '課堂', 'during'], ['post', '課後', 'after'], ['practice', '練習', 'practice']] as const).map(([id, label, phase]) => {
              const rows = phase === 'practice' ? [] : chapter.activities.filter((a) => a.phase === phase);
              const required = rows.filter((a) => isRequiredActivity(a));
              const undone = required.filter((a) => !progress.activities[chapterActivityKey(selectedChapterName, a.id)]?.completed).length;
              return <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); route(`/unit/${encodeURIComponent(unit.id)}?tab=${id}`); }}>{label} <small>{id === 'practice' ? '練習' : undone ? `${undone} 待完成` : required.length ? '✓ 完成' : rows.length ? `${rows.length} 項` : '暫無'}</small></button>;
            })}
          </div>
          <section className={tab === 'practice' ? 'practice-list' : 'activitycards'} role="tabpanel">
            {tab === 'practice' ? <><p className="muted practice-note">完整測驗與完整閃卡計入最高成績；抽題與錯題僅供練習，不影響完成度。</p>{chapterUnits.map((classification) => <PracticeRow key={classification.id} unit={classification} threshold={chapter.threshold} progress={progress} busy={busy} start={start} route={route} />)}</> : chapter.activities.filter((a) => a.phase === tabPhase(tab)).map((a) => <ActivityCard key={a.id} ownerKey={`chapter:${selectedChapterName}`} activity={a} progress={progress} onOpen={() => route(`/unit/${encodeURIComponent(unit.id)}/activity/${encodeURIComponent(a.id)}`)} />)}
            {tab !== 'practice' && !chapter.activities.some((a) => a.phase === tabPhase(tab)) && <p className="empty">本單元暫無{tab === 'pre' ? '課前' : tab === 'class' ? '課堂' : '課後'}內容。</p>}
          </section>
        </>
      ) : null}
      {historyOpen && (
        <div className="modalshade">
          <section className="modal wide">
            <div className="sectionhead">
              <h2>我的學習紀錄</h2>
              <button onClick={() => setHistoryOpen(false)}>關閉</button>
            </div>
            <p className="muted">每次載入 20 組；錯題閃卡不會建立作答紀錄。</p>
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
    </div></>
  );
}
function StudentSettings() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const close = () => setOpen(false); addEventListener('popstate', close); return () => removeEventListener('popstate', close); }, []);
  const show = () => { history.pushState({ studentSettings: true }, ''); setOpen(true); };
  const close = () => { if (open) history.back(); else setOpen(false); };
  return <><button className="student-settings-button" aria-label="顯示設定" onClick={show}><Settings2 size={20} /></button>{open && <div className="settings-shade" onClick={close}><section className="settings-sheet" aria-label="顯示設定" onClick={(e) => e.stopPropagation()}><header><strong>顯示設定</strong><button aria-label="關閉顯示設定" onClick={close}><X size={20} /></button></header><ThemePicker /><FontSizePicker /></section></div>}</>;
}
function phaseTab(phase: string) { return phase === 'before' ? 'pre' : phase === 'during' ? 'class' : 'post'; }
function tabPhase(tab: string) { return tab === 'pre' ? 'before' : tab === 'class' ? 'during' : 'after'; }
function isRequiredActivity(a: any) { return (a.type === 'html' && a.tracking === 'interactive') || a.type === 'link'; }
export function defaultTab(unit: Pick<Unit | Chapter, 'activities'>, progress: Progress, ownerId = (unit as Unit).id || ''): 'pre' | 'class' | 'post' | 'practice' {
  const stages = [['before', 'pre'], ['during', 'class'], ['after', 'post']] as const;
  const activityKey = (id: string) => ownerId.startsWith('chapter:') ? `${ownerId}_${id}` : `${ownerId}_${id}`;
  const unfinished = stages.find(([phase]) => unit.activities.some((a) => a.phase === phase && isRequiredActivity(a) && !progress.activities[activityKey(a.id)]?.completed));
  if (unfinished) return unfinished[1];
  const populated = stages.find(([phase]) => unit.activities.some((a) => a.phase === phase));
  return populated ? populated[1] : 'practice';
}
function ActivityCard({ ownerKey, activity, progress, onOpen }: { ownerKey: string; activity: any; progress: Progress; onOpen: () => void }) {
  const done = !!progress.activities[`${ownerKey}_${activity.id}`]?.completed;
  const label = activity.type === 'youtube' ? '選看' : isRequiredActivity(activity) ? '必做' : activity.type === 'quiz' ? '計入成績' : '活動';
  const state = activity.type === 'youtube' ? (progress.activities[`${ownerKey}_${activity.id}`]?.position ? '看過部分' : '未看') : done ? '已完成' : '未開始';
  return <button className="activitycard" onClick={onOpen} aria-label={`${activity.title}，${label}，${state}`}><span className="badge">{label}</span><h3>{activity.title}</h3>{activity.description && activity.description !== activity.title && <p>{activity.description}</p>}<footer>{done ? <><CheckCircle2 size={16} /> 已完成</> : <><BookOpen size={16} /> {state}</>}</footer></button>;
}
function PracticeRow({ unit, threshold, progress, busy, start, route }: { unit: Unit; threshold: number; progress: Progress; busy: boolean; start: (m: Mode, n?: number, target?: Unit) => Promise<void>; route: (path: string) => void }) {
  const go = (mode: Mode, suffix: string, n?: number) => { route(`/unit/${encodeURIComponent(unit.id)}${suffix}`); void start(mode, n, unit); };
  const wrong = Object.keys(wrongEntries(progress, unit.id, unit.bankVersion)).length;
  const best = progress.units[unit.id]?.best ?? 0;
  const passed = best >= threshold;
  return <div className="practice-row">
    <div className="practice-row-title"><strong>{unit.title}</strong><span className="muted">題目分類</span></div>
    <div className="practice-row-score"><span>最高分 {best} / 門檻 {threshold}</span>{passed && <span className="badge green">已達標</span>}</div>
    <button className="practice-full" disabled={busy} onClick={() => go('quiz', '/quiz?mode=full')}>完整測驗</button>
    <button className="practice-flash" disabled={busy} onClick={() => go('flashcard', '/flashcard')}>完整閃卡</button>
    <div className="practice-draw" aria-label="抽題題數"><span>抽題</span>{[10, 20, 30].map((n) => <button key={n} disabled={busy} onClick={() => go('quiz', `/quiz?mode=draw&n=${n}`, n)}>{n} 題</button>)}</div>
    <button className="practice-wrong" disabled={busy || !wrong} onClick={() => route(`/unit/${encodeURIComponent(unit.id)}/wrongcards?range=7d`)}>錯題 {wrong}</button>
  </div>;
}
function ReadingPage({ course, unit, chapterName, activity, api, uid, progress, onSave, onBack }: { course: Course; unit: Unit; chapterName: string; activity: any; api: API; uid: string; progress: Progress; onSave: (position: number, completed: boolean) => Promise<void>; onBack: () => void }) {
  const root = useRef<HTMLElement>(null); const [canFullscreen, setCanFullscreen] = useState(false);
  useEffect(() => setCanFullscreen(!!document.fullscreenEnabled && !!root.current?.requestFullscreen), []);
  const key = chapterActivityKey(chapterName, activity.id);
  return <main className="reading-page" ref={root as any}><header><button aria-label="離開閱讀" onClick={onBack}><ArrowLeft size={18} /></button><strong>{activity.title}</strong>{canFullscreen && <button aria-label="全螢幕閱讀" onClick={() => root.current?.requestFullscreen()}>全螢幕</button>}</header><section className="reading-body">{activity.type === 'html' ? <HtmlMaterial activity={activity} onSave={onSave} api={api} courseId={course.id} unitId={unit.id} chapterName={chapterName} uid={uid} /> : activity.type === 'youtube' ? <Youtube activity={activity} position={progress.activities[key]?.position || 0} onSave={onSave} /> : <><h1>{activity.title}</h1><p>{activity.description}</p><a className="button primary" href={activity.url} target="_blank" rel="noreferrer" onClick={() => onSave(0, false)}>開啟連結 ↗</a><button onClick={() => onSave(0, true)}>確認已閱讀</button></>}</section></main>;
}
function WrongCards({ api, course, unit, progress, onBack }: { api: API; course: Course; unit: Unit; progress: Progress; onBack: () => void }) {
  const [range, setRange] = useState<'24h' | '7d' | 'all'>('7d'), [qs, setQs] = useState<Question[]>([]), [i, setI] = useState(0), [flipped, setFlipped] = useState(false), [seen, setSeen] = useState(0);
  const ids = (r: '24h' | '7d' | 'all') => wrongCardIds(progress, unit.id, unit.bankVersion, r);
  const counts = { '24h': ids('24h').length, '7d': ids('7d').length, all: ids('all').length };
  useEffect(() => { if (!counts[range]) setRange(counts['7d'] ? '7d' : 'all'); }, [counts['24h'], counts['7d'], counts.all, range]);
  useEffect(() => { void cachedBank(api, course.id, unit.id, unit.bankVersion).then((all) => setQs(ids(range).map((id) => all.find((q) => q.id === id)).filter(Boolean) as Question[])); }, [range, unit.id, unit.bankVersion]);
  const q = qs[i];
  if (!q) return <main className="quiz"><button onClick={onBack}>返回單元</button><h1>{seen ? '本次錯題閃卡已看完' : '目前沒有錯題'}</h1><p>錯題會在完整測驗、完整閃卡、抽題或綜合練習答對時移除。</p></main>;
  return <main className="quiz"><div className="sectionhead"><button onClick={onBack}>離開</button><strong>錯題閃卡 {i + 1} / {qs.length}</strong></div><label>時間範圍 <select value={range} onChange={(e) => { setRange(e.target.value as any); setI(0); setFlipped(false); }}>{(['24h','7d','all'] as const).map((r) => <option key={r} value={r} disabled={!counts[r]}>{r === '24h' ? '最近 24 小時' : r === '7d' ? '最近 7 天' : '全部'}（{counts[r]}）</option>)}</select></label><article className="panel" onClick={() => setFlipped(true)} aria-label="點選翻到答案"><h2>{q.text}</h2>{flipped && <><p>正確答案：{q.options.find((o) => o.id === q.answer)?.text}</p><Explanations q={q} /></>}</article><p>閃卡不會寫入資料或改變錯題清單；在測驗或練習中答對才會移除。</p><div className="sectionhead"><button onClick={() => { setSeen((n) => n + 1); setQs((x) => x.filter((_, index) => index !== i)); setI(0); setFlipped(false); }}>我會</button><button onClick={() => { setSeen((n) => n + 1); setQs((x) => [...x.slice(0, i), ...x.slice(i + 1), q]); setI(Math.min(i, Math.max(0, qs.length - 1))); setFlipped(false); }}>再看一次</button></div></main>;
}
function MixedPractice({ api, course, progress, count, onBack, notify }: { api: API; course: Course; progress: Progress; count: number; onBack: () => void; notify: (s: string) => void }) {
  const [rows, setRows] = useState<{ q: Question; unit: Unit }[]>([]), [i, setI] = useState(0), [selected, setSelected] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  useEffect(() => { let active = true; void Promise.all(course.units.filter((u) => unitVisibility(u) === 'current' && u.bankVersion).map(async (unit) => (await cachedBank(api, course.id, unit.id, unit.bankVersion)).map((q) => ({ q, unit })))).then((all) => { if (!active) return; const flat = all.flat(); const wrong = flat.filter(({q,unit}) => !!wrongEntries(progress, unit.id, unit.bankVersion)[q.id]); const unseen = flat.filter(({q,unit}) => !wrongEntries(progress, unit.id, unit.bankVersion)[q.id] && !progress.attempted?.[unit.id]?.[q.id]); const other = flat.filter(({q,unit}) => !wrongEntries(progress, unit.id, unit.bankVersion)[q.id] && !!progress.attempted?.[unit.id]?.[q.id]); setRows([...shuffle(wrong), ...shuffle(unseen), ...shuffle(other)].slice(0, Math.min(count, flat.length))); }).catch((e) => notify(e.message)); return () => { active = false; }; }, [api, course.id, count]);
  const row = rows[i];
  async function submit() { if (!rows.length || busy) return; setBusy(true); try { const grouped = new Map<Unit, { q: Question; key: string }[]>(); rows.forEach(({ q, unit }) => grouped.set(unit, [...(grouped.get(unit) || []), { q, key: `${unit.id}:${q.id}` }])); const attempts: Attempt[] = [...grouped].map(([unit, qs]) => { const answers = qs.map(({q, key}) => ({ questionId: q.id, selected: selected[key] || '', correct: false, seconds: 0 })); return { id: crypto.randomUUID(), courseId: course.id, unitId: unit.id, version: unit.bankVersion, mode: 'quiz', answers, score: 0, full: false, clientAt: Date.now(), duration: 0 }; }); await api.call('submitMixedAttempts', { attempts }); setDone(true); } catch (e) { notify((e as Error).message); } finally { setBusy(false); } }
  if (!row) return <main className="quiz"><button onClick={onBack}>返回首頁</button><h1>目前沒有可供綜合練習的題目</h1></main>;
  if (done) return <main className="quiz"><h1>綜合練習已提交</h1><p>錯題與作答紀錄已分別寫回原次單元；不影響最高成績或完成度。</p><button onClick={onBack}>返回首頁</button></main>;
  const key = `${row.unit.id}:${row.q.id}`;
  return <main className="quiz"><div className="sectionhead"><button onClick={onBack}>離開</button><strong>綜合練習 {i + 1} / {rows.length}</strong></div><p>{row.unit.title}</p><h2>{row.q.text}</h2><div className="options">{row.q.options.map((o) => <button key={o.id} className={selected[key] === o.id ? 'chosen' : ''} onClick={() => setSelected((x) => ({ ...x, [key]: o.id }))}>{o.text}</button>)}</div><div className="sectionhead"><button disabled={i === 0} onClick={() => setI(i - 1)}>上一題</button>{i < rows.length - 1 ? <button className="primary" onClick={() => setI(i + 1)}>下一題</button> : <button className="primary" disabled={busy} onClick={submit}>完成並提交</button>}</div></main>;
}
function Quiz({
  questions,
  full,
  mode,
  course,
  unit,
  onSubmit,
  researchEnabled,
  onResearch,
  onClose,
  forceLeave = false,
}: {
  questions: Question[];
  full: boolean;
  mode: Mode;
  course: Course;
  unit: Unit;
  onSubmit: (a: Attempt) => Promise<string>;
  researchEnabled: boolean;
  onResearch: (events: ExplanationResearchEvent[]) => Promise<void>;
  onClose: () => void;
  forceLeave?: boolean;
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
  useEffect(() => { if (forceLeave && !result) setLeave(true); }, [forceLeave, result]);
  function research(questionId: string, value: Omit<ExplanationResearchEvent, 'id' | 'questionId' | 'attemptId' | 'clientAt'>) {
    if (!researchEnabled) return;
    void onResearch([{ ...value, id: crypto.randomUUID(), questionId, attemptId: attemptId.current, clientAt: Date.now() }]);
  }
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
    // 2026-09-15（第二次調整）：quiz 模式（完整測驗／抽題練習）恢復成交卷後才揭曉正解與解析，
    // 作答中不鎖定、可以改答案——不然跟閃卡沒有差別。閃卡／複習模式維持選了就立刻鎖定並顯示。
    if (mode !== 'quiz' || !full) setLocked((l) => ({ ...l, [q.id]: true }));
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
        <p className="result-counts">
          <span>答對：<b className="count-ok">{result.answers.filter((a) => a.correct).length}</b> 題</span>
          <span>答錯：<b className="count-bad">{questions.length - result.answers.filter((a) => a.correct).length}</b> 題</span>
        </p>
        <p className="notice">{busy ? '正在保存…' : status}</p>
        <button className="primary" disabled={busy} onClick={onClose}>
          返回單元
        </button>
        <div className="reviewanswers">
          {questions.map((q, j) => (
            // 2026-09-15 起：不用 <details> 收合，交卷後每一題的正解與解析直接顯示，不用點。
            <div className={'reviewanswer ' + (result.answers[j].correct ? 'is-ok' : 'is-bad')} key={q.id}>
              <strong className="review-verdict">{result.answers[j].correct ? '✅ 答對' : '❌ 答錯'}</strong>
              <h3><span className="review-no">Q{j + 1}.</span> {q.text}</h3>
              <ul className="review-options">
                {q.options.map((o) => {
                  const picked = result.answers[j].selected === o.id, right = o.id === q.answer;
                  return <li key={o.id} className={right ? 'right' : picked ? 'picked' : ''}>{right ? '✓' : picked ? '✗' : '•'} {o.text}{right && <small>（正確答案）</small>}{picked && !right && <small>（本次選擇）</small>}</li>;
                })}
              </ul>
              <QuestionImage key={q.image} url={q.image} /><Explanations q={q} onResearch={(v) => research(q.id, v)} />
            </div>
          ))}
        </div>
      </section>
    );
  return (
    <section className="quiz">
      <div className="sectionhead quiz-topbar">
        <button aria-label="離開測驗" onClick={() => setLeave(true)}>
          <X size={20} />
          離開
        </button>
        <span>
          {modes[mode]} · {unit.title}
        </span>
        <span aria-label={`第 ${i + 1} 題，共 ${questions.length} 題`}>{i + 1} / {questions.length}</span>
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
            role="radio"
            aria-checked={selections[q.id] === o.id}
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
      <div className="sectionhead quiz-bottom">
        <button disabled={i === 0} onClick={() => move(i - 1)}>
          上一題
        </button>
        <span>{Object.keys(selections).length} 題已作答</span>
        {i < questions.length - 1 ? (
          <button
            className="primary"
            disabled={(mode !== 'quiz' || !full) && !locked[q.id]}
            onClick={() => move(i + 1)}
          >
            下一題
          </button>
        ) : (
          <button
            className="primary"
            disabled={(mode !== 'quiz' || !full) && Object.keys(locked).length < questions.length}
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
