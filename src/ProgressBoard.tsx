import { useState } from 'react';
import { Course, Unit, unitVisibility, orderedChapters } from '../shared/model';
import { OPEN_STATUS } from '../shared/courseStatus';
import { API } from './service';
import { usePublishedCourse } from './usePublishedCourse';
const zones = [['hidden', OPEN_STATUS.hidden], ['current', OPEN_STATUS.current], ['archived', OPEN_STATUS.archived]] as const;
function grouped(course: Course, units: Unit[]): [string, Unit[]][] {
  const ids = new Set(units.map(u => u.id));
  return orderedChapters(course).map(({ name, units: rows }) => [name, rows.filter(u => ids.has(u.id))] as [string, Unit[]]).filter(([, rows]) => rows.length > 0);
}
export default function ProgressBoard({ course, api, notify, changed }: { course: Course; api: API; notify: (s: string) => void; changed: () => Promise<void> }) {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(course.studentNotice || ''), [label, setLabel] = useState('');
  const { published, loading, error, reload } = usePublishedCourse(api, course);
  const present = (id: string) => published?.units.some(u => u.id === id);
  async function run(name: string, data: any, message = '學習進度已更新') {
    setBusy(true);
    try { await api.call(name, { courseId: course.id, ...data }); await changed(); reload(); notify(message); }
    catch (e) { notify((e as Error).message); } finally { setBusy(false); }
  }
  return <><header className="pageheading"><div><span className="eyebrow">LEARNING FLOW</span><h1>學習進度</h1><p className="notice">這裡的變更會立即對學生生效，不需要更新到學生端</p><p>單元會連同底下所有題目分類一起移動。</p></div></header>
    {error && <p role="alert" className="error">無法確認學生端單元：{error} <button onClick={reload}>重新讀取</button></p>}
    <section className="panel"><label className="field">學生首頁提示<textarea maxLength={60} value={notice} onChange={e => setNotice(e.target.value)} /></label><button disabled={busy} onClick={() => run('setStudentNotice', { text: notice })}>儲存提示</button></section>
    <section className="panel"><div className="toolbar"><label>本次考試歷史標籤<input maxLength={30} value={label} onChange={e => setLabel(e.target.value)} placeholder="例如 第一次期中考" /></label><button disabled={busy || !course.units.some(u => unitVisibility(u) === 'current')} onClick={() => { if (confirm('將目前學習的所有單元移至已考完？')) void run('endCurrentExam', { archiveLabel: label }); }}>本次考試結束</button></div></section>
    <div className="progress-board">{zones.map(([zone, title]) => {
      const units = course.units.filter(u => unitVisibility(u) === zone);
      return <section className="panel" key={zone}><h2>{title}（{grouped(course, units).length} 個單元）</h2>{grouped(course, units).map(([group, rows]) => <div className="progress-row" key={group}>
        <div className="progress-unit-info"><span>{group} · {rows.length} 個題目分類</span>{zone === 'archived' && <small>{rows[0]?.archiveLabel || '其他'}</small>}
          <ul className="progress-published-status">{rows.map(u => <li key={u.id}>{u.title}：{loading ? '正在確認學生端狀態…' : error ? '學生端狀態讀取失敗' : present(u.id) ? '已更新到學生端' : '尚未更新到學生端'}</li>)}</ul>
          {!loading && !error && zone === 'current' && rows.some(u => !present(u.id)) && <p className="notice warning">學生端還沒有這個單元，請先到課程與教材更新到學生端</p>}
        </div>
        <select aria-label={`${group} 整個單元移到`} value="" disabled={busy || loading || !!error} onChange={e => {
          if (!e.target.value) return;
          const missing = e.target.value === 'current' && rows.some(u => !present(u.id));
          void run('setUnitVisibility', { unitIds: rows.map((u) => u.id), visibility: e.target.value, archiveLabel: e.target.value === 'archived' ? label : '' }, missing ? '學生端還沒有這個單元，請先到課程與教材更新到學生端' : '學習進度已更新');
        }}><option value="">整組移到…</option>{zones.filter(([v]) => v !== zone).map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select>
      </div>)}{!units.length && <p className="muted">此區目前沒有單元。</p>}</section>;
    })}</div></>;
}
