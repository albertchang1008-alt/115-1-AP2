import { useState } from 'react';
import { validateInteractions, validateAnswerKeys } from '../shared/classroom';
import { TRUE_FALSE_OPTIONS } from '../shared/pptImport';
import {
  sampleFieldType,
  sampleQuestionDiff,
  type SampleQuestion,
  type QuestionManagerSampleData,
} from '../shared/questionManagerSample';

export default function QuestionManager({
  data,
  save,
  download,
  thumbnails,
}: {
  data: QuestionManagerSampleData;
  save: (
    before: SampleQuestion | undefined,
    after: SampleQuestion | undefined,
    slideId: string,
  ) => Promise<void>;
  download: (deckId: string, items: SampleQuestion[]) => Promise<void>;
  thumbnails: Record<string, string>;
}) {
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(data.questions);
  const [deckId, setDeckId] = useState(
    data.decks.find((d) => d.slideIds.includes(data.questions[0]?.interaction.slideId))?.id ||
      data.decks[0].id,
  );
  const [selected, setSelected] = useState(data.questions[0]?.interaction.slideId || '');
  const [draft, setDraft] = useState<SampleQuestion>(
    structuredClone(
      data.questions[0] || {
        interaction: { slideId: '', title: '', fields: [] },
        keys: {},
        rounds: 0,
      },
    ),
  );
  const [preview, setPreview] = useState<'edit' | 'delete' | null>(null);
  const [empty, setEmpty] = useState(!data.questions.length);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const deck = data.decks.find((d) => d.id === deckId)!;
  const inDeck = (q: SampleQuestion) =>
    deckId === 'legacy'
      ? !data.decks.some((d) => d.id !== 'legacy' && d.slideIds.includes(q.interaction.slideId))
      : deck.slideIds.includes(q.interaction.slideId);
  const visible = items.filter(inDeck);
  const original = items.find((q) => q.interaction.slideId === selected);
  const diffs = sampleQuestionDiff(original, draft);
  const dirty = !empty && (!original || JSON.stringify(original) !== JSON.stringify(draft));
  const pick = (q: SampleQuestion) => {
    setEmpty(false);
    setSelected(q.interaction.slideId);
    setDraft(structuredClone(q));
    setError('');
    setNotice('');
  };
  const update = (fn: (q: SampleQuestion) => void) =>
    setDraft((q) => {
      const next = structuredClone(q);
      fn(next);
      return next;
    });
  const warning = (
    <div className="qm-warning" role="note">
      <strong>已有 {draft.rounds} 輪作答</strong>
      <span>
        修改選項或答案會影響既有統計與學生回看的判定。儲存不會改動先前輪次與已公佈的答案快照。
      </span>
    </div>
  );
  function changeDeck(id: string) {
    if (dirty && !window.confirm('尚有未儲存的修改，要捨棄並切換嗎？')) return;
    setDeckId(id);
    const target = items.find((q) =>
      id === 'legacy'
        ? !data.decks.some((d) => d.id !== 'legacy' && d.slideIds.includes(q.interaction.slideId))
        : data.decks.find((d) => d.id === id)!.slideIds.includes(q.interaction.slideId),
    );
    if (target) pick(target);
    else setEmpty(true);
  }
  function showPreview() {
    try {
      validateInteractions([draft.interaction]);
      validateAnswerKeys([draft.interaction], { [selected]: draft.keys });
      setError('');
      setPreview('edit');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function saveSample() {
    setBusy(true);
    try {
      await save(original, preview === 'delete' ? undefined : draft, selected);
      setItems((current) =>
        preview === 'delete'
          ? current.filter((q) => q.interaction.slideId !== selected)
          : [...current.filter((q) => q.interaction.slideId !== selected), structuredClone(draft)],
      );
      setPreview(null);
      setNotice(preview === 'delete' ? '已刪除題目。' : '已儲存修改。');
      if (preview === 'delete') {
        const next = visible.find((q) => q.interaction.slideId !== selected);
        if (next) {
          setSelected(next.interaction.slideId);
          setDraft(structuredClone(next));
        } else setEmpty(true);
      }
    } catch (e) {
      setError((e as Error).message);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="qm-app qm-production">
      <fieldset disabled={busy} className="qm-lock">
        <main className="qm-main">
          <div className="qm-content">
            <div className="qm-heading">
              <div>
                <div className="qm-eyebrow">授課控制台</div>
                <h1>題目管理</h1>
                <p>直接調整課堂互動題目與答案，儲存前先核對修改內容。</p>
              </div>
              <button
                disabled={busy || !visible.length}
                onClick={() => {
                  setError('');
                  void download(deckId, visible).catch((e) => setError(e.message));
                }}
              >
                ↓ 下載題目表 .xlsx
              </button>
            </div>
            <div className="qm-toolbar">
              <label>
                選擇簡報
                <select
                  aria-label="選擇簡報"
                  value={deckId}
                  onChange={(e) => changeDeck(e.target.value)}
                >
                  {data.decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              <span>
                本組 {visible.length} 題 · 共 {items.length} 題
              </span>
              <select aria-label="新增題目頁碼" id="qm-new-page">
                {deck.slideIds
                  .filter((id) => !items.some((q) => q.interaction.slideId === id))
                  .map((id) => (
                    <option key={id} value={id}>
                      第 {deck.slideIds.indexOf(id) + 1} 頁
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  const free =
                    (document.getElementById('qm-new-page') as HTMLSelectElement)?.value ||
                    deck.slideIds.find((id) => !items.some((q) => q.interaction.slideId === id));
                  if (!free) {
                    setError('這組沒有可新增的投影片，請選擇其他簡報。');
                    return;
                  }
                  if (dirty && !window.confirm('要捨棄目前修改並新增題目嗎？')) return;
                  pick({
                    interaction: {
                      slideId: free,
                      title: '新互動題',
                      fields: [
                        {
                          id: 'f1',
                          label: '請輸入題幹',
                          kind: 'choice',
                          options: ['選項一', '選項二'],
                        },
                      ],
                    },
                    keys: { f1: { answer: '選項一', explanation: '' } },
                    page: deck.slideIds.indexOf(free) + 1,
                    rounds: data.roundCounts?.[free] || 0,
                  });
                }}
              >
                ＋ 新增一題
              </button>
            </div>
            {notice && (
              <div className="qm-notice" role="status">
                {notice}
              </div>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="qm-workspace">
              <section className="qm-list" aria-label="題目清單">
                <div className="qm-list-header">
                  有題目的投影片<span>頁碼 / 題目</span>
                </div>
                {visible
                  .sort((a, b) => (a.page || 0) - (b.page || 0))
                  .map((q) => (
                    <button
                      className={`qm-question ${selected === q.interaction.slideId ? 'selected' : ''}`}
                      key={q.interaction.slideId}
                      onClick={() => {
                        if (!dirty || window.confirm('要捨棄目前修改並切換題目嗎？')) pick(q);
                      }}
                    >
                      <span className="qm-page">
                        {q.page ? String(q.page).padStart(2, '0') : '舊'}
                      </span>
                      <span>
                        <strong>{q.interaction.title}</strong>
                        <small>
                          {sampleFieldType(q.interaction.fields[0])} ·{' '}
                          {q.rounds ? `${q.rounds} 輪作答` : '尚無作答'}
                        </small>
                      </span>
                      <span className="qm-chevron">›</span>
                    </button>
                  ))}
                <div className="qm-list-note">只會修改選取的題目；其他簡報與舊版題目保留。</div>
              </section>
              <section className="qm-editor" aria-label="編輯題目">
                {empty ? (
                  <div className="qm-empty">
                    <h2>這份簡報尚無題目</h2>
                    <p>按「新增一題」開始設定。</p>
                  </div>
                ) : (
                  <>
                    <div className="qm-editor-header">
                      <div>
                        <span className="qm-tag">
                          {deckId === 'legacy' ? '其他／舊版' : `第 ${draft.page} 頁`}
                        </span>
                        <span className={`qm-state ${dirty ? 'dirty' : ''}`}>
                          {dirty ? '有未儲存的修改' : '與已儲存內容一致'}
                        </span>
                      </div>
                      <button
                        className="qm-danger"
                        onClick={() => setPreview('delete')}
                        disabled={!original}
                      >
                        刪除整題
                      </button>
                    </div>
                    {thumbnails[selected] ? (
                      <iframe
                        title="投影片縮圖"
                        sandbox=""
                        srcDoc={thumbnails[selected]}
                        className="qm-slide-thumbnail"
                      />
                    ) : (
                      <p>舊版題目，無對應投影片</p>
                    )}
                    {draft.rounds > 0 && warning}
                    <label className="qm-label">
                      題目標題
                      <input
                        aria-label="題目標題"
                        value={draft.interaction.title}
                        onChange={(e) =>
                          update((q) => {
                            q.interaction.title = e.target.value;
                          })
                        }
                      />
                    </label>
                    {draft.interaction.fields.map((f, index) => (
                      <div className="qm-field" key={f.id}>
                        <div className="qm-field-top">
                          <strong>第 {index + 1} 欄</strong>
                          <label>
                            題型
                            <select
                              aria-label={`第 ${index + 1} 欄題型`}
                              value={sampleFieldType(f)}
                              onChange={(e) =>
                                update((q) => {
                                  const field = q.interaction.fields[index];
                                  field.kind = e.target.value === '排序' ? 'order' : 'choice';
                                  field.options =
                                    e.target.value === '是非'
                                      ? [...TRUE_FALSE_OPTIONS]
                                      : ['選項一', '選項二'];
                                  q.keys[f.id] = {
                                    answer:
                                      field.kind === 'order'
                                        ? [...field.options]
                                        : field.options[0],
                                    explanation: q.keys[f.id]?.explanation || '',
                                  };
                                })
                              }
                            >
                              <option>單選</option>
                              <option>排序</option>
                              <option>是非</option>
                            </select>
                          </label>
                          {draft.interaction.fields.length > 1 && (
                            <button
                              onClick={() =>
                                update((q) => {
                                  q.interaction.fields.splice(index, 1);
                                  delete q.keys[f.id];
                                })
                              }
                            >
                              移除此欄
                            </button>
                          )}
                        </div>
                        <label className="qm-label">
                          題幹
                          <textarea
                            aria-label={`第 ${index + 1} 欄題幹`}
                            rows={2}
                            value={f.label}
                            onChange={(e) =>
                              update((q) => {
                                q.interaction.fields[index].label = e.target.value;
                              })
                            }
                          />
                        </label>
                        <div className="qm-option-heading">
                          <strong>
                            {f.kind === 'order' ? '選項（題目顯示順序）' : '選項與正確答案'}
                          </strong>
                          <small>
                            {sampleFieldType(f) === '是非'
                              ? '是非選項固定，請選正確答案'
                              : f.kind === 'order'
                                ? '正確順序另列於下方'
                                : '點選圓鈕設定正解'}
                          </small>
                        </div>
                        <div className="qm-options">
                          {f.options.map((option, oi) => (
                            <div
                              className={`qm-option ${qAnswer(draft, f.id) === option ? 'correct' : ''}`}
                              key={oi}
                            >
                              {f.kind === 'choice' ? (
                                <input
                                  type="radio"
                                  name={f.id}
                                  aria-label={`正確答案：${option}`}
                                  checked={qAnswer(draft, f.id) === option}
                                  onChange={() =>
                                    update((q) => {
                                      q.keys[f.id].answer = option;
                                    })
                                  }
                                />
                              ) : (
                                <span className="qm-order-number">{oi + 1}</span>
                              )}
                              <input
                                aria-label={`第 ${index + 1} 欄選項 ${oi + 1}`}
                                readOnly={sampleFieldType(f) === '是非'}
                                value={option}
                                onChange={(e) =>
                                  update((q) => {
                                    q.interaction.fields[index].options[oi] = e.target.value;
                                    const a = q.keys[f.id].answer;
                                    q.keys[f.id].answer = Array.isArray(a)
                                      ? a.map((x) => (x === option ? e.target.value : x))
                                      : a === option
                                        ? e.target.value
                                        : a;
                                  })
                                }
                              />
                              {sampleFieldType(f) !== '是非' && (
                                <div className="qm-option-actions">
                                  <button
                                    aria-label={`選項 ${oi + 1} 上移`}
                                    disabled={oi === 0}
                                    onClick={() =>
                                      update((q) => {
                                        const opts = q.interaction.fields[index].options;
                                        [opts[oi - 1], opts[oi]] = [opts[oi], opts[oi - 1]];
                                      })
                                    }
                                  >
                                    ↑
                                  </button>
                                  <button
                                    aria-label={`選項 ${oi + 1} 下移`}
                                    disabled={oi === f.options.length - 1}
                                    onClick={() =>
                                      update((q) => {
                                        const opts = q.interaction.fields[index].options;
                                        [opts[oi + 1], opts[oi]] = [opts[oi], opts[oi + 1]];
                                      })
                                    }
                                  >
                                    ↓
                                  </button>
                                  <button
                                    aria-label={`刪除選項 ${oi + 1}`}
                                    disabled={f.options.length <= 2}
                                    onClick={() =>
                                      update((q) => {
                                        q.interaction.fields[index].options.splice(oi, 1);
                                        const a = q.keys[f.id].answer;
                                        q.keys[f.id].answer = Array.isArray(a)
                                          ? a.filter((x) => x !== option)
                                          : a === option
                                            ? ''
                                            : a;
                                      })
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {sampleFieldType(f) !== '是非' && (
                          <button
                            className="qm-add-option"
                            disabled={f.options.length >= 20}
                            onClick={() =>
                              update((q) => {
                                q.interaction.fields[index].options.push(
                                  `新選項 ${f.options.length + 1}`,
                                );
                                if (f.kind === 'order')
                                  (q.keys[f.id].answer as string[]).push(
                                    `新選項 ${f.options.length + 1}`,
                                  );
                              })
                            }
                          >
                            ＋ 新增選項
                          </button>
                        )}
                        {f.kind === 'order' && (
                          <div className="qm-order-answer">
                            <strong>正確順序</strong>
                            {((draft.keys[f.id]?.answer as string[]) || []).map(
                              (value, ai, all) => (
                                <span key={ai}>
                                  {ai + 1}. {value}
                                  <button
                                    aria-label={`正確順序 ${ai + 1} 上移`}
                                    disabled={!ai}
                                    onClick={() =>
                                      update((q) => {
                                        const a = q.keys[f.id].answer as string[];
                                        [a[ai - 1], a[ai]] = [a[ai], a[ai - 1]];
                                      })
                                    }
                                  >
                                    ↑
                                  </button>
                                </span>
                              ),
                            )}
                          </div>
                        )}
                        <label className="qm-label">
                          解析
                          <textarea
                            aria-label={`第 ${index + 1} 欄解析`}
                            rows={2}
                            value={draft.keys[f.id]?.explanation || ''}
                            onChange={(e) =>
                              update((q) => {
                                q.keys[f.id].explanation = e.target.value;
                              })
                            }
                          />
                        </label>
                      </div>
                    ))}
                    <div className="qm-editor-footer">
                      <div>
                        <button
                          onClick={() =>
                            update((q) => {
                              const id = `f${Date.now()}`;
                              q.interaction.fields.push({
                                id,
                                label: '新欄位題幹',
                                kind: 'choice',
                                options: ['選項一', '選項二'],
                              });
                              q.keys[id] = { answer: '選項一', explanation: '' };
                            })
                          }
                        >
                          ＋ 新增欄位
                        </button>
                      </div>
                      <div>
                        <button
                          disabled={!dirty || !original}
                          onClick={() => original && pick(original)}
                        >
                          還原修改
                        </button>
                        <button className="qm-primary" disabled={!dirty} onClick={showPreview}>
                          檢視差異並儲存 →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </main>
      </fieldset>
      {preview && (
        <div className="qm-modal-backdrop">
          <section role="dialog" aria-modal="true" aria-label="儲存前差異預覽" className="qm-modal">
            <div className="qm-modal-top">
              <div className="qm-eyebrow">儲存前確認</div>
              <h2>{preview === 'delete' ? '確認刪除此題' : '核對這次的修改'}</h2>
              <p>
                {deck.title} · {draft.page ? `第 ${draft.page} 頁` : '舊版題目'} · 只更新這一題
              </p>
            </div>
            {draft.rounds > 0 && warning}
            <div className="qm-diff-table">
              <div className="qm-diff-row heading">
                <strong>修改項目</strong>
                <strong>修改前</strong>
                <strong>修改後</strong>
              </div>
              {(preview === 'delete' ? sampleQuestionDiff(original, undefined) : diffs).map((d) => (
                <div className="qm-diff-row" key={d.label}>
                  <strong>{d.label}</strong>
                  <span>{d.before}</span>
                  <span>{d.after}</span>
                </div>
              ))}
            </div>
            <div className="qm-modal-footer">
              <span>其他題目與先前作答輪次保持原樣。</span>
              <button disabled={busy} onClick={() => setPreview(null)}>
                返回編輯
              </button>
              <button className="qm-primary" disabled={busy} onClick={() => void saveSample()}>
                {preview === 'delete' ? '確認刪除' : '確認儲存'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function qAnswer(q: SampleQuestion, id: string) {
  return q.keys[id]?.answer;
}
