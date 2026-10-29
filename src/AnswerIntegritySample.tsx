import { useState } from 'react';
import {
  sampleCohort,
  sampleStudentUnit,
  sampleSeconds,
  sampleInvalid,
  type IntegritySampleData,
} from '../shared/answerIntegritySample';
import './answer-integrity-sample.css';

/** Local storyboard only: not imported by the production app or submitAttempt. */
export default function AnswerIntegritySample({ data }: { data: IntegritySampleData }) {
  const [view, setView] = useState<'profile' | 'cohort' | 'prompt' | 'result'>('profile');
  const [uid, setUid] = useState('demo-1');
  const [scenario, setScenario] = useState('one');
  const [leaves, setLeaves] = useState({ count: 1, seconds: 12 });
  const [promptOpen, setPromptOpen] = useState(true);
  const [explanation, setExplanation] = useState(false);
  const unit = data.units[0],
    cohort = sampleCohort(data, unit),
    student = data.students.find((s) => s.uid === uid)!;
  const studentView = view === 'prompt' || view === 'result';
  const selectedStats = data.units
    .filter((u) => !u.review)
    .map((u) => ({ unit: u, ...sampleStudentUnit(data, uid, u) }));
  const invalidAttempt = data.attempts.find((a) => a.uid === 'demo-4' && a.leaveCount === 4)!;
  const invalidStats = sampleStudentUnit(data, 'demo-4', unit);
  const flagText =
    '僅供查看，不代表作弊。首次作答達滿分門檻，且每題秒數低於全班中位數的一半，建議教師了解作答情況。';
  const switchView = (v: typeof view) => {
    setView(v);
    setPromptOpen(v === 'prompt');
    setExplanation(false);
  };
  function chooseScenario(value: string) {
    setScenario(value);
    setLeaves(
      value === 'four'
        ? { count: 4, seconds: 42 }
        : value === 'one'
          ? { count: 1, seconds: 12 }
          : { count: 0, seconds: 0 },
    );
    setPromptOpen(value === 'one' || value === 'four');
  }
  return (
    <div className="ai-app">
      <aside className="ai-nav">
        <div className="ai-brand">
          AP2<span>課程平台</span>
        </div>
        <div className="ai-course">
          115-1
          <br />
          <strong>解剖生理學（二）</strong>
        </div>
        <div className={`ai-nav-item ${!studentView ? 'active' : ''}`}>
          {studentView ? '我的課程' : '學生與學習進度'}
        </div>
        <div className={`ai-nav-item ${studentView ? 'active' : ''}`}>
          {studentView ? '單元練習' : '授課控制台'}
        </div>
        <div className="ai-nav-item">{studentView ? '錯題本與閃卡' : '課程與教材'}</div>
        <div className="ai-nav-bottom">{studentView ? '學生端樣張' : '教師端樣張'}</div>
      </aside>
      <main className="ai-main">
        <header className="ai-header">
          <span>{studentView ? '我的課程 ／ 呼吸系統' : '教師工作區 ／ 學生與學習進度'}</span>
          <span className="ai-avatar">{studentView ? '學' : '教'}</span>
        </header>
        <div className="ai-content">
          <div className="ai-sample-bar">
            <span>互動樣張</span>
            <p>使用虛構資料；操作不會改變正式作答。</p>
            <small>規劃版本 1.14.0</small>
          </div>
          <nav className="ai-view-tabs" aria-label="樣張畫面">
            {(
              [
                ['profile', '個人檔案'],
                ['cohort', '全班總覽'],
                ['prompt', '學生離開提示'],
                ['result', '無效作答結果'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={view === id ? 'active' : ''}
                onClick={() => switchView(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          {view === 'profile' && (
            <>
              <div className="ai-heading">
                <div>
                  <span className="ai-eyebrow">STUDENT PROFILE</span>
                  <h1>{student.name}</h1>
                  <p>
                    {student.studentId} · {student.classId} · 虛構示範資料
                  </p>
                </div>
                <label>
                  選擇示範學生
                  <select
                    aria-label="選擇示範學生"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                  >
                    {data.students
                      .filter((s) => s.classId !== 'test')
                      .map((s) => (
                        <option key={s.uid} value={s.uid}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <section className="ai-panel">
                <div className="ai-section-title">
                  <h2>各單元練習</h2>
                  <span className="ai-soft-tag">新增：每題作答時間</span>
                </div>
                {selectedStats.map((s) => (
                  <div className="ai-unit" key={s.unit.id}>
                    <div className="ai-unit-top">
                      <div>
                        <h3>{s.unit.title}</h3>
                        <p>
                          最高有效分數：<b>{s.best ?? '尚無'}</b> · 練習 {s.attempts} 次
                        </p>
                      </div>
                      <span
                        className={`ai-status ${s.best !== null && s.best >= s.unit.threshold ? 'passed' : ''}`}
                      >
                        {s.best !== null && s.best >= s.unit.threshold ? '已達標' : '待完成'}
                      </span>
                    </div>
                    <div className="ai-time-line">
                      <span>◷</span>
                      <strong>平均每題 {sampleSeconds(s.average)}</strong>
                      <i>·</i>
                      <span>第一次作答平均每題 {sampleSeconds(s.firstAverage)}</span>
                      {s.leaves > 0 && (
                        <>
                          <i>·</i>
                          <span>
                            離開畫面 {s.leaves} 次（共 {s.leaveSeconds} 秒）
                          </span>
                        </>
                      )}
                    </div>
                    {s.invalid > 0 && (
                      <div className="ai-small-note">
                        其中 {s.invalid} 次作答未列入最高有效分數與達標，練習次數仍計入。
                      </div>
                    )}
                  </div>
                ))}
                <div className="ai-panel-foot">
                  時間統計限單元完整練習；舊作答可補算時間，沒有離開紀錄的舊作答仍有效。
                </div>
              </section>
              <section className="ai-panel">
                <div className="ai-section-title">
                  <h2>最近作答</h2>
                  <span className="ai-muted">呼吸系統</span>
                </div>
                <div className="ai-history-head">
                  <span>作答順序</span>
                  <span>分數</span>
                  <span>平均每題</span>
                  <span>離開畫面</span>
                  <span>紀錄狀態</span>
                </div>
                {data.attempts
                  .filter(
                    (a) => a.uid === uid && a.unitId === unit.id && a.mode === 'quiz' && a.full,
                  )
                  .sort((a, b) => a.clientAt - b.clientAt)
                  .map((a, i) => (
                    <div className="ai-history-row" key={a.id}>
                      <strong>{i === 0 ? '第一次' : `第 ${i + 1} 次`}作答</strong>
                      <span>{a.score} 分</span>
                      <span>{sampleSeconds(a.duration / a.answers.length)}</span>
                      <span>
                        {a.leaveCount === undefined
                          ? '舊紀錄無此欄位'
                          : `${a.leaveCount} 次 · ${a.leaveSeconds} 秒`}
                      </span>
                      <span
                        className={`ai-status ${sampleInvalid(a, unit) ? 'excluded' : 'passed'}`}
                      >
                        {sampleInvalid(a, unit) ? '不列入成績' : '有效'}
                      </span>
                    </div>
                  ))}
              </section>
            </>
          )}
          {view === 'cohort' && (
            <>
              <div className="ai-heading">
                <div>
                  <span className="ai-eyebrow">CLASS OVERVIEW</span>
                  <h1>全班作答時間</h1>
                  <p>從作答紀錄了解練習情況，標記僅供教師查看。</p>
                </div>
                <div className="ai-filters">
                  <label>
                    班級
                    <select disabled>
                      <option>示範班</option>
                    </select>
                  </label>
                  <label>
                    單元
                    <select disabled>
                      <option>呼吸系統</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="ai-stat-grid">
                <div>
                  <span>全班每題時間・中位數</span>
                  <strong>{sampleSeconds(cohort.median)}</strong>
                  <small>以每位學生的平均每題秒數比較</small>
                </div>
                <div>
                  <span>納入統計</span>
                  <strong>
                    {cohort.rows.length}
                    <em> 位學生</em>
                  </strong>
                  <small>排除 test 班與非單元練習</small>
                </div>
                <div>
                  <span>建議了解作答情況</span>
                  <strong>
                    {cohort.rows.filter((r) => r.flag).length}
                    <em> 位學生</em>
                  </strong>
                  <small>首次達滿分門檻且時間偏短</small>
                </div>
              </div>
              <div className="ai-guidance">
                <span>ⓘ</span>
                <p>
                  <strong>⚠ 僅供查看，不代表作弊。</strong>{' '}
                  判讀時請一併了解學生的熟悉程度與實際作答情況；系統不因作答偏快而自動取消成績。
                </p>
              </div>
              <section className="ai-panel ai-table-panel">
                <div className="ai-section-title">
                  <h2>呼吸系統</h2>
                  <span className="ai-muted">
                    比較門檻：中位數的一半（
                    {sampleSeconds(cohort.median === null ? null : cohort.median / 2)}）
                  </span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>學生</th>
                      <th>最高有效分數</th>
                      <th>第一次分數</th>
                      <th>平均每題</th>
                      <th>第一次每題</th>
                      <th>離開畫面</th>
                      <th>查看重點</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohort.rows.map((r) => (
                      <tr key={r.student.uid} className={r.flag ? 'flagged' : ''}>
                        <td>
                          <strong>{r.student.name}</strong>
                          <small>{r.student.studentId}</small>
                        </td>
                        <td>
                          <b>{r.best ?? '—'}</b>
                          <small>練習 {r.attempts} 次</small>
                        </td>
                        <td>{r.firstScore ?? '—'}</td>
                        <td>{sampleSeconds(r.average)}</td>
                        <td>
                          <strong>{sampleSeconds(r.firstAverage)}</strong>
                        </td>
                        <td>
                          {r.leaves} 次<small>累計 {r.leaveSeconds} 秒</small>
                        </td>
                        <td>
                          {r.flag ? (
                            <div className="ai-flag-wrap">
                              <button
                                className="ai-flag"
                                title={flagText}
                                aria-describedby="time-flag-note"
                              >
                                ⚠ 時間偏短
                              </button>
                              <div className="ai-tooltip" role="tooltip">
                                {flagText}
                              </div>
                            </div>
                          ) : r.invalid ? (
                            <span className="ai-status excluded">{r.invalid} 次未列成績</span>
                          ) : (
                            <span className="ai-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div id="time-flag-note" className="ai-panel-foot">
                  首次作答分數達 100 分，且每題時間低於全班中位數的一半才顯示
                  ⚠。統計包含未列成績的練習；標記不等同違規判定。
                </div>
              </section>
            </>
          )}
          {view === 'prompt' && (
            <>
              <div className="ai-scenario">
                <label>
                  示範情境
                  <select
                    aria-label="示範情境"
                    value={scenario}
                    onChange={(e) => chooseScenario(e.target.value)}
                  >
                    <option value="normal">正常作答</option>
                    <option value="fast">偏快作答</option>
                    <option value="one">離開 1 次</option>
                    <option value="four">離開 4 次</option>
                  </select>
                </label>
                <button
                  onClick={() => {
                    setLeaves((l) => ({ count: l.count + 1, seconds: l.seconds + 12 }));
                    setPromptOpen(true);
                  }}
                >
                  模擬離開後返回
                </button>
              </div>
              <section className="ai-practice">
                <div className="ai-practice-top">
                  <span className="ai-soft-tag">呼吸系統・單元練習</span>
                  <span>第 3 題 / 共 10 題</span>
                </div>
                <div className="ai-progress-track">
                  <span />
                </div>
                <h1>本次活動開始前，請先完成哪個步驟？</h1>
                <p>此題為介面示範，請依課堂活動安排選擇。</p>
                <div className="ai-student-options">
                  {['閱讀本頁題幹', '和同學交換想法', '整理討論結論', '分享小組重點'].map(
                    (s, i) => (
                      <button key={s} className={i === 0 ? 'selected' : ''}>
                        <span>{String.fromCharCode(65 + i)}</span>
                        {s}
                      </button>
                    ),
                  )}
                </div>
                <div className="ai-practice-footer">
                  <span>
                    已離開 {leaves.count} 次 · 累計 {leaves.seconds} 秒
                  </span>
                  <button className="ai-primary" onClick={() => switchView('result')}>
                    查看結果樣張
                  </button>
                </div>
              </section>
              {promptOpen && (
                <div className="ai-overlay">
                  <section
                    className="ai-return-prompt"
                    role="dialog"
                    aria-modal="true"
                    aria-label="離開作答畫面提示"
                  >
                    <div className="ai-prompt-icon">↩</div>
                    <span className="ai-eyebrow">返回作答畫面</span>
                    <h2>你已離開作答畫面 {leaves.count} 次</h2>
                    <p className="ai-leave-total">共 {leaves.seconds} 秒 · 已記錄</p>
                    <p>
                      離開超過 3 次或累計超過 60 秒，
                      <br />
                      本次作答不列入成績。
                    </p>
                    {(leaves.count > 3 || leaves.seconds > 60) && (
                      <div className="ai-invalid-note">
                        依目前紀錄，本次將不列入最高有效分數與達標；仍可完成作答並查看分數與解析。
                      </div>
                    )}
                    <button className="ai-primary" onClick={() => setPromptOpen(false)}>
                      繼續作答
                    </button>
                    <small>請留在作答畫面，完成後再切換其他頁面。</small>
                  </section>
                </div>
              )}
            </>
          )}
          {view === 'result' && (
            <>
              <div className="ai-heading">
                <div>
                  <span className="ai-eyebrow">PRACTICE RESULT</span>
                  <h1>本次作答結果</h1>
                  <p>呼吸系統 · 單元練習 · 虛構結果示範</p>
                </div>
              </div>
              <section className="ai-result">
                <div className="ai-result-main">
                  <div className="ai-score">
                    <strong>{invalidAttempt.score}</strong>
                    <span>本次作答分數</span>
                    <small>答對 10 / 10 題</small>
                  </div>
                  <div className="ai-result-message">
                    <span className="ai-status excluded">本次不列入成績</span>
                    <h2>仍可查看分數與解析</h2>
                    <p>
                      本次離開畫面 <strong>4 次</strong>（共 42 秒），超過 3 次。
                      <br />
                      因此不更新最高有效分數，也不計入達標。
                    </p>
                    <div className="ai-result-progress">
                      <div>
                        <span>目前最高有效分數</span>
                        <strong>{invalidStats.best} 分</strong>
                      </div>
                      <div>
                        <span>單元狀態</span>
                        <strong>待完成</strong>
                      </div>
                      <div>
                        <span>練習次數</span>
                        <strong>{invalidStats.attempts} 次</strong>
                      </div>
                    </div>
                    <p className="ai-small-note">
                      此次練習次數照計；沒有離開紀錄的舊作答保持有效。
                    </p>
                  </div>
                </div>
                <div className="ai-result-actions">
                  <button
                    className="ai-primary"
                    onClick={() => {
                      chooseScenario('normal');
                      setView('prompt');
                    }}
                  >
                    再作答一次
                  </button>
                  <button onClick={() => setExplanation(!explanation)}>查看本次解析</button>
                </div>
                {explanation && (
                  <div className="ai-explanation">
                    <h3>本次解析（示範）</h3>
                    <p>本題依活動安排先閱讀題幹，再進行討論。完整分數與解析仍可查看。</p>
                  </div>
                )}
              </section>
              <p className="ai-mode-note">
                單元練習適用此規則；錯題本、閃卡與綜合練習僅記錄離開情況，不因此作廢。
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
