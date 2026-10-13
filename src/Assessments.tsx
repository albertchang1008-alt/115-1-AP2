import { useEffect, useRef, useState } from 'react';
import { API } from './service';
import { Course } from '../shared/model';
import { ExamQuestion } from '../shared/assessment';
import { QuestionImage } from './QuestionContent';
const errorText = (e: unknown) => (e as Error).message;
const time = (at: number) => new Date(at).toLocaleString('zh-TW');
export function StudentAssessments({ api, course }: { api: API; course: Course }) {
  const [exams, setExams] = useState<any[]>([]),
    [current, setCurrent] = useState<any>(null),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(Date.now());
  const offset = useRef(0),
    inflight = useRef(false),
    lastTimeout = useRef(0),
    currentRef = useRef<any>(null),
    answersRef = useRef<Record<string, string>>({});
  currentRef.current = current;
  answersRef.current = answers;
  async function refresh() {
    if (api.preview) return;
    try {
      const r = await api.call('getAssessments', { courseId: course.id });
      setExams(r.assessments);
      const latest = r.assessments.find((e: any) => e.id === currentRef.current?.id);
      if (currentRef.current?.session?.state === 'active' && latest?.session?.state === 'submitted') {
        adopt(latest);
        setNotice('已完成交卷，等待教師公布結果。');
      }
    } catch (e) {
      setNotice(errorText(e));
    }
  }
  useEffect(() => {
    setCurrent(null);
    setAnswers({});
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [course.id, api]);
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const dirty =
    !!current && JSON.stringify(answers) !== JSON.stringify(current.session?.answers || {});
  function adopt(e: any) {
    offset.current = e.serverAt - Date.now();
    setCurrent(e);
    setAnswers(e.session?.answers || {});
  }
  async function start(exam: any) {
    setBusy(true);
    setNotice('');
    try {
      adopt(await api.call('startAssessment', { courseId: course.id, examId: exam.id }));
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function save(submit = false) {
    const e = currentRef.current;
    if (!e || e.session.state !== 'active' || inflight.current) return;
    inflight.current = true;
    setBusy(true);
    const sent = answersRef.current;
    try {
      const r = await api.call('saveAssessment', {
        courseId: course.id,
        examId: e.id,
        revision: e.session.revision,
        answers: sent,
        submit,
      });
      offset.current = r.serverAt - Date.now();
      setCurrent(r);
      if (
        r.session.state === 'submitted' ||
        JSON.stringify(answersRef.current) === JSON.stringify(sent)
      )
        setAnswers(r.session.answers);
      setNotice(r.session.state === 'submitted' ? '已完成交卷，等待教師公布結果。' : '答案已儲存');
      if (r.session.state === 'submitted') refresh();
    } catch (err) {
      setNotice(
        '尚未存入雲端：' +
          errorText(err) +
          '。請保持此頁開啟，重試儲存；若另一視窗更新，按「重新載入作答」。',
      );
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!dirty || current?.session.state !== 'active') return;
    const t = setTimeout(() => save(), 650);
    return () => clearTimeout(t);
  }, [answers, current]);
  const remaining =
    current?.session?.state === 'active'
      ? Math.max(0, Math.ceil((current.session.expiresAt - tick - offset.current) / 1000))
      : 0;
  useEffect(() => {
    if (
      current?.session.state === 'active' &&
      remaining === 0 &&
      !busy &&
      Date.now() - lastTimeout.current > 5000
    ) {
      lastTimeout.current = Date.now();
      save(true);
    }
  }, [remaining, current, busy, tick]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  if (api.preview)
    return (
      <section className="panel">
        <h2>正式前後測</h2>
        <p>教師前台預覽不建立正式作答紀錄；請在「正式測驗」查看試卷與開放設定。</p>
      </section>
    );
  if (!exams.length && !notice) return null;
  const active = current?.session?.state === 'active';
  return (
    <section className={active ? 'assessment-overlay' : 'panel'} aria-label="正式前後測">
      <h2>正式前後測</h2>
      <p>題數依老師設定、限時 8 分鐘、一次正式交卷。成績與解析由教師在後測結束後公布。</p>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {!current ? (
        exams.map((e) => (
          <article className="assessment-card" key={e.id}>
            <h3>{e.title}</h3>
            <p>
              {e.state === 'open' ? '教師已開放' : e.state === 'closed' ? '已結束' : '尚未開放'}
            </p>
            <button disabled={busy || (!e.session && e.state !== 'open')} onClick={() => start(e)}>
              {e.session?.state === 'active'
                ? '繼續原作答'
                : e.session?.state === 'submitted'
                  ? '查看交卷狀態'
                  : '開始測驗'}
            </button>
            {e.session?.state === 'submitted' && (
              <span>
                {' '}
                已交卷{e.released ? ` · ${e.session.correct} / ${e.total} 題` : '，等待公布'}
              </span>
            )}
          </article>
        ))
      ) : (
        <>
          <h3>
            {current.title}{' '}
            {active && (
              <span aria-live="off">
                剩餘 {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </span>
            )}
          </h3>
          {active ? (
            <>
              <p className={dirty ? 'notice warning' : 'muted'}>
                {dirty ? '答案尚未儲存，請保持網路連線。' : '所有答案已存入雲端。'} 已答{' '}
                {Object.keys(answers).length} / {current.total}
              </p>
              {current.session.questions.map((q: ExamQuestion, i: number) => (
                <fieldset
                  key={q.id}
                  className="assessment-question"
                  disabled={busy || remaining === 0}
                >
                  <legend>
                    {i + 1}. {q.text}
                  </legend>
                  {q.image && <QuestionImage url={q.image} />}{' '}
                  {q.options.map((o) => (
                    <label key={o.id}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === o.id}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      />
                      {o.text}
                    </label>
                  ))}
                </fieldset>
              ))}
              <div className="assessment-actions">
                <button disabled={busy} onClick={() => save()}>
                  儲存答案
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        `已答 ${Object.keys(answers).length} / ${current.total} 題，確定交卷？交卷後不能再修改。`,
                      )
                    )
                      save(true);
                  }}
                >
                  正式交卷
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (!dirty || confirm('重新載入會以雲端已儲存答案取代本頁尚未儲存內容。'))
                      start(current);
                  }}
                >
                  重新載入作答
                </button>
                <button
                  disabled={busy || dirty}
                  onClick={() => {
                    setCurrent(null);
                    refresh();
                  }}
                >
                  暫離（計時持續）
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                已交卷 · {time(current.session.submittedAt)}。
                {current.released
                  ? `答對 ${current.session.correct} / ${current.total} 題（${current.session.score} 分）`
                  : '等待教師公布成績與解析。'}
              </p>
              {current.results?.map((q: any, i: number) => (
                <article key={q.id}>
                  <h4>
                    {i + 1}. {q.text}
                  </h4>
                  <p>
                    你的選答：{q.options.find((o: any) => o.id === q.selected)?.text || '未作答'}
                  </p>
                  <p>正解：{q.options.find((o: any) => o.id === q.answer)?.text}</p>
                  <p>{q.explanation}</p>
                </article>
              ))}
              <button
                onClick={() => {
                  setCurrent(null);
                  refresh();
                }}
              >
                返回課程
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
export function TeacherAssessments({
  api,
  course,
  notify,
}: {
  api: API;
  course: Course;
  notify: (s: string) => void;
}) {
  const [exams, setExams] = useState<any[]>([]),
    [kind, setKind] = useState('pretest'),
    [classes, setClasses] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [report, setReport] = useState<any>(null),
    [preview, setPreview] = useState<any>(null),
    [makeup, setMakeup] = useState(''),
    [reason, setReason] = useState('');
  async function load() {
    if (api.preview) return;
    try {
      setExams((await api.call('getAssessments', { courseId: course.id })).assessments);
    } catch (e) {
      notify(errorText(e));
    }
  }
  useEffect(() => {
    setClasses(course.classIds);
    load();
  }, [course.id, api]);
  async function run(name: string, data: any) {
    setBusy(true);
    try {
      const r = await api.call(name, { courseId: course.id, ...data });
      await load();
      return r;
    } catch (e) {
      notify(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function reports() {
    const r = await run('assessmentReport', {});
    if (r) setReport(r);
  }
  function csv() {
    if (!report) return;
    const rows = [['學號', '姓名', '班級', '前測答對', '後測答對', '差值', '前測狀態', '後測狀態']];
    const roster = [...report.roster];
    for (const s of report.sessions)
      if (!roster.some((r: any) => r.classId === s.classId && r.studentId === s.studentId))
        roster.push(s);
    for (const r of roster) {
      const pre = report.sessions.find(
          (s: any) =>
            !s.makeupOf &&
            s.kind === 'pretest' &&
            s.classId === r.classId &&
            s.studentId === r.studentId,
        ),
        post = report.sessions.find(
          (s: any) =>
            !s.makeupOf &&
            s.kind === 'posttest' &&
            s.classId === r.classId &&
            s.studentId === r.studentId,
        );
      const a = pre?.state === 'submitted' ? pre.correct : '',
        b = post?.state === 'submitted' ? post.correct : '';
      rows.push([
        r.studentId,
        r.name,
        r.classId,
        a,
        b,
        a !== '' && b !== '' ? b - a : '',
        pre?.state || '未開始',
        post?.state || '未開始',
      ]);
    }
    // Protect spreadsheet consumers from formula interpretation in roster text.
    const text =
      '\uFEFF' +
      rows
        .map((r) =>
          r
            .map(
              (v) =>
                '"' +
                String(v ?? '')
                  .replace(/^[=+@-]/, "'$&")
                  .replaceAll('"', '""') +
                '"',
            )
            .join(','),
        )
        .join('\r\n');
    const a = document.createElement('a'),
      url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.href = url;
    a.download = `${course.id}_前後測配對.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  if (api.preview)
    return (
      <section className="panel">
        <h2>正式測驗</h2>
        <p>正式測驗必須連接 Firebase；預覽模式不會建立試卷或成績。</p>
      </section>
    );
  return (
    <section className="panel">
      <h2>正式前後測</h2>
      <p>
        題數依課程來源，限時 8
        分鐘（從每位學生開始作答起算）。由教師手動按「開放作答」與「結束測驗」，不需設定日期時間。建立即凍結試卷；同步題庫不改已建立的試卷。先結束前測才開後測，所有後測結束後才能公布答案。
      </p>
      <div className="assessment-form">
        <label>
          種類
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setMakeup('');
              setReason('');
            }}
          >
            <option value="pretest">前測</option>
            <option value="posttest">後測</option>
          </select>
        </label>
        {course.classIds.map((cl) => (
          <label key={cl}>
            <input
              type="checkbox"
              checked={classes.includes(cl)}
              onChange={(e) =>
                setClasses((old) => (e.target.checked ? [...old, cl] : old.filter((x) => x !== cl)))
              }
            />
            {course.classNames?.[cl] || cl}
          </label>
        ))}
        <label>
          補考原測驗（一般正式測驗留空）
          <select value={makeup} onChange={(e) => setMakeup(e.target.value)}>
            <option value="">一般正式測驗</option>
            {exams
              .filter((e) => e.kind === kind)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} · {e.classIds.join('、')} · {time(e.createdAt)}
                </option>
              ))}
          </select>
        </label>
        {makeup && (
          <label>
            補考理由
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        )}
        <button
          disabled={busy || !classes.length || (!!makeup && !reason.trim())}
          onClick={() =>
            run('prepareAssessment', {
              kind,
              classIds: classes,
              makeupOf: makeup,
              reason,
            })
          }
        >
          建立凍結試卷
        </button>
      </div>
      {exams.map((e) => (
        <article className="assessment-card" key={e.id}>
          <h3>
            {e.title} · {e.classIds.join('、')}
            {e.id === makeup ? '（補考來源）' : ''}
          </h3>
          <p>
            {e.state === 'prepared' ? '待開放' : e.state === 'open' ? '開放中' : '已結束'}
            {e.released ? ' · 已公布' : ''}
            {e.openedAt ? ` · 開放於 ${time(e.openedAt)}` : ''}
            {e.closedAt ? ` · 結束於 ${time(e.closedAt)}` : ''}
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              const r = await run('previewAssessment', { examId: e.id });
              if (r) setPreview(r);
            }}
          >
            教師試卷預覽
          </button>{' '}
          {e.state === 'prepared' && (
            <button
              disabled={busy}
              onClick={() => run('controlAssessment', { examId: e.id, action: 'open' })}
            >
              開放作答
            </button>
          )}{' '}
          {e.state !== 'closed' && (
            <button
              disabled={busy}
              onClick={() => {
                if (confirm('確定結束？未交卷作答將採最後已儲存答案批改。'))
                  run('controlAssessment', { examId: e.id, action: 'close' });
              }}
            >
              結束測驗
            </button>
          )}{' '}
          {e.state === 'closed' && !e.released && (
            <button
              disabled={busy}
              onClick={() => {
                if (confirm('公布本試卷的成績、正解及解析？公布後不可再開放同來源測驗。'))
                  run('controlAssessment', { examId: e.id, action: 'release' });
              }}
            >
              公布結果
            </button>
          )}
        </article>
      ))}
      {preview && (
        <details open>
          <summary>{preview.title}｜教師專用（不建立作答）</summary>
          {preview.questions.map((q: any, i: number) => (
            <div key={q.id}>
              <h4>
                {i + 1}. {q.text}
              </h4>
              {q.options.map((o: any) => (
                <p key={o.id}>
                  {o.text}
                  {o.id === q.answer ? ' ✓' : ''}
                </p>
              ))}
              <p>{q.explanation}</p>
            </div>
          ))}
          <button onClick={() => setPreview(null)}>關閉預覽</button>
        </details>
      )}
      <button disabled={busy} onClick={reports}>
        更新作答報表
      </button>
      {report && (
        <>
          <button onClick={csv}>匯出前後測配對 CSV</button>
          <p>未開始／未交卷以空白呈現，不當成 0 分；補考另外保留原紀錄，不取代配對正式成績。</p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>學號</th>
                  <th>班級</th>
                  <th>測驗</th>
                  <th>狀態</th>
                  <th>答對／總題</th>
                  <th>交卷時間</th>
                </tr>
              </thead>
              <tbody>
                {report.sessions.map((s: any) => (
                  <tr key={`${s.examId}:${s.uid}`}>
                    <td>{s.studentId}</td>
                    <td>{s.classId}</td>
                    <td>
                      {s.kind === 'pretest' ? '前測' : '後測'}
                      {s.makeupOf ? '（補考）' : ''}
                    </td>
                    <td>{s.state === 'active' ? '作答中' : '已交卷'}</td>
                    <td>{s.state === 'submitted' ? `${s.correct} / ${s.total}` : '—'}</td>
                    <td>{s.submittedAt ? time(s.submittedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
