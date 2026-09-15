import { useEffect, useRef, useState } from 'react';
import { Question, materialUrl } from '../shared/model';
export function QuestionImage({ url }: { url?: string }) {
  const [expanded, setExpanded] = useState(false), [failed, setFailed] = useState(false);
  if (!url) return null;
  if (!materialUrl(url) || failed) return <p className="error">題目圖片無法載入，請聯絡教師。</p>;
  return <><button className="image-button" onClick={() => setExpanded(true)} aria-label="放大題目圖片"><img className="questionimage" src={url} alt="題目附圖，點擊放大" onError={() => setFailed(true)} /></button>{expanded && <div className="modalshade" role="dialog" aria-modal="true" aria-label="題目圖片" onClick={() => setExpanded(false)}><div className="image-modal"><button autoFocus onClick={() => setExpanded(false)} onKeyDown={(e) => { if (e.key === 'Escape') setExpanded(false); }}>關閉圖片</button><img src={url} alt="放大的題目附圖" /></div></div>}</>;
}
export function Explanations({ q, audience = 'student', onResearch }: { q: Question; audience?: 'student' | 'teacher'; onResearch?: (v: { format: 'guided' | 'traditional'; action: 'exposed' | 'opened' | 'closed'; seconds?: number }) => void }) {
  const s = q.socratic;
  const forTeacher = audience === 'teacher';
  // 新欄位（引導式解析總表五段，原稱「蘇格拉底式解析」，2026-09-15 改名，欄位鍵名不變）優先；
  // 沒有值時退回 1.2.0 以前發布的舊題庫快照鍵名，讓學生回看歷史版本的解析不會消失。
  // 順序固定 ①～④，不能只改標籤文字。
  // ⑤追溯原子卡是教師備課用的溯源資訊，學生端不顯示；只在教師題目預覽（audience="teacher"）呈現。
  const slots: [string, string | undefined][] = [
    ['① 先想關鍵字', s?.keyword || s?.hint1],
    ['② 提問鏈', s?.chain || s?.hint2],
    ['③ 回頭選答案', s?.decide || s?.hint3],
    ['④ 一句話記憶', s?.memory || s?.concept],
  ];
  if (forTeacher) slots.push(['⑤ 追溯原子卡', s?.trace || s?.misconception]);
  const items = slots.filter(([, value]) => value);
  // 2026-09-15 起：引導式解析一律直接展開顯示，不用點擊——使用者明確要求「一次給到位」。
  // 傳統解析（2026-09-15 第二次調整）改回預設收合，要點 <summary> 才展開，避免跟引導式解析
  // 混在一起、也避免完整測驗作答中一眼看到完整正解說明。學生／教師唯一的差異只剩⑤追溯原子卡。
  const traditionalOpenedAt = useRef(0);
  useEffect(() => {
    if (!onResearch || !items.length) return;
    const timer = window.setTimeout(() => { if (document.visibilityState === 'visible') onResearch({ format: 'guided', action: 'exposed', seconds: 3 }); }, 3000);
    return () => window.clearTimeout(timer);
  }, [onResearch, items.length]);
  const explanation = q.explanation && <details onToggle={(e) => {
    const open = (e.currentTarget as HTMLDetailsElement).open;
    if (open) { traditionalOpenedAt.current = Date.now(); onResearch?.({ format: 'traditional', action: 'opened' }); }
    else if (traditionalOpenedAt.current) { onResearch?.({ format: 'traditional', action: 'closed', seconds: Math.min(600, Math.max(1, Math.round((Date.now() - traditionalOpenedAt.current) / 1000))) }); traditionalOpenedAt.current = 0; }
  }}><summary>傳統解析</summary><p className="preserve-lines">{q.explanation}</p></details>;
  return <div className="explanations">{items.length > 0 && <section><h3>引導式解析</h3>{items.map(([label, value]) => <div className="explanationstep" key={label}><h4>{label}</h4><p className="preserve-lines">{value}</p></div>)}</section>}{explanation}{q.lectureUrl && materialUrl(q.lectureUrl) && <a href={q.lectureUrl} target="_blank" rel="noreferrer">{q.lectureTitle || '查看講義'} ↗</a>}{q.remedialUrl && materialUrl(q.remedialUrl) && <a href={q.remedialUrl} target="_blank" rel="noreferrer">查看補強教材 ↗</a>}{!q.explanation && !items.length && <p>此題尚未提供解析。</p>}</div>;
}
