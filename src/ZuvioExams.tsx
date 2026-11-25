import { useEffect, useMemo, useState } from 'react';
import { allocate, drawItems, optionOrderFor, parseZuvioMatrix, type ZPoolEntry, type ZExamView, type ZItem } from '../shared/zuvio';
import { fakeZuvioExport } from '../shared/zuvioSample';
import { readXlsxFirstSheetMatrix } from './pptImportFiles';
import { cloudZuvioApi, sampleZuvioApi, type ZuvioApi, type ExamSummary, type ImportPreview, type Sitting, type FullZuvioReport } from './zuvioApi';
import { MOOD_STATES, type CareListEntry } from '../shared/zuvioExt';
import { PlatformQuizTeacher, QuizClassDirectory, type ListedQuiz, type QuizClass } from './PlatformQuizTeacher';
import type { QuizAnswerMode } from '../shared/platformQuiz';
import type { API } from './service';
import { SAMPLE_POOL } from '../shared/zuvioSamplePool';

type Tab = 'classes' | 'make' | 'exams' | 'report';
const uuid = () => (crypto as any).randomUUID?.() || 'x' + Math.random().toString(16).slice(2);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const pct = (x: number) => Math.round(x * 100) + '%';
const COUNT_LABEL: Record<string, string> = { notInRoster: '不在名冊', disabled: '已停用', wrongClass: '不屬於本場班級', needTextId: '學號需重新匯出為文字', duplicate: '重複學號' };

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const fileName = (t: string) => t.replace(/[\\/:*?"<>|]/g, '_') + '.csv';

/** 後台分頁入口：預覽模式用示範資料，正式模式走教師限定 callable；api 物件只建一次 */
export function ZuvioTab({ api, courseId, notify, moodEnabled = true }: { api: { preview: boolean; call<T = any>(name: string, data?: any): Promise<T> }; courseId: string; notify: (m: string) => void; moodEnabled?: boolean }) {
  const z = useMemo(() => (api.preview ? sampleZuvioApi(SAMPLE_POOL) : cloudZuvioApi(api, courseId)), [api, courseId]);
  return <ZuvioExams api={z} notify={notify} moodEnabled={moodEnabled} platform={!api.preview ? { api, courseId } : undefined} />;
}

export default function ZuvioExams({ api, notify = () => {}, moodEnabled = true, platform }: {
  api: ZuvioApi; notify?: (m: string) => void; moodEnabled?: boolean; platform?: { api: API; courseId: string };
}) {
  const [tab, setTab] = useState<Tab>(platform ? 'classes' : 'make');
  const [openExam, setOpenExam] = useState<string>('');
  const [classes, setClasses] = useState<QuizClass[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [classId, setClassId] = useState('');
  const [row, setRow] = useState<ListedQuiz>();
  const [loadError, setLoadError] = useState('');
  const className = classes.find((item) => item.classId === classId)?.name || classId;
  const reloadDirectory = () => {
    if (!platform) return;
    Promise.all([api.listExams(), platform.api.call<QuizClass[]>('zuvioClassDirectory', { courseId: platform.courseId })])
      .then(([list, roster]) => { setExams(list); setClasses(roster); setLoadError(''); })
      .catch((error) => setLoadError(error.message));
  };
  useEffect(() => { if (tab === 'classes') reloadDirectory(); }, [tab, api, platform?.api, platform?.courseId]);
  const showTab = (next: Tab) => { setRow(undefined); setTab(next); };
  const tabs: [Tab, string][] = platform
    ? [['classes', '班級小考'], ['make', '出題'], ['exams', '考卷設定']]
    : [['make', '出題'], ['exams', '考卷與場次'], ['report', '報表']];
  return (
    <div className="zuvio">
      <div className="sectionhead"><h2>試務中心</h2>{api.sample && <span className="z-badge">樣張：示範題目與合成學生</span>}</div>
      <div className="z-tabs" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => showTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'classes' && platform && !row && <>
        {loadError && <p className="z-warn" role="alert">{loadError} <button type="button" onClick={reloadDirectory}>重新整理</button></p>}
        <QuizClassDirectory classes={classes} exams={exams} selected={classId}
          select={setClassId} open={setRow} back={() => setClassId('')} />
      </>}
      {tab === 'classes' && platform && row && (row.exam.answerMode === 'platform'
        ? <PlatformQuizTeacher key={row.sitting.id} api={platform.api} courseId={platform.courseId}
          className={className} row={row} back={() => setRow(undefined)} reload={reloadDirectory}
          report={() => <Report api={api} initial={row.exam.id} classScope={classId} sittingScope={row.sitting.id} moodEnabled={moodEnabled} />} />
        : <>
          <ExamDetail api={api} notify={notify} examId={row.exam.id} classScope={classId} sittingScope={row.sitting.id}
            className={className} back={() => { setRow(undefined); reloadDirectory(); }} onChanged={reloadDirectory} />
          <Report key={row.sitting.id + ':' + (exams.find((exam) => exam.id === row.exam.id)?.sittings.find((sitting) => sitting.id === row.sitting.id)?.results?.revision || 0)}
            api={api} initial={row.exam.id} classScope={classId} sittingScope={row.sitting.id} moodEnabled={moodEnabled} />
        </>)}
      {tab === 'make' && <Make api={api} notify={notify} platform={!!platform} done={(id) => { setOpenExam(id); setTab('exams'); }} />}
      {tab === 'exams' && <Exams api={api} notify={notify} open={openExam} setOpen={setOpenExam} />}
      {tab === 'report' && <Report api={api} initial={openExam} moodEnabled={moodEnabled} />}
    </div>
  );
}

// ---------------- 出題 ----------------
type Mode = 'proportional' | 'equal' | 'custom';
function Make({ api, notify, done, platform }: { api: ZuvioApi; notify: (m: string) => void; done: (id: string) => void; platform: boolean }) {
  const [answerMode, setAnswerMode] = useState<QuizAnswerMode>('zuvio');
  const [data, setData] = useState<Awaited<ReturnType<ZuvioApi['pool']>>>();
  const [checked, setChecked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(20);
  const [mode, setMode] = useState<Mode>('proportional');
  const [custom, setCustom] = useState<Record<string, number>>({});
  const [scorePer, setScorePer] = useState(5);
  const [title, setTitle] = useState(`${new Date().getMonth() + 1}/${new Date().getDate()} 小考`);
  const [shuffleOpts, setShuffleOpts] = useState(false);
  const [fresh, setFresh] = useState(true);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [picked, setPicked] = useState<{ e: ZPoolEntry; order: string[] }[]>([]);
  const [short, setShort] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.pool().then((d) => { setData(d); setClassIds(d.classes); }); }, [api]);
  const tree = useMemo(() => {
    const g = new Map<string, Map<string, { title: string; n: number }>>();
    for (const e of data?.entries || []) {
      if (data?.unitClasses && !classIds.every((cl) => data.unitClasses![e.unitId]?.includes(cl))) continue;
      if (!g.has(e.group)) g.set(e.group, new Map());
      const u = g.get(e.group)!;
      u.set(e.unitId, { title: e.unitTitle, n: (u.get(e.unitId)?.n || 0) + 1 });
    }
    return g;
  }, [data, classIds.join()]);
  const unitInfo = useMemo(() => new Map([...tree.values()].flatMap((m) => [...m])), [tree]);
  const sel = checked.filter((u) => unitInfo.has(u)).map((u) => ({ unitId: u, n: unitInfo.get(u)!.n }));
  const available = sel.reduce((a, b) => a + b.n, 0);
  const plan: Record<string, number> = mode === 'custom'
    ? Object.fromEntries(sel.map((u) => [u.unitId, Math.min(u.n, custom[u.unitId] ?? 0)]))
    : allocate(sel, total, mode);
  const planned = Object.values(plan).reduce((a, b) => a + b, 0);
  const qCount = picked.length || planned;
  const totalScore = Math.round(scorePer * qCount * 100) / 100;
  if (!data) return <p className="muted">讀取題庫中…</p>;
  const excludedText = Object.entries(data.excluded).filter(([, n]) => n).map(([k, n]) => `${{ image: '圖片題', reserved: '正式前後測題', unsafe: '無法安全輸出', invalid: '資料不完整' }[k] || k} ${n}`).join('、');
  const toggle = (ids: string[], on: boolean) => setChecked(on ? [...new Set([...checked, ...ids])] : checked.filter((x) => !ids.includes(x)));
  function draw() {
    const ok = new Set(sel.map((u) => u.unitId));
    const r = drawItems(data!.entries.filter((e) => ok.has(e.unitId)), { units: plan, groups: {} }, data!.usage, Math.random, fresh);
    setPicked(r.picked.map((e) => ({ e, order: optionOrderFor(e.question, shuffleOpts, Math.random) })));
    setShort(r.short);
  }
  function swap(i: number) {
    const cur = picked[i].e;
    const taken = new Set(picked.map((p) => p.e.question.id));
    const alt = data!.entries.find((e) => !taken.has(e.question.id) && e.unitId === cur.unitId);
    if (!alt) return notify('這個次單元已沒有其他題目可換');
    const next = [...picked];
    next[i] = { e: alt, order: optionOrderFor(alt.question, shuffleOpts, Math.random) };
    setPicked(next);
  }
  async function create() {
    if (!title.trim() || title.trim().length > 60 || /^[=+\-@]/.test(title.trim())) return notify('考卷名稱需 1–60 字，且不能以 = + - @ 開頭');
    if (!classIds.length) return notify('至少選一個班級');
    if (!Number.isInteger(scorePer) || scorePer < 1 || scorePer > 100) return notify('每題配分需為 1–100 的整數');
    setBusy(true);
    try {
      const items: ZItem[] = picked.map((p) => ({ questionId: p.e.question.id, unitId: p.e.unitId, version: p.e.version, optionOrder: p.order }));
      const r = await api.createExam({ examId: uuid(), title: title.trim(), score: scorePer, classIds, items, answerMode });
      if (r.csv) download(fileName(title.trim()), r.csv);
      notify(r.csv ? '已建立考卷並下載 CSV' : '已建立平台小考考卷');
      done(r.examId);
    } catch (e: any) { notify(e.message); } finally { setBusy(false); }
  }
  const pickedBy = (u: string) => picked.filter((p) => p.e.unitId === u).length;
  return (
    <>
      <section className="z-card">
        <h3>1. 勾選出題範圍（次單元）</h3>
        {excludedText && <p className="muted">已自動排除：{excludedText}。</p>}
        <div className="z-range-actions">
          <button type="button" onClick={() => setExpanded(new Set(tree.keys()))}>全部展開</button>
          <button type="button" onClick={() => setExpanded(new Set())}>全部收起</button>
        </div>
        {[...tree].map(([g, us]) => {
          const units = [...us];
          const ids = units.map(([id]) => id);
          const selected = units.filter(([id]) => checked.includes(id));
          const all = selected.length === units.length;
          const open = expanded.has(g);
          return (
            <div className="z-group" key={g}>
              <div className="z-grouphead">
                <label>
                  <input type="checkbox" aria-label={g} checked={all}
                    ref={(el) => { if (el) el.indeterminate = !all && selected.length > 0; }}
                    onChange={(e) => toggle(ids, e.target.checked)} />
                  <b>{g}</b>
                </label>
                <span className="muted">{units.reduce((n, [, info]) => n + info.n, 0)} 題</span>
                {selected.length > 0 && <span className="muted z-group-picked">
                  已選 {selected.length}／{units.length} 個次單元・{selected.reduce((n, [, info]) => n + info.n, 0)} 題
                </span>}
                <button type="button" className="z-group-toggle" aria-expanded={open}
                  aria-label={`${open ? '收起' : '展開'} ${g}`}
                  onClick={() => setExpanded((old) => {
                    const next = new Set(old);
                    if (next.has(g)) next.delete(g);
                    else next.add(g);
                    return next;
                  })}>{open ? '▾' : '▸'}</button>
              </div>
              {open && units.map(([u, info]) => (
                <label className="z-unit" key={u}><input type="checkbox" checked={checked.includes(u)} onChange={(e) => toggle([u], e.target.checked)} /><span>{info.title}</span><span className="muted">{info.n} 題</span></label>
              ))}
            </div>
          );
        })}
      </section>
      <section className="z-card">
        <h3>2. 題數與次單元比例</h3>
        <div className="z-row">
          <label>總題數<input type="number" min={1} max={100} value={mode === 'custom' ? planned : total} disabled={mode === 'custom'} onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))} /></label>
          <label>分配方式<select value={mode} onChange={(e) => { const m = e.target.value as Mode; if (m === 'custom') setCustom(plan); setMode(m); }}>
            <option value="proportional">依各次單元題庫題數比例</option><option value="equal">各次單元平均</option><option value="custom">自訂每個次單元題數</option></select></label>
          <span className="muted">已勾 {sel.length} 個次單元，可出 {available} 題</span>
        </div>
        {sel.length > 0 ? (
          <table className="z-table z-alloc"><thead><tr><th>次單元</th><th>可出題數</th><th>出題數</th><th>比例</th>{picked.length > 0 && <th>已抽到</th>}</tr></thead>
            <tbody>{sel.map((u) => (
              <tr key={u.unitId}><td>{unitInfo.get(u.unitId)!.title}</td><td>{u.n}</td>
                <td>{mode === 'custom' ? <input type="number" min={0} max={u.n} aria-label={unitInfo.get(u.unitId)!.title + ' 題數'} value={custom[u.unitId] ?? 0} onChange={(e) => setCustom({ ...custom, [u.unitId]: Math.max(0, Math.min(u.n, Number(e.target.value) || 0)) })} /> : plan[u.unitId]}</td>
                <td><span className="z-pbar"><i style={{ width: planned ? (plan[u.unitId] / planned) * 100 + '%' : 0 }} /></span>{planned ? Math.round((plan[u.unitId] / planned) * 100) : 0}%</td>
                {picked.length > 0 && <td>{pickedBy(u.unitId)}</td>}</tr>
            ))}
              <tr className="z-sum"><td>合計</td><td>{available}</td><td>{planned}</td><td>100%</td>{picked.length > 0 && <td>{picked.length}</td>}</tr></tbody></table>
        ) : <p className="muted">請先在上面勾選次單元。</p>}
        {mode !== 'custom' && total > available && sel.length > 0 && <p className="z-warn">勾選範圍只有 {available} 題，少於總題數 {total}。</p>}
      </section>
      <section className="z-card">
        <h3>3. 配分與考卷設定</h3>
        <div className="z-row">
          {platform && <label>作答方式<select value={answerMode} onChange={(event) => setAnswerMode(event.target.value as QuizAnswerMode)}>
            <option value="zuvio">Zuvio 匯入</option><option value="platform">平台作答</option>
          </select></label>}
          <label>考卷名稱<input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>每題配分（整數）<input type="number" min={1} max={100} step={1} value={scorePer} onChange={(e) => setScorePer(Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1))))} /></label>
          <span className="z-total">總分：{qCount} 題 × {scorePer} 分 ＝ <b>{totalScore}</b> 分</span>
        </div>
        <div className="z-row">
          <label className="z-check"><input type="checkbox" checked={shuffleOpts} onChange={(e) => setShuffleOpts(e.target.checked)} />打亂選項順序</label>
          <label className="z-check"><input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} />優先抽較少出過的題目</label>
        </div>
        <div className="z-row"><span>使用班級：</span>{data.classes.map((c) => (
          <label key={c} className="z-check"><input type="checkbox" checked={classIds.includes(c)} onChange={(e) => setClassIds(e.target.checked ? [...classIds, c] : classIds.filter((x) => x !== c))} />{c}</label>
        ))}</div>
        <button className="primary" disabled={!planned} onClick={draw}>抽題{planned ? `（${planned} 題）` : ''}</button>
      </section>
      {picked.length > 0 && (
        <section className="z-card">
          <div className="z-row"><h3 style={{ margin: 0 }}>4. 預覽（{picked.length} 題，每題 {scorePer} 分，總分 {totalScore} 分）</h3><span className="z-sp" />
            <button onClick={draw}>全部重抽</button><button className="primary" disabled={busy} onClick={create}>{answerMode === 'platform' ? '建立考卷' : '建立考卷並下載 CSV'}</button></div>
          {short.length > 0 && <p className="z-warn">題數不足：{short.join('、')}</p>}
          <ol className="z-qs">
            {picked.map(({ e, order }, i) => (
              <li key={e.question.id}>
                <div className="z-qmeta"><span className="z-tag">{e.question.id}</span><span className="z-tag">{e.unitTitle}</span>{data.usage[e.question.id]?.n ? <span className="z-tag">出過 {data.usage[e.question.id].n} 次</span> : null}
                  <span className="z-sp" /><button onClick={() => swap(i)}>換一題</button><button onClick={() => setPicked(picked.filter((_, k) => k !== i))}>刪除</button></div>
                <p>{e.question.text}</p>
                <ol className="z-opts">{order.map((id) => <li key={id} className={id === e.question.answer ? 'z-ans' : ''}>{e.question.options.find((o) => o.id === id)!.text}</li>)}</ol>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}

// ---------------- 考卷與場次 ----------------
function Exams({ api, notify, open, setOpen }: { api: ZuvioApi; notify: (m: string) => void; open: string; setOpen: (id: string) => void }) {
  const [list, setList] = useState<ExamSummary[]>();
  const reload = () => api.listExams().then(setList);
  useEffect(() => { reload(); }, [api]);
  if (!list) return <p className="muted">讀取中…</p>;
  if (open) return <ExamDetail api={api} notify={notify} examId={open} back={() => { setOpen(''); reload(); }} />;
  return (
    <section className="z-card">
      <h3>考卷紀錄</h3>
      {!list.length && <p className="muted">還沒有考卷。到「出題」建立第一份。</p>}
      <table className="z-table"><thead><tr><th>建立日期</th><th>考卷名稱</th><th>題數</th><th>場次</th><th>已匯入成績</th><th /></tr></thead>
        <tbody>{list.filter((e) => !e.archived).map((e) => (
          <tr key={e.id}><td>{new Date(e.createdAt).toLocaleDateString('zh-TW')}</td><td>{e.title}</td><td>{e.count}</td><td>{e.sittings.length}</td><td>{e.sittings.filter((s) => s.results).length}</td>
            <td><button onClick={() => setOpen(e.id)}>開啟</button></td></tr>
        ))}</tbody></table>
    </section>
  );
}

function ExamDetail({ api, notify, examId, back, classScope, sittingScope, className, onChanged }: {
  api: ZuvioApi; notify: (m: string) => void; examId: string; back: () => void;
  classScope?: string; sittingScope?: string; className?: string; onChanged?: () => void;
}) {
  const [d, setD] = useState<Awaited<ReturnType<ZuvioApi['getExam']>>>();
  const [newS, setNewS] = useState({ label: '', date: today(), classIds: [] as string[] });
  const [importing, setImporting] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number>();
  const reload = () => api.getExam(examId).then(setD);
  useEffect(() => { reload(); }, [examId]);
  if (!d) return <p className="muted">讀取中…</p>;
  const platform = d.summary.answerMode === 'platform';
  const sittings = d.summary.sittings.filter((row) => !sittingScope || row.id === sittingScope);
  async function addSitting() {
    if (!newS.label.trim() || !newS.classIds.length) return notify('請填場次名稱並選班級');
    try {
      await api.createSitting(examId, { ...newS, label: newS.label.trim(), ...(platform && durationSeconds !== undefined ? { durationSeconds } : {}) });
    } catch (error) {
      notify((error as Error).message);
      return;
    }
    setNewS({ label: '', date: today(), classIds: [] });
    reload();
  }
  async function cleanupResults(sittingId: string) {
    try {
      await api.deleteResults(examId, sittingId, true);
    } catch (error) {
      notify(error instanceof Error && error.message ? error.message : '清理殘留成績失敗，請重試');
      return;
    }
    reload();
  }
  return (
    <>
      <div className="z-row"><button onClick={back}>{className ? '← ' + className + '的小考' : '← 考卷列表'}</button><span className="z-sp" />{d.csv ? <button onClick={() => download(fileName(d.summary.title), d.csv!)}>重新下載 CSV</button> : !platform && <span className="z-warn">有 {d.masked} 題已列為正式測驗保留題，不能重新下載</span>}</div>
      <section className="z-card">
        <h3>{d.summary.title}</h3>
        <p className="muted">{d.view.items.length} 題・每題 {d.view.score} 分・可使用班級：{d.classIds.join('、')}{platform ? '・平台作答' : '・重新下載的檔案與建立時完全相同'}</p>
        <h4>場次</h4>
        <table className="z-table"><thead><tr><th>場次</th><th>日期</th><th>開考時間</th><th>班級</th><th>成績</th><th /></tr></thead>
          <tbody>{sittings.map((s) => (
            <tr key={s.id}><td>{s.label}</td><td>{s.date}</td>
              <td>
                {s.startsAt && !['prepared', 'announced'].includes(s.platformState || '') ? new Date(s.startsAt).toLocaleString('zh-TW', { hour12: false }) : '未開放'}
                {' '}
                {!platform && <button type="button" onClick={async () => {
                  const cur = new Date(s.startsAt || Date.now());
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const def = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}T${pad(cur.getHours())}:${pad(cur.getMinutes())}`;
                  const v = prompt('修改開考時間（YYYY-MM-DDTHH:mm，台北時間）', def);
                  if (!v) return;
                  const ms = Date.parse(v);
                  if (!Number.isFinite(ms)) return notify('時間格式無效');
                  await api.updateSittingStart(examId, s.id, ms);
                  reload();
                }}>改時間</button>}
              </td>
              <td>{classScope || s.classIds.join('、')}</td>
              <td>{s.results ? (platform ? '已批改 ' : '已匯入 ') + s.results.matched + ' 人' : <span className="muted">{platform ? '尚無成績' : '尚未匯入'}</span>}</td>
              <td>{platform ? '從班級小考管理' : <><button onClick={() => setImporting(s.id)}>{s.results ? '重新匯入' : '匯入成績'}</button>
                {s.results && <button onClick={async () => { if (confirm('刪除這一場的成績？')) { await api.deleteResults(examId, s.id); reload(); onChanged?.(); } }}>刪除成績</button>}
                {s.pendingCleanup && <button onClick={() => void cleanupResults(s.id)}>清理殘留成績</button>}
                <button onClick={async () => { if (confirm('清除這一場的情緒簽到紀錄？')) { await api.deleteMood(examId, s.id); notify('已清除情緒紀錄'); } }}>刪情緒</button></>}</td></tr>
          ))}</tbody></table>
        {!sittingScope && <div className="z-row z-new">
          <label>新增場次<input placeholder="例：乙班 第1次" value={newS.label} onChange={(e) => setNewS({ ...newS, label: e.target.value })} /></label>
          <label>日期<input type="date" value={newS.date} onChange={(e) => setNewS({ ...newS, date: e.target.value })} /></label>
          {d.classIds.map((c) => <label key={c} className="z-check"><input type={platform ? 'radio' : 'checkbox'} name={platform ? 'platform-class' : undefined} checked={newS.classIds.includes(c)} onChange={(e) => setNewS({ ...newS, classIds: platform ? [c] : e.target.checked ? [...newS.classIds, c] : newS.classIds.filter((x) => x !== c) })} />{c}</label>)}
          {platform && <label>限時（秒）<input type="number" min="1" max="14400" value={durationSeconds ?? d.view.items.length * 30}
            onChange={(event) => setDurationSeconds(Number(event.target.value))} /></label>}
          <button onClick={addSitting}>新增</button>
        </div>}
        {!platform && <p className="muted">再考一次時，請在 Zuvio 複製一份新考卷或重新匯入同一個 CSV，不要重新開放舊考卷，以免匯出檔只剩最後一次作答。</p>}
      </section>
      {importing && <ImportPanel api={api} notify={notify} view={d.view} examId={examId} sitting={d.summary.sittings.find((s) => s.id === importing)!} close={() => { setImporting(''); reload(); onChanged?.(); }} />}
      <section className="z-card">
        <h4>{platform ? '題目（報表順序）' : '題目（依 Zuvio 顯示順序）'}</h4>
        <ol className="z-qs">{d.view.items.map((it) => (
          <li key={it.questionId}><div className="z-qmeta"><span className="z-tag">{it.questionId}</span></div><p>{it.text}</p>
            <ol className="z-opts">{it.optionOrder.map((id) => <li key={id} className={id === it.answer ? 'z-ans' : ''}>{it.options.find((o) => o.id === id)!.text}</li>)}</ol></li>
        ))}</ol>
      </section>
    </>
  );
}

function ImportPanel({ api, notify, view, examId, sitting, close }: { api: ZuvioApi; notify: (m: string) => void; view: ZExamView; examId: string; sitting: Sitting; close: () => void }) {
  const [pv, setPv] = useState<ImportPreview>();
  const [err, setErr] = useState('');
  async function useMatrix(m: string[][]) {
    setErr('');
    const parsed = parseZuvioMatrix(m); // 姓名在這一步就丟掉，不會送出
    setPv(await api.previewImport(examId, sitting.id, parsed));
  }
  async function onFile(f?: File) {
    if (!f) return;
    if (f.size > 5_000_000) return setErr('檔案超過 5 MB');
    try { await useMatrix(await readXlsxFirstSheetMatrix(await f.arrayBuffer())); } catch (e: any) { setErr('讀檔失敗：' + e.message); }
  }
  function demoFile(kind: 'ok' | 'wrong') {
    const students = Array.from({ length: 30 }, (_, i) => ({ studentId: 'T' + String(i * 3 + (sitting.classIds[0] === '乙班' ? 2 : sitting.classIds[0] === '丙班' ? 3 : 1)).padStart(3, '0'), name: '示範' + i }));
    students.push({ studentId: 'X999', name: '外班' });
    const m = fakeZuvioExport(view, students, (si, ii) => (si === 3 ? null : (si + ii) % view.items[ii].optionOrder.length), { garble: { item: 0, option: 1 }, titleOverride: kind === 'wrong' ? view.title + '（舊版）' : undefined });
    useMatrix(m);
  }
  return (
    <section className="z-card z-import">
      <div className="z-row"><h3 style={{ margin: 0 }}>匯入成績：{sitting.label}</h3><span className="z-sp" /><button onClick={close}>關閉</button></div>
      <p>在 Zuvio 這份考卷右上角「更多 → 下載數據」，選擇下載的 xlsx。檔案只在這個瀏覽器裡解析，<b>學生姓名不會上傳</b>，原檔也不保存。</p>
      <input type="file" accept=".xlsx" onChange={(e) => onFile(e.target.files?.[0])} />
      {api.sample && <div className="z-row"><button onClick={() => demoFile('ok')}>載入示範成績檔</button><button onClick={() => demoFile('wrong')}>載入「錯的考卷」示範</button></div>}
      {err && <p className="z-err">{err}</p>}
      {pv && (
        <div className="z-preview">
          {pv.blocking.length ? (
            <div className="z-err"><b>不能匯入，請確認是不是選錯檔案：</b><ul>{pv.blocking.slice(0, 12).map((b) => <li key={b}>{b}</li>)}</ul></div>
          ) : <p className="z-ok">考卷比對通過：{view.items.length} 題全部相符{pv.garbled ? `（${pv.garbled} 題有 Zuvio 匯出亂碼，已依選項位置還原）` : ''}。</p>}
          <p>可匯入 <b>{pv.matched}</b> 人。{Object.entries(pv.counts).filter(([, n]) => n).map(([k, n]) => `${COUNT_LABEL[k]} ${n} 人`).join('、') || '沒有異常名單。'}</p>
          {pv.details.length > 0 && <details><summary>未匯入名單（學號已遮碼，只顯示在這個畫面）</summary><ul>{pv.details.map((x, i) => <li key={i}>{x}</li>)}</ul></details>}
          {!pv.blocking.length && <button className="primary" onClick={async () => { await api.confirmImport(examId, sitting.id, pv.previewId); notify('成績已匯入'); close(); }}>{pv.replaces ? '確認匯入（取代這一場原有成績）' : '確認匯入'}</button>}
        </div>
      )}
    </section>
  );
}

// ---------------- 報表 ----------------
export function Report({ api, initial, moodEnabled = true, classScope, sittingScope }: {
  api: ZuvioApi; initial: string; moodEnabled?: boolean; classScope?: string; sittingScope?: string;
}) {
  const [list, setList] = useState<ExamSummary[]>([]);
  const [examId, setExamId] = useState(initial);
  const [sel, setSel] = useState<string[]>([]);
  const [cls, setCls] = useState(classScope || '');
  const [threshold, setThreshold] = useState(80);
  const [full, setFull] = useState<FullZuvioReport>();
  const [care, setCare] = useState<CareListEntry[]>([]);
  const [careIncomplete, setCareIncomplete] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    api.listExams().then((l) => {
      setList(l);
      const first = initial || l.find((e) => e.sittings.some((s) => s.results))?.id || l[0]?.id || '';
      setExamId(first);
    });
  }, [api]);

  const exam = list.find((e) => e.id === examId);
  const platform = exam?.answerMode === 'platform';
  const availableSittings = (exam?.sittings || []).filter((s) =>
    (moodEnabled || s.results) && (!classScope || s.classIds.includes(classScope)));
  const moodOn = moodEnabled && full?.moodEnabled !== false;
  const analysisOn = moodOn || platform;

  useEffect(() => {
    const firstWithRes = availableSittings.find((s) => s.results);
    const defaultSel = firstWithRes ? [firstWithRes.id] : availableSittings.slice(0, 1).map((s) => s.id);
    setSel(sittingScope ? [sittingScope] : defaultSel);
    setCls(classScope || '');
    setRevealed({});
  }, [examId, list, moodEnabled, classScope, sittingScope]);

  useEffect(() => {
    if (!examId || !sel.length) { setFull(undefined); setCare([]); setCareIncomplete(false); return; }
    let alive = true;
    setReportError('');
    api.fullReport(examId, sel, cls || undefined, threshold).then((result) => { if (alive) setFull(result); })
      .catch((error) => { if (alive) { setFull(undefined); setReportError(error.message); } });
    if (moodEnabled && sel.length === 1) {
      api.careList(examId, sel[0], cls || undefined, threshold).then((r) => {
        if (!alive) return;
        setCare(r.entries);
        setCareIncomplete(Boolean(r.preExamIncomplete));
      }).catch(() => { if (alive) { setCare([]); setCareIncomplete(false); } });
    } else {
      setCare([]);
      setCareIncomplete(false);
    }
    return () => { alive = false; };
  }, [api, examId, sel.join(), cls, threshold, moodEnabled]);

  const classes = [...new Set(availableSittings.filter((s) => sel.includes(s.id)).flatMap((s) => s.classIds))];
  const rep = full?.report;
  const cmp = full?.compare;
  const analysis = analysisOn ? full?.analysis : undefined;
  const mood = moodOn ? full?.moodSummary : undefined;
  const preExam = moodOn ? full?.preExamCounts : undefined;
  const preDetail = moodOn ? full?.preExamDetail : undefined;
  const hasResults = (rep?.students ?? 0) > 0;

  const doExport = async (kind: 'itemAnalysis' | 'researchAnon' | 'researchNamed') => {
    if (!examId || !sel.length || exporting || (!moodOn && !(platform && kind === 'itemAnalysis'))) return;
    setExporting(kind);
    try {
      const res = await api.exportCsv(examId, sel, kind, cls || undefined);
      download(res.filename, res.csv);
    } catch (error) {
      setReportError((error as Error).message);
    } finally {
      setExporting('');
    }
  };

  return (
    <>
      <section className="z-card">
        <div className="z-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {!classScope && <label>考卷<select value={examId} onChange={(e) => setExamId(e.target.value)}>{list.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>}
          {!classScope && classes.length > 1 && <label>班級<select value={cls} onChange={(e) => setCls(e.target.value)}><option value="">全部</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></label>}
          {moodOn && (
            <label>高分門檻 (%)<input type="number" min={0} max={100} value={threshold} onChange={(e) => setThreshold(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} style={{ width: 64 }} /></label>
          )}
          <span className="z-sp" />
          {analysisOn && <button type="button" disabled={!sel.length || !!exporting || !hasResults} onClick={() => void doExport('itemAnalysis')}>試題分析 CSV</button>}
          {moodOn && (
            <>
              <button type="button" disabled={!sel.length || !!exporting || !!full?.preExamIncomplete} title={full?.preExamIncomplete ? '考前練習資料不完整，暫停匯出' : undefined} onClick={() => void doExport('researchAnon')}>研究 CSV（去識別）</button>
              <button type="button" disabled={!sel.length || !!exporting || !!full?.preExamIncomplete} title={full?.preExamIncomplete ? '考前練習資料不完整，暫停匯出' : undefined} onClick={() => void doExport('researchNamed')}>研究 CSV（具名・含個資）</button>
            </>
          )}
        </div>
        {reportError && <p className="z-warn" role="alert">{reportError}</p>}
        <div className="z-row"><span>場次：</span>{availableSittings.map((s) => (
          <label key={s.id} className="z-check">
            <input type="checkbox" checked={sel.includes(s.id)} disabled={!!sittingScope && s.id === sittingScope} onChange={(e) => setSel(e.target.checked ? [...sel.slice(0, classScope ? 1 : sel.length), s.id] : sel.filter((x) => x !== s.id))} />
            {s.label}（{s.results ? `${s.results.matched} 人` : '尚無成績'}）
          </label>
        ))}</div>
        <p className="muted">{classScope ? '可勾選同班另一場比較。' : '勾一場＝單場；勾多場＝合併。'}{moodOn ? '未匯入成績場次可先看考前練習覆蓋率與情緒分布；剛好勾兩場時顯示比較。' : '剛好勾兩場時顯示兩場比較。'}</p>
      </section>

      {rep && (
        <>
          {!hasResults && moodOn && (
            <section className="z-card">
              <p className="muted">本場次尚未匯入 Zuvio 成績（以下顯示考前練習與課前情緒統計；匯入成績後將自動出現試題分析與交叉表）。</p>
            </section>
          )}

          {full?.preExamIncomplete && moodOn && (
            <section className="z-card">
              <p className="z-warn">部分單元作答紀錄超過單次查詢上限，考前練習資料可能不完整（系統未永久定稿）。</p>
            </section>
          )}

          {platform && full?.platformStats && (
            <section className="z-card pq-teacher">
              <h3>成績分布</h3>
              <div className="z-metrics">
                <div className="z-metric">平均 <b>{full.platformStats.mean ?? '—'}</b></div>
                <div className="z-metric">中位數 <b>{full.platformStats.median ?? '—'}</b></div>
                <div className="z-metric">最高 <b>{full.platformStats.max ?? '—'}</b></div>
                <div className="z-metric">最低 <b>{full.platformStats.min ?? '—'}</b></div>
              </div>
              <div className="pq-distribution" aria-label="百分比成績分布">
                {full.platformStats.bins.map((bin) => <div key={bin.label}>
                  <b>{bin.count}</b><i style={{ height: Math.max(2, bin.count / Math.max(1, ...full.platformStats!.bins.map((value) => value.count)) * 105) }} />
                  <span>{bin.label}</span>
                </div>)}
              </div>
            </section>
          )}
          {!moodOn && !platform && (
            <section className="z-card">
              <h3>場次摘要（{rep.students} {sel.length > 1 ? '人次' : '人'}）</h3>
              <div className="z-metrics">
                <div className="z-metric"><small>作答人數</small><b>{rep.students} {sel.length > 1 ? '人次' : '人'}</b></div>
              </div>
              <h4>次單元答對率</h4>
              {rep.subunits.map((s) => <div key={s.unitId} className="z-bar"><span>{s.title}</span><i style={{ width: pct(s.rate) }} /><b>{pct(s.rate)}</b></div>)}
              <h4>逐題答對率</h4>
              <table className="z-table">
                <thead><tr><th>題</th><th>題目</th><th>答對率</th>{cmp && <th>兩場比較</th>}</tr></thead>
                <tbody>{rep.questions.map((q, i) => (
                  <tr key={q.questionId}>
                    <td>Q{i + 1}</td>
                    <td className="z-qtext">{q.text}</td>
                    <td>{pct(q.rate)}</td>
                    {cmp && <td>{pct(cmp[i].rateA)} → {pct(cmp[i].rateB)}</td>}
                  </tr>
                ))}</tbody>
              </table>
            </section>
          )}

          {analysisOn && hasResults && analysis && (
            <section className="z-card">
              <h3>甲表：整卷統計與信度（{rep.students} {sel.length > 1 ? '人次' : '人'}）</h3>
              {analysis.summary.lowSample && <p className="z-warn">作答人數少於 30 人，統計結果僅供參考。</p>}
              {analysis.summary.kr20Low && <p className="z-warn">KR-20 低於 0.50，整卷內部一致性偏低，請留意乙表異常題。</p>}
              <div className="z-metrics">
                <div className="z-metric"><small>平均數</small><b>{analysis.summary.mean}</b><small>SD {analysis.summary.sd}</small></div>
                <div className="z-metric"><small>最低／最高</small><b>{analysis.summary.min} / {analysis.summary.max}</b><small>{analysis.summary.itemCount} 題</small></div>
                <div className="z-metric"><small>KR-20</small><b>{analysis.summary.kr20 ?? '—'}</b><small>SEM {analysis.summary.sem ?? '—'}</small></div>
                {preExam && (
                  <div className="z-metric"><small>考前練習（平均覆蓋 {preDetail?.avgCoverage ?? 0}%）</small><b>達標 {preExam.passed} · 練過 {preExam.practiced}</b><small>僅看教材 {preExam.infographic_only} · 未練 {preExam.none}</small></div>
                )}
              </div>
              {!platform && <><h4>分數分布</h4>
              {analysis.summary.scoreBins.map((b) => (
                <div key={b.label} className="z-bar"><span>{b.label}</span><i style={{ width: pct(analysis.summary.students ? b.count / analysis.summary.students : 0) }} /><b>{b.count} 人</b></div>
              ))}</>}
              <h4>次單元答對率</h4>
              {rep.subunits.map((s) => <div key={s.unitId} className="z-bar"><span>{s.title}</span><i style={{ width: pct(s.rate) }} /><b>{pct(s.rate)}</b></div>)}
            </section>
          )}

          {moodOn && preDetail && (
            <section className="z-card">
              <h3>考前練習詳細統計（全班平均題目覆蓋率 {preDetail.avgCoverage}%）</h3>
              {!hasResults && preExam && (
                <div className="z-metrics" style={{ marginBottom: 12 }}>
                  <div className="z-metric"><small>考前狀態</small><b>達標 {preExam.passed} · 練過 {preExam.practiced}</b><small>僅看教材 {preExam.infographic_only} · 未練 {preExam.none}</small></div>
                </div>
              )}
              <h4>考前覆蓋率 × 分數表現</h4>
              <table className="z-table">
                <thead><tr><th>考前覆蓋率</th><th>人數</th><th>平均分數 (%)</th></tr></thead>
                <tbody>
                  {preDetail.coverageBands.map((b) => (
                    <tr key={b.label}>
                      <td>{b.label}</td>
                      <td>{b.count}</td>
                      <td>{b.avgPercentage !== null ? `${b.avgPercentage}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasResults && (
                <>
                  <h4 style={{ marginTop: 12 }}>逐題：練過 vs 沒練過答對率與鑑別度</h4>
                  <table className="z-table">
                    <thead><tr><th>題</th><th>練過（人數 / 答對率 / D）</th><th>練過且曾答錯（人數 / 答對率）</th><th>沒練過（人數 / 答對率 / D）</th></tr></thead>
                    <tbody>
                      {preDetail.byQuestion.map((q) => (
                        <tr key={q.qid}>
                          <td>{q.label}</td>
                          <td>{q.practicedCount ? `${q.practicedCount} 人 / ${pct(q.practicedAccuracy || 0)} / ${q.practicedD !== null ? q.practicedD.toFixed(2) : '—'}` : '—'}</td>
                          <td>{q.practicedWrongCount ? `${q.practicedWrongCount} 人 / ${pct(q.practicedWrongAccuracy || 0)}` : '—'}</td>
                          <td>{q.unpracticedCount ? `${q.unpracticedCount} 人 / ${pct(q.unpracticedAccuracy || 0)} / ${q.unpracticedD !== null ? q.unpracticedD.toFixed(2) : '—'}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>
          )}

          {mood && mood.totalResponded > 0 && (
            <section className="z-card">
              <h3>考前情緒分布與成績交叉（高分門檻 {mood.threshold}%，填答 {mood.totalResponded} 人）</h3>
              <table className="z-table">
                <thead><tr><th>情緒狀態</th><th>總人數</th><th>≥ {mood.threshold}%</th><th>&lt; {mood.threshold}%</th><th>高分比例</th></tr></thead>
                <tbody>
                  {mood.byScore.map((m) => {
                    const matched = mood.counts[m.code] || 0;
                    return (
                      <tr key={m.code}>
                        <td style={{ color: m.color, fontWeight: 600 }}>{m.label}</td>
                        <td>{matched}</td>
                        <td>{m.highCount}</td>
                        <td>{m.lowCount}</td>
                        <td>{m.total ? pct(m.passRate) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {mood.shifts && (
                <p className="muted" style={{ marginTop: 8 }}>
                  兩場情緒變化（配對 {mood.shifts.totalPaired} 人）：維持不變 {mood.shifts.unchanged} 人・轉綠（微風） {mood.shifts.toGreen} 人・轉紅／霧 {mood.shifts.toFogOrRed} 人
                </p>
              )}
            </section>
          )}

          {analysisOn && hasResults && analysis && (
            <section className="z-card">
              <h3>乙表：逐題難度、鑑別度、r_pb 與誘答分析</h3>
              <table className="z-table">
                <thead><tr><th>題</th><th>題目</th><th>難度 P</th><th>鑑別度 D</th><th>r_pb</th><th>誘答（高分/低分）</th><th>未答</th><th>異常</th>{cmp && <th>兩場比較</th>}</tr></thead>
                <tbody>{analysis.items.map((it, i) => {
                  const q = rep.questions[i];
                  return (
                    <tr key={it.qid}>
                      <td>{it.label}</td>
                      <td className="z-qtext">{q?.text || it.qid}</td>
                      <td><b>{it.p.toFixed(2)}</b></td>
                      <td>{it.d.toFixed(2)}</td>
                      <td>{it.rpb.toFixed(2)}</td>
                      <td>{it.distractors.map((d) => (
                        <span key={d.option} className={'z-opt' + (d.isKey ? ' z-ans' : '')}>
                          {d.option}:{d.total}({d.high}/{d.low})
                        </span>
                      ))}</td>
                      <td>{it.blank}</td>
                      <td>{it.flags.length ? <span className="z-warn">{it.flags.join('、')}</span> : '—'}</td>
                      {cmp && <td>{pct(cmp[i].rateA)} → {pct(cmp[i].rateB)}<br /><small>錯→對 {cmp[i].wrongToRight}・對→錯 {cmp[i].rightToWrong}</small></td>}
                    </tr>
                  );
                })}</tbody>
              </table>
            </section>
          )}

          {mood && mood.totalResponded > 0 && hasResults && (
            <section className="z-card">
              <h4>逐題答對率 × 情緒狀態</h4>
              <table className="z-table">
                <thead><tr><th>題</th>{MOOD_STATES.map((m) => <th key={m.code} style={{ color: m.color }}>{m.label.split('（')[0]}</th>)}</tr></thead>
                <tbody>
                  {mood.byQuestion.map((row) => (
                    <tr key={row.qid}>
                      <td>{row.label}</td>
                      {MOOD_STATES.map((m) => {
                        const st = row.stats[m.code];
                        return <td key={m.code}>{st.count ? `${pct(st.accuracy || 0)} (${st.count})` : '—'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {moodOn && sel.length === 1 && (
            <section className="z-card">
              <h3>關懷名單（僅教師可見 · {care.length} 人）</h3>
              {(careIncomplete || full?.preExamIncomplete) && (
                <p className="z-warn">部分單元作答紀錄超過單次查詢上限，考前練習資料不完整，未讀到者暫不判為確定未練。</p>
              )}
              {!care.length ? <p className="muted">本場次無符合條件的關懷對象。</p> : (
                <table className="z-table">
                  <thead><tr><th>姓名（點擊顯示）</th><th>班級</th><th>成績</th><th>情緒</th><th>考前狀態 / 覆蓋率</th><th>練習分類</th><th>觸發原因</th></tr></thead>
                  <tbody>
                    {care.map((c) => {
                      const show = !!revealed[c.uid];
                      const prepText = c.preExamIncomplete && c.preExamCoverage === 0 && c.preExamStatus === 'none'
                        ? '資料不完整'
                        : `${c.preExamStatus}（${c.preExamCoverage}%）`;
                      return (
                        <tr key={c.uid}>
                          <td>
                            <button type="button" className="z-care-btn" onClick={() => setRevealed((old) => ({ ...old, [c.uid]: !old[c.uid] }))}>
                              {show ? `${c.name} (${c.studentId})` : c.maskedName}
                            </button>
                          </td>
                          <td>{c.classId}</td>
                          <td>{c.score !== null ? `${c.score}${c.percentage !== null ? ` (${c.percentage}%)` : ''}` : '缺考'}</td>
                          <td>{c.mood ? MOOD_STATES.find((m) => m.code === c.mood)?.label.split('（')[0] : '未填'}</td>
                          <td>{prepText}</td>
                          <td>{c.practiceGroup || '—'}</td>
                          <td>{[...c.tags, ...c.streakNotes].join('、')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
