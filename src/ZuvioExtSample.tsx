import React, { useState } from 'react';

export type MoodCode =
  | 'red_volcano'
  | 'yellow_rubberband'
  | 'blue_caterpillar'
  | 'green_flow'
  | 'gray_fog';

interface MoodDef {
  code: MoodCode;
  color: string;
  shortLabel: string;
  titleDesc: string;
  teacherNote: string;
  feedback: string;
}

export const MOOD_QUESTION = '剛寫完這份測驗，你現在的內在狀態最像哪一種？';
export const MOOD_SUBNOTE = '此題不計分，老師會看到你的選擇，用來調整教學';

export const MOOD_STATES: MoodDef[] = [
  {
    code: 'red_volcano',
    color: '#dc2626',
    shortLabel: '紅（高張力）',
    titleDesc: '像快噴發的火山（煩躁、不甘心、覺得題目很刁鑽）',
    teacherNote: '挫敗感強，容易因情緒抗拒檢討錯題',
    feedback:
      '這份測驗確實不容易！先深呼吸三口氣，等情緒降溫後，我們再一起拆解卡住的地方。',
  },
  {
    code: 'yellow_rubberband',
    color: '#d97706',
    shortLabel: '黃（高緊繃）',
    titleDesc: '像拉滿的橡皮筋（心跳快、腦袋還在高速運轉、怕粗心）',
    teacherNote: '高度焦慮或完美主義',
    feedback:
      '你已經全力以赴了，現在可以先把橡皮筋放鬆，看看哪些觀念其實比你以為的更穩固。',
  },
  {
    code: 'blue_caterpillar',
    color: '#2563eb',
    shortLabel: '藍（低能量）',
    titleDesc: '像沒電的毛毛蟲（腦袋一片空白、無力、想直接放棄）',
    teacherNote: '認知超載或準備不足',
    feedback:
      '辛苦了，大腦剛剛消耗了很多能量。今天先不用一次看完所有錯題，挑一題最簡單的弄懂就好。',
  },
  {
    code: 'green_flow',
    color: '#15803d',
    shortLabel: '綠（平穩流暢）',
    titleDesc: '像順流的小船／跳跳糖（寫得很順、有掌握感、甚至有點興奮）',
    teacherNote: '心流或準備充分',
    feedback:
      '很棒的節奏！趁著記憶最清晰的時候，順手把幾道不確定的題目確認一下就大功告成了。',
  },
  {
    code: 'gray_fog',
    color: '#475569',
    shortLabel: '灰（抽離麻木）',
    titleDesc: '像隔著一層霧／碎玻璃（說不上來、沒什麼感覺、只是想趕快交卷）',
    teacherNote: '情緒隔離或科目疏離',
    feedback:
      '有時候「沒感覺」也是大腦保護自己的一種方式。先休息一下，隨時準備好了再回來看解析。',
  },
];

export function MoodLineIcon({ code, color }: { code: MoodCode; color: string }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (code === 'red_volcano') {
    return (
      <svg {...common}>
        <path d="M4 20h16l-5-10H9L4 20z" />
        <path d="M12 6V3" />
        <path d="M8.5 7 6.5 4.5" />
        <path d="M15.5 7 17.5 4.5" />
      </svg>
    );
  }
  if (code === 'yellow_rubberband') {
    return (
      <svg {...common}>
        <path d="M3 12c2-4 4 4 6 0s4 4 6 0 4 4 6 0" />
        <path d="M5 7v10" />
        <path d="M19 7v10" />
      </svg>
    );
  }
  if (code === 'blue_caterpillar') {
    return (
      <svg {...common}>
        <rect x="3" y="8" width="16" height="8" rx="2" />
        <path d="M21 11v2" />
        <path d="M7 12h4" />
      </svg>
    );
  }
  if (code === 'green_flow') {
    return (
      <svg {...common}>
        <path d="M3 17c2.5 1.5 5 1.5 7.5 0s5-1.5 7.5 0 3 1 3 1" />
        <path d="M6 13h12l-2 3H8l-2-3z" />
        <path d="M12 13V6l4 4h-4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 9h14" />
      <path d="M6 13h14" />
      <path d="M4 17h11" />
    </svg>
  );
}

function StudentMoodCardView({
  initialSelected,
  initialSubmitted,
}: {
  initialSelected?: MoodCode;
  initialSubmitted?: boolean;
}) {
  const [selected, setSelected] = useState<MoodCode | undefined>(initialSelected);
  const [submitted, setSubmitted] = useState<boolean>(Boolean(initialSubmitted));
  const chosen = MOOD_STATES.find((m) => m.code === selected);

  return (
    <div className="mood-student-overlay" role="dialog" aria-modal="true" aria-label="課堂情緒快篩">
      <div className="mood-student-header">
        <span className="mood-student-badge">課堂小考後快篩・甲班 第 1 次</span>
        <h1 className="mood-student-question">{MOOD_QUESTION}</h1>
        <p className="mood-student-note">{MOOD_SUBNOTE}</p>
      </div>

      {!submitted ? (
        <>
          <div className="mood-card-list" role="radiogroup" aria-label={MOOD_QUESTION}>
            {MOOD_STATES.map((m) => {
              const active = selected === m.code;
              return (
                <button
                  key={m.code}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`mood-option-card${active ? ' selected' : ''}`}
                  style={{ borderLeftColor: m.color }}
                  onClick={() => setSelected(m.code)}
                >
                  <span className="mood-option-icon">
                    <MoodLineIcon code={m.code} color={m.color} />
                  </span>
                  <span className="mood-option-text">{m.titleDesc}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="mood-submit-btn"
            disabled={!selected}
            onClick={() => setSubmitted(true)}
          >
            確認
          </button>
          <p className="mood-lock-hint">送出後即可進入課程其他頁面</p>
        </>
      ) : (
        <div className="mood-feedback-box">
          {chosen && (
            <div className="mood-feedback-chosen" style={{ color: chosen.color }}>
              <MoodLineIcon code={chosen.code} color={chosen.color} />
              <span style={{ color: '#0f172a' }}>{chosen.titleDesc}</span>
            </div>
          )}
          <p className="mood-feedback-reply">{chosen?.feedback}</p>
          <button type="button" className="mood-submit-btn">
            回到課程
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- 1. 課堂互動建立場次與開啟快篩 ----------------
function Shot1ClassroomOpenMood() {
  return (
    <div className="zuvio-ext-stage zuvio">
      <div className="zuvio-ext-banner">
        <strong>樣張 1／6：授課控制台「課堂互動」— 建立 Zuvio 場次與開啟情緒快篩</strong>
        <span>合成資料・Emulator</span>
      </div>
      <section className="zuvio-ext-panel">
        <div className="z-row">
          <h2 style={{ margin: 0 }}>課堂互動與 Zuvio 場次</h2>
          <span className="z-pill-info">已開始上課・每 30 秒輪詢學生端</span>
        </div>
        <div className="zuvio-ext-grid-2">
          <div className="z-card">
            <h3>新增場次（Zuvio 一條龍）</h3>
            <div className="z-row">
              <label>
                選擇考卷
                <select defaultValue="exam-w8">
                  <option value="exam-w8">第 8 週小考：呼吸系統（20 題）</option>
                  <option value="exam-w9">第 9 週小考：酸鹼平衡（15 題）</option>
                </select>
              </label>
              <label>
                班級
                <select defaultValue="A">
                  <option value="A">甲班（60 人）</option>
                  <option value="B">乙班（58 人）</option>
                </select>
              </label>
            </div>
            <div className="z-row">
              <label>
                場次名稱
                <input type="text" defaultValue="甲班 第 1 次" />
              </label>
              <label>
                開考時間（預設＝現在，供計算考前練習）
                <input type="datetime-local" defaultValue="2026-11-13T09:00" />
              </label>
            </div>
            <div className="z-row">
              <button type="button" className="primary">
                建立場次
              </button>
              <span className="muted">不需另按開考鈕，系統依開考時間從 attempts 計算考前練習</span>
            </div>
          </div>

          <div className="z-card">
            <h3>場次情緒快篩控制</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              目前場次：<b>第 8 週小考：呼吸系統 — 甲班 第 1 次</b>（開考 2026-11-13 09:00）
            </p>
            <div className="z-row">
              <label>
                自動結束時間
                <select defaultValue="10">
                  <option value="5">5 分鐘</option>
                  <option value="10">10 分鐘（預設）</option>
                  <option value="15">15 分鐘</option>
                </select>
              </label>
              <label>
                狀態
                <span className="z-pill-warn">尚未開啟</span>
              </label>
            </div>
            <div className="z-row" style={{ marginTop: 12 }}>
              <button type="button" className="primary">
                開啟情緒快篩
              </button>
              <button type="button">投影課程 QR Code</button>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              開啟後僅「甲班」學生會收到全畫面卡片；若尚未開始上課將一併啟動輪詢（3 小時自動停）。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------- 2. 學生卡片（390 寬、選取後與送出後） ----------------
function Shot2StudentCards() {
  return (
    <div className="zuvio-ext-stage">
      <div className="zuvio-ext-banner">
        <strong>樣張 2／6：學生端全畫面卡片（390 寬手機畫面・選取後與送出後）</strong>
        <span>符合 READABILITY_STANDARD.md・無關閉鈕・不可略過</span>
      </div>
      <div className="zuvio-ext-phones">
        <div className="zuvio-ext-phone-wrap">
          <span className="zuvio-ext-phone-label">狀態 A：選取後（390 寬・確認送出前）</span>
          <div className="zuvio-ext-phone-frame">
            <StudentMoodCardView initialSelected="yellow_rubberband" initialSubmitted={false} />
          </div>
        </div>
        <div className="zuvio-ext-phone-wrap">
          <span className="zuvio-ext-phone-label">狀態 B：送出後（顯示對應回饋語）</span>
          <div className="zuvio-ext-phone-frame">
            <StudentMoodCardView initialSelected="yellow_rubberband" initialSubmitted={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- 3. 教師即時人數 ----------------
function Shot3LiveCounts() {
  const counts: Record<MoodCode, number> = {
    red_volcano: 6,
    yellow_rubberband: 17,
    blue_caterpillar: 11,
    green_flow: 14,
    gray_fog: 4,
  };
  const filled = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = 60;

  return (
    <div className="zuvio-ext-stage zuvio">
      <div className="zuvio-ext-banner">
        <strong>樣張 3／6：教師即時人數（課堂互動投影畫面・僅顯示人數）</strong>
        <span>合成資料・進行中・倒數 07:42</span>
      </div>
      <section className="zuvio-ext-panel">
        <div className="z-row">
          <div>
            <h2 style={{ margin: 0 }}>情緒快篩進行中：第 8 週小考 — 甲班 第 1 次</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              自動結束倒數 <b>07:42</b>（僅顯示各狀態人數，可投影於教室螢幕）
            </p>
          </div>
          <span className="z-sp" />
          <button type="button" className="primary">
            結束快篩
          </button>
        </div>

        <div className="mood-live-bar">
          <b style={{ fontSize: 22 }}>
            已填 {filled}／{total} 人
          </b>
          <div className="mood-live-track">
            <div className="mood-live-fill" style={{ width: `${(filled / total) * 100}%` }} />
          </div>
          <span>{Math.round((filled / total) * 100)}%</span>
        </div>

        <div style={{ marginTop: 14 }}>
          {MOOD_STATES.map((m) => {
            const n = counts[m.code];
            const pct = Math.round((n / filled) * 100);
            return (
              <div key={m.code} className="mood-dist-row">
                <MoodLineIcon code={m.code} color={m.color} />
                <span>
                  <b>{m.shortLabel}</b>
                  <br />
                  <small className="muted">{m.titleDesc.split('（')[0]}</small>
                </span>
                <div className="mood-dist-track">
                  <div
                    className="mood-dist-fill"
                    style={{ width: `${pct}%`, background: m.color }}
                  />
                </div>
                <b style={{ textAlign: 'right' }}>
                  {n} 人（{pct}%）
                </b>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ---------------- 4. 報表：試題分析 ----------------
function Shot4ItemAnalysis() {
  const rows = [
    {
      no: 1,
      title: '合成題目 Q01（次單元：氣體分壓與擴散）',
      p: 0.93,
      d: 0.14,
      rpb: 0.21,
      opts: [
        { k: 1, hi: 15, lo: 14, ans: true },
        { k: 2, hi: 1, lo: 1, ans: false },
        { k: 3, hi: 0, lo: 1, ans: false },
        { k: 4, hi: 0, lo: 0, ans: false },
      ],
      blank: 0,
      flags: ['P > 0.9 太簡單', 'D < 0.2 鑑別度低', '選項 4 無人選'],
    },
    {
      no: 12,
      title: '合成題目 Q12（次單元：氧血紅素解離曲線）',
      p: 0.62,
      d: 0.44,
      rpb: 0.48,
      opts: [
        { k: 1, hi: 2, lo: 6, ans: false },
        { k: 2, hi: 13, lo: 4, ans: true },
        { k: 3, hi: 1, lo: 4, ans: false },
        { k: 4, hi: 0, lo: 2, ans: false },
      ],
      blank: 0,
      flags: ['指標正常'],
    },
    {
      no: 30,
      title: '合成題目 Q30（次單元：呼吸中樞化學受器）',
      p: 0.2,
      d: -0.19,
      rpb: -0.11,
      opts: [
        { k: 1, hi: 11, lo: 5, ans: false },
        { k: 2, hi: 2, lo: 6, ans: true },
        { k: 3, hi: 2, lo: 3, ans: false },
        { k: 4, hi: 1, lo: 2, ans: false },
      ],
      blank: 1,
      flags: [
        'P < 0.25 太難',
        'D < 0 優先複核',
        'r_pb < 0.15',
        '高分組選選項 1（11 人）多於正解（2 人）→ 可能答案鍵錯誤或題意不清',
      ],
    },
  ];

  return (
    <div className="zuvio-ext-stage zuvio">
      <div className="zuvio-ext-banner">
        <strong>樣張 4／6：報表 — 試題分析（A 考卷整體＋B 逐題指標與誘答提醒）</strong>
        <span>合成資料（不含考題原文）</span>
      </div>
      <section className="zuvio-ext-panel">
        <div className="z-row">
          <h2 style={{ margin: 0 }}>試題分析：第 8 週小考（甲班 第 1 次）</h2>
          <span className="z-sp" />
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            高／低分門檻（%）
            <input type="number" defaultValue={80} style={{ width: 68 }} />
          </label>
          <button type="button" className="primary">
            匯出試題分析 CSV
          </button>
        </div>

        <div className="z-metrics" style={{ marginTop: 10 }}>
          <div className="z-metric">
            <small>應考／實到人數</small>
            <b>58 人</b>
            <small>高／低分組各 27%（16 人）</small>
          </div>
          <div className="z-metric">
            <small>平均分數 ± 標準差</small>
            <b>74.2 ± 13.8</b>
            <small>最高 95 / 最低 40</small>
          </div>
          <div className="z-metric">
            <small>信度 KR-20</small>
            <b>0.78</b>
            <small className="z-pill-ok">≥ 0.5 良好</small>
          </div>
          <div className="z-metric">
            <small>測量標準誤 SEM</small>
            <b>6.47 分</b>
            <small>分數誤差範圍</small>
          </div>
        </div>

        <h3 style={{ marginTop: 18 }}>逐題指標與誘答分析（節錄關鍵提醒題）</h3>
        <table className="z-table">
          <thead>
            <tr>
              <th>題</th>
              <th>合成題目</th>
              <th>難度 P</th>
              <th>鑑別度 D</th>
              <th>點二系列</th>
              <th>誘答（高分組 / 低分組，綠＝正解）</th>
              <th>未答</th>
              <th>提醒標記</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no}>
                <td>{r.no}</td>
                <td>{r.title}</td>
                <td>{r.p.toFixed(2)}</td>
                <td>
                  <b>{r.d.toFixed(2)}</b>
                </td>
                <td>{r.rpb.toFixed(2)}</td>
                <td>
                  {r.opts.map((o) => (
                    <span
                      key={o.k}
                      className={'z-opt' + (o.ans ? ' z-ans' : '')}
                      style={{ display: 'inline-block', marginRight: 10 }}
                    >
                      ({o.k}) {o.hi}/{o.lo}
                    </span>
                  ))}
                </td>
                <td>{r.blank}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.flags.map((f) => (
                      <span
                        key={f}
                        className={
                          f.includes('優先複核') || f.includes('答案鍵')
                            ? 'z-pill-err'
                            : f === '指標正常'
                              ? 'z-pill-ok'
                              : 'z-pill-warn'
                        }
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ---------------- 5. 報表：情緒＋考前練習 ----------------
function Shot5MoodAndPrep() {
  const prepByMood = [
    { label: '紅（高張力）', hi: 1, lo: 5 },
    { label: '黃（高緊繃）', hi: 11, lo: 6 },
    { label: '藍（低能量）', hi: 2, lo: 9 },
    { label: '綠（平穩流暢）', hi: 10, lo: 4 },
    { label: '灰（抽離麻木）', hi: 1, lo: 3 },
  ];

  return (
    <div className="zuvio-ext-stage zuvio">
      <div className="zuvio-ext-banner">
        <strong>樣張 5／6：報表 — 情緒區塊 ＋ 考前練習分析（僅聚合人數）</strong>
        <span>門檻預設 80%（可調）</span>
      </div>

      <div className="zuvio-ext-grid-2">
        <section className="zuvio-ext-panel">
          <h3>情緒 × 分數高低（2×5 格，只有人數）</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            已填 52／58 人・門檻：<b>80%</b>（≥80% 為高分，&lt;80% 為低分）
          </p>
          <table className="z-table">
            <thead>
              <tr>
                <th>情緒狀態</th>
                <th>高分（≥80%）</th>
                <th>低分（&lt;80%）</th>
                <th>合計</th>
              </tr>
            </thead>
            <tbody>
              {prepByMood.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td>{r.hi} 人</td>
                  <td>{r.lo} 人</td>
                  <td>
                    <b>{r.hi + r.lo} 人</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 16 }}>每題答對率 × 情緒（篩出迷思題）</h3>
          <table className="z-table">
            <thead>
              <tr>
                <th>題</th>
                <th>紅</th>
                <th>黃</th>
                <th>藍</th>
                <th>綠</th>
                <th>灰</th>
                <th>教學線索</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Q07</td>
                <td>50%</td>
                <td>71%</td>
                <td>36%</td>
                <td>
                  <b style={{ color: '#b42318' }}>29%</b>
                </td>
                <td>25%</td>
                <td>
                  <span className="z-pill-err">綠色低答對率：自以為懂的迷思概念</span>
                </td>
              </tr>
              <tr>
                <td>Q12</td>
                <td>33%</td>
                <td>76%</td>
                <td>45%</td>
                <td>86%</td>
                <td>50%</td>
                <td>
                  <span className="z-pill-ok">與自評趨勢一致</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="zuvio-ext-panel">
          <div className="z-row" style={{ marginTop: 0 }}>
            <h3 style={{ margin: 0 }}>考前練習（依開考 2026-11-13 09:00 計算）</h3>
            <span className="z-sp" />
            <button type="button">重算考前練習</button>
          </div>
          <div className="z-metrics" style={{ margin: '10px 0' }}>
            <div className="z-metric">
              <small>全班平均考前練題覆蓋率</small>
              <b>64%</b>
              <small>開考前於平台作答紀錄</small>
            </div>
            <div className="z-metric">
              <small>練過題目之平均答對率</small>
              <b>81%</b>
              <small>沒練過：46%（+35%）</small>
            </div>
          </div>

          <h4>練習 × 情緒分流摘要（僅人數）</h4>
          <ul style={{ margin: '6px 0 12px', paddingLeft: 20, lineHeight: 1.7 }}>
            <li>
              <b>沒練習 ＋ 低分 ＋ 藍</b>（5 人）：準備不足，建議先回平台練習對應次單元
            </li>
            <li>
              <b>有練習 ＋ 低分 ＋ 藍</b>（4 人）：有努力但卡住，課堂上需換講法或個別鷹架
            </li>
            <li>
              <b>有練習 ＋ 答錯 ＋ 綠</b>（3 人）：練過仍有迷思且自覺順暢，最需對照解析
            </li>
          </ul>

          <h4>每題：練過 vs 沒練過答對率</h4>
          <table className="z-table">
            <thead>
              <tr>
                <th>題</th>
                <th>考前練過</th>
                <th>考前沒練過</th>
                <th>差距</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Q12</td>
                <td>85%（34/40）</td>
                <td>44%（8/18）</td>
                <td>
                  <span className="z-pill-ok">+41% 練習有效</span>
                </td>
              </tr>
              <tr>
                <td>Q30</td>
                <td>22%（8/36）</td>
                <td>18%（4/22）</td>
                <td>
                  <span className="z-pill-warn">練過仍錯 → 檢視題目或解析</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="z-row" style={{ marginTop: 14 }}>
            <button type="button">匯出研究 CSV（去識別代碼）</button>
            <button type="button" className="primary">
              匯出研究 CSV（具名・含個資）
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------- 6. 關心名單 ----------------
function Shot6CareList() {
  const [revealAll, setRevealAll] = useState(false);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  const items = [
    {
      id: 'T003',
      masked: '學***03',
      name: '學生03',
      cls: '甲班',
      score: '85%',
      mood: '黃（高緊繃）',
      teacherNote: MOOD_STATES[1].teacherNote,
      prep: '90%（練過且達標）',
      tag: '表現好但緊繃',
      pill: 'z-pill-warn',
    },
    {
      id: 'T011',
      masked: '學***11',
      name: '學生11',
      cls: '甲班',
      score: '55%',
      mood: '藍（低能量）',
      teacherNote: MOOD_STATES[2].teacherNote,
      prep: '75%（有練習但卡住）',
      tag: '可能需要鷹架（連續 2 場・有練習）',
      pill: 'z-pill-err',
    },
    {
      id: 'T019',
      masked: '學***19',
      name: '學生19',
      cls: '甲班',
      score: '60%',
      mood: '藍（低能量）',
      teacherNote: MOOD_STATES[2].teacherNote,
      prep: '15%（沒練習）',
      tag: '可能需要鷹架（沒練習・準備不足）',
      pill: 'z-pill-warn',
    },
    {
      id: 'T024',
      masked: '學***24',
      name: '學生24',
      cls: '甲班',
      score: '65%',
      mood: '綠（平穩流暢）',
      teacherNote: MOOD_STATES[3].teacherNote,
      prep: '70%（有練習但仍錯）',
      tag: '自評與表現有落差（建議對照解析）',
      pill: 'z-pill-info',
    },
    {
      id: 'T042',
      masked: '學***42',
      name: '學生42',
      cls: '甲班',
      score: '70%',
      mood: '灰（抽離麻木）',
      teacherNote: MOOD_STATES[4].teacherNote,
      prep: '20%（沒練習）',
      tag: '持續疏離（最近 3 場皆灰）',
      pill: 'z-pill-err',
    },
  ];

  const toggle = (id: string) =>
    setRevealedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="zuvio-ext-stage zuvio">
      <div className="zuvio-ext-banner">
        <strong>樣張 6／6：關心名單（僅教師可見・預設遮名・依門檻 80% 與跨場次計算）</strong>
        <span>合成資料・用詞為「值得關心」，不寫成診斷</span>
      </div>
      <section className="zuvio-ext-panel">
        <div className="z-row">
          <div>
            <h2 style={{ margin: 0 }}>值得關心名單（甲班・門檻 80%）</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              學生端永遠看不到此名單；姓名僅由既有名冊在畫面顯示，不寫入聚合報表。
            </p>
          </div>
          <span className="z-sp" />
          <button type="button" onClick={() => setRevealAll((v) => !v)}>
            {revealAll ? '全部遮蔽姓名' : '全部顯示姓名'}
          </button>
        </div>

        <table className="z-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>學生（點選展開）</th>
              <th>班級</th>
              <th>Zuvio 分數</th>
              <th>情緒狀態與教師端標註</th>
              <th>考前練習覆蓋率</th>
              <th>值得關心標記</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const show = revealAll || revealedIds.includes(it.id);
              return (
                <tr key={it.id}>
                  <td>
                    <button
                      type="button"
                      className="z-care-btn"
                      onClick={() => toggle(it.id)}
                    >
                      {show ? `${it.name}（${it.id}）` : `${it.masked}（點開）`}
                    </button>
                  </td>
                  <td>{it.cls}</td>
                  <td>
                    <b>{it.score}</b>
                  </td>
                  <td>
                    <b>{it.mood}</b>
                    <br />
                    <small className="muted">{it.teacherNote}</small>
                  </td>
                  <td>{it.prep}</td>
                  <td>
                    <span className={it.pill}>{it.tag}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function ZuvioExtSample({ shot }: { shot: string }) {
  if (shot === 'student') {
    return <StudentMoodCardView initialSelected="yellow_rubberband" initialSubmitted={false} />;
  }
  if (shot === '1') return <Shot1ClassroomOpenMood />;
  if (shot === '2') return <Shot2StudentCards />;
  if (shot === '3') return <Shot3LiveCounts />;
  if (shot === '4') return <Shot4ItemAnalysis />;
  if (shot === '5') return <Shot5MoodAndPrep />;
  if (shot === '6') return <Shot6CareList />;
  return <Shot1ClassroomOpenMood />;
}
