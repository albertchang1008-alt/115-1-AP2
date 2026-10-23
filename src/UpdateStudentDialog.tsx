import { useEffect, useRef } from 'react';
import { Course } from '../shared/model';
import { studentUpdateSummary } from '../shared/courseStatus';
export default function UpdateStudentDialog({ draft, published, busy, cancel, confirm }: {
  draft: Course; published?: Course; busy: boolean; cancel: () => void; confirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null), summary = studentUpdateSummary(draft, published);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="modal update-student-dialog" aria-labelledby="student-update-title" onCancel={e => { e.preventDefault(); if (!busy) cancel(); }}>
    <h2 id="student-update-title">確認更新到學生端</h2><p>將目前草稿更新為學生端使用的版本。</p>
    <ul className="update-counts">{(['chapters','units','activities'] as const).map((key, i) => <li key={key}>{['章節','單元','活動'][i]}：新增 {summary[key].added}、修改 {summary[key].modified}、移除 {summary[key].removed}</li>)}</ul>
    <p className="notice warning"><strong>尚未開放的單元，學生仍然看不到</strong>；要讓學生開始，請到「學習進度」改為「目前學習」。</p>
    <h3>更新後仍尚未開放的單元（{summary.hidden.length}）</h3>{summary.hidden.length ? <ul>{summary.hidden.map(s => <li key={s}>{s}</li>)}</ul> : <p>沒有尚未開放的單元。</p>}
    {!!summary.currentWithoutClasses.length && <section className="notice warning"><h3>目前學習，但沒有任何班級勾選</h3><ul>{summary.currentWithoutClasses.map(s => <li key={s}>{s}</li>)}</ul></section>}
    {!!summary.selectedHidden.length && <section className="notice warning"><h3>已勾選班級，但仍尚未開放</h3><ul>{summary.selectedHidden.map(s => <li key={s}>{s}</li>)}</ul></section>}
    <div className="actions"><button className="primary" disabled={busy} onClick={confirm}>確定更新到學生端</button><button autoFocus disabled={busy} onClick={cancel}>取消</button></div>
  </dialog>;
}
