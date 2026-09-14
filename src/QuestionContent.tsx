import { useState } from 'react';
import { Question, materialUrl } from '../shared/model';
export function QuestionImage({ url }: { url?: string }) {
  const [expanded, setExpanded] = useState(false), [failed, setFailed] = useState(false);
  if (!url) return null;
  if (!materialUrl(url) || failed) return <p className="error">題目圖片無法載入，請聯絡教師。</p>;
  return <><button className="image-button" onClick={() => setExpanded(true)} aria-label="放大題目圖片"><img className="questionimage" src={url} alt="題目附圖，點擊放大" onError={() => setFailed(true)} /></button>{expanded && <div className="modalshade" role="dialog" aria-modal="true" aria-label="題目圖片" onClick={() => setExpanded(false)}><div className="image-modal"><button autoFocus onClick={() => setExpanded(false)} onKeyDown={(e) => { if (e.key === 'Escape') setExpanded(false); }}>關閉圖片</button><img src={url} alt="放大的題目附圖" /></div></div>}</>;
}
export function Explanations({ q, audience = 'student' }: { q: Question; audience?: 'student' | 'teacher' }) {
  const s = q.socratic;
  const forTeacher = audience === 'teacher';
  // 新欄位（蘇格拉底式解析總表五段）優先；沒有值時退回 1.2.0 以前發布的舊題庫快照鍵名，
  // 讓學生回看歷史版本的解析不會消失。順序固定 ①～④，不能只改標籤文字。
  // ⑤追溯原子卡是教師備課用的溯源資訊，學生端不顯示；只在教師題目預覽（audience="teacher"）呈現。
  const slots: [string, string | undefined][] = [
    ['① 先想關鍵字', s?.keyword || s?.hint1],
    ['② 提問鏈', s?.chain || s?.hint2],
    ['③ 回頭選答案', s?.decide || s?.hint3],
    ['④ 一句話記憶', s?.memory || s?.concept],
  ];
  if (forTeacher) slots.push(['⑤ 追溯原子卡', s?.trace || s?.misconception]);
  const items = slots.filter(([, value]) => value);
  // 傳統解析（q.explanation）放在最後；學生端預設收合，需點選才展開，避免一進頁面就看到答案理由。
  // 教師預覽端保持展開，方便備課時直接掃過內容。
  const explanation = q.explanation && (forTeacher
    ? <section><h3>傳統解析</h3><p className="preserve-lines">{q.explanation}</p></section>
    : <details><summary>傳統解析</summary><p className="preserve-lines">{q.explanation}</p></details>);
  return <div className="explanations">{items.length > 0 && <section><h3>蘇格拉底式解析</h3>{items.map(([label, value]) => <details key={label}><summary>{label}</summary><p className="preserve-lines">{value}</p></details>)}</section>}{explanation}{q.lectureUrl && materialUrl(q.lectureUrl) && <a href={q.lectureUrl} target="_blank" rel="noreferrer">{q.lectureTitle || '查看講義'} ↗</a>}{q.remedialUrl && materialUrl(q.remedialUrl) && <a href={q.remedialUrl} target="_blank" rel="noreferrer">查看補強教材 ↗</a>}{!q.explanation && !items.length && <p>此題尚未提供解析。</p>}</div>;
}
