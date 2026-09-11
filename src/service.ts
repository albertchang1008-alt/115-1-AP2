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
  await signInWithPopup(auth, new GoogleAuthProvider());
}
export async function logout() {
  if (auth) await signOut(auth);
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
  return {
    id: 'example-course',
    title: '課程平台・操作示例',
    description: '這份範例僅供操作介面，不是正式課程或學生資料。',
    term: '115 學年度第 1 學期',
    classIds: ['example-class'],
    sheetsUrl: '',
    units: [
      {
        id: 'orientation',
        title: '01 認識學習流程',
        description: '從課前活動，到練習與完成度。',
        required: true,
        threshold: 80,
        opensAt: '',
        dueAt: '',
        bankVersion: 'example-v1',
        activities: [
          {
            id: 'welcome',
            title: '閱讀學習說明',
            type: 'link',
            phase: 'before',
            url: 'https://www.youtube.com/',
            description: '正式使用時請替換成自己的教材連結。',
          },
          {
            id: 'practice',
            title: '平台操作練習',
            type: 'quiz',
            phase: 'after',
            url: '',
            description: '使用三道示例題體驗一般測驗與閃卡。',
          },
        ],
      },
    ],
  };
}
export function memoryApi(initial = sampleCourse(), bank: Question[] = sampleQuestions): API {
  let draft = structuredClone(initial),
    published = structuredClone(initial),
    progress = emptyProgress();
  const attempts: Attempt[] = [];
  const banks = new Map<string, Question[]>([
    [initial.units[0]?.bankVersion || 'example-v1', bank],
  ]);
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
          progress.activities[d.unitId + '_' + d.activityId] = {
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
            rows: roster.map((r) => ({ ...r, progress: emptyProgress() })),
          });
          result = { done: true };
          break;
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
      const cached = sessionStorage.getItem(key);
      if (cached) return JSON.parse(cached) as Question[];
    } catch {}
  }
  const { questions } = await api.call('getBank', { courseId, unitId, version });
  if (!api.preview)
    try {
      sessionStorage.setItem(key, JSON.stringify(questions));
    } catch {}
  return questions as Question[];
}
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
