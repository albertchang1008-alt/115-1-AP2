import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { mergeChapterCourse, mergedChapterProgress, mergeActivityList, chapterMergeDraftFingerprint, chapterMergePublishedBlocker } from '../shared/chapterMerge';
import {
  Course,
  Question,
  Profile,
  Progress,
  Attempt,
  Report,
  Seen,
  emptyProgress,
  applyAttempt,
  aggregate,
  chaptersOf,
} from '../shared/model';
const env = import.meta.env || {};
export const configured = !!(env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_API_KEY);
export const projectId = env.VITE_FIREBASE_PROJECT_ID || '';
const app = configured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  : null;
export const auth = app ? getAuth(app) : null;
const functions = app ? getFunctions(app, env.VITE_FUNCTIONS_REGION || 'asia-east1') : null;
if (env.VITE_USE_EMULATORS === 'true' && auth && functions) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
export function watchAuth(fn: () => void) {
  return auth ? onAuthStateChanged(auth, fn) : () => {};
}
export async function login() {
  if (!auth) throw Error('尚未設定 Firebase');
  // 2026-09-15：強制帶 prompt=select_account，讓 Google 彈窗每次都列出帳號選擇畫面
  // （含「使用其他帳戶」），不會因為瀏覽器已有登入狀態就悄悄用同一個帳號登入。
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithPopup(auth, provider);
}
export async function logout() {
  if (auth) await signOut(auth);
  clearBankCache();
}
// 2026-09-15：使用者反映登入後 Firebase 會記住這個瀏覽器的帳號，找不到地方切換。
// 這裡先登出目前的 session，再呼叫（已強制 select_account 的）login() 重新彈出
// 帳號選擇視窗，讓「登出＋重新登入」變成一次點擊即可完成。
export async function switchAccount() {
  if (!auth) throw Error('尚未設定 Firebase');
  await signOut(auth);
  clearBankCache();
  await login();
}
export interface API {
  call<T = any>(name: string, data?: any): Promise<T>;
  preview: boolean;
}
export const cloud: API = {
  preview: false,
  async call<T>(name: string, data = {}) {
    if (!functions) throw Error('尚未設定 Firebase');
    return (await httpsCallable<any, T>(functions, name, { timeout: name === 'syncSheet' ? 330000 : 70000 })(data)).data;
  },
};
export const sampleQuestions: Question[] = [
  {
    id: 'example-1',
    text: '這是一道操作示例題：課程的學習活動可以在哪裡找到？',
    options: [
      { id: 'a', text: '「我的課程」內的單元頁' },
      { id: 'b', text: '瀏覽器下載紀錄' },
      { id: 'c', text: '電腦系統設定' },
    ],
    answer: 'a',
    explanation: '單元依課前、課中、課後呈現活動。此題僅供介面操作示例。',
    concept: '平台使用',
  },
  {
    id: 'example-2',
    text: '當畫面顯示「待同步」時，代表什麼？',
    options: [
      { id: 'a', text: '雲端已確認完成' },
      { id: 'b', text: '紀錄仍等待成功提交' },
      { id: 'c', text: '紀錄已刪除' },
    ],
    answer: 'b',
    explanation: '待同步資料尚未成功保存，不會先算為雲端已完成。',
    concept: '學習紀錄',
  },
  {
    id: 'example-3',
    text: '錯題複習的用途是什麼？',
    options: [
      { id: 'a', text: '取代完整單元測驗' },
      { id: 'b', text: '直接提高平常分數完成度' },
      { id: 'c', text: '練習曾答錯的題目並查看解析' },
    ],
    answer: 'c',
    explanation: '複習紀錄獨立保存，不更動完整單元的完成度。',
    concept: '錯題複習',
  },
];
export function sampleCourse(): Course {
  const unit = (id: string, title: string, group: string, questionCount: number, required = true): Course['units'][number] => ({
    id, title, group, description: `${title}題目分類`, required, threshold: 80,
    opensAt: '', dueAt: '', bankVersion: `example-${id}-v1`, questionCount, activities: [],
  });
  const course: Course = {
    id: 'example-course',
    title: '課程平台・操作示例',
    description: '這份範例僅供操作介面，不是正式課程或學生資料。',
    term: '115 學年度第 1 學期',
    classIds: ['example-class'],
    sheetsUrl: '',
    units: [
      unit('heart-structure', '心臟構造', '心臟基礎', 24),
      unit('cardiac-cycle', '心動週期與心音', '心臟基礎', 30),
      unit('coronary-flow', '冠狀循環', '血液循環', 20),
      unit('blood-pressure', '血壓與血流', '血液循環', 18),
      { ...unit('future-topic', '進階整合', '尚未開放', 16), opensAt: '2099-10-05T08:00' },
      unit('extension-reading', '延伸閱讀題', '延伸學習', 12, false),
      {
        ...unit('midterm-review', '期中複習考', '期中複習考', 20),
        dueAt: '2026-09-22T23:59',
        review: {
          sourceUnitIds: ['heart-structure', 'cardiac-cycle'],
          sourceVersions: { 'heart-structure': 'example-heart-structure-v1', 'cardiac-cycle': 'example-cardiac-cycle-v1' },
          drawCount: 20, allocation: { 'heart-structure': 10, 'cardiac-cycle': 10 }, builtAt: 1,
          history: [{ version: 'example-midterm-review-v1', drawCount: 20, allocation: { 'heart-structure': 10, 'cardiac-cycle': 10 }, builtAt: 1 }],
        },
      },
    ],
  };
  course.chapters = {
    心臟基礎: {
      title: '心臟基礎', description: '認識心臟構造、血流與心動週期。', required: true, threshold: 80,
      opensAt: '', dueAt: '2026-10-06T23:59', research: { enabled: true },
      activities: [
        { id: 'heart-map', title: '互動心臟圖', type: 'html', tracking: 'interactive', phase: 'before', url: '', description: '依節點探索心臟構造。', required: true, nodeTotal: 6, questionTotal: 11 },
        { id: 'heart-video', title: '心臟構造補充影片', type: 'youtube', phase: 'after', url: 'https://youtu.be/abcdefghijk', description: '選看補充影片。', required: false },
      ],
    },
    血液循環: {
      title: '血液循環', description: '把冠狀循環、血壓與血流連在一起。', required: true, threshold: 80,
      opensAt: '', dueAt: '2026-09-20T23:59', research: { enabled: true },
      activities: [{ id: 'flow-map', title: '血流路徑互動圖', type: 'html', tracking: 'interactive', phase: 'during', url: '', description: '依序完成血流節點。', required: true, nodeTotal: 6, questionTotal: 11 }],
    },
    尚未開放: { title: '尚未開放', description: '示範鎖定中的單元。', required: true, threshold: 80, opensAt: '2099-10-05T08:00', dueAt: '', activities: [] },
    延伸學習: {
      title: '延伸學習', description: '有餘力時自由探索，不計入完成度。', required: false, threshold: 80,
      opensAt: '', dueAt: '', activities: [{ id: 'extension-video', title: '循環生理延伸影片', type: 'youtube', phase: 'after', url: 'https://youtu.be/abcdefghijk', description: '選看延伸內容。', required: false }],
    },
    期中複習考: { title: '期中複習考', description: '從已學分類抽題的複習作業。', required: true, threshold: 80, opensAt: '', dueAt: '2026-09-22T23:59', activities: [] },
  };
  course.chapterOrder = ['心臟基礎', '血液循環', '尚未開放', '延伸學習', '期中複習考'];
  return course;
}
export function sampleProgress(course: Course, state: string): Progress {
  const progress = emptyProgress();
  const now = Date.now();
  if (state === 'none') return progress;
  if (state === 'complete') {
    for (const unit of course.units) progress.units[unit.id] = { best: 100, attempts: 2, fullAttempts: 2, updatedAt: now, passedAt: now };
    for (const [name, chapter] of Object.entries(course.chapters || {})) {
      for (const activity of chapter.activities) progress.activities[`chapter:${name}_${activity.id}`] = { position: activity.nodeTotal || 120, completed: true, updatedAt: now };
    }
    return progress;
  }
  progress.units = {
    'heart-structure': { best: 88, attempts: 2, fullAttempts: 2, updatedAt: now, wrong: { 'example-heart-structure-v1': { 'example-2': { n: 1, at: now } } } },
    'cardiac-cycle': { best: 84, attempts: 1, fullAttempts: 1, updatedAt: now },
    'coronary-flow': { best: 52, attempts: 1, fullAttempts: 1, updatedAt: now, wrong: { 'example-coronary-flow-v1': { 'example-1': { n: 2, at: now } } } },
    'extension-reading': { best: -1, attempts: 1, updatedAt: now },
    'midterm-review': { best: 92, attempts: 1, fullAttempts: 1, updatedAt: now, passedAt: Date.parse('2026-09-24T08:00:00+08:00') },
  };
  progress.attempted = {
    'heart-structure': { 'example-1': true, 'example-2': true, 'example-3': true },
    'cardiac-cycle': { 'example-1': true, 'example-2': true },
    'coronary-flow': { 'example-1': true, 'example-2': true },
    'extension-reading': { 'example-1': true },
  };
  progress.activities = {
    'chapter:心臟基礎_heart-map': { position: 6, completed: true, updatedAt: now },
    'chapter:心臟基礎_heart-video': { position: 95, completed: false, updatedAt: now },
    'chapter:血液循環_flow-map': { position: 3, completed: false, updatedAt: now },
    'chapter:延伸學習_extension-video': { position: 180, completed: true, updatedAt: now },
  };
  return progress;
}
export function memoryApi(initial = sampleCourse(), bank: Question[] = sampleQuestions): API {
  let draft = structuredClone(initial),
    published = structuredClone(initial),
    progress = emptyProgress();
  const attempts: Attempt[] = [];
  const banks = new Map<string, Question[]>(initial.units.filter((unit) => !!unit.bankVersion).map((unit) => [unit.bankVersion, bank]));
  const reports = new Map<string, Report>(),
    seen = new Map<string, Record<string, Seen>>();
  let roster: any[] = [],
    snapshots: any[] = [];
  const courseMap = new Map<string, Course>([[draft.id, draft]]);
  const publishedMap = new Map<string, Course>([[published.id, published]]);
  const rosterMap = new Map<string, any[]>();
  const profile: Profile = {
    uid: 'preview-user',
    email: 'preview@ctcn.edu.tw',
    name: '預覽學生',
    studentId: 'PREVIEW',
    classId: initial.classIds[0] || 'example-class',
    teacher: true,
    enabled: true,
  };
  return {
    preview: true,
    async call<T>(name: string, d: any = {}) {
      let result: any = { ok: true };
      if (d.courseId && courseMap.has(d.courseId)) { draft = courseMap.get(d.courseId)!; published = publishedMap.get(d.courseId) || draft; roster = rosterMap.get(d.courseId) || []; }
      switch (name) {
        case 'bootstrap':
          result = { profile, courses: [...courseMap.values()] };
          break;
        case 'saveCourse':
          draft = structuredClone(d.course);
          courseMap.set(draft.id, draft);
          break;
        case 'publishCourse':
          published = { ...structuredClone(draft), publishedAt: Date.now() };
          publishedMap.set(draft.id, published);
          result = published;
          break;
        case 'mergeChapter': {
          const nextDraft = mergeChapterCourse(draft, d.sourceName, d.targetName);
          const blockedReason = chapterMergePublishedBlocker(published, d.sourceName, d.targetName);
          const nextPublished = !blockedReason && chaptersOf(published)[d.sourceName] ? mergeChapterCourse(published, d.sourceName, d.targetName) : published;
          const activities = mergeActivityList(draft, published, d.sourceName, d.targetName);
          const affectedStudents = activities.some(a => progress.activities[`chapter:${d.sourceName}_${a.id}`]) ? 1 : 0;
          const confirmationToken = JSON.stringify({ draft, published, affectedStudents, source: d.sourceName, target: d.targetName });
          if (d.expectedDraft && chapterMergeDraftFingerprint(d.expectedDraft) !== chapterMergeDraftFingerprint(draft)) throw Error('草稿剛被更新，請重新載入後合併');
          result = { sourceName: d.sourceName, targetName: d.targetName, activities, affectedStudents, confirmationToken: blockedReason ? '' : confirmationToken, ...(blockedReason ? { blockedReason } : {}) };
          if (d.preview !== true) {
            if (blockedReason) throw Error(blockedReason);
            if (d.confirmationToken !== confirmationToken) throw Error('請重新預覽後確認合併');
            draft = nextDraft; published = nextPublished;
            courseMap.set(draft.id, draft); publishedMap.set(draft.id, published);
            progress = mergedChapterProgress(progress, d.sourceName, d.targetName, activities.map(a => a.id));
            result.course = draft;
          }
          break;
        }
        case 'deleteCourse':
          courseMap.delete(d.courseId); publishedMap.delete(d.courseId); rosterMap.delete(d.courseId); break;
        case 'archiveCourse':
          courseMap.set(d.courseId, { ...draft, archived: d.archived }); break;
        case 'migrateRoster':
          result = { done: true, rows: [], count: 0 }; break;
        case 'getLearningDiagnostics':
          result = { rows: [], next: null }; break;
        case 'getPublished':
          result = published;
          break;
        case 'getBank':
          result = { questions: banks.get(d.version) || [] };
          break;
        case 'publishQuestions': {
          const version = 'preview-' + crypto.randomUUID().slice(0, 8);
          banks.set(version, d.questions);
          result = { version, count: d.questions.length };
          break;
        }
        case 'getProgress':
          result = progress;
          break;
        case 'setPreviewProgress':
          progress = structuredClone(d.progress);
          break;
        case 'questionStudents':
          result = { rows: [], next: null };
          break;
        case 'submitAttempt':
          if (!attempts.some((a) => a.id === d.attempt.id)) {
            const a = {
              ...d.attempt,
              receivedAt: Date.now(),
              uid: profile.uid,
              classId: profile.classId,
            };
            attempts.push(a);
            progress = applyAttempt(progress, a);
          }
          result = { progress };
          break;
        case 'saveActivity':
          progress.activities[(d.chapterName ? `chapter:${d.chapterName}` : d.unitId) + '_' + d.activityId] = {
            position: d.position,
            completed: d.completed,
            updatedAt: Date.now(),
          };
          break;
        case 'getHistory':
          result = { rows: [...attempts].reverse(), next: null };
          break;
        case 'importRoster':
          for (const row of d.rows) roster = [...roster.filter((old) => old.email !== row.email), row];
          rosterMap.set(d.courseId, roster);
          break;
        case 'getRoster':
          result = { rows: roster.filter((r) => r.classId === d.classId), next: null };
          break;
        case 'getCompletion':
          result = { course: published, rows: roster.filter((r) => r.classId === d.classId).map((r) => ({ ...r, progress: emptyProgress() })), next: null };
          break;
        case 'updateReports':
          for (const a of attempts.filter((a) => !a.processed)) {
            const key = a.unitId + '_' + a.version;
            const r = reports.get(key) || {
              id: key,
              unitId: a.unitId,
              version: a.version,
              classId: profile.classId,
              modes: {},
              updatedAt: 0,
            };
            const s = seen.get(key) || {};
            aggregate(r.modes, s, a);
            r.updatedAt = Date.now();
            reports.set(key, r);
            seen.set(key, s);
            a.processed = true;
          }
          result = { hasMore: false };
          break;
        case 'getReports':
          result = { rows: [...reports.values()], next: null, job: { updatedAt: Date.now() } };
          break;
        case 'createSnapshot':
          snapshots.push({
            id: d.snapshotId,
            createdAt: Date.now(),
            status: 'complete',
            course: published,
            completionFormulaVersion: 2,
            rows: roster.map((r) => ({ ...r, progress: emptyProgress() })),
          });
          result = { done: true };
          break;
        case 'setUnitVisibility': {
          const ids = new Set(d.unitIds || []);
          const patch = (course: Course) => ({ ...course, units: course.units.map((u) => !ids.has(u.id) ? u : { ...u, visibility: d.visibility, archiveLabel: d.visibility === 'archived' ? (d.archiveLabel || undefined) : undefined, archivedAt: d.visibility === 'archived' ? Date.now() : undefined, visibilityUpdatedAt: Date.now() }) });
          draft = patch(draft); published = patch(published); courseMap.set(draft.id, draft); publishedMap.set(published.id, published);
          break;
        }
        case 'endCurrentExam': {
          const unitIds = draft.units.filter((u) => (u.visibility || 'current') === 'current').map((u) => u.id);
          if (!unitIds.length) throw Error('目前沒有可結束的單元');
          const ids = new Set(unitIds);
          const patch = (course: Course) => ({ ...course, units: course.units.map((u) => !ids.has(u.id) ? u : { ...u, visibility: 'archived' as const, archiveLabel: d.archiveLabel || undefined, archivedAt: Date.now(), visibilityUpdatedAt: Date.now() }) });
          draft = patch(draft); published = patch(published); courseMap.set(draft.id, draft); publishedMap.set(published.id, published);
          break;
        }
        case 'setStudentNotice':
          draft = { ...draft, studentNotice: d.text || undefined }; published = { ...published, studentNotice: d.text || undefined }; courseMap.set(draft.id, draft); publishedMap.set(published.id, published); break;
        case 'getSnapshots':
          result = d.snapshotId
            ? { rows: snapshots.find((s) => s.id === d.snapshotId)?.rows || [], next: null }
            : { rows: snapshots };
          break;
      }
      return structuredClone(result) as T;
    },
  };
}
export async function previewApi(source: API, course: Course, draft: boolean): Promise<API> {
  const mem = memoryApi(course, []);
  return {
    ...mem,
    async call<T>(name: string, data: any = {}) {
      if (name === 'getBank') return source.call<T>(name, { ...data, draft });
      return mem.call<T>(name, data);
    },
  };
}
export async function cachedBank(api: API, courseId: string, unitId: string, version: string) {
  const key = `bank:${auth?.currentUser?.uid || 'preview'}:${courseId}:${unitId}:${version}`;
  if (!api.preview) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) { const questions = JSON.parse(cached); if (Array.isArray(questions) && questions.every((q) => q?.id && Array.isArray(q.options) && typeof q.answer === 'string')) { localStorage.setItem(key + ':at', String(Date.now())); return questions as Question[]; } localStorage.removeItem(key); }
    } catch {}
  }
  const { questions } = await api.call('getBank', { courseId, unitId, version });
  if (!api.preview)
    try {
      const raw = JSON.stringify(questions);
      if (raw.length <= 1024 * 1024) { for (const k of storageKeys().filter((k) => k.startsWith(`bank:${auth?.currentUser?.uid || 'preview'}:${courseId}:${unitId}:`) && k !== key && k !== key + ':at')) localStorage.removeItem(k); localStorage.setItem(key, raw); localStorage.setItem(key + ':at', String(Date.now())); evictBankCache(); }
    } catch {}
  return questions as Question[];
}
function storageKeys() { return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k): k is string => !!k); }
export function clearBankCache() { try { for (const k of storageKeys().filter((k) => k.startsWith('bank:'))) localStorage.removeItem(k); } catch {} }
function evictBankCache() { try { const keys = storageKeys().filter((k) => k.startsWith('bank:') && !k.endsWith(':at')); let size = keys.reduce((n, k) => n + (localStorage.getItem(k)?.length || 0), 0); for (const k of keys.sort((a, b) => Number(localStorage.getItem(a + ':at') || 0) - Number(localStorage.getItem(b + ':at') || 0))) { if (size <= 3 * 1024 * 1024) break; size -= localStorage.getItem(k)?.length || 0; localStorage.removeItem(k); localStorage.removeItem(k + ':at'); } } catch {} }
export function queueKey(uid: string) {
  return `pending-v1:${uid}`;
}
export function pending(uid: string): Attempt[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey(uid)) || '[]');
  } catch {
    return [];
  }
}
export function enqueue(uid: string, a: Attempt) {
  const list = pending(uid);
  if (!list.some((x) => x.id === a.id))
    localStorage.setItem(queueKey(uid), JSON.stringify([...list, a]));
}
export function dequeue(uid: string, id: string) {
  localStorage.setItem(queueKey(uid), JSON.stringify(pending(uid).filter((a) => a.id !== id)));
}
