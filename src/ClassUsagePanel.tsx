import { useEffect, useState } from 'react';
import type { API } from './service';
import type { UsageStats } from '../shared/usageStats';
import { isTestClass } from '../shared/answerIntegrity';
export function ClassUsagePanel({
  api,
  courseId,
  classId,
}: {
  api: API;
  courseId: string;
  classId: string;
}) {
  const [open, setOpen] = useState(false),
    [data, setData] = useState<UsageStats | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [reload, setReload] = useState(0);
  useEffect(() => {
    setData(null);
    setError('');
    setLoading(false);
    if (!open || api.preview || isTestClass(classId)) return;
    let active = true;
    setLoading(true);
    api
      .call<UsageStats>('getClassUsageStats', { courseId, classId })
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, courseId, classId, open, reload]);
  if (isTestClass(classId)) return null;
  const max = Math.max(1, ...(data?.daily.map((d) => d.users) || [])),
    peak = Math.max(1, ...(data?.heat.flat() || []));
  return (
    <section className="panel usage-panel">
      <div className="sectionhead">
        <div>
          <h2>使用情況</h2>
          <p className="muted">{classId} 班 · 近 28 天 · 台灣時間 · 排除 test 班與複習考</p>
        </div>
        <button onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? '收合使用情況' : '查看使用情況'}
        </button>
      </div>
      {open && (
        <>
          <button disabled={loading || api.preview} onClick={() => setReload((n) => n + 1)}>
            重新讀取使用情況
          </button>
          {api.preview ? (
            <p>預覽不讀取正式使用紀錄。</p>
          ) : loading ? (
            <p role="status">讀取使用情況…</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            data && (
              <>
                {!!data.missingDays?.length && <p className="notice">{data.missingDays.length} 天尚未建立摘要，圖上的零值不是已驗證無活動；請教師補算。</p>}
                <h3>每日使用人數</h3>
                <div className="usage-bars" role="img" aria-label="近28天每日不重複使用人數">
                  {data.daily.map((d) => (
                    <div key={d.date} title={`${d.date}：${d.users} 人，${d.records} 筆紀錄`}>
                      <small>{d.users}</small>
                      <span style={{ height: `${Math.max(2, (90 * d.users) / max)}px` }} />
                      <small>{d.date.slice(5)}</small>
                    </div>
                  ))}
                </div>
                <p>
                  每週不重複使用人數（週一開始，首尾週僅計近 28 天範圍）：
                  {data.weekly.map((w) => `${w.monday}：${w.users} 人`).join('；')}
                </p>
                <h3>星期 × 時段</h3>
                <div className="tablewrap">
                  <table className="usage-heat">
                    <thead>
                      <tr>
                        <th>星期</th>
                        {Array.from({ length: 12 }, (_, i) => (
                          <th key={i}>
                            {i * 2}–{i * 2 + 2}時
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.heat.map((row, i) => (
                        <tr key={i}>
                          <th>{['一', '二', '三', '四', '五', '六', '日'][i]}</th>
                          {row.map((n, j) => (
                            <td
                              key={j}
                              title={`${n} 筆活動紀錄`}
                              style={{
                                background: `rgba(29,130,142,${n ? 0.12 + (0.5 * n) / peak : 0.03})`,
                              }}
                            >
                              {n}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  各單元截止前 24 小時作答占比（分母為近 28 天該單元作答）：
                  {data.deadlines.length
                    ? data.deadlines
                        .map(
                          (d) =>
                            `${d.title}：${d.ratio === null ? '尚無作答' : `${Math.round(d.ratio * 100)}%（${d.within}/${d.total}）`}`,
                        )
                        .join('；')
                    : '目前沒有設定截止時間的單元'}
                </p>
                <h3>最近 10 分鐘有活動：{data.recent.length} 人</h3>
                <p className="muted">
                  依最新既有紀錄估計，截至{' '}
                  {new Date(data.generatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                  ；不代表仍在線上，沒有新增心跳或第三方追蹤。
                </p>
                {data.recent.length ? (
                  <ul>
                    {data.recent.map((s) => (
                      <li key={s.uid}>
                        {s.name}（{s.studentId}）·{' '}
                        {new Date(s.at).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>近 10 分鐘沒有活動紀錄。</p>
                )}
                <details>
                  <summary>計算方式與資料限制</summary>
                  <p>
                    歷史讀每日摘要，今天以 receivedAt 範圍查詢作答、互動教材事件及活動進度最新時間。每日／每週按學生去重；熱度為紀錄筆數，同一活動可能同時產生事件及進度紀錄。活動進度只留最新時間，無法回推過去每次使用；沒有時間戳記的舊進度不推估。讀取{' '}
                    {Object.values(data.reads || {}).reduce((a, b) => a + b, 0)}{' '}
                    筆文件（另含課程與權限查詢）；不快取、不寫回。
                  </p>
                </details>
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
