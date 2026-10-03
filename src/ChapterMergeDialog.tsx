import { useState } from 'react';
import { Course, orderedChapters } from '../shared/model';
import { ChapterMergePreview } from '../shared/chapterMerge';
import { API } from './service';

export default function ChapterMergeDialog({ course, sourceName, api, onClose, onMerged, notify }: {
  course: Course; sourceName: string; api: API; onClose: () => void; onMerged: (course: Course) => void; notify: (message: string) => void;
}) {
  const targets = orderedChapters(course).filter(row => row.name !== sourceName);
  const [targetName, setTargetName] = useState(targets[0]?.name || '');
  const [preview, setPreview] = useState<ChapterMergePreview>();
  const [busy, setBusy] = useState(false);
  const request = async (confirm = false) => {
    setBusy(true);
    try {
      const result = await api.call<ChapterMergePreview & { course?: Course }>('mergeChapter', {
        courseId: course.id, sourceName, targetName, expectedDraft: course,
        ...(confirm ? { confirmationToken: preview?.confirmationToken } : { preview: true }),
      });
      if (confirm && result.course) { onMerged(result.course); notify(`已合併到「${targetName}」，保留 ${result.affectedStudents} 位學生的活動紀錄`); }
      else setPreview(result);
    } catch (error) { setPreview(undefined); notify((error as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="modalshade"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="chapter-merge-title">
    <div className="sectionhead"><h2 id="chapter-merge-title">合併單元「{sourceName}」</h2><button disabled={busy} onClick={onClose}>取消</button></div>
    <label className="field">合併到<select aria-label="合併目標單元" disabled={busy} value={targetName} onChange={e => { setTargetName(e.target.value); setPreview(undefined); }}>{targets.map(row => <option key={row.name} value={row.name}>{row.chapter.title}</option>)}</select></label>
    <p>來源單元會從單元安排移除。活動依序附加；同 ID 活動沿用目標內容，既有設定優先。學生既有完成紀錄保留，已完成活動不會變回未完成；研究與診斷紀錄保留。</p>
    {preview && <div className="notice"><h3>合併前確認</h3><p>受影響學生：{preview.affectedStudents} 人</p><p>會搬移的活動（{preview.activities.length} 個）：</p>{preview.activities.length ? <ul>{preview.activities.map(a => <li key={a.id}>{a.title}（{a.id}）{a.alreadyInTarget ? '：目標已有同 ID，活動不重複，仍保留完成紀錄' : ''}</li>)}</ul> : <p>無活動；只合併設定並移除空單元。</p>}</div>}
    {preview?.blockedReason && <p className="error" role="alert">{preview.blockedReason}</p>}
    <div className="actions"><button disabled={busy || !targetName} onClick={() => void request()}>預覽合併</button>{preview && <button className="primary" disabled={busy || !!preview.blockedReason} onClick={() => void request(true)}>確認合併到「{targetName}」</button>}</div>
  </section></div>;
}
