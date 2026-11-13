import { useEffect, useMemo, useState } from 'react';
import { allocate, drawItems, optionOrderFor, parseZuvioMatrix, type ZPoolEntry, type ZExamView, type ZItem } from '../shared/zuvio';
import { fakeZuvioExport } from '../shared/zuvioSample';
import { readXlsxFirstSheetMatrix } from './pptImportFiles';
import { cloudZuvioApi, sampleZuvioApi, type ZuvioApi, type ExamSummary, type ImportPreview, type Sitting, type FullZuvioReport } from './zuvioApi';
import { MOOD_STATES, type CareListEntry } from '../shared/zuvioExt';
import { SAMPLE_POOL } from '../shared/zuvioSamplePool';

type Tab = 'make' | 'exams' | 'report';
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
export function ZuvioTab({ api, courseId, notify }: { api: { preview: boolean; call<T = any>(name: string, data?: any): Promise<T> }; courseId: string; notify: (m: string) => void }) {
  const z = useMemo(() => (api.preview ? sampleZuvioApi(SAMPLE_POOL) : cloudZuvioApi(api, courseId)), [api, courseId]);
  return <ZuvioExams api={z} notify={notify} />;
}

export default function ZuvioExams({ api, notify = () => {} }: { api: ZuvioApi; notify?: (m: string) => void }) {
  const [tab, setTab] = useState<Tab>('make');
  const [openExam, setOpenExam] = useState<string>('');
  return (
    <div className="zuvio">
      <div className="sectionhead"><h2>Zuvio 出題</h2>{api.sample && <span className="z-badge">樣張：示範題目與合成學生</span>}</div>
      <div className="z-tabs" role="tablist">
        {([['make', '出題'], ['exams', '考卷與場次'], ['report', '報表']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'make' && <Make api={api} notify={notify} done={(id) => { setOpenExam(id); setTab('exams'); }} />}
      {tab === 'exams' && <Exams api={api} notify={notify} open={openExam} setOpen={setOpenExam} />}
      {tab === 'report' && <Report api={api} initial={openExam} />}
    </div>
  );
}

// ---------------- 出題 ----------------
type Mode = 'proportional' | 'equal' | 'custom';
function Make({ api, notify, done }: { api: ZuvioApi; notify: (m: string) => void; done: (id: string) => void }) {
  const [data, setData] = useState<Awaited<ReturnType<ZuvioApi['pool']>>>();
  const [checked, setChecked] = useState<string[]>([]);
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
      const r = await api.createExam({ examId: uuid(), title: title.trim(), score: scorePer, classIds, items });
      download(fileName(title.trim()), r.csv);
      notify('已建立考卷並下載 CSV');
      done(r.examId);
    } catch (e: any) { notify(e.message); } finally { setBusy(false); }
  }
  const pickedBy = (u: string) => picked.filter((p) => p.e.unitId === u).length;
  return (
    <>
      <section className="z-card">
        <h3>1. 勾選出題範圍（次單元）</h3>
        {excludedText && <p className="muted">已自動排除：{excludedText}。</p>}
        {[...tree].map(([g, us]) => {
          const ids = [...us.keys()];
          const all = ids.every((x) => checked.includes(x));
          return (
            <div className="z-group" key={g}>
              <label className="z-grouphead"><input type="checkbox" checked={all} ref={(el) => { if (el) el.indeterminate = !all && ids.some((x) => checked.includes(x)); }} onChange={(e) => toggle(ids, e.target.checked)} />
                <b>{g}</b><span className="muted">{[...us.values()].reduce((a, b) => a + b.n, 0)} 題</span></label>
              {[...us].map(([u, info]) => (
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
            <button onClick={draw}>全部重抽</button><button className="primary" disabled={busy} onClick={create}>建立考卷並下載 CSV</button></div>
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

function ExamDetail({ api, notify, examId, back }: { api: ZuvioApi; notify: (m: string) => void; examId: string; back: () => void }) {
  const [d, setD] = useState<Awaited<ReturnType<ZuvioApi['getExam']>>>();
  const [newS, setNewS] = useState({ label: '', date: today(), classIds: [] as string[] });
  const [importing, setImporting] = useState<string>('');
  const reload = () => api.getExam(examId).then(setD);
  useEffect(() => { reload(); }, [examId]);
  if (!d) return <p className="muted">讀取中…</p>;
  async function addSitting() {
    if (!newS.label.trim() || !newS.classIds.length) return notify('請填場次名稱並選班級');
    await api.createSitting(examId, { ...newS, label: newS.label.trim() });
    setNewS({ label: '', date: today(), classIds: [] });
    reload();
  }
  return (
    <>
      <div className="z-row"><button onClick={back}>← 考卷列表</button><span className="z-sp" />{d.csv ? <button onClick={() => download(fileName(d.summary.title), d.csv!)}>重新下載 CSV</button> : <span className="z-warn">有 {d.masked} 題已列為正式測驗保留題，不能重新下載</span>}</div>
      <section className="z-card">
        <h3>{d.summary.title}</h3>
        <p className="muted">{d.view.items.length} 題・每題 {d.view.score} 分・可使用班級：{d.classIds.join('、')}・重新下載的檔案與建立時完全相同</p>
        <h4>場次</h4>
        <table className="z-table"><thead><tr><th>場次</th><th>日期</th><th>開考時間</th><th>班級</th><th>成績</th><th /></tr></thead>
          <tbody>{d.summary.sittings.map((s) => (
            <tr key={s.id}><td>{s.label}</td><td>{s.date}</td>
              <td>
                {s.startsAt ? new Date(s.startsAt).toLocaleString('zh-TW', { hour12: false }) : '未設定'}
                {' '}
                <button type="button" onClick={async () => {
                  const cur = new Date(s.startsAt || Date.now());
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const def = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}T${pad(cur.getHours())}:${pad(cur.getMinutes())}`;
                  const v = prompt('修改開考時間（YYYY-MM-DDTHH:mm，台北時間）', def);
                  if (!v) return;
                  const ms = Date.parse(v);
                  if (!Number.isFinite(ms)) return notify('時間格式無效');
                  await api.updateSittingStart(examId, s.id, ms);
                  reload();
                }}>改時間</button>
              </td>
              <td>{s.classIds.join('、')}</td>
              <td>{s.results ? `已匯入 ${s.results.matched} 人` : <span className="muted">尚未匯入</span>}</td>
              <td><button onClick={() => setImporting(s.id)}>{s.results ? '重新匯入' : '匯入成績'}</button>
                {s.results && <button onClick={async () => { if (confirm('刪除這一場的成績？')) { await api.deleteResults(examId, s.id); reload(); } }}>刪除成績</button>}
                <button onClick={async () => { if (confirm('清除這一場的情緒簽到紀錄？')) { await api.deleteMood(examId, s.id); notify('已清除情緒紀錄'); } }}>刪情緒</button></td></tr>
          ))}</tbody></table>
        <div className="z-row z-new">
          <label>新增場次<input placeholder="例：乙班 第1次" value={newS.label} onChange={(e) => setNewS({ ...newS, label: e.target.value })} /></label>
          <label>日期<input type="date" value={newS.date} onChange={(e) => setNewS({ ...newS, date: e.target.value })} /></label>
          {d.classIds.map((c) => <label key={c} className="z-check"><input type="checkbox" checked={newS.classIds.includes(c)} onChange={(e) => setNewS({ ...newS, classIds: e.target.checked ? [...newS.classIds, c] : newS.classIds.filter((x) => x !== c) })} />{c}</label>)}
          <button onClick={addSitting}>新增</button>
        </div>
        <p className="muted">再考一次時，請在 Zuvio 複製一份新考卷或重新匯入同一個 CSV，不要重新開放舊考卷，以免匯出檔只剩最後一次作答。</p>
      </section>
      {importing && <ImportPanel api={api} notify={notify} view={d.view} examId={examId} sitting={d.summary.sittings.find((s) => s.id === importing)!} close={() => { setImporting(''); reload(); }} />}
      <section className="z-card">
        <h4>題目（依 Zuvio 顯示順序）</h4>
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
function Report({ api, initial }: { api: ZuvioApi; initial: string }) {
  const [list, setList] = useState<ExamSummary[]>([]);
  const [examId, setExamId] = useState(initial);
  const [sel, setSel] = useState<string[]>([]);
  const [cls, setCls] = useState('');
  const [threshold, setThreshold] = useState(80);
  const [full, setFull] = useState<FullZuvioReport>();
  const [care, setCare] = useState<CareListEntry[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    api.listExams().then((l) => {
      setList(l);
      const first = initial || l.find((e) => e.sittings.some((s) => s.results))?.id || '';
      setExamId(first);
    });
  }, [api]);

  const exam = list.find((e) => e.id === examId);
  const withResults = exam?.sittings.filter((s) => s.results) || [];
  useEffect(() => { setSel(withResults.map((s) => s.id).slice(0, 1)); setCls(''); setRevealed({}); }, [examId, list]);
  useEffect(() => {
    if (!examId || !sel.length) { setFull(undefined); setCare([]); return; }
    api.fullReport(examId, sel, cls || undefined, threshold).then(setFull);
    if (sel.length === 1) {
      api.careList(examId, sel[0], cls || undefined, threshold).then((r) => setCare(r.entries));
    } else {
      setCare([]);
    }
  }, [examId, sel.join(), cls, threshold]);

  const classes = [...new Set(withResults.filter((s) => sel.includes(s.id)).flatMap((s) => s.classIds))];
  const rep = full?.report;
  const cmp = full?.compare;
  const analysis = full?.analysis;
  const mood = full?.moodSummary;
  const preExam = full?.preExamCounts;

  const doExport = async (kind: 'itemAnalysis' | 'researchAnon' | 'researchNamed') => {
    if (!examId || !sel.length || exporting) return;
    setExporting(kind);
    try {
      const res = await api.exportCsv(examId, sel, kind, cls || undefined);
      download(res.filename, res.csv);
    } finally {
      setExporting('');
    }
  };

  return (
    <>
      <section className="z-card">
        <div className="z-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <label>考卷<select value={examId} onChange={(e) => setExamId(e.target.value)}>{list.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
          {classes.length > 1 && <label>班級<select value={cls} onChange={(e) => setCls(e.target.value)}><option value="">全部</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></label>}
          <label>高分門檻<input type="number" min={0} max={100} value={threshold} onChange={(e) => setThreshold(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} style={{ width: 64 }} /></label>
          <span className="z-sp" />
          <button type="button" disabled={!sel.length || !!exporting} onClick={() => void doExport('itemAnalysis')}>試題分析 CSV</button>
          <button type="button" disabled={!sel.length || !!exporting} onClick={() => void doExport('researchAnon')}>研究 CSV（去識別）</button>
          <button type="button" disabled={!sel.length || !!exporting} onClick={() => void doExport('researchNamed')}>研究 CSV（具名・含個資）</button>
        </div>
        <div className="z-row"><span>場次：</span>{withResults.map((s) => (
          <label key={s.id} className="z-check"><input type="checkbox" checked={sel.includes(s.id)} onChange={(e) => setSel(e.target.checked ? [...sel, s.id] : sel.filter((x) => x !== s.id))} />{s.label}（{s.results!.matched} 人）</label>
        ))}</div>
        <p className="muted">勾一場＝單場；勾多場＝合併；剛好勾兩場時另外顯示兩場比較與情緒變化。</p>
      </section>

      {rep && analysis && (
        <>
          <section className="z-card">
            <h3>甲表：整卷統計與信度（{rep.students} {sel.length > 1 ? '人次' : '人'}）</h3>
            {analysis.summary.lowSample && <p className="z-warn">作答人數少於 30 人，統計結果僅供參考。</p>}
            {analysis.summary.kr20Low && <p className="z-warn">KR-20 低於 0.50，整卷內部一致性偏低，請留意乙表異常題。</p>}
            <div className="z-metrics">
              <div className="z-metric"><small>平均數</small><b>{analysis.summary.mean}</b><small>SD {analysis.summary.sd}</small></div>
              <div className="z-metric"><small>最低／最高</small><b>{analysis.summary.min} / {analysis.summary.max}</b><small>{analysis.summary.itemCount} 題</small></div>
              <div className="z-metric"><small>KR-20</small><b>{analysis.summary.kr20 ?? '—'}</b><small>SEM {analysis.summary.sem ?? '—'}</small></div>
              {preExam && (
                <div className="z-metric"><small>考前練習</small><b>達標 {preExam.passed} · 練過 {preExam.practiced}</b><small>僅看教材 {preExam.infographic_only} · 未練 {preExam.none}</small></div>
              )}
            </div>
            <h4>分數分布</h4>
            {analysis.summary.scoreBins.map((b) => (
              <div key={b.label} className="z-bar"><span>{b.label}</span><i style={{ width: pct(analysis.summary.students ? b.count / analysis.summary.students : 0) }} /><b>{b.count} 人</b></div>
            ))}
            <h4>次單元答對率</h4>
            {rep.subunits.map((s) => <div key={s.unitId} className="z-bar"><span>{s.title}</span><i style={{ width: pct(s.rate) }} /><b>{pct(s.rate)}</b></div>)}
          </section>

          {mood && mood.totalResponded > 0 && (
            <section className="z-card">
              <h3>考前情緒分布與成績交叉（高分門檻 {mood.threshold} 分，填答 {mood.totalResponded} 人）</h3>
              <table className="z-table">
                <thead><tr><th>情緒狀態</th><th>總人數</th><th>≥ {mood.threshold} 分</th><th>&lt; {mood.threshold} 分</th><th>高分比例</th></tr></thead>
                <tbody>
                  {mood.byScore.map((m) => (
                    <tr key={m.code}>
                      <td style={{ color: m.color, fontWeight: 600 }}>{m.label}</td>
                      <td>{m.total}</td>
                      <td>{m.highCount}</td>
                      <td>{m.lowCount}</td>
                      <td>{pct(m.passRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {mood.shifts && (
                <p className="muted" style={{ marginTop: 8 }}>
                  兩場情緒變化（配對 {mood.shifts.totalPaired} 人）：維持不變 {mood.shifts.unchanged} 人・轉綠（微風） {mood.shifts.toGreen} 人・轉紅／霧 {mood.shifts.toFogOrRed} 人
                </p>
              )}
            </section>
          )}

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

          {mood && mood.totalResponded > 0 && (
            <section className="z-card">
              <h4>逐題答對率 × 情緒狀態</h4>
              <table className="z-table">
                <thead><tr><th>題</th>{MOOD_STATES.map((m) => <th key={m.code} style={{ color: m.color }}>{m.label.split('：')[0]}</th>)}</tr></thead>
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

          {sel.length === 1 && (
            <section className="z-card">
              <h3>關懷名單（僅教師可見 · {care.length} 人）</h3>
              {!care.length ? <p className="muted">本場次無符合條件的關懷對象。</p> : (
                <table className="z-table">
                  <thead><tr><th>姓名（點擊顯示）</th><th>班級</th><th>成績</th><th>情緒</th><th>考前練習</th><th>觸發原因</th></tr></thead>
                  <tbody>
                    {care.map((c) => {
                      const show = !!revealed[c.uid];
                      return (
                        <tr key={c.uid}>
                          <td>
                            <button type="button" className="z-care-btn" onClick={() => setRevealed((old) => ({ ...old, [c.uid]: !old[c.uid] }))}>
                              {show ? `${c.name} (${c.studentId})` : c.maskedName}
                            </button>
                          </td>
                          <td>{c.classId}</td>
                          <td>{c.score ?? '缺考'}</td>
                          <td>{c.mood ? MOOD_STATES.find((m) => m.code === c.mood)?.label.split('：')[0] : '未填'}</td>
                          <td>{c.preExamStatus}</td>
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
