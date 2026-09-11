import { useState } from 'react';
import { Question, materialUrl } from '../shared/model';
export function QuestionImage({ url }: { url?: string }) {
  const [expanded, setExpanded] = useState(false), [failed, setFailed] = useState(false);
  if (!url) return null;
  if (!materialUrl(url) || failed) return <p className="error">題目圖片無法載入，請聯絡教師。</p>;
  return <><button className="image-button" onClick={() => setExpanded(true)} aria-label="放大題目圖片"><img className="questionimage" src={url} alt="題目附圖，點擊放大" onError={() => setFailed(true)} /></button>{expanded && <div className="modalshade" role="dialog" aria-modal="true" aria-label="題目圖片" onClick={() => setExpanded(false)}><div className="image-modal"><button autoFocus onClick={() => setExpanded(false)} onKeyDown={(e) => { if (e.key === 'Escape') setExpanded(false); }}>關閉圖片</button><img src={url} alt="放大的題目附圖" /></div></div>}</>;
}
export function Explanations({ q }: { q: Question }) {
  const labels = { concept: '核心概念', misconception: '常見誤解', hint1: '① 先看題幹', hint2: '② 比較觀念', hint3: '③ 推回答案' };
  const items = Object.entries(labels).filter(([key]) => q.socratic?.[key as keyof typeof labels]);
  return <div className="explanations">{q.explanation && <section><h3>傳統解析</h3><p className="preserve-lines">{q.explanation}</p></section>}{items.length > 0 && <section><h3>蘇格拉底式解析</h3>{items.map(([key, label]) => <details key={key}><summary>{label}</summary><p className="preserve-lines">{q.socratic?.[key as keyof typeof labels]}</p></details>)}</section>}{q.lectureUrl && materialUrl(q.lectureUrl) && <a href={q.lectureUrl} target="_blank" rel="noreferrer">{q.lectureTitle || '查看講義'} ↗</a>}{q.remedialUrl && materialUrl(q.remedialUrl) && <a href={q.remedialUrl} target="_blank" rel="noreferrer">查看補強教材 ↗</a>}{!q.explanation && !items.length && <p>此題尚未提供解析。</p>}</div>;
}
