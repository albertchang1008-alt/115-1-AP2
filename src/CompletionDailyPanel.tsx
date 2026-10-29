import { useState } from 'react';
import type { API } from './service';
import type { Course } from '../shared/model';
import { isTestClass } from '../shared/answerIntegrity';
export function CompletionDailyPanel({ api, course }: { api: API; course: Course }) {
  const classes = course.classIds.filter((id) => !isTestClass(id)),
    [cl, setCl] = useState(classes[0] || ''),
    [data, setData] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [plan, setPlan] = useState<any>(null),
    [rebuildStatus, setRebuildStatus] = useState('');
  async function load(refresh = false) {
    setBusy(true);
    setError('');
    try {
      setData(await api.call('getCompletionDaily', { courseId: course.id, classId: cl, refresh }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function previewRebuild() {
    setBusy(true);
    setError('');
    setRebuildStatus('');
    try {
      setPlan(await api.call('rebuildStats', { courseId: course.id, classId: cl }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function applyRebuild() {
    if (!plan) return;
    setBusy(true);
    setError('');
    let cursor = 0;
    try {
      do {
        const r: any = await api.call('rebuildStats', {
          courseId: course.id,
          classId: cl,
          dryRun: false,
          confirm: true,
          planHash: plan.planHash,
          cursor,
          limit: 3,
        });
        cursor = r.nextCursor;
        setRebuildStatus(cursor === null ? '補算完成' : `已完成 ${cursor}／${plan.tasks} 批次工作`);
      } while (cursor !== null);
      setPlan(null);
      setData(null);
    } catch (e) {
      setError((e as Error).message + '；可重新預覽，已完成工作重跑不會重複累加。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <div className="sectionhead">
        <div>
          <h2>班級完成度摘要</h2>
          <p className="muted">每日更新；交卷後不即時重算。逐人明細仍在下方看板。</p>
        </div>
        <select
          aria-label="完成度摘要班級"
          value={cl}
          disabled={busy}
          onChange={(e) => {
            setCl(e.target.value);
            setData(null);
            setError('');
            setPlan(null);
            setRebuildStatus('');
          }}
        >
          {classes.map((id) => (
            <option key={id} value={id}>
              {course.classNames?.[id] || id}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar">
        <button disabled={busy || api.preview || !cl} onClick={() => void load()}>
          查看班級摘要
        </button>
        <button disabled={busy || api.preview || !cl} onClick={() => void load(true)}>
          立即更新班級摘要
        </button>
        <button disabled={busy || api.preview || !cl} onClick={() => void previewRebuild()}>
          預覽補算統計
        </button>
      </div>
      {plan && (
        <section className="notice">
          <h3>補算預覽：{cl} 班</h3>
          <p>
            將更新 {plan.documents} 份文件：時間統計 {plan.timingDocuments} 份、每日使用{' '}
            {plan.usageDocuments} 份、完成度摘要及帳號對應各 1 份。最高分與達標保留。
          </p>
          <p>
            須讀取本學期作答與28天教材紀錄；初次讀取估計含名冊 {plan.readEstimate.rosterPerBatch}{' '}
            份、時間進度 {plan.readEstimate.timingProgress}{' '}
            份，另依歷史量增加。單次補算的來源讀取安全上限 {plan.readEstimate.maxSourceDocuments}{' '}
            份，實際用量於每批回報。
          </p>
          <div className="toolbar">
            <button disabled={busy} onClick={() => setPlan(null)}>
              取消補算
            </button>
            <button className="primary" disabled={busy} onClick={() => void applyRebuild()}>
              確認補算本班統計
            </button>
          </div>
        </section>
      )}
      {rebuildStatus && <p role="status">{rebuildStatus}</p>}
      {busy && <p role="status">讀取班級摘要…</p>}
      {error && <p role="alert">{error}</p>}
      {data &&
        (data.schema === 1 ? (
          <>
            <p>
              更新時間：
              {new Date(data.updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
              {data.stale ? '（超過一天，可立即更新）' : ''} · {data.board.count} 人 · 全部完成{' '}
              {data.board.allDone} 人 · 有逾期 {data.board.overdue} 人
            </p>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>次單元</th>
                    <th>已達標</th>
                    <th>待完成</th>
                    <th>逾期未完成</th>
                  </tr>
                </thead>
                <tbody>
                  {data.units.map((u: any) => (
                    <tr key={u.unitId}>
                      <td>{course.units.find((x) => x.id === u.unitId)?.title || u.unitId}</td>
                      <td>{u.completed}</td>
                      <td>{u.pending}</td>
                      <td>{u.overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>尚無目前課程版本的摘要，請按「立即更新班級摘要」。</p>
        ))}
    </section>
  );
}
