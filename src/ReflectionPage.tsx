import { useEffect, useRef, useState } from 'react';
import type {
  Activity,
  Course,
  Progress,
  ReflectionConfig,
  ReflectionResponse,
} from '../shared/model';
import {
  reflectionCanEdit,
  reflectionDraftKey,
  validateReflectionAnswers,
} from '../shared/reflection';
import type { API } from './service';

export function ReflectionPage({
  course,
  chapterId,
  dueAt,
  activity,
  api,
  uid,
  onProgress,
  onBack,
}: {
  course: Course;
  chapterId: string;
  dueAt: string;
  activity: Activity;
  api: API;
  uid: string;
  onProgress: (p: Progress) => void;
  onBack: () => void;
}) {
  const config = activity.reflection || { prompts: [], allowEdit: true };
  const key =
    reflectionDraftKey(course.id, uid, chapterId, activity.id) + (api.preview ? ':preview' : '');
  const [answers, setAnswers] = useState<Record<string, string>>({}),
    [saved, setSaved] = useState<ReflectionResponse | null>(null),
    [editing, setEditing] = useState(true),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(api.preview),
    [error, setError] = useState(''),
    [draftNotice, setDraftNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const changed = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let live = true;
    changed.current = false;
    setSaved(null);
    setAnswers({});
    setEditing(true);
    setError('');
    setLoaded(api.preview);
    let draft: Record<string, string> | null = null;
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        draft = Object.fromEntries(
          config.prompts
            .filter((p) => typeof value[p.id] === 'string')
            .map((p) => [p.id, value[p.id]]),
        );
        setAnswers(draft);
        setDraftNotice('已恢復此裝置的草稿');
      } else setDraftNotice('');
    } catch {
      setDraftNotice('無法讀取此裝置草稿，請保持頁面開啟');
    }
    if (api.preview)
      return () => {
        live = false;
      };
    api
      .call('getMyReflection', { courseId: course.id, chapterId, activityId: activity.id })
      .then((r) => {
        if (!live) return;
        setSaved(r.response);
        if (!changed.current && !draft) {
          setAnswers(r.response?.answers || {});
          setEditing(!r.response);
        } else if (r.response) setEditing(true);
        setLoaded(true);
      })
      .catch((e) => {
        if (live) {
          setError((e as Error).message);
          setLoaded(false);
        }
      });
    return () => {
      live = false;
    };
  }, [key, retry]);
  const canEdit = reflectionCanEdit(config, dueAt, !!saved, now),
    readOnly = !canEdit || (!!saved && !editing);
  const update = (id: string, value: string) => {
    changed.current = true;
    setError('');
    const next = { ...answers, [id]: value };
    setAnswers(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setDraftNotice('草稿已保存在此裝置');
    } catch {
      setDraftNotice('此裝置無法暫存草稿，請保持頁面開啟');
    }
  };
  async function submit() {
    setError('');
    try {
      validateReflectionAnswers(config, answers);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    if (api.preview) {
      setError('教師預覽：不會送出正式反思或更新進度');
      return;
    }
    setBusy(true);
    try {
      const r = await api.call('saveReflection', {
        courseId: course.id,
        chapterId,
        activityId: activity.id,
        answers,
      });
      setSaved(r.response);
      setAnswers(r.response.answers);
      setEditing(false);
      onProgress(r.progress);
      try {
        localStorage.removeItem(key);
      } catch {}
      setDraftNotice('');
    } catch (e) {
      setError('送出失敗：' + (e as Error).message + '。已填內容仍保留，請重試。');
    } finally {
      setBusy(false);
    }
  }
  const display: ReflectionConfig =
    readOnly && saved ? { ...config, prompts: saved.promptsSnapshot } : config;
  return (
    <main className="reflection-page">
      <header className="sectionhead">
        <div>
          <span className="eyebrow">課後反思</span>
          <h1>{activity.title}</h1>
        </div>
        <button onClick={onBack}>返回單元</button>
      </header>
      <p>{activity.description}</p>
      <p className="muted">
        回答所有必做題並送出後，這項活動才算完成；反思沒有正確答案。可使用換行分段，請勿輸入 Tab。
      </p>
      {saved && (
        <p role="status" className="success">
          已送出 · {new Date(saved.updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
          {saved.editCount > 0 ? ` · 修改${saved.editCount}次` : ''}
        </p>
      )}
      {!canEdit && (
        <p role="status">
          {reflectionCanEdit(config, dueAt, false, now)
            ? '教師設定送出後不能修改。'
            : '單元已截止，只能查看。'}
        </p>
      )}
      {draftNotice && !readOnly && <p role="status">{draftNotice}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!loaded && error && (
        <button type="button" onClick={() => setRetry((n) => n + 1)}>
          重新讀取已送出答案
        </button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {display.prompts.map((p, i) => (
          <fieldset key={p.id}>
            <legend>
              {i + 1}. {p.text} <span className="badge">{p.required ? '必做' : '選做'}</span>
            </legend>
            {readOnly ? (
              <p className="reflection-answer">{saved?.answers[p.id] || '未填寫'}</p>
            ) : p.kind === 'text' ? (
              <>
                <textarea
                  aria-label={p.text}
                  aria-required={p.required}
                  maxLength={p.maxLength ?? 500}
                  rows={5}
                  value={answers[p.id] || ''}
                  onChange={(e) => update(p.id, e.target.value)}
                  disabled={busy}
                />
                <small>
                  剩餘 {Math.max(0, (p.maxLength ?? 500) - (answers[p.id]?.length || 0))} 字
                </small>
              </>
            ) : (
              <div className="reflection-choices" role="group" aria-label={p.text}>
                {p.options?.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={answers[p.id] === o}
                    className={answers[p.id] === o ? 'selected' : ''}
                    disabled={busy}
                    onClick={() => update(p.id, o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        ))}
        <div className="actions">
          {readOnly ? (
            saved &&
            canEdit && (
              <button
                key="edit"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setAnswers(
                    Object.fromEntries(
                      config.prompts.map((p) => [p.id, saved.answers[p.id] || '']),
                    ),
                  );
                  setEditing(true);
                }}
              >
                修改
              </button>
            )
          ) : (
            <button
              key="submit"
              className="primary"
              type="submit"
              disabled={busy || !loaded || !config.prompts.length}
            >
              {busy ? '送出中…' : '送出反思'}
            </button>
          )}
          {saved && editing && canEdit && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setAnswers(saved.answers);
                setEditing(false);
              }}
            >
              查看已送出答案
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
