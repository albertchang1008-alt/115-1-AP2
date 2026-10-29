import { useEffect, useState } from 'react';
import type { API } from './service';
import type { Course } from '../shared/model';
import {
  ANSWER_INTEGRITY,
  isTestClass,
  integrityReasonText,
  integrityFastRatioLabel,
  sortedIntegrityRows,
  type IntegrityStatsResponse,
  type IntegrityRow,
  type IntegritySortKey,
} from '../shared/answerIntegrity';
const seconds = (n: number | null) => (n === null ? '尚無資料' : `${Number(n.toFixed(1))} 秒`);
export function useStudentIntegrityStats(api: API, courseId: string, classId: string, uid: string) {
  const [data, setData] = useState<IntegrityStatsResponse | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setData(null);
    setError('');
    setLoading(false);
    if (api.preview || !uid || isTestClass(classId)) return;
    let active = true;
    setLoading(true);
    api
      .call<IntegrityStatsResponse>('getAnswerIntegrityStats', { courseId, classId, uid })
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, courseId, classId, uid, retry]);
  return { data, error, loading, retry: () => setRetry((n) => n + 1) };
}
export function StudentIntegrityLine({ row }: { row: IntegrityRow | undefined }) {
  if (!row) return null;
  return (
    <div className="integrity-time-line">
      <span>
        平均每題 {seconds(row.average)} · 第一次作答平均每題 {seconds(row.firstAverage)}
        {row.leaveCount > 0
          ? ` · 離開畫面 ${row.leaveCount} 次（共 ${Number(row.leaveSeconds.toFixed(1))} 秒）`
          : ''}
      </span>
      {row.invalidCount > 0 && (
        <small>{row.invalidCount} 次作答未列入最高有效分數與達標，練習次數照計。</small>
      )}
    </div>
  );
}
export function AnswerIntegrityOverview({
  course,
  api,
  classId,
}: {
  course: Course;
  api: API;
  classId: string;
}) {
  const units = course.units.filter((u) => !u.review),
    [unitId, setUnitId] = useState(units[0]?.id || ''),
    [open, setOpen] = useState(false),
    [data, setData] = useState<IntegrityStatsResponse | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [reload, setReload] = useState(0),
    [sort, setSort] = useState<IntegritySortKey>('studentId'),
    [desc, setDesc] = useState(false),
    [marked, setMarked] = useState(false);
  useEffect(() => {
    setData(null);
    setError('');
    setLoading(false);
    if (!open || !unitId || api.preview || isTestClass(classId)) return;
    let active = true;
    setLoading(true);
    api
      .call<IntegrityStatsResponse>('getAnswerIntegrityStats', {
        courseId: course.id,
        classId,
        unitId,
      })
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, course.id, classId, unitId, open, reload]);
  if (isTestClass(classId))
    return (
      <section className="panel">
        <h2>作答時間統計</h2>
        <p className="muted">test 班不納入統計。</p>
      </section>
    );
  const stats = data?.units.find((u) => u.unitId === unitId),
    rows = stats ? sortedIntegrityRows(stats.rows, sort, desc, marked) : [];
  const heading = (label: string, key: IntegritySortKey) => (
    <th aria-sort={sort === key ? (desc ? 'descending' : 'ascending') : 'none'}>
      <button
        onClick={() => {
          setSort(key);
          setDesc(sort === key ? !desc : false);
        }}
      >
        {label} {sort === key ? (desc ? '↓' : '↑') : '↕'}
      </button>
    </th>
  );
  return (
    <section className="panel integrity-overview">
      <div className="sectionhead">
        <div>
          <h2>作答時間統計</h2>
          <p className="muted">限單元完整測驗，排除複習考、其他練習模式與 test 班。</p>
        </div>
        <button onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? '收合統計' : '查看作答時間'}
        </button>
      </div>
      {open && (
        <>
          <div className="toolbar">
            <label className="field">
              次單元
              <select
                aria-label="作答時間次單元"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="integrity-filter">
              <input
                type="checkbox"
                checked={marked}
                onChange={(e) => setMarked(e.target.checked)}
              />
              只看有標記
            </label>
            <button disabled={loading || api.preview} onClick={() => setReload((n) => n + 1)}>
              重新讀取統計
            </button>
          </div>
          {api.preview ? (
            <p className="notice">預覽不讀取正式作答統計。</p>
          ) : loading ? (
            <p role="status">正在讀取作答時間…</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : !units.length ? (
            <p>目前沒有可統計的單元完整測驗。</p>
          ) : (
            stats && (
              <>
                <p>
                  全班每題時間中位數：<strong>{seconds(stats.medianSeconds)}</strong> · 納入{' '}
                  {stats.rows.filter((r) => r.attempts > 0).length} 位學生 · 有標記{' '}
                  {stats.rows.filter((r) => r.reasons.length > 0 || r.invalidCount > 0).length} 位
                </p>
                <p className="notice integrity-info">
                  <strong>⚠ 僅供查看，不代表作弊。</strong>首次 {ANSWER_INTEGRITY.firstScore}{' '}
                  分且「第一次每題時間低於全班中位數的 {integrityFastRatioLabel()}」或「至少{' '}
                  {ANSWER_INTEGRITY.minCvQuestions} 題的時間變異係數小於{' '}
                  {ANSWER_INTEGRITY.uniformCv}」才標記；作答偏快或平均不會自動取消成績。
                </p>
                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        {heading('學生', 'studentId')}
                        {heading('最高有效分數', 'best')}
                        <th>第一次分數</th>
                        {heading('平均每題', 'average')}
                        {heading('第一次每題', 'firstAverage')}
                        {heading('離開次數', 'leaveCount')}
                        <th>查看重點</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.uid}>
                          <td>
                            {r.name}
                            <small className="integrity-subtext">{r.studentId}</small>
                          </td>
                          <td>
                            {r.best ?? '尚無'}
                            <small className="integrity-subtext">完整測驗 {r.attempts} 次</small>
                          </td>
                          <td>{r.firstScore ?? '尚無'}</td>
                          <td>{seconds(r.average)}</td>
                          <td>{seconds(r.firstAverage)}</td>
                          <td>
                            {r.leaveCount} 次
                            <small className="integrity-subtext">
                              共 {Number(r.leaveSeconds.toFixed(1))} 秒
                            </small>
                          </td>
                          <td>
                            {r.reasons.length > 0 && (
                              <span className="integrity-flag-wrap">
                                <button
                                  className="integrity-flag"
                                  aria-describedby={`integrity-${r.uid}`}
                                >
                                  ⚠{' '}
                                  {r.reasons
                                    .map((x) => (x === 'fast' ? '偏快' : '每題時間平均'))
                                    .join('／')}
                                </button>
                                <span
                                  role="tooltip"
                                  id={`integrity-${r.uid}`}
                                  className="integrity-tooltip"
                                >
                                  {integrityReasonText(r)}
                                </span>
                              </span>
                            )}
                            {r.invalidCount > 0 && (
                              <span className="badge integrity-excluded">
                                {r.invalidCount} 次未列成績
                              </span>
                            )}
                            {!r.reasons.length && !r.invalidCount && '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!rows.length && <p>目前篩選下沒有紀錄。</p>}
                <p className="muted integrity-method">
                  平均每題為作答總秒數÷總題數，包含離開時間；全班以每位學生的平均取中位數。首次依
                  clientAt 排序。時間統計含未列成績紀錄；不回溯作廢舊作答。
                </p>
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
