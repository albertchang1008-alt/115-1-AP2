import { useEffect, useRef, useState } from 'react';
import type { Course, ReflectionResponse } from '../shared/model';
import { chaptersOf } from '../shared/model';
import { reflectionCsv } from '../shared/reflection';
import type { API } from './service';

type Results = {
  rows: (ReflectionResponse & { researchId: string })[];
  missing: { studentId: string; name: string; classId: string }[];
  rosterCount: number;
  choiceCounts: { id: string; text: string; options: Record<string, number> }[];
};
export function ReflectionResults({ course, api }: { course: Course; api: API }) {
  const chapters = Object.entries(chaptersOf(course)).filter(([, c]) =>
    c.activities.some((a) => a.type === 'reflection'),
  );
  const [chapterId, setChapter] = useState(chapters[0]?.[0] || ''),
    [activityId, setActivity] = useState(''),
    [classId, setClass] = useState(''),
    [data, setData] = useState<Results | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [descending, setDescending] = useState(true);
  const ticket = useRef(0);
  const activities =
    chapters
      .find(([id]) => id === chapterId)?.[1]
      .activities.filter((a) => a.type === 'reflection') || [];
  const selected = activities.find((a) => a.id === activityId)?.id || activities[0]?.id || '';
  useEffect(() => {
    ticket.current++;
    setData(null);
    setError('');
    setBusy(false);
  }, [course.id, chapterId, selected, classId]);
  async function load() {
    const t = ++ticket.current;
    setBusy(true);
    setError('');
    try {
      const result = await api.call<Results>('getReflections', {
        courseId: course.id,
        chapterId,
        activityId: selected,
        classId,
      });
      if (ticket.current === t) setData(result);
    } catch (e) {
      if (ticket.current === t) {
        setData(null);
        setError((e as Error).message);
      }
    } finally {
      if (ticket.current === t) setBusy(false);
    }
  }
  const rows = [...(data?.rows || [])].sort((a, b) =>
    descending ? b.submittedAt - a.submittedAt : a.submittedAt - b.submittedAt,
  );
  const prompts = new Map<string, string>();
  rows.forEach((r) => r.promptsSnapshot.forEach((p) => prompts.set(p.id, p.text)));
  const exportCsv = (anonymous: boolean) => {
    const blob = new Blob([reflectionCsv(rows, anonymous)], { type: 'text/csv;charset=utf-8' }),
      url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `反思-${anonymous ? '去識別' : '具名'}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="panel reflection-results" aria-label="反思結果">
      <div className="sectionhead">
        <div>
          <span className="eyebrow">REFLECTION</span>
          <h2>反思結果</h2>
          <p>閱讀學生的觀念改變與仍想釐清的問題。</p>
        </div>
      </div>
      {!chapters.length ? (
        <p>目前沒有反思活動。請在單元活動編輯器新增並發布。</p>
      ) : (
        <>
          <div className="reflection-filters">
            <label>
              單元
              <select
                aria-label="反思單元"
                value={chapterId}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setActivity('');
                }}
              >
                {chapters.map(([id, c]) => (
                  <option key={id} value={id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              活動
              <select
                aria-label="反思活動"
                value={selected}
                onChange={(e) => setActivity(e.target.value)}
              >
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              班級
              <select
                aria-label="反思班級"
                value={classId}
                onChange={(e) => setClass(e.target.value)}
              >
                <option value="">全部班級</option>
                {course.classIds.map((c) => (
                  <option key={c} value={c}>
                    {course.classNames?.[c] || c}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={load} disabled={busy || !selected}>
              {busy ? '讀取中…' : '讀取反思結果'}
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {data && (
            <>
              <p className="reflection-summary">
                已作答 {data.rows.length} 人／名冊 {data.rosterCount} 人
              </p>
              <details>
                <summary>尚未作答 {data.missing.length} 人</summary>
                <ul>
                  {data.missing.map((r) => (
                    <li key={r.classId + r.studentId}>
                      {r.classId} · {r.studentId} · {r.name}
                    </li>
                  ))}
                </ul>
              </details>
              {data.choiceCounts.map((p) => (
                <section key={p.id} className="reflection-bars">
                  <h3>{p.text}</h3>
                  {Object.entries(p.options).map(([o, n]) => (
                    <div key={o}>
                      <span>{o}</span>
                      <meter
                        min={0}
                        max={Math.max(1, data.rows.length)}
                        value={n}
                        aria-label={`${o}：${n}人`}
                      />
                      <strong>{n} 人</strong>
                    </div>
                  ))}
                </section>
              ))}
              <div className="actions">
                <button disabled={!rows.length} onClick={() => exportCsv(false)}>
                  匯出具名 CSV
                </button>
                <button disabled={!rows.length} onClick={() => exportCsv(true)}>
                  匯出去識別 CSV
                </button>
                <button onClick={() => setDescending(!descending)}>
                  送出時間：{descending ? '新到舊' : '舊到新'}
                </button>
              </div>
              <p className="muted">
                去識別版僅保留研究代碼、班級、送出時間與答案。答案本身可能含個人資訊，研究整理時請檢視。題目改版後每筆答案仍顯示送出當時的題目。
              </p>
              <div className="tablewrap">
                <table aria-label="反思作答明細">
                  <thead>
                    <tr>
                      <th>學號</th>
                      <th>姓名</th>
                      <th>班級</th>
                      <th>送出時間</th>
                      {[...prompts].map(([id, text]) => (
                        <th key={id}>{text}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.uid}>
                        <td>{r.studentId}</td>
                        <td>{r.name}</td>
                        <td>{r.classCode}</td>
                        <td>
                          {new Date(r.submittedAt).toLocaleString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                          })}
                        </td>
                        {[...prompts].map(([id]) => (
                          <td key={id} className="reflection-answer">
                            {r.promptsSnapshot.find((p) => p.id === id)?.text && (
                              <small className="block">
                                {r.promptsSnapshot.find((p) => p.id === id)?.text}
                              </small>
                            )}
                            {r.answers[id] || '未填寫'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
