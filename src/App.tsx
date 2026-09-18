import { NewCourse, ClassManager } from './CourseSetup';
import { QuestionImage, Explanations } from './QuestionContent';
import Diagnostics from './Diagnostics';
import ResearchEvidence from './ResearchEvidence';
import ProgressBoard from './ProgressBoard';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ChartNoAxesCombined,
  Settings,
  Eye,
  Plus,
  ArrowUpRight,
  GraduationCap,
  LogOut,
  FileChartColumn,
  CheckCircle2,
  PanelLeftClose,
  Search,
  Upload,
  RefreshCw,
  Download,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  Layers,
  Trash2,
} from 'lucide-react';
import Papa from 'papaparse';
import { VERSION } from '../shared/version';
import { MATERIAL_CATALOG } from '../shared/materials';
import {
  materialUrl,
  Course,
  Activity,
  Chapter,
  Profile,
  Question,
  Report,
  Roster,
  Progress,
  completion,
  complete,
  emptyProgress,
  phases,
  modes,
  youtubeId,
  forClass,
  chaptersOf,
  orderedChapters,
  chapterName,
} from '../shared/model';
import {
  API,
  cloud,
  configured,
  projectId,
  login,
  logout,
  switchAccount,
  watchAuth,
  auth,
  memoryApi,
  previewApi,
  cachedBank,
} from './service';
import Student from './Student';
import ThemePicker from './ThemePicker';
import FontSizePicker from './FontSizePicker';
const tabs = [
  ['overview', '教學總覽', LayoutDashboard],
  ['courses', '課程與教材', BookOpen],
  ['bank', '題庫管理', Layers],
  ['roster', '班級名冊', Users],
  ['completion', '完成度看板', CheckCircle2],
  ['progress', '學習進度', LayoutDashboard],
  ['analysis', '題目分析', ChartNoAxesCombined],
  ['reports', '報表與結算', FileChartColumn],
  ['settings', '平台設定', Settings],
  ['diagnostics', '教材診斷', ChartNoAxesCombined],
  ['research', '解析研究資料', FileChartColumn],
] as const;
function download(name: string, data: any[]) {
  const csv =
    '\ufeff' +
    Papa.unparse(
      data.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [
            k,
            typeof v === 'string' && /^[=+@\-\t\r]/.test(v) ? "'" + v : v,
          ]),
        ),
      ),
    );
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const uid = () => crypto.randomUUID();
const makeCourse = (): Course => ({
  id: uid(),
  title: '新課程',
  description: '',
  term: '115 學年度第 1 學期',
  classIds: ['class-a'],
  units: [],
  sheetsUrl: '',
});
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function ChapterOverrides({ course, name, chapter, onChange }: { course: Course; name: string; chapter: Chapter; onChange: (v: Course['chapterOverrides']) => void }) {
  const [cl, setCl] = useState(course.classIds[0] || '');
  const value = course.chapterOverrides?.[cl]?.[name] || {};
  const change = (patch: any) => onChange({ ...course.chapterOverrides, [cl]: { ...course.chapterOverrides?.[cl], [name]: { ...value, ...patch } } });
  return <details><summary>各班級的門檻與開放安排</summary><p className="muted">未設定時沿用單元共用值，教材內容保持共用。</p>
    <Field label="設定班級"><select value={cl} onChange={(e) => setCl(e.target.value)}>{course.classIds.map((id) => <option key={id} value={id}>{course.classNames?.[id] || id}</option>)}</select></Field>
    {cl && <div className="formgrid"><Field label="此班達標分數"><input type="number" min="0" max="100" value={value.threshold ?? chapter.threshold} onChange={(e) => change({ threshold: Number(e.target.value) })} /></Field><Field label="此班開放時間"><input type="datetime-local" value={value.opensAt ?? chapter.opensAt} onChange={(e) => change({ opensAt: e.target.value })} /></Field><Field label="此班完成期限"><input type="datetime-local" value={value.dueAt ?? chapter.dueAt} onChange={(e) => change({ dueAt: e.target.value })} /></Field><label className="check"><input type="checkbox" checked={value.required ?? chapter.required} onChange={(e) => change({ required: e.target.checked })} />此班列為必做</label></div>}
    <button disabled={!cl} onClick={() => { const next = structuredClone(course.chapterOverrides || {}); if (next[cl]) delete next[cl][name]; onChange(next); }}>恢復共用設定</button>
  </details>;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <BookOpen size={32} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
export default function App() {
  const [api, setApi] = useState<API>(cloud),
    [profile, setProfile] = useState<Profile | null>(null),
    [courses, setCourses] = useState<Course[]>([]),
    [courseId, setCourseId] = useState(''),
    [tab, setTab] = useState(location.hash.slice(1) || 'overview'),
    [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [loading, setLoading] = useState(false),
    [mobile, setMobile] = useState(false),
    [deleting, setDeleting] = useState(false),
    [unsavedIds, setUnsavedIds] = useState<Set<string>>(new Set()),
    [creating, setCreating] = useState(false),
    [copySource, setCopySource] = useState<Course | undefined>(),
    [dirty, setDirty] = useState(false),
    [termFilter, setTermFilter] = useState(''),
    [testEmails, setTestEmails] = useState<string[]>([]);
  const [preview, setPreview] = useState<{
      api: API;
      course: Course;
      unit?: string;
      activity?: string;
      draft: boolean;
    } | null>(null),
    [previewClass, setPreviewClass] = useState(''),
    [width, setWidth] = useState('desktop'),
    [sim, setSim] = useState('none'),
    [previewKey, setPreviewKey] = useState(0);
  const course = courses.find((c) => c.id === courseId) || courses[0];
  function notify(s: string) {
    setToast(s);
  }
  function doSwitchAccount() {
    setError('');
    setLoading(true);
    switchAccount()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  async function boot(service = api) {
    setLoading(true);
    setError('');
    try {
      const data = await service.call('bootstrap');
      setProfile(data.profile);
      setCourses(data.courses);
      setTestEmails(Array.isArray(data.testEmails) ? data.testEmails : []);
      setCourseId((old) => old || data.courses[0]?.id || '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (api.preview) {
      void boot(api);
      return;
    }
    return watchAuth(() => {
      if (auth?.currentUser) void boot(cloud);
      else setProfile(null);
    });
  }, [api]);
  useEffect(() => {
    const fn = () => setTab(location.hash.slice(1) || 'overview');
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  function nav(t: string) {
    if (dirty && !confirm('有尚未保存的編輯，確定離開？')) return;
    setDirty(false);
    location.hash = t;
    setTab(t);
    setMobile(false);
  }
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool || !profile?.teacher) return;
    const controller = new AbortController();
    const tool = {
      name: 'navigate_teacher_workspace',
      description: '切換教師後台目前頁面；不發布或修改課程。',
      inputSchema: {
        type: 'object',
        properties: { page: { type: 'string', enum: tabs.map((t) => t[0]) } },
        required: ['page'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input: any) => {
        if (!input || Object.keys(input).length !== 1 || !tabs.some((t) => t[0] === input.page))
          throw Error('無效的後台頁面');
        nav(input.page);
        return { page: input.page };
      },
    };
    try {
      Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, [profile?.uid]);
  async function save(c: Course) {
    await api.call('saveCourse', { course: c });
    setCourses((old) =>
      old.some((x) => x.id === c.id) ? old.map((x) => (x.id === c.id ? c : x)) : [...old, c],
    );
    setCourseId(c.id);
    setDirty(false);
    setUnsavedIds((old) => { const next = new Set(old); next.delete(c.id); return next; });
  }
  async function openPreview(c: Course, draft = true, unit?: string, activity?: string) {
    try {
      let chosen = c;
      if (draft) await save(c);
      else if (api.preview) chosen = await api.call('getPublished', { courseId: c.id });
      else chosen = await api.call('getPublished', { courseId: c.id });
      setPreviewClass(chosen.classIds[0]);
      setPreview({
        api: await previewApi(api, chosen, draft),
        course: chosen,
        unit,
        activity,
        draft,
      });
      setPreviewKey((k) => k + 1);
      setSim('none');
    } catch (e) {
      notify((e as Error).message);
    }
  }
  if (!profile)
    return (
      <div className="login">
        <div className="login-art">
          <div className="brand">
            <GraduationCap />
            課序<span>COURSE SPACE</span>
          </div>
          <h1>
            讓每一次練習，
            <br />
            看得見進步。
          </h1>
          <p>
            課程、教材、作答與學習歷程，
            <br />
            從同一個入口開始。
          </p>
          <div className="login-foot">
            LEARN · PRACTICE · REFLECT <span>v{VERSION}</span>
          </div>
        </div>
        <div className="login-form">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>進入你的學習空間</h2>
          <p>
            學生請使用學校 Google 帳號。
            <br />
            教師登入後將進入教學後台。
          </p>
          {!configured && (
            <div className="notice">
              尚未連接新的 Firebase 專案。可先進入操作示例，所有資料僅留在本次頁面。
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary loginbutton"
            disabled={!configured || loading}
            onClick={() => {
              setError('');
              login().catch((e) => setError(e.message));
            }}
          >
            {loading ? '登入中…' : '使用 Google 帳號登入'}
            <ArrowUpRight size={18} />
          </button>
          <p className="muted">@ctcn.edu.tw · 需列入課程名冊</p>
          <p className="muted">登入時會列出瀏覽器中的 Google 帳號，可選擇其他帳戶</p>
          <button className="linkbutton" onClick={() => setApi(memoryApi())}>
            查看操作示例（不連接正式資料） →
          </button>
        </div>
      </div>
    );
  if (preview)
    return (
      <div className="preview-shell">
        <div className="previewbar">
          <button onClick={() => setPreview(null)}>
            <ArrowLeft size={16} />
            返回教師後台
          </button>
          <strong>
            <Eye size={17} />
            教師預覽，不計入紀錄
          </strong>
          <span className="badge">{preview.draft ? '目前草稿' : '已發布版本'}</span>
          <select
            aria-label="預覽班級"
            value={previewClass}
            onChange={(e) => {
              setPreviewClass(e.target.value);
              setPreviewKey((k) => k + 1);
            }}
          >
            {preview.course.classIds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="模擬進度" value={sim} onChange={(e) => setSim(e.target.value)}>
            <option value="none">尚未開始</option>
            <option value="learning">學習中</option>
            <option value="complete">已完成</option>
          </select>
          <div className="segmented">
            {[
              ['desktop', Monitor],
              ['tablet', Tablet],
              ['mobile', Smartphone],
            ].map(([v, Icon]: any) => (
              <button
                aria-label={v}
                key={v}
                className={width === v ? 'active' : ''}
                onClick={() => setWidth(v)}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
          <button
            onClick={async () => {
              setPreview({ ...preview, api: await previewApi(api, preview.course, preview.draft) });
              setPreviewKey((k) => k + 1);
              setSim('none');
            }}
          >
            重設
          </button>
        </div>
        <div className={'previewdevice ' + width}>
          <Student
            key={previewKey}
            api={preview.api}
            course={forClass(preview.course, previewClass)}
            classLabel={previewClass}
            uid="preview-user"
            preview
            initialUnit={preview.unit}
            initialActivity={preview.activity}
            sim={sim}
            notify={notify}
          />
        </div>
        {toast && (
          <div className="toast" role="status">
            {toast}
            <button onClick={() => setToast('')}>×</button>
          </div>
        )}
      </div>
    );
  if (!profile.teacher)
    return (
      <>
        <div className="student-nav">
          <div className="brand">
            <GraduationCap />
            課序
          </div>
          <select
            aria-label="選擇課程"
            value={course?.id || ''}
            onChange={(e) => { if (!dirty || confirm('有尚未保存的編輯，確定切換課程？')) { setDirty(false); setCourseId(e.target.value); } }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <span>
            {profile.name} · {course?.classNames?.[course.enrollmentClassId || ''] || course?.enrollmentClassId}
          </span>
          <button onClick={doSwitchAccount}>
            <RefreshCw size={15} />
            切換帳號
          </button>
          <button onClick={() => logout()}>登出</button>
          <small>v{VERSION}</small>
        </div>
        {course ? (
          <Student
            key={course.id}
            api={api}
            course={course}
            classLabel={course.classNames?.[course.enrollmentClassId || ''] || course.enrollmentClassId || ''}
            uid={profile.uid}
            notify={notify}
          />
        ) : (
          <Empty title="尚無已發布課程" detail="教師發布課程後，就會出現在這裡。" />
        )}
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  return (
    <>
      <div className="prefs-bar"><ThemePicker /><FontSizePicker /></div>
    <div className="app">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <GraduationCap size={28} />
          <div>
            課序<small>教師工作空間</small>
          </div>
        </div>
        <div className="workspace-label">TEACHING WORKSPACE</div>
        <nav>
          {tabs.filter(([id]) => id !== 'settings').map(([id, label, Icon]) => (
            <button className={tab === id ? 'active' : ''} key={id} onClick={() => nav(id)}>
              <Icon size={19} />
              {label}
              {tab === id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>
        <button className={'sidebar-settings' + (tab === 'settings' ? ' active' : '')} onClick={() => nav('settings')}>
          <Settings size={19} />
          平台設定
          {tab === 'settings' && <ChevronRight size={14} />}
        </button>
        <div className="sidebar-bottom">
          <div className="avatar">師</div>
          <div>
            <strong>{api.preview ? '操作示例' : profile.name}</strong>
            <small>
              {api.preview ? '本次頁面暫存' : '教師帳號'} · v{VERSION}
            </small>
          </div>
          {!api.preview && (
            <button aria-label="切換帳號" onClick={doSwitchAccount}>
              <RefreshCw size={17} />
            </button>
          )}
          <button
            aria-label="登出"
            onClick={() => {
              if (api.preview) {
                setApi(cloud);
                setProfile(null);
                setCourses([]);
              } else void logout();
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main>
        <div className="topbar">
          <button
            className="mobile-toggle"
            aria-label="切換選單"
            onClick={() => setMobile(!mobile)}
          >
            <PanelLeftClose />
          </button>
          <div className="breadcrumb">
            教師後台 <ChevronRight size={14} />{' '}
            <b>{tabs.find((t) => t[0] === tab)?.[1] || '教學總覽'}</b>
          </div>
          <div className="top-actions">
            <span className="statuschip">{api.preview ? '操作示例 · 無正式資料' : '已登入'}</span>
            {tab !== 'courses' && (
              <button disabled={!course} onClick={() => course && openPreview(course)}>
                <Eye size={17} />
                預覽前台
              </button>
            )}
          </div>
        </div>
        <div className="workspace">
          {api.preview && (
            <div className="demo-banner">
              這是操作示例：課程編輯、作答與報表只保留在本次頁面，重新整理即清除。
            </div>
          )}
          <div className="contextrow">
            <label>學期<select aria-label="篩選學期" value={termFilter} onChange={(e) => setTermFilter(e.target.value)}><option value="">全部學期</option>{[...new Set(courses.map((c) => c.term))].map((term) => <option key={term}>{term}</option>)}</select></label>
            <select
              aria-label="目前課程"
              value={course?.id || ''}
              onChange={(e) => { if (!dirty || confirm('有尚未保存的編輯，確定切換課程？')) { setDirty(false); setCourseId(e.target.value); } }}
            >
              {courses.filter((c) => !termFilter || c.term === termFilter || c.id === course?.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}{c.archived ? '（已封存）' : ''}
                </option>
              ))}
            </select>
          </div>
          {tab === 'courses' ? (
            <CourseEditor
              key={course?.id || 'new'}
              course={course}
              deleting={deleting}
              api={api}
              save={save}
              preview={openPreview}
              notify={notify}
              onPublished={(published) => setCourses((old) => old.map((c) => c.id === published.id ? published : c))}
              onDirty={setDirty}
              newCourse={() => { if (!dirty || confirm('有尚未保存的編輯，確定新增課程？')) { setCopySource(undefined); setCreating(true); } }}
              copyCourse={() => { setCopySource(course); setCreating(true); }}
              archiveCourse={async () => {
                if (!course || !confirm(course.archived ? '重新開放此課程？' : '封存後學生不再能開啟課程，紀錄保留。確定封存？')) return;
                try { await api.call('archiveCourse', { courseId: course.id, archived: !course.archived }); await boot(); } catch (e) { notify((e as Error).message); }
              }}
              deleteCourse={async () => {
                if (!course || deleting) return;
                if (!confirm(`確定要刪除課程「${course.title}」嗎？此操作無法復原。`)) return;
                setDeleting(true);
                try {
                  if (!unsavedIds.has(course.id)) await api.call('deleteCourse', { courseId: course.id });
                  const rest = courses.filter((x) => x.id !== course.id);
                  setCourses(rest);
                  setUnsavedIds((old) => { const next = new Set(old); next.delete(course.id); return next; });
                  setCourseId(rest[0]?.id || '');
                  notify('課程已刪除');
                } catch (e) {
                  notify((e as Error).message);
                } finally {
                  setDeleting(false);
                }
              }}
            />
          ) : tab === 'settings' ? (
            <SettingsPage course={course} api={api} notify={notify} />
          ) : tab === 'diagnostics' && course ? (
            <Diagnostics key={course.id} course={course} api={api} notify={notify} />
          ) : tab === 'research' && course ? (
            <ResearchEvidence key={course.id} course={course} api={api} notify={notify} />
          ) : !course ? (
            <Empty title="建立第一門課程" detail="請從「課程與教材」建立課程，再匯入名冊及題庫。" />
          ) : tab === 'bank' ? (
            <Bank key={course.id} course={course} api={api} notify={notify} onSynced={async () => {
              const data = await api.call('bootstrap');
              setCourses(data.courses);
            }} />
          ) : tab === 'roster' ? (
            <RosterPage key={course.id} course={course} api={api} notify={notify} onSynced={async () => {
              const data = await api.call('bootstrap');
              setCourses(data.courses);
            }} />
          ) : tab === 'completion' ? (
            <CompletionPage key={course.id} course={course} api={api} notify={notify} />
          ) : tab === 'progress' ? (
            <ProgressBoard key={course.id} course={course} api={api} notify={notify} changed={async () => { const data = await api.call('bootstrap'); setCourses(data.courses); }} />
          ) : tab === 'analysis' ? (
            <Analysis key={course.id} course={course} api={api} notify={notify} />
          ) : tab === 'reports' ? (
            <ReportsPage key={course.id} course={course} api={api} notify={notify} />
          ) : (
            <Overview key={course.id} course={course} api={api} notify={notify} navigate={nav} />
          )}
        </div>
      </main>
      {creating && <NewCourse source={copySource} close={() => setCreating(false)} create={async (c) => {
        if (courses.some((x) => x.id === c.id)) throw Error('課程代碼已存在');
        await save(c); nav('courses');
      }} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button onClick={() => setToast('')}>×</button>
        </div>
      )}
    </div></>
  );
}
function Overview({
  course,
  api,
  notify,
  navigate,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
  navigate: (s: string) => void;
}) {
  const [overviewClass, setOverviewClass] = useState(course.classIds[0] || '');
  const [report, setReport] = useState<Report[]>([]),
    [time, setTime] = useState<number | null>(null);
  useEffect(() => {
    api
      .call('getReports', { courseId: course.id, classId: overviewClass })
      .then((r) => {
        setReport(r.rows);
        setTime(r.job?.updatedAt || null);
      })
      .catch((e) => notify(e.message));
  }, [course.id, api, overviewClass]);
  const weak = report
    .flatMap((r) => Object.entries(r.modes.all || {}).map(([id, s]) => ({ id, ...s })))
    .filter((s) => s.students > 0)
    .sort((a, b) => b.wrong / b.students - a.wrong / a.students)
    .slice(0, 3);
  const chapters = orderedChapters(course);
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">TEACHING OVERVIEW</span>
          <h1>今天，從學習現況開始。</h1>
          <p>安排下一步教學，也看見每一次練習的進展。</p>
        </div>
        <button className="primary" onClick={() => navigate('courses')}>
          <Plus size={17} />
          安排學習活動
        </button>
      </header>
      <div className="metricgrid">
        <Metric title="課程單元" value={chapters.length} note="依課前・課中・課後安排" />
        <Metric
          title="必做單元"
          value={chapters.filter(({ chapter }) => chapter.required).length}
          note="供平常分數完成度採計"
        />
        <Metric
          title="學習活動"
          value={chapters.reduce((n, row) => n + row.chapter.activities.length, 0)}
          note="教材參與獨立記錄"
        />
        <Metric title="授課班級" value={course.classIds.length} note="名冊限制與班級權限" />
      </div>
      <div className="overviewgrid">
        <section className="panel">
          <div className="sectionhead">
            <div>
              <span className="eyebrow">COURSE PATH</span>
              <h2>課程進行安排</h2>
            </div>
            <button className="linkbutton" onClick={() => navigate('courses')}>
              管理課程 ↗
            </button>
          </div>
          {chapters.map(({ name, chapter, units }, i) => (
            <div className="timeline" key={name}>
              <span className="timeline-no">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{chapter.title}</h3>
                <p>
                  {chapter.activities.length} 項活動 · {units.length} 個分類 · 達標 {chapter.threshold} 分
                  {chapter.dueAt ? ' · ' + new Date(chapter.dueAt).toLocaleDateString() : ''}
                </p>
              </div>
              <span className={'badge ' + (units.every((u) => u.bankVersion) ? 'green' : '')}>
                {units.every((u) => u.bankVersion) ? '題庫已連接' : '待設定題庫'}
              </span>
            </div>
          ))}
        </section>
        <section className="panel darkpanel">
          <span className="eyebrow">TEACHING INSIGHTS</span>
          <h2>值得再講一次的題目</h2>
          <p className="muted">
            <select aria-label="總覽班級" value={overviewClass} onChange={(e) => setOverviewClass(e.target.value)}>{course.classIds.map((cl) => <option key={cl} value={cl}>{course.classNames?.[cl] || cl}</option>)}</select> · {time ? new Date(time).toLocaleString() : '尚未產生統計'}
          </p>
          {weak.length ? (
            weak.map((q) => (
              <div className="weak" key={q.id}>
                <span>{q.id}</span>
                <strong>
                  {Math.round((q.wrong / q.students) * 100)}%<small>首次答錯</small>
                </strong>
              </div>
            ))
          ) : (
            <p className="insight-empty">
              有學生作答並更新報表後，
              <br />
              這裡會呈現共同的困難。
            </p>
          )}
          <button onClick={() => navigate('analysis')}>
            查看題目分析 <ArrowUpRight size={17} />
          </button>
        </section>
      </div>
      <section className="quickgrid">
        {[
          ['completion', '確認誰還沒完成', '依班級查看待完成單元與學生'],
          ['roster', '管理本學期名冊', '匯入學校信箱並安排班級'],
          ['reports', '準備平常分數', '保存完成度結算快照'],
        ].map(([id, title, detail]) => (
          <button key={id} onClick={() => navigate(id)}>
            <h3>
              {title} <ArrowUpRight size={18} />
            </h3>
            <p>{detail}</p>
          </button>
        ))}
      </section>
    </>
  );
}
function Metric({ title, value, note }: { title: string; value: number | string; note: string }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function ChapterActivityEditor({
  activity,
  onChange,
  onPreview,
  onRemove,
}: {
  activity: Activity;
  onChange: (patch: Partial<Activity>) => void;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const knownMaterial = activity.materialVersion ? MATERIAL_CATALOG[activity.materialVersion] : undefined;
  const materialSelectValue = knownMaterial ? activity.materialVersion! : '__custom__';
  return (
    <details className="activityeditor" open>
      <summary>{phases[activity.phase]} · {activity.title}</summary>
      <div className="formgrid">
        <Field label="活動名稱">
          <input value={activity.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="階段">
          <select value={activity.phase} onChange={(e) => onChange({ phase: e.target.value as Activity['phase'] })}>
            {Object.entries(phases).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </Field>
        <Field label="類型">
          <select value={activity.type} onChange={(e) => onChange({ type: e.target.value as Activity['type'] })}>
            <option value="youtube">YouTube 影片</option>
            <option value="html">互動 HTML 教材</option>
            <option value="link">外部教材</option>
          </select>
        </Field>
        <Field label={activity.type === 'html' ? 'GitHub Pages 教材網址' : '教材連結'}>
          <input type="url" value={activity.url || ''} onChange={(e) => onChange({ url: e.target.value })} />
        </Field>
      </div>
      {activity.type === 'youtube' && <>
        <div className="formgrid">
          <Field label="YouTube 開始秒數">
            <input type="number" min="0" value={activity.start ?? 0} onChange={(e) => onChange({ start: Number(e.target.value) })} />
          </Field>
          <Field label="YouTube 結束秒數（留白播放至結束）">
            <input type="number" min="1" value={activity.end ?? ''} onChange={(e) => onChange({ end: e.target.value ? Number(e.target.value) : undefined })} />
          </Field>
        </div>
        {activity.url && <p className={youtubeId(activity.url) ? 'success' : 'error'}>{youtubeId(activity.url) ? '已辨識 YouTube 影片' : '請貼上單支影片的有效連結'}</p>}
        <p className="muted">選看補充教材：不影響完成度或成績，播放位置可保存。</p>
      </>}
      {activity.type === 'html' && <>
        {activity.url && !materialUrl(activity.url) && <p className="error">請填入有效的 HTTPS 網址</p>}
        <div className="formgrid">
          <Field label="教材紀錄方式">
            <select value={activity.tracking || 'reading'} onChange={(e) => onChange({ tracking: e.target.value as 'reading' | 'interactive' })}>
              <option value="reading">一般閱讀</option>
              <option value="interactive">闖關與學習診斷（需串接）</option>
            </select>
          </Field>
          <Field label="教材版本">
            <select value={materialSelectValue} onChange={(e) => {
              const slug = e.target.value;
              if (slug === '__custom__') { onChange({ materialVersion: '' }); return; }
              const entry = MATERIAL_CATALOG[slug];
              onChange({ materialVersion: slug, tracking: entry.tracking, nodeTotal: entry.nodeTotal, questionTotal: entry.questionTotal });
            }}>
              <option value="__custom__">其他／自訂教材版本</option>
              {Object.entries(MATERIAL_CATALOG).map(([slug, entry]) => <option key={slug} value={slug}>{entry.label}（{slug}）</option>)}
            </select>
            {materialSelectValue === '__custom__' && <input value={activity.materialVersion || ''} placeholder="教材版本字串，例如 v1" onChange={(e) => onChange({ materialVersion: e.target.value })} />}
          </Field>
          <Field label="探索節點總數">
            <input type="number" min="0" max="500" value={activity.nodeTotal || 0} onChange={(e) => onChange({ nodeTotal: Number(e.target.value) })} />
          </Field>
          <Field label="闖關題目總數">
            <input type="number" min="0" max="500" value={activity.questionTotal || 0} onChange={(e) => onChange({ questionTotal: Number(e.target.value) })} />
          </Field>
        </div>
      </>}
      <Field label="學習說明">
        <textarea value={activity.description} onChange={(e) => onChange({ description: e.target.value })} />
      </Field>
      <div className="actions"><button onClick={onPreview}><Eye size={16} />預覽活動</button><button onClick={onRemove}>從草稿移除</button></div>
    </details>
  );
}
type CourseEditorProps = {
  course?: Course;
  api: API;
  save: (course: Course) => Promise<void>;
  preview: (course: Course, draft?: boolean, unitId?: string, activityId?: string) => void;
  notify: (message: string) => void;
  newCourse: () => void;
  deleteCourse: () => Promise<void>;
  deleting: boolean;
  onDirty: (dirty: boolean) => void;
  onPublished: (course: Course) => void;
  copyCourse: () => void;
  archiveCourse: () => Promise<void>;
};
function CourseEditor(props: CourseEditorProps) {
  const { course, api, save, preview, notify, newCourse, deleteCourse, deleting, onDirty, onPublished, copyCourse, archiveCourse } = props;
  const [draft, setDraft] = useState<Course>(structuredClone(course || makeCourse()));
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const next = structuredClone(course || makeCourse()); setDraft(next); setSelected(orderedChapters(next)[0]?.name || ''); }, [course?.id]);
  const isDirty = !!course && JSON.stringify(draft) !== JSON.stringify(course);
  useEffect(() => { onDirty(isDirty); return () => onDirty(false); }, [isDirty]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);
  const rows = orderedChapters(draft), row = rows.find((item) => item.name === selected) || rows[0];
  const name = row?.name || '', chapter = row?.chapter, units = row?.units || [];
  const materialize = (source = draft) => source.chapters ? source : { ...source, chapters: chaptersOf(source), chapterOrder: orderedChapters(source).map((item) => item.name) };
  const changeChapter = (patch: Partial<Chapter>) => { const base = materialize(); setDraft({ ...base, chapters: { ...base.chapters, [name]: { ...chaptersOf(base)[name], ...patch } } }); };
  const changeActivity = (index: number, patch: Partial<Activity>) => changeChapter({ activities: chapter!.activities.map((a, i) => i === index ? { ...a, ...patch } : a) });
  const act = async (publish = false) => { setBusy(true); try { const ready = materialize(); await save(ready); if (publish) { const result = await api.call<Course>('publishCourse', { courseId: ready.id }); setDraft(result); onPublished(result); } notify(publish ? '課程已發布' : '草稿已保存'); } catch (e) { notify((e as Error).message); } finally { setBusy(false); } };
  const move = (offset: number) => { const order = rows.map((item) => item.name), at = order.indexOf(name), to = at + offset; if (to < 0 || to >= order.length) return; [order[at], order[to]] = [order[to], order[at]]; setDraft({ ...materialize(), chapterOrder: order }); };
  const removeStale = () => { const stale = draft.staleUnits || []; if (!stale.length || !confirm(`確定移除以下舊題目分類？\n${stale.join('\n')}`)) return; const classUnits = Object.fromEntries(Object.entries(draft.classUnits || {}).map(([cl, ids]) => [cl, ids.filter((id) => !stale.includes(id))])); setDraft({ ...draft, units: draft.units.filter((u) => !stale.includes(u.id)), classUnits, staleUnits: [] }); };
  const moveLegacyActivity = (unitId: string, activity: Activity) => { const base = materialize(); setDraft({ ...base, chapters: { ...base.chapters, [name]: { ...chaptersOf(base)[name], activities: [...chaptersOf(base)[name].activities, activity] } }, units: base.units.map((u) => u.id === unitId ? { ...u, activities: u.activities.filter((a) => a.id !== activity.id) } : u) }); };
  if (!course) return <section className="panel"><Empty title="建立第一門課程" detail="先新增自訂課程代碼，再同步 Google Sheet 建立單元。" /><button onClick={newCourse}>新增課程</button></section>;
  return <>
    <header className="pageheading"><div><span className="eyebrow">COURSE STUDIO</span><h1>課程與教材</h1><p>{isDirty ? '尚未保存' : '草稿已保存'} · Chapter 單元設定</p></div><div className="actions"><button onClick={newCourse}><Plus size={16} />新增課程</button><button disabled={busy} onClick={() => act()}>保存草稿</button><button className="primary" disabled={busy} onClick={() => act(true)}>發布課程</button></div></header>
    <section className="panel"><div className="formgrid"><Field label="課程名稱"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label="學期"><input value={draft.term} onChange={(e) => setDraft({ ...draft, term: e.target.value })} /></Field><Field label="課程說明"><input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field></div><p className="muted">課程代碼：{draft.id}</p><div className="actions"><button onClick={() => preview(materialize(), true)}>保存並預覽草稿</button><button onClick={copyCourse}>複製課程</button><button onClick={archiveCourse}>封存課程</button><button disabled={deleting} onClick={deleteCourse}>刪除課程</button></div></section>
    <ClassManager course={draft} change={setDraft} />
    {!!draft.staleUnits?.length && <div className="notice warning"><strong>Sheet 已無對應的舊題目分類</strong><p>{draft.staleUnits.join('、')}</p><button onClick={removeStale}>全部移除</button></div>}
    <div className="editorgrid"><aside className="panel unitmenu"><div className="sectionhead"><h3>單元安排</h3></div>{rows.map(({ name: key, chapter: item, units: children }) => <button key={key} className={'unit-leaf top' + (name === key ? ' selected' : '')} onClick={() => setSelected(key)}><strong>{item.title}</strong><span className="muted">{children.length} 個分類、{children.reduce((n, u) => n + (u.questionCount || 0), 0)} 題</span></button>)}</aside>
      {!chapter ? <Empty title="尚未有單元" detail="請先到題庫管理同步 Google Sheet。" /> : <section className="panel"><div className="sectionhead"><h2>單元設定</h2><button onClick={() => preview(materialize(), true, units[0]?.id)}>預覽單元</button></div>
        {units.some((u) => u.activities.length) && <div className="notice warning"><strong>以下活動掛在舊的題目分類上，請搬到單元</strong>{units.flatMap((u) => u.activities.map((a) => <div className="sectionhead" key={`${u.id}_${a.id}`}><span>{u.title}／{a.title}</span><button onClick={() => moveLegacyActivity(u.id, a)}>搬到此單元</button></div>))}</div>}
        <div className="formgrid"><Field label="單元名稱"><input value={chapter.title} onChange={(e) => changeChapter({ title: e.target.value })} /></Field><Field label="達標分數"><input type="number" min="0" max="100" value={chapter.threshold} onChange={(e) => changeChapter({ threshold: Number(e.target.value) })} /></Field><Field label="開放時間"><input type="datetime-local" value={chapter.opensAt} onChange={(e) => changeChapter({ opensAt: e.target.value })} /></Field><Field label="完成期限"><input type="datetime-local" value={chapter.dueAt} onChange={(e) => changeChapter({ dueAt: e.target.value })} /></Field></div>
        <Field label="單元說明"><textarea value={chapter.description} onChange={(e) => changeChapter({ description: e.target.value })} /></Field><label className="check"><input type="checkbox" checked={chapter.required} onChange={(e) => changeChapter({ required: e.target.checked })} />列為平常分數的必做單元</label><label className="check"><input type="checkbox" checked={chapter.research?.enabled !== false} onChange={(e) => changeChapter({ research: { enabled: e.target.checked } })} />蒐集解析研究資料</label>
        <div className="actions"><button disabled={rows[0]?.name === name} onClick={() => move(-1)}>上移</button><button disabled={rows.at(-1)?.name === name} onClick={() => move(1)}>下移</button></div><ChapterOverrides course={draft} name={name} chapter={chapter} onChange={(chapterOverrides) => setDraft({ ...draft, chapterOverrides })} />
        <hr /><div className="sectionhead"><h2>學習活動</h2><button onClick={() => changeChapter({ activities: [...chapter.activities, { id: uid(), title: '新活動', type: 'youtube', phase: 'before', url: '', description: '' }] })}><Plus size={16} />新增活動</button></div>
        {chapter.activities.map((activity, index) => <ChapterActivityEditor
          key={activity.id}
          activity={activity}
          onChange={(patch) => changeActivity(index, patch)}
          onPreview={() => preview(materialize(), true, units[0]?.id, activity.id)}
          onRemove={() => changeChapter({ activities: chapter.activities.filter((item) => item.id !== activity.id) })}
        />)}
        <hr /><h2>題目分類（來自 Sheet 次單元）</h2><p className="muted">分類僅供題庫與作答進度使用，不在此編輯設定。</p>{units.map((u) => <div className="progress-row" key={u.id}><span><strong>{u.title}</strong> · {u.questionCount || 0} 題</span><span className="badge">{u.bankVersion || '未連接題庫'}</span></div>)}
      </section>}
    </div>
  </>;
}
function Bank({
  course,
  api,
  notify,
  onSynced,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
  onSynced: () => Promise<void>;
}) {
  const [unitId, setUnit] = useState(course.units[0]?.id || ''),
    [questions, setQuestions] = useState<Question[]>([]),
    [search, setSearch] = useState(''),
    [busy, setBusy] = useState(false),
    [sheetId, setSheetId] = useState(''),
    [sheetBusy, setSheetBusy] = useState(false);
  const unit = course.units.find((u) => u.id === unitId);
  useEffect(() => {
    if (api.preview) return;
    void api.call<any>('getSyncStatus').then((r) => setSheetId(r.sheetId || '')).catch((e) => notify('無法讀取同步檔案設定：' + e.message));
  }, [api]);
  async function load() {
    if (!unit?.bankVersion) return;
    setBusy(true);
    try {
      setQuestions(await cachedBank(api, course.id, unitId, unit.bankVersion));
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">QUESTION BANK</span>
          <h1>題庫管理</h1>
          <p>按「同步題庫」讀取與課程代碼同名的 Google Sheet 分頁；單元與次單元依表格欄位增量更新至草稿。</p>
        </div>
      </header>
      <section className="panel">
        <h2>同步檔案設定</h2>
        <p className="muted">貼上 Google Sheet 網址或 ID。題庫分頁名稱必須完全等於課程代碼「{course.id}」。</p>
        <div className="formgrid">
          <Field label="Google Sheet 網址或 ID">
            <input aria-label="Google Sheet 網址或 ID" value={sheetId} onChange={(e) => setSheetId(e.target.value)} placeholder="貼上 Google Sheet 完整網址或 ID" />
          </Field>
        </div>
        <div className="actions">
          <button disabled={api.preview || sheetBusy || !sheetId} onClick={async () => { setSheetBusy(true); try { const saved = await api.call<any>('saveSheetConfig', { sheetId }); setSheetId(saved.sheetId); notify('已保存同步檔案設定'); } catch (e) { notify((e as Error).message); } finally { setSheetBusy(false); } }}>保存同步檔案設定</button>
        </div>
      </section>
      <section className="panel">
        <div className="formgrid">
          <Field label="單元">
            <select
              value={unitId}
              onChange={(e) => {
                setUnit(e.target.value);
                setQuestions([]);
              }}
            >
              {course.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="actions">
          <button
            className="primary"
            disabled={api.preview || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await api.call<any>('syncSheet');
                await onSynced();
                const mine = (r.banks || []).filter((bank: any) => bank.sourceCourseId === course.id || bank.courseId === course.id);
                const stale = [...new Set(mine.flatMap((bank: any) => bank.staleUnits || []))];
                if (mine.some((bank: any) => bank.error)) {
                  const errors = mine.filter((bank: any) => bank.error).slice(0, 3)
                    .map((bank: any) => `${bank.unitId || bank.sourceTab || '題庫'}：${bank.error}`).join('；');
                  notify(`題庫同步有未完成項目：${errors}`);
                }
                else if (mine.length) notify(`題庫同步完成：${mine.map((bank: any) => `${bank.unitId} ${bank.count} 題`).join('、')}${stale.length ? `；舊題目分類待清理：${stale.join('、')}` : ''}；請檢查後發布課程`);
                else {
                  const tabs = Array.isArray(r.availableTabs) ? r.availableTabs.map((title: unknown) => JSON.stringify(String(title))).join('、') : '';
                  notify(`找不到與課程代碼「${course.id}」同名的題庫分頁。平台實際讀到：${tabs || '（未提供分頁清單，請確認雲端 Functions 已更新）'}`);
                }
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <RefreshCw size={16} />
            同步題庫
          </button>
          <button disabled={busy || !unit?.bankVersion} onClick={load}>
            讀取已連接版本
          </button>
          <span className="badge">{unit?.bankVersion || '未連接題庫'}</span>
        </div>
      </section>
      <section className="panel">
        <div className="sectionhead">
          <h2>
            題目預覽 <span className="badge">{questions.length} 題</span>
          </h2>
          <div className="search">
            <Search size={16} />
            <input
              aria-label="搜尋題目"
              placeholder="搜尋題目、ID 或知識點"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {questions
          .filter((q) => `${q.id} ${q.text} ${q.concept}`.includes(search))
          .map((q) => (
            // 2026-09-15 起：教師預覽不用 <details> 收合，題目、正解、解析直接全部展開顯示，不用點。
            <div className="questionpreview" key={q.id}>
              <h3>
                <span className="badge">{q.id}</span> {q.text}
              </h3>
              {q.options.map((o) => (
                <p key={o.id}>
                  {o.id === q.answer ? '✓' : '○'} {o.text}
                </p>
              ))}
              <QuestionImage key={q.image} url={q.image} /><Explanations q={q} audience="teacher" />
            </div>
          ))}
        {!questions.length && (
          <Empty title="尚未載入題目" detail="同步題庫後，選擇次單元讀取已連接版本。" />
        )}
      </section>
    </>
  );
}
function RosterPage({
  course,
  api,
  notify,
  onSynced,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
  onSynced: () => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [cl, setCl] = useState(course.classIds[0]),
    [rows, setRows] = useState<Roster[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  async function load(more = false) {
    setBusy(true);
    try {
      const r = await api.call('getRoster', {
        courseId: course.id,
        classId: cl,
        after: more ? next : '',
      });
      setRows(more ? [...rows, ...r.rows] : r.rows);
      setNext(r.next);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">CLASS ROSTER</span>
          <h1>班級名冊</h1>
          <p>名冊以 Google Sheet 的「班級名冊」分頁為唯一來源；按同步後才會增量更新。</p>
        </div>
        <button
          className="primary"
          disabled={api.preview || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await api.call<any>('syncRoster');
              await onSynced();
              if (r.roster?.error) notify(`班級名冊同步未完成：${r.roster.error}`);
              else {
                const updated = (r.roster?.results || []).reduce((total: number, result: any) => total + (result.updated || 0), 0);
                notify(r.roster?.changed ? `班級名冊同步完成：已更新 ${updated} 人` : `班級名冊內容一致，共 ${r.roster?.count || 0} 人，未重複寫入`);
              }
              setRows([]);
              setNext(null);
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCw size={16} />
          同步班級名冊
        </button>
      </header>
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="班級"
            disabled={busy}
            value={cl}
            onChange={(e) => {
              setCl(e.target.value);
              setRows([]);
              setNext(null);
            }}
          >
            {course.classIds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button disabled={busy} onClick={() => load()}>
            <RefreshCw size={16} />
            讀取名冊
          </button>
        </div>
        <label className="field">搜尋已載入名冊<input value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <RosterTable rows={rows.filter((r) => `${r.name} ${r.email} ${r.studentId}`.includes(search))} />
        {!rows.length && <Empty title="尚未載入名冊" detail="請先按「同步班級名冊」，再讀取班級名冊。" />}
        {next && <button onClick={() => load(true)}>載入更多</button>}
      </section>
    </>
  );
}
function RosterTable({
  rows,
  action,
}: {
  rows: Roster[];
  action?: (r: Roster) => React.ReactNode;
}) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>學生</th>
            <th>學號</th>
            <th>班級</th>
            <th>學校信箱</th>
            <th>狀態</th>
            {action && <th>管理</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.email + i}>
              <td>{r.name}</td>
              <td>{r.studentId}</td>
              <td>{r.classId}</td>
              <td>{r.email}</td>
              <td>
                <span className={'badge ' + (r.enabled ? 'green' : '')}>
                  {r.enabled ? '啟用' : '停用'}
                </span>
              </td>
              {action && <td>{action(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CompletionPage({
  course,
  api,
  notify,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
}) {
  const [publishedCourse, setPublishedCourse] = useState(course);
  const [cl, setCl] = useState(course.classIds[0]),
    [rows, setRows] = useState<any[]>([]),
    [next, setNext] = useState<string | null>(null),
    [search, setSearch] = useState(''),
    [student, setStudent] = useState<any>(null),
    [busy, setBusy] = useState(false);
  async function load(more = false) {
    setBusy(true);
    try {
      const r = await api.call('getCompletion', {
        courseId: course.id,
        classId: cl,
        after: more ? next : '',
      });
      if (r.course) setPublishedCourse(r.course);
      setRows(more ? [...rows, ...r.rows] : r.rows);
      setNext(r.next);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter((r) => `${r.name} ${r.studentId}`.includes(search));
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">LEARNING PROGRESS</span>
          <h1>完成度看板</h1>
          <p>個人進度隨交卷更新；本頁按更新讀取，與分析報表獨立。</p>
        </div>
        <button
          disabled={!rows.length}
          onClick={() =>
            download(
              '完成度.csv',
              filtered.map((r) => {
                const n = completion(forClass(publishedCourse, cl), r.progress);
                return {
                  姓名: r.name,
                  學號: r.studentId,
                  班級: cl,
                  已完成: n.done,
                  應完成: n.total,
                  待完成: forClass(publishedCourse, cl)
                    .units.filter((u) => u.required && !complete(u, r.progress))
                    .map((u) => u.title)
                    .join('、'),
                };
              }),
            )
          }
        >
          <Download size={16} />
          匯出已載入名單
        </button>
      </header>
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="班級"
            disabled={busy}
            value={cl}
            onChange={(e) => {
              setCl(e.target.value);
              setRows([]);
              setNext(null);
              setStudent(null);
            }}
          >
            {course.classIds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button disabled={busy} onClick={() => load()}>
            <RefreshCw size={16} />
            更新完成度
          </button>
          <input
            aria-label="搜尋學生"
            placeholder="搜尋已載入學生"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>學生</th>
                <th>學號</th>
                <th>單元完成度</th>
                <th>尚待完成</th>
                <th>紀錄</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const p = r.progress as Progress,
                  n = completion(forClass(publishedCourse, cl), p);
                return (
                  <tr key={r.email}>
                    <td>
                      {r.name}
                      <small className="block">{r.enabled ? '' : '帳號停用'}</small>
                    </td>
                    <td>{r.studentId}</td>
                    <td>
                      <div className="tableprogress">
                        <span>
                          {n.done} / {n.total}
                        </span>
                        <div className="progressline">
                          <div style={{ width: `${n.total ? (n.done / n.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {forClass(publishedCourse, cl)
                        .units.filter((u) => u.required && !complete(u, p))
                        .map((u) => u.title)
                        .join('、') || '—'}
                    </td>
                    <td>
                      <button onClick={() => setStudent(r)}>查看</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty title="選擇班級並更新完成度" detail="包含尚未作答學生；沒有成績不視為零分。" />
        )}
        {next && <button onClick={() => load(true)}>載入更多學生</button>}
      </section>
      {student && (
        <StudentDetail
          course={forClass(publishedCourse, cl)}
          api={api}
          student={student}
          close={() => setStudent(null)}
          notify={notify}
        />
      )}
    </>
  );
}
function StudentDetail({
  course,
  api,
  student,
  close,
  notify,
}: {
  course: Course;
  api: API;
  student: any;
  close: () => void;
  notify: (s: string) => void;
}) {
  const [rows, setRows] = useState<any[]>([]),
    [next, setNext] = useState<any>(null);
  async function load(more = false) {
    if (!student.uid) return;
    try {
      const r = await api.call('getHistory', {
        courseId: course.id,
        classId: student.classId,
        uid: student.uid,
        after: more ? next : null,
      });
      setRows(more ? [...rows, ...r.rows] : r.rows);
      setNext(r.next);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <div className="modalshade">
      <section className="modal wide">
        <div className="sectionhead">
          <div>
            <span className="eyebrow">STUDENT PROFILE</span>
            <h2>{student.name}</h2>
            <p>
              {student.studentId} · {student.classId}
            </p>
          </div>
          <button onClick={close}>關閉</button>
        </div>
        {course.units.map((u) => (
          <div className="timeline" key={u.id}>
            <div>
              <h3>{u.title}</h3>
              <p>
                最高有效分數：
                {(student.progress.units[u.id]?.best ?? -1) < 0
                  ? '尚無'
                  : student.progress.units[u.id].best}{' '}
                · 練習 {student.progress.units[u.id]?.attempts || 0} 次
              </p>
            </div>
            <span className="badge">{complete(u, student.progress) ? '已達標' : '待完成'}</span>
          </div>
        ))}
        <h3>活動參與</h3>
        {Object.entries(student.progress.activities || {}).length ? (
          Object.entries(student.progress.activities).map(([k, v]: any) => (
            <p key={k}>
              {course.units
                .flatMap((u) =>
                  u.activities.map((a) => ({ key: u.id + '_' + a.id, title: a.title })),
                )
                .find((a) => a.key === k)?.title || k}
              ：{v.completed ? '已完成參與' : '學習中'}
            </p>
          ))
        ) : (
          <p className="muted">尚無活動參與紀錄</p>
        )}
        <button disabled={!student.uid} onClick={() => load()}>
          讀取最近 20 組作答
        </button>
        {!student.uid && <p>學生尚未登入。</p>}
        {rows.map((a) => (
          <details key={a.id}>
            <summary>
              {new Date(a.receivedAt).toLocaleString()} · {modes[a.mode as keyof typeof modes]} ·{' '}
              {a.score} 分
            </summary>
            {a.answers.map((r: any) => (
              <p key={r.questionId}>
                {r.questionId} · 選 {r.selected || '未作答'} · {r.correct ? '答對' : '答錯'}
              </p>
            ))}
          </details>
        ))}
        {next && <button onClick={() => load(true)}>載入更多</button>}
      </section>
    </div>
  );
}
function Analysis({
  course,
  api,
  notify,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
}) {
  const [detail, setDetail] = useState<any>(null),
    [cl, setCl] = useState(course.classIds[0]),
    [reports, setReports] = useState<Report[]>([]),
    [next, setNext] = useState<string | null>(null),
    [mode, setMode] = useState('all'),
    [unit, setUnit] = useState('all'),
    [busy, setBusy] = useState(false),
    [time, setTime] = useState<number | null>(null);
  async function load(more = false) {
    try {
      const r = await api.call('getReports', {
        courseId: course.id,
        classId: cl,
        after: more ? next : '',
      });
      setReports(more ? [...reports, ...r.rows] : r.rows);
      setNext(r.next);
      setTime(r.job?.updatedAt || null);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function update() {
    setBusy(true);
    try {
      let count = 0;
      for (let i = 0; i < 100; i++) {
        const r = await api.call('updateReports', { courseId: course.id });
        count += r.processed || 0;
        if (!r.hasMore) {
          notify(`報表已更新，處理 ${count} 組新紀錄`);
          break;
        }
        if (i === 99) notify('本輪已處理 2,000 組，請再次更新以繼續。');
      }
      await load();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, [course.id, cl]);
  const rows = reports
    .filter((r) => unit === 'all' || r.unitId === unit)
    .flatMap((r) =>
      Object.entries(r.modes[mode] || {}).map(([id, s]) => ({
        ...s,
        id,
        unitId: r.unitId,
        version: r.version,
      })),
    )
    .sort(
      (a, b) => (b.students ? b.wrong / b.students : 0) - (a.students ? a.wrong / a.students : 0),
    );
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">QUESTION INSIGHTS</span>
          <h1>哪些題目，需要再講一次？</h1>
          <p>首次作答與複習分開看，讓重複練習不扭曲原始理解。</p>
        </div>
        <button className="primary" disabled={busy} onClick={update}>
          <RefreshCw size={17} />
          {busy ? '增量彙整中…' : '更新至最新'}
        </button>
      </header>
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="班級"
            disabled={busy}
            value={cl}
            onChange={(e) => {
              setCl(e.target.value);
              setReports([]);
            }}
          >
            {course.classIds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="單元" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">全部已載入單元</option>
            {course.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
          <select aria-label="作答模式" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="all">測驗＋閃卡（學生去重）</option>
            <option value="quiz">一般測驗</option>
            <option value="flashcard">閃卡</option>
            <option value="review">錯題複習</option>
          </select>
          <button
            onClick={() =>
              download(
                '題目分析.csv',
                rows.map((r) => ({
                  題目: r.id,
                  版本: r.version,
                  首次作答人數: r.students,
                  首次答錯人數: r.wrong,
                  複習人數: r.reviewStudents,
                  最近複習仍錯: r.reviewWrong,
                  複習次數: r.reviews,
                })),
              )
            }
          >
            <Download size={16} />
            匯出
          </button>
        </div>
        <p className="muted">
          最後彙整：{time ? new Date(time).toLocaleString() : '尚未彙整'} ·
          開啟報表只讀摘要，不重算歷史紀錄。
        </p>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>題目／版本</th>
                <th>單元</th>
                <th>首次錯誤率</th>
                <th>作答人數</th>
                <th>複習後仍錯</th>
                <th>選項分布</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id + r.version + r.unitId}>
                  <td>
                    <button className="linkbutton" onClick={() => setDetail(r)}>
                      {r.id}
                    </button>
                    <small className="block">{r.version}</small>
                  </td>
                  <td>{course.units.find((u) => u.id === r.unitId)?.title || r.unitId}</td>
                  <td>
                    <span className="error-rate">
                      {r.students ? Math.round((r.wrong / r.students) * 100) + '%' : '—'}
                    </span>
                  </td>
                  <td>{r.students} 人</td>
                  <td>
                    {r.reviewStudents ? `${r.reviewWrong} / ${r.reviewStudents} 人` : '尚無複習'}
                  </td>
                  <td>
                    <details>
                      <summary>查看</summary>
                      {Object.entries(r.options).map(([o, n]) => (
                        <p key={o}>
                          {o === 'unanswered' ? '未作答' : o}：{n} 人
                        </p>
                      ))}
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="尚無此條件的分析資料"
            detail="有作答後按「更新至最新」，只會處理新增紀錄。"
          />
        )}
        {next && <button onClick={() => load(true)}>載入更多摘要</button>}
      </section>
      {detail && (
        <QuestionDetail
          course={course}
          api={api}
          cl={cl}
          item={detail}
          close={() => setDetail(null)}
          notify={notify}
        />
      )}
    </>
  );
}
function ReportsPage({
  course,
  api,
  notify,
}: {
  course: Course;
  api: API;
  notify: (s: string) => void;
}) {
  const [cl, setCl] = useState(course.classIds[0]),
    [list, setList] = useState<any[]>([]),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setList((await api.call('getSnapshots', { courseId: course.id })).rows);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [course.id]);
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">REPORTS & SNAPSHOTS</span>
          <h1>保留每次評分的依據</h1>
          <p>結算快照固定課程門檻與當次讀取結果，不受日後新增單元影響。</p>
        </div>
      </header>
      <section className="panel">
        <h2>完成度結算快照</h2>
        <p>快照依批次取得學生進度，完成時保留採集起訖時間。請在評分截止後結算。</p>
        <div className="toolbar">
          <select aria-label="結算班級" value={cl} onChange={(e) => setCl(e.target.value)}>
            {course.classIds.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const snapshotId = uid();
                for (let i = 0; i < 100; i++) {
                  const r = await api.call('createSnapshot', {
                    courseId: course.id,
                    classId: cl,
                    snapshotId,
                  });
                  if (r.done) break;
                }
                await load();
                notify('快照處理完成，請確認狀態後匯出');
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            建立新快照
          </button>
          <button onClick={load}>重新讀取</button>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>建立時間</th>
                <th>班級</th>
                <th>狀態</th>
                <th>完成度規則</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.classId || cl}</td>
                  <td>{s.status === 'complete' ? '完成' : '處理中'}</td>
                  <td>第 {s.completionFormulaVersion || 1} 版</td>
                  <td>
                    {s.status !== 'complete' ? (
                      <button
                        onClick={async () => {
                          try {
                            await api.call('createSnapshot', {
                              courseId: course.id,
                              classId: s.classId,
                              snapshotId: s.id,
                            });
                            await load();
                          } catch (e) {
                            notify((e as Error).message);
                          }
                        }}
                      >
                        接續處理
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            let rows: any[] = [],
                              after = null,
                              meta: any;
                            do {
                              const r: any = await api.call('getSnapshots', {
                                courseId: course.id,
                                snapshotId: s.id,
                                after,
                              });
                              rows.push(...r.rows);
                              after = r.next;
                              meta = r.meta || s;
                            } while (after);
                            download(
                              '完成度結算.csv',
                              rows.map((r) => {
                                const c = meta.course || course,
                                  formulaVersion = meta.completionFormulaVersion || 1,
                                  n = completion(c, r.progress, formulaVersion);
                                return {
                                  姓名: r.name,
                                  學號: r.studentId,
                                  班級: r.classId,
                                  已完成: n.done,
                                  應完成: n.total,
                                  完成率: n.total
                                    ? Math.round((n.done / n.total) * 100) + '%'
                                    : '不適用',
                                  完成度規則: `第 ${formulaVersion} 版`,
                                  結算時間: new Date(s.createdAt).toLocaleString(),
                                };
                              }),
                            );
                          } catch (e) {
                            notify((e as Error).message);
                          }
                        }}
                      >
                        匯出 CSV
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.length && (
          <Empty title="尚未建立結算快照" detail="完成度用於平常分數時，在此保存當次採計依據。" />
        )}
      </section>
    </>
  );
}
function SettingsPage({
  course,
  api,
  notify,
}: {
  course?: Course;
  api: API;
  notify: (s: string) => void;
}) {
  const [sheetId, setSheetId] = useState(''),
    [syncStatus, setSyncStatus] = useState<any>(null),
    [syncBusy, setSyncBusy] = useState(false);
  useEffect(() => {
    if (api.preview) return;
    api
      .call('getSyncStatus')
      .then((r: any) => {
        setSheetId(r.sheetId || '');
        setSyncStatus(r.status);
      })
      .catch((e) => notify('無法讀取同步設定：' + (e as Error).message));
  }, [api]);
  return (
    <>
      <header className="pageheading">
        <div>
          <span className="eyebrow">PLATFORM SETTINGS</span>
          <h1>平台設定</h1>
          <p>連接狀態、報表更新方式與發布版本。</p>
        </div>
        <span className="badge green">v{VERSION}</span>
      </header>
      <section className="panel">
        <h2>資料連接</h2>
        <dl>
          <dt>執行模式</dt>
          <dd>{api.preview ? '操作示例（暫存）' : '正式 Firebase 連接'}</dd>
          <dt>Firebase 專案</dt>
          <dd>{api.preview ? '未使用' : projectId}</dd>
          <dt>學生登入網域</dt>
          <dd>@ctcn.edu.tw</dd>
          <dt>平台版本</dt>
          <dd>{VERSION}</dd>
          <dt>判分方式</dt>
          <dd>前端即時判分，整組提交</dd>
        </dl>
      </section>
      <section className="panel">
        <h2>Google Sheet 同步</h2>
        <p className="muted">
          每門課的題庫分頁名稱必須等於課程代碼（例如 115-1-AP2），分頁內依「單元／次單元」整理題目。「班級名冊」分頁使用授課班級、學號、姓名、Gmail 欄位。設定完成後，請分別到「題庫管理」與「班級名冊」按同步；分頁需先用檢視權限分享給
          Cloud Functions 的執行服務帳戶。
        </p>
        <div className="formgrid">
          <Field label="Google Sheet ID">
            <input
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="貼上 Google Sheet 完整網址或 ID"
            />
          </Field>
        </div>
        <div className="actions">
          <button
            disabled={api.preview || syncBusy || !sheetId}
            onClick={async () => {
              setSyncBusy(true);
              try {
                const saved = await api.call('saveSheetConfig', { sheetId });
                setSheetId(saved.sheetId);
                notify('已保存 Sheet 設定');
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setSyncBusy(false);
              }
            }}
          >
            保存 Sheet ID
          </button>
        </div>
        {syncStatus?.lastSyncedAt && (
          <p className="muted">上次同步：{new Date(syncStatus.lastSyncedAt).toLocaleString()}</p>
        )}
      </section>
      <section className="panel">
        <h2>教師報表更新</h2>
        {!course && <p>建立課程後即可設定報表更新。</p>}
        <p>預設只在按「更新至最新」時增量彙整。可啟用每日凌晨 03:00 自動處理。</p>
        <div className="actions">
          <button
            disabled={!course}
            onClick={() =>
              api
                .call('setSchedule', { courseId: course?.id, enabled: true })
                .then(() => notify('已啟用每日自動彙整'))
                .catch((e) => notify(e.message))
            }
          >
            啟用每日彙整
          </button>
          <button
            disabled={!course}
            onClick={() =>
              api
                .call('setSchedule', { courseId: course?.id, enabled: false })
                .then(() => notify('已改為按需彙整'))
                .catch((e) => notify(e.message))
            }
          >
            僅按需彙整
          </button>
        </div>
        <p className="muted">不影響學生交卷後的即時完成度。</p>
      </section>
    </>
  );
}
function QuestionDetail({
  course,
  api,
  cl,
  item,
  close,
  notify,
}: {
  course: Course;
  api: API;
  cl: string;
  item: any;
  close: () => void;
  notify: (s: string) => void;
}) {
  const [q, setQ] = useState<Question | null>(null),
    [rows, setRows] = useState<any[]>([]),
    [next, setNext] = useState<string | null>(null),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    api
      .call('getBank', {
        courseId: course?.id,
        unitId: item.unitId,
        version: item.version,
        draft: true,
      })
      .then((r) => setQ(r.questions.find((q: Question) => q.id === item.id) || null))
      .catch((e) => notify(e.message));
  }, [item.id]);
  async function load(more = false) {
    try {
      const r = await api.call('questionStudents', {
        courseId: course?.id,
        classId: cl,
        unitId: item.unitId,
        version: item.version,
        questionId: item.id,
        after: more ? next : '',
      });
      setRows(more ? [...rows, ...r.rows] : r.rows);
      setNext(r.next);
      setLoaded(true);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <div className="modalshade">
      <section className="modal wide">
        <div className="sectionhead">
          <div>
            <span className="eyebrow">QUESTION DETAIL</span>
            <h2>{item.id}</h2>
          </div>
          <button onClick={close}>關閉</button>
        </div>
        {q ? (
          <>
            <h3>{q.text}</h3>
            {q.options.map((o) => (
              <div className="timeline" key={o.id}>
                <span className={'badge ' + (o.id === q.answer ? 'green' : '')}>
                  {o.id.toUpperCase()}
                </span>
                <div>{o.text}</div>
                <span>{item.options[o.id] || 0} 人</span>
              </div>
            ))}
            <p className="feedback">{q.explanation}</p>
          </>
        ) : (
          <p>讀取題目中…</p>
        )}
        <h3>相關學生</h3>
        <p className="muted">需要時才讀取學生明細，每次最多查詢 30 份學生題目狀態。</p>
        <button onClick={() => load()}>讀取學生名單</button>
        {rows.map((r) => (
          <div className="timeline" key={r.uid}>
            <div>
              <h3>
                {r.name} · {r.studentId}
              </h3>
              <p>
                首次：{r.first?.all ? (r.first.all.correct ? '答對' : '答錯') : '尚無'} · 最新複習：
                {r.review ? (r.review.correct ? '答對' : '仍錯') : '尚無'}
              </p>
            </div>
          </div>
        ))}
        {loaded && !rows.length && <p>此頁沒有此題的學生作答。</p>}
        {next && <button onClick={() => load(true)}>載入更多</button>}
      </section>
    </div>
  );
}
