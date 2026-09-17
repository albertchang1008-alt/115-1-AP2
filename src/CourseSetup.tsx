import { useState } from 'react';
import { Course, safeCode } from '../shared/model';
export function NewCourse({ source, close, create }: { source?: Course; close: () => void; create: (c: Course) => Promise<void> }) {
  const [code, setCode] = useState(''), [title, setTitle] = useState(source ? source.title + '（複本）' : ''), [term, setTerm] = useState(source?.term || '115 學年度第 1 學期'), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <div className="modalshade"><form className="modal" onSubmit={async (e) => {
    e.preventDefault(); setError('');
    if (!safeCode(code.trim()) || !title.trim() || !term.trim()) return setError('請填寫課程名稱、學期及課程代碼（可用中文、英數字、- 或 _，不能有空白）');
    setBusy(true);
    try { await create({ id: code.trim(), title: title.trim(), term: term.trim(), description: source?.description || '', classIds: [], classNames: {}, classUnits: {}, sheetsUrl: '', units: source ? source.units.map((u) => ({ ...structuredClone(u), bankVersion: '' })) : [] }); close(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }}><h2>{source ? '複製課程架構' : '建立課程'}</h2><label className="field">課程名稱<input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} /></label><label className="field">課程代碼<input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="例如 anatomy-115-1 或 解剖生理115-1" /></label><label className="field">學期<input required value={term} onChange={(e) => setTerm(e.target.value)} /></label><p>建立後再新增班級及安排單元。代碼建立後固定，用來對應 Google Sheet。</p>{source && <p>複製單元與教材；新課程的名冊及題庫請重新同步，歷史作答不會複製。</p>}{error && <p role="alert" className="error">{error}</p>}<div className="actions"><button disabled={busy} type="submit">{busy ? '保存中…' : '建立並保存'}</button><button disabled={busy} type="button" onClick={close}>取消</button></div></form></div>;
}
export function ClassManager({ course, change }: { course: Course; change: (c: Course) => void }) {
  const [code, setCode] = useState(''), [name, setName] = useState(''), [error, setError] = useState('');
  const update = (cl: string, ids: string[]) => change({ ...course, classUnits: { ...course.classUnits, [cl]: ids } });
  return <section className="panel"><h2>課程班級與適用單元</h2><div className="formgrid"><label className="field">班級名稱<input value={name} onChange={(e) => setName(e.target.value)} placeholder="護理一甲" /></label><label className="field">班級代碼<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="護525 或 N1A" /></label></div><button type="button" onClick={() => {
    const cl = code.trim(); if (!safeCode(cl) || !name.trim()) return setError('請填寫名稱與班級代碼（可用中文、英數字、- 或 _，不能有空白）');
    if (course.classIds.includes(cl)) return setError('本課程已有此班級代碼');
    change({ ...course, classIds: [...course.classIds, cl], classNames: { ...course.classNames, [cl]: name.trim() }, classUnits: { ...course.classUnits, [cl]: course.units.map((u) => u.id) } }); setCode(''); setName(''); setError('');
  }}>新增班級</button>{error && <p className="error">{error}</p>}{course.classIds.map((cl) => {
    // 設定頁必須顯示 hidden 次單元；學生可見性由學生端的 forClass() 處理。
    const selected = course.classUnits?.[cl] || course.units.map((u) => u.id);
    const grouped = course.units.reduce<Record<string, typeof course.units>>((all, u) => {
      const group = u.group || '未分類';
      (all[group] ||= []).push(u);
      return all;
    }, {});
    return <details open key={cl} className="class-card"><summary>{course.classNames?.[cl] || cl} · {cl} · {selected.length} 個單元</summary><label className="field">班級名稱<input value={course.classNames?.[cl] || cl} onChange={(e) => change({ ...course, classNames: { ...course.classNames, [cl]: e.target.value } })} /></label><div className="actions"><button onClick={() => update(cl, course.units.map((u) => u.id))}>全部勾選</button><button onClick={() => update(cl, [])}>全部取消</button><button onClick={() => {
      if (!confirm('從草稿移除此班級？發布前學生權限不變，既有名冊與紀錄會保留。')) return;
      const classUnits = { ...course.classUnits }, classNames = { ...course.classNames }, classOverrides = { ...course.classOverrides };
      delete classUnits[cl]; delete classNames[cl]; delete classOverrides[cl];
      change({ ...course, classIds: course.classIds.filter((c) => c !== cl), classUnits, classNames, classOverrides });
  }}>移除班級</button></div><div className="unit-checks">{Object.entries(grouped).map(([group, units]) => <details key={group} open><summary>{group} · {units.length} 個次單元</summary>{units.map((u) => <label className="check" key={u.id}><input type="checkbox" checked={selected.includes(u.id)} onChange={(e) => update(cl, e.target.checked ? [...selected, u.id] : selected.filter((id) => id !== u.id))} />{u.title}</label>)}</details>)}</div><p className="muted">未勾選的單元不顯示、不計分；必做與期限請在單元設定調整。</p><label className="field">套用此班的單元選擇與安排到<select value="" onChange={(e) => { const target = e.target.value; if (target) change({ ...course, classUnits: { ...course.classUnits, [target]: selected }, classOverrides: { ...course.classOverrides, [target]: structuredClone(course.classOverrides?.[cl] || {}) } }); }}><option value="">選擇其他班級</option>{course.classIds.filter((c) => c !== cl).map((c) => <option key={c} value={c}>{course.classNames?.[c] || c}</option>)}</select></label></details>;
  })}</section>;
}
