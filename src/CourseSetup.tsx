import { useEffect, useRef, useState } from 'react';
import { Course, safeCode, orderedChapters } from '../shared/model';
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
function TriCheck({ state, label, onChange }: { state: 'all' | 'some' | 'none'; label: string; onChange: (checked: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = state === 'some'; }, [state]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={state === 'all'} onChange={(e) => onChange(e.target.checked)} />;
}
// 班級 × 單元對照表：勾一個單元時，儲存其所有題目分類的 ID。
export function ClassManager({ course, change }: { course: Course; change: (c: Course) => void }) {
  const [code, setCode] = useState(''), [name, setName] = useState(''), [error, setError] = useState('');
  const chapters = orderedChapters(course);
  const selectedOf = (cl: string) => course.classUnits?.[cl] || course.units.map((u) => u.id);
  const stateOf = (cl: string, ids: string[]): 'all' | 'some' | 'none' => {
    const sel = selectedOf(cl), n = ids.filter((id) => sel.includes(id)).length;
    return n === 0 ? 'none' : n === ids.length ? 'all' : 'some';
  };
  const setMany = (cl: string, ids: string[], on: boolean) => {
    const sel = selectedOf(cl);
    const next = on ? [...sel, ...ids.filter((id) => !sel.includes(id))] : sel.filter((id) => !ids.includes(id));
    change({ ...course, classUnits: { ...course.classUnits, [cl]: course.units.map((u) => u.id).filter((id) => next.includes(id)) } });
  };
  const addClass = () => {
    const cl = code.trim(); if (!safeCode(cl) || !name.trim()) return setError('請填寫班級名稱與班級代碼（可用中文、英數字、- 或 _，不能有空白）');
    if (course.classIds.includes(cl)) return setError('本課程已有此班級代碼');
    change({ ...course, classIds: [...course.classIds, cl], classNames: { ...course.classNames, [cl]: name.trim() }, classUnits: { ...course.classUnits, [cl]: course.units.map((u) => u.id) } }); setCode(''); setName(''); setError('');
  };
  const renameClass = (cl: string) => {
    const next = prompt('班級名稱', course.classNames?.[cl] || cl)?.trim(); if (!next) return;
    change({ ...course, classNames: { ...course.classNames, [cl]: next } });
  };
  const removeClass = (cl: string) => {
    if (!confirm(`從草稿移除「${course.classNames?.[cl] || cl}」？發布前學生權限不變，既有名冊與紀錄會保留。`)) return;
    const classUnits = { ...course.classUnits }, classNames = { ...course.classNames }, classOverrides = { ...course.classOverrides };
    delete classUnits[cl]; delete classNames[cl]; delete classOverrides[cl];
    change({ ...course, classIds: course.classIds.filter((c) => c !== cl), classUnits, classNames, classOverrides });
  };
  const allIds = course.units.map((u) => u.id);
  return <section className="panel">
    <h2>班級與適用單元</h2>
    <p className="muted">每一列是一個單元；打勾代表該班看得到底下全部題目分類並會計分。結構來自 Google Sheet。</p>
    <div className="class-add">
      <input aria-label="班級名稱" value={name} onChange={(e) => setName(e.target.value)} placeholder="班級名稱，例如 護理一甲" />
      <input aria-label="班級代碼" value={code} onChange={(e) => setCode(e.target.value)} placeholder="班級代碼，例如 護525" />
      <button type="button" onClick={addClass}>新增班級</button>
    </div>
    {error && <p className="error">{error}</p>}
    {!course.classIds.length ? <p className="muted">尚未新增班級。</p> : !course.units.length ? <p className="muted">尚未有單元，請先到題庫管理同步 Google Sheet。</p> :
    <div className="class-matrix-wrap"><table className="class-matrix">
      <thead><tr><th scope="col">單元</th>{course.classIds.map((cl) => <th scope="col" key={cl}>
        <div className="class-head"><strong>{course.classNames?.[cl] || cl}</strong>{course.classNames?.[cl] && course.classNames[cl] !== cl && <span className="muted">{cl}</span>}</div>
        <div className="class-head-actions"><button type="button" onClick={() => renameClass(cl)}>改名</button><button type="button" onClick={() => removeClass(cl)}>移除</button></div>
      </th>)}</tr>
      <tr className="matrix-all"><th scope="row">全部（{allIds.length} 節）</th>{course.classIds.map((cl) => <td key={cl}><TriCheck state={stateOf(cl, allIds)} label={`${cl} 全部`} onChange={(on) => setMany(cl, allIds, on)} /> <span className="muted">{selectedOf(cl).filter((id) => allIds.includes(id)).length}</span></td>)}</tr></thead>
      <tbody>{chapters.map(({ name, units }) => { const ids = units.map((u) => u.id); return <tr key={name} className="matrix-group"><th scope="row">{name} <span className="muted">· {ids.length} 個分類</span></th>{course.classIds.map((cl) => <td key={cl}><TriCheck state={stateOf(cl, ids)} label={`${cl} ${name}`} onChange={(on) => setMany(cl, ids, on)} /></td>)}</tr>; })}</tbody>
    </table></div>}
    <p className="muted">未勾選的單元，該班學生看不到、也不計分。開放時間、期限與必做請在下方單元設定調整。</p>
  </section>;
}
