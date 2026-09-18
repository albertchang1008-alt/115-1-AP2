import { useState } from 'react';
import { Course, Unit, unitVisibility, orderedChapters } from '../shared/model';
import { API } from './service';

const zones = [['hidden', '尚未開放'], ['current', '目前學習'], ['archived', '已考完']] as const;
// 依「課程與教材」設定的單元順序（chapterOrder）排列，與學生首頁一致。
function grouped(course: Course, units: Unit[]): [string, Unit[]][] {
  const ids = new Set(units.map((u) => u.id));
  return orderedChapters(course)
    .map(({ name, units: rows }) => [name, rows.filter((u) => ids.has(u.id))] as [string, Unit[]])
    .filter(([, rows]) => rows.length > 0);
}
export default function ProgressBoard({ course, api, notify, changed }: { course: Course; api: API; notify: (s: string) => void; changed: () => Promise<void> }) {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(course.studentNotice || ''), [label, setLabel] = useState('');
  async function run(name: string, data: any) { setBusy(true); try { await api.call(name, { courseId: course.id, ...data }); await changed(); notify('學習進度已更新'); } catch (e) { notify((e as Error).message); } finally { setBusy(false); } }
  return <><header className="pageheading"><div><span className="eyebrow">LEARNING FLOW</span><h1>學習進度</h1><p>單元會連同底下所有題目分類一起移動，並立即同步至已發布課程。</p></div></header><section className="panel"><label className="field">學生首頁提示<textarea maxLength={60} value={notice} onChange={(e) => setNotice(e.target.value)} /></label><button disabled={busy} onClick={() => run('setStudentNotice', { text: notice })}>儲存提示</button></section><section className="panel"><div className="toolbar"><label>本次考試歷史標籤<input maxLength={30} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="例如 第一次期中考" /></label><button disabled={busy || !course.units.some((u) => unitVisibility(u) === 'current')} onClick={() => { if (confirm('將目前學習的所有單元移至已考完？')) void run('endCurrentExam', { archiveLabel: label }); }}>本次考試結束</button></div></section><div className="progress-board">{zones.map(([zone, title]) => { const units = course.units.filter((u) => unitVisibility(u) === zone); return <section className="panel" key={zone}><h2>{title}（{grouped(course, units).length} 個單元）</h2>{grouped(course, units).map(([group, rows]) => <div className="progress-row" key={group}><span>{group} · {rows.length} 個題目分類</span>{zone === 'archived' && <small>{rows[0]?.archiveLabel || '其他'}</small>}<select aria-label={`${group} 整個單元移到`} value="" disabled={busy} onChange={(e) => { if (e.target.value) void run('setUnitVisibility', { unitIds: rows.map((u) => u.id), visibility: e.target.value, archiveLabel: e.target.value === 'archived' ? label : '' }); }}><option value="">整組移到…</option>{zones.filter(([v]) => v !== zone).map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></div>)}{!units.length && <p className="muted">此區目前沒有單元。</p>}</section>; })}</div></>;
}
