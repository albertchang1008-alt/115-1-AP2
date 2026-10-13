import { useState } from 'react';
import type { ReflectionConfig, ReflectionPrompt } from '../shared/model';
import { reflectionTemplate, validateReflectionConfig } from '../shared/reflection';

export function ReflectionEditor({
  config,
  onChange,
}: {
  config: ReflectionConfig;
  onChange: (config: ReflectionConfig) => void;
}) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [error, setError] = useState('');
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});
  const change = (i: number, patch: Partial<ReflectionPrompt>) =>
    onChange({
      ...config,
      prompts: config.prompts.map((p, n) => (n === i ? { ...p, ...patch } : p)),
    });
  const confirmChange = (fn: () => void) => setPending(() => fn);
  const reorder = (i: number, offset: number) => {
    const prompts = [...config.prompts];
    [prompts[i], prompts[i + offset]] = [prompts[i + offset], prompts[i]];
    onChange({ ...config, prompts });
  };
  return (
    <section className="reflection-editor" aria-label="反思題目編輯器">
      <div className="actions">
        <button
          type="button"
          onClick={() =>
            config.prompts.length
              ? confirmChange(() => onChange(reflectionTemplate()))
              : onChange(reflectionTemplate())
          }
        >
          套用課後反思範本
        </button>
        <button
          type="button"
          disabled={config.prompts.length >= 8}
          onClick={() =>
            onChange({
              ...config,
              prompts: [
                ...config.prompts,
                { id: crypto.randomUUID(), kind: 'text', text: '', required: true, maxLength: 500 },
              ],
            })
          }
        >
          新增反思題目
        </button>
      </div>
      <label>
        <input
          type="checkbox"
          checked={config.allowEdit}
          onChange={(e) => onChange({ ...config, allowEdit: e.target.checked })}
        />
        送出後允許修改（單元截止後一律唯讀）
      </label>
      {config.prompts.map((p, i) => (
        <fieldset key={p.id}>
          <legend>第 {i + 1} 題</legend>
          <small className="block">
            固定題目 ID：<code>{p.id}</code>
          </small>
          <label>
            題型
            <select
              aria-label={`第${i + 1}題題型`}
              value={p.kind}
              onChange={(e) =>
                confirmChange(() => {
                  const next: ReflectionPrompt = {
                    id: p.id,
                    text: p.text,
                    required: p.required,
                    kind: e.target.value as 'text' | 'single',
                  };
                  if (next.kind === 'single') next.options = ['選項一', '選項二'];
                  else next.maxLength = 500;
                  onChange({
                    ...config,
                    prompts: config.prompts.map((v, n) => (n === i ? next : v)),
                  });
                })
              }
            >
              <option value="text">文字</option>
              <option value="single">單選（沒有正確答案）</option>
            </select>
          </label>
          <label>
            題目文字
            <textarea
              aria-label={`第${i + 1}題題目文字`}
              maxLength={300}
              value={p.text}
              onChange={(e) => change(i, { text: e.target.value })}
            />
          </label>
          <label>
            <input
              aria-label={`第${i + 1}題必做`}
              type="checkbox"
              checked={p.required}
              onChange={(e) => change(i, { required: e.target.checked })}
            />
            必做
          </label>
          {p.kind === 'text' ? (
            <label>
              字數上限
              <input
                aria-label={`第${i + 1}題字數上限`}
                type="number"
                min={1}
                max={1000}
                value={p.maxLength ?? 500}
                onChange={(e) => change(i, { maxLength: Number(e.target.value) })}
              />
            </label>
          ) : (
            <>
              <p className="muted">2–6 個選項，每個最多80字。改選項時舊作答仍保留原題快照。</p>
              {(p.options || []).map((o, n) => (
                <label key={n}>
                  選項 {n + 1}
                  <input
                    aria-label={`第${i + 1}題選項${n + 1}`}
                    maxLength={80}
                    value={optionDrafts[p.id + ':' + n] ?? o}
                    onChange={(e) =>
                      setOptionDrafts({ ...optionDrafts, [p.id + ':' + n]: e.target.value })
                    }
                    onBlur={() => {
                      const value = optionDrafts[p.id + ':' + n];
                      if (value !== undefined && value !== o) {
                        const reset = () =>
                          setOptionDrafts((d) => {
                            const next = { ...d };
                            delete next[p.id + ':' + n];
                            return next;
                          });
                        setPending(() => () => {
                          change(i, { options: p.options!.map((v, k) => (k === n ? value : v)) });
                          reset();
                        });
                      }
                    }}
                  />
                </label>
              ))}
              <div className="actions">
                <button
                  type="button"
                  disabled={(p.options?.length || 0) >= 6}
                  onClick={() =>
                    confirmChange(() => change(i, { options: [...(p.options || []), ''] }))
                  }
                >
                  新增選項
                </button>
                <button
                  type="button"
                  disabled={(p.options?.length || 0) <= 2}
                  onClick={() =>
                    confirmChange(() => change(i, { options: p.options!.slice(0, -1) }))
                  }
                >
                  刪除末項
                </button>
              </div>
            </>
          )}
          <div className="actions">
            <button
              type="button"
              aria-label={`第${i + 1}題上移`}
              disabled={i === 0}
              onClick={() => reorder(i, -1)}
            >
              上移
            </button>
            <button
              type="button"
              aria-label={`第${i + 1}題下移`}
              disabled={i === config.prompts.length - 1}
              onClick={() => reorder(i, 1)}
            >
              下移
            </button>
            <button
              type="button"
              aria-label={`刪除第${i + 1}題`}
              onClick={() =>
                confirmChange(() =>
                  onChange({ ...config, prompts: config.prompts.filter((_, n) => n !== i) }),
                )
              }
            >
              刪除題目
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => {
          try {
            validateReflectionConfig(config);
            setError('設定檢查通過');
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        檢查反思設定
      </button>
      {error && <p role="status">{error}</p>}
      {pending && (
        <div className="modalshade">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="變更反思題目警告"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOptionDrafts({});
                setPending(null);
              }
              if (e.key === 'Tab') {
                const buttons = e.currentTarget.querySelectorAll('button');
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <h2>確認變更反思題目</h2>
            <p>
              若已有學生作答，刪除題目、改題型或改動選項後，舊作答仍保留原題目快照，可能與新題不同。題目
              ID 不會修改。
            </p>
            <div className="actions">
              <button
                autoFocus
                type="button"
                onClick={() => {
                  setOptionDrafts({});
                  setPending(null);
                }}
              >
                取消變更
              </button>
              <button
                type="button"
                onClick={() => {
                  pending();
                  setPending(null);
                }}
              >
                確認變更
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
