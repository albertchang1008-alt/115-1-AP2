export type Mode = 'quiz' | 'flashcard' | 'review';
export type Phase = 'before' | 'during' | 'after';
export type UnitVisibility = 'hidden' | 'current' | 'archived';
export const CURRENT_COMPLETION_FORMULA_VERSION = 2;
export interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  answer: string;
  explanation: string;
  concept?: string;
  image?: string;
  questionType?: 'single' | 'image';
  lectureTitle?: string;
  lectureUrl?: string;
  order?: number;
  socratic?: {
    // 舊欄位：1.2.0 以前發布的題庫快照沿用這五個鍵，保留供相容顯示。
    concept?: string;
    misconception?: string;
    hint1?: string;
    hint2?: string;
    hint3?: string;
    // 新欄位：對應蘇格拉底式解析總表的五段（①～⑤）。
    keyword?: string;
    chain?: string;
    decide?: string;
    memory?: string;
    trace?: string;
  };
  remedialUrl?: string;
}
export interface Activity {
  id: string;
  title: string;
  type: 'html' | 'youtube' | 'link' | 'quiz';
  phase: Phase;
  url: string;
  start?: number;
  end?: number;
  description: string;
  tracking?: 'reading' | 'interactive';
  materialVersion?: string;
  nodeTotal?: number;
  questionTotal?: number;
}
export interface Unit {
  id: string;
  title: string;
  description: string;
  required: boolean;
  threshold: number;
  opensAt: string;
  dueAt: string;
  bankVersion: string;
  activities: Activity[];
  // 研究資料模式預設開啟；教師可逐單元關閉，與成績／完成資格分離。
  research?: { enabled: boolean };
  // 單元（大分類，例如「血液」）；次單元＝這個 Unit 本身。純顯示用分組，沒有值時平鋪顯示。
  group?: string;
  visibility?: UnitVisibility;
  archiveLabel?: string;
  archivedAt?: number;
  visibilityUpdatedAt?: number;
}
export interface ExplanationResearchEvent {
  id: string;
  questionId: string;
  format: 'guided' | 'traditional';
  action: 'exposed' | 'opened' | 'closed';
  seconds?: number;
  attemptId: string;
  clientAt: number;
}
export interface Course {
  id: string;
  title: string;
  description: string;
  term: string;
  classIds: string[];
  classNames?: Record<string, string>;
  classUnits?: Record<string, string[]>;
  enrollmentClassId?: string;
  archived?: boolean;
  units: Unit[];
  sheetsUrl: string;
  publishedAt?: number;
  classOverrides?: Record<
    string,
    Record<string, Partial<Pick<Unit, 'threshold' | 'required' | 'opensAt' | 'dueAt'>>>
  >;
  studentNotice?: string;
}
export interface Profile {
  uid: string;
  email: string;
  name: string;
  studentId: string;
  classId: string;
  teacher: boolean;
  enabled: boolean;
}
export interface Roster {
  email: string;
  name: string;
  studentId: string;
  classId: string;
  enabled: boolean;
  courseId?: string;
}
export interface Answer {
  questionId: string;
  selected: string;
  correct: boolean;
  seconds: number;
}
export interface Attempt {
  id: string;
  courseId: string;
  unitId: string;
  version: string;
  mode: Mode;
  answers: Answer[];
  score: number;
  full: boolean;
  clientAt: number;
  duration: number;
  receivedAt?: number;
  uid?: string;
  classId?: string;
  processed?: boolean;
}
export interface Progress {
  units: Record<
    string,
    { best: number; attempts: number; updatedAt: number; wrong?: Record<string, Record<string, WrongEntry> | string[]> }
  >;
  activities: Record<string, { position: number; completed: boolean; updatedAt: number }>;
  // 抽題練習「已考過優先」用：unitId -> questionId -> true。跨題庫版本保留、只增不減，不影響完成度。
  attempted?: Record<string, Record<string, true>>;
}
export interface WrongEntry { n: number; at: number; }
export function wrongEntries(progress: Progress, unitId: string, version: string): Record<string, WrongEntry> {
  const raw = progress.units[unitId]?.wrong?.[version];
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((id) => [id, { n: 1, at: 0 }]));
  return raw || {};
}
/** 錯題閃卡的前端篩選：舊資料 at:0 只能在「全部」可見。 */
export function wrongCardIds(progress: Progress, unitId: string, version: string, range: '24h' | '7d' | 'all', now = Date.now()) {
  const limit = range === '24h' ? 86400000 : 604800000;
  return Object.entries(wrongEntries(progress, unitId, version))
    .filter(([, entry]) => range === 'all' || (entry.at > 0 && now - entry.at <= limit))
    .sort((a, b) => b[1].n - a[1].n || b[1].at - a[1].at)
    .map(([questionId]) => questionId);
}
export interface Stat {
  students: number;
  wrong: number;
  options: Record<string, number>;
  reviewStudents: number;
  reviewWrong: number;
  reviews: number;
}
export interface Report {
  id: string;
  unitId: string;
  version: string;
  classId: string;
  updatedAt: number;
  modes: Record<string, Record<string, Stat>>;
}
export const emptyProgress = (): Progress => ({ units: {}, activities: {} });
export function unitVisibility(unit: Unit): UnitVisibility { return unit.visibility || 'current'; }
export function forClass(course: Course, classId: string): Course {
  return {
    ...course,
    units: course.units.filter((u) => unitVisibility(u) !== 'hidden' && (!course.classUnits?.[classId] || course.classUnits[classId].includes(u.id))).map((u) => ({ ...u, ...course.classOverrides?.[classId]?.[u.id] })),
  };
}
export const phases: Record<Phase, string> = {
  before: '課前準備',
  during: '課堂學習',
  after: '課後練習',
};
export const modes: Record<Mode, string> = {
  quiz: '一般測驗',
  flashcard: '閃卡作答',
  review: '錯題複習',
};
export function requiredActivities(unit: Unit) {
  return (unit.activities || []).filter((a) => (a.type === 'html' && a.tracking === 'interactive') || a.type === 'link');
}
export function unitCompletion(unit: Unit, p: Progress, formulaVersion = CURRENT_COMPLETION_FORMULA_VERSION) {
  const required = requiredActivities(unit), hasBank = !!unit.bankVersion;
  const eligible = formulaVersion === 1 ? unit.required : unit.required && (hasBank || required.length > 0);
  const scoreDone = !hasBank || (p.units[unit.id]?.best ?? -1) >= unit.threshold;
  const activitiesDone = required.every((a) => p.activities[unit.id + '_' + a.id]?.completed);
  const completedActivities = required.filter((a) => p.activities[unit.id + '_' + a.id]?.completed).length;
  const done = formulaVersion === 1 ? (p.units[unit.id]?.best ?? -1) >= unit.threshold : scoreDone && activitiesDone;
  return { eligible, done, hasBank, scoreDone, activitiesDone, completedActivities, totalRequired: required.length + (hasBank ? 1 : 0) };
}
export function complete(unit: Unit, p: Progress, formulaVersion = CURRENT_COMPLETION_FORMULA_VERSION) {
  return unitCompletion(unit, p, formulaVersion).done;
}
export function completion(course: Course, p: Progress, formulaVersion = CURRENT_COMPLETION_FORMULA_VERSION) {
  const units = course.units.filter((u) => unitCompletion(u, p, formulaVersion).eligible);
  return { done: units.filter((u) => complete(u, p, formulaVersion)).length, total: units.length };
}
export function safeId(s: string) {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(s);
}
// 教師自訂的課程、單元、班級代碼：允許中文，不允許空白與標點。
export function safeCode(s: string) {
  return /^[-a-zA-Z0-9_\u3400-\u4dbf\u4e00-\u9fff]{1,50}$/.test(s);
}
export function youtubeId(raw: string) {
  try {
    const u = new URL(raw);
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      id =
        u.searchParams.get('v') ||
        (/^\/(shorts|embed)\//.test(u.pathname) ? u.pathname.split('/')[2] : '');
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export const MAX_BANK_QUESTIONS = 500;
export function validateQuestions(qs: Question[]) {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (!Array.isArray(qs)) return ['題庫必須是陣列'];
  if (!qs.length || qs.length > MAX_BANK_QUESTIONS) errors.push('每個单元需 1–500 題；更多題目請拆分次單元。');
  qs.forEach((q, i) => {
    if (!q || typeof q !== 'object') { errors.push(`第 ${i + 1} 題格式無效`); return; }
    if (q.questionType === 'image' && !q.image) errors.push(`第 ${i + 1} 題缺少圖片`);
    if (q.image && !materialUrl(q.image)) errors.push(`第 ${i + 1} 題圖片需為 HTTPS 網址`);
    if (!safeId(q.id) || ids.has(q.id)) errors.push(`第 ${i + 1} 題 ID 無效或重複`);
    ids.add(q.id);
    if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8)
      errors.push(`第 ${i + 1} 題題幹或選項不完整`);
    else if (
      new Set(q.options.map((o) => o.id)).size !== q.options.length ||
      q.options.some((o) => !safeId(o.id) || !o.text) ||
      !q.options.some((o) => o.id === q.answer)
    )
      errors.push(`第 ${i + 1} 題選項 ID 或正解無效`);
  });
  return errors;
}
// 2026-09-15（使用者要求）：學生登入與名冊比對不再限制信箱網域（原本只接受
// @ctcn.edu.tw，一般 @gmail.com 會被拒絕）。真正的存取控管是每堂課各自的班級
// 名冊（enrollments，見 functions/src/index.ts 的 access()）——不在名冊裡的信箱
// 一樣進不去任何課程，所以這裡放寬網域限制不會讓沒登記的人看到課程內容。
// 仍保留基本信箱格式檢查，避免名冊誤填非信箱內容（例如整欄空白或打錯字）。
const EMAIL_FORMAT = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export function allowedEmail(email: unknown, testEmails: readonly string[] = []) {
  const value = String(email ?? '').trim().toLowerCase();
  if (!value) return false;
  return EMAIL_FORMAT.test(value) || testEmails.some((e) => String(e).trim().toLowerCase() === value);
}
export function validateRoster(rows: Roster[], testEmails: readonly string[] = []) {
  const errors: string[] = [];
  const emails = new Set<string>(),
    ids = new Set<string>();
  rows.forEach((r, i) => {
    if (
      !allowedEmail(r.email, testEmails) ||
      !r.name ||
      !safeId(r.studentId) ||
      !safeCode(r.classId)
    )
      errors.push(`第 ${i + 1} 列：信箱、姓名、學號或班級不完整`);
    const scope = r.courseId || '';
    if (emails.has(scope + ':' + r.email) || ids.has(scope + ':' + r.studentId)) errors.push(`第 ${i + 1} 列：信箱或學號重複`);
    emails.add(scope + ':' + r.email);
    ids.add(scope + ':' + r.studentId);
  });
  return errors;
}
export function grade(
  qs: Question[],
  selections: Record<string, string>,
  times: Record<string, number>,
): Answer[] {
  return qs.map((q) => ({
    questionId: q.id,
    selected: selections[q.id] || '',
    correct: selections[q.id] === q.answer,
    seconds: times[q.id] || 0,
  }));
}
export function applyAttempt(p: Progress, a: Attempt): Progress {
  if (a.mode === 'review') return p;
  const old = p.units[a.unitId];
  const prior = wrongEntries(p, a.unitId, a.version);
  const wrongForVersion = { ...prior };
  for (const answer of a.answers) {
    if (answer.correct) delete wrongForVersion[answer.questionId];
    else wrongForVersion[answer.questionId] = { n: (prior[answer.questionId]?.n || 0) + 1, at: a.receivedAt || a.clientAt };
  }
  const wrong = {
    ...old?.wrong,
    [a.version]: wrongForVersion,
  };
  return {
    ...p,
    units: {
      ...p.units,
      [a.unitId]: {
        best: a.full ? Math.max(old?.best ?? -1, a.score) : (old?.best ?? -1),
        attempts: (old?.attempts || 0) + 1,
        wrong,
        updatedAt: a.receivedAt || a.clientAt,
      },
    },
    attempted: mergeAttempted(p.attempted, a.unitId, a.answers.map((x) => x.questionId)),
  };
}
// 抽題練習「已考過優先」：把這次出現過的題目 ID 併入紀錄，只增不減，不分題庫版本。
export function mergeAttempted(
  attempted: Progress['attempted'],
  unitId: string,
  questionIds: readonly string[],
): Progress['attempted'] {
  const unit = { ...(attempted?.[unitId] || {}) };
  for (const id of questionIds) unit[id] = true;
  return { ...attempted, [unitId]: unit };
}
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
// 抽題練習排序（仿 v1.9 orderQuestionsForQuiz）：未考過的題目洗牌排前面，考過的洗牌排後面；
// 不是「輪完重洗」——題庫全部考過一輪之後就自然退化成純隨機，不會主動重置。
export function orderForPractice<T extends { id: string }>(
  qs: T[],
  attemptedIds: ReadonlySet<string>,
): T[] {
  const unseen = qs.filter((q) => !attemptedIds.has(q.id));
  const seen = qs.filter((q) => attemptedIds.has(q.id));
  return [...shuffle(unseen), ...shuffle(seen)];
}
export interface Seen {
  first: Partial<Record<Mode | 'all', Answer>>;
  review?: Answer;
}
export function aggregate(modesMap: Report['modes'], seen: Record<string, Seen>, a: Attempt) {
  for (const answer of a.answers) {
    const s = (seen[answer.questionId] ??= { first: {} });
    seen[answer.questionId] = s;
    for (const mode of [a.mode, 'all']) {
      const map = (modesMap[mode] ??= {});
      modesMap[mode] = map;
      const stat = (map[answer.questionId] ??= {
        students: 0,
        wrong: 0,
        options: {},
        reviewStudents: 0,
        reviewWrong: 0,
        reviews: 0,
      });
      map[answer.questionId] = stat;
      if (a.mode === 'review') {
        stat.reviews++;
        if (!s.review) stat.reviewStudents++;
        stat.reviewWrong += (answer.correct ? 0 : 1) - (s.review && !s.review.correct ? 1 : 0);
      } else if (!s.first[mode as Mode | 'all']) {
        stat.students++;
        stat.wrong += answer.correct ? 0 : 1;
        stat.options[answer.selected || 'unanswered'] =
          (stat.options[answer.selected || 'unanswered'] || 0) + 1;
        s.first[mode as Mode | 'all'] = answer;
      }
    }
    if (a.mode === 'review') s.review = answer;
  }
}

// GitHub Pages 及其自訂網域皆接受；不接受程式碼、資料或含帳密的網址。
export function materialUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
// 教師後台用的單元樹：依 Unit.group（Sheet「單元」欄）分組，保持第一次出現的順序。
// 單元沒有細分次單元時（該組只有一個、且名稱等於單元名），畫面上以單一節點呈現。
export interface UnitTreeItem { unit: Unit; index: number }
export interface UnitTreeGroup { group: string; items: UnitTreeItem[]; single: boolean }
export function unitTree(units: Unit[]): UnitTreeGroup[] {
  const order: string[] = [];
  const map = new Map<string, UnitTreeItem[]>();
  units.forEach((unit, index) => {
    const key = unit.group || '';
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key)!.push({ unit, index });
  });
  return order.map((group) => {
    const items = map.get(group)!;
    const only = items.length === 1 ? items[0].unit : undefined;
    return { group, items, single: !!group && !!only && (only.id === group || only.title === group) };
  });
}
// 找出看起來是舊版匯入錯誤產生的單元：以課程代碼（分頁名稱）當單元代碼。
export function isTabFallbackUnit(course: Pick<Course, 'id'>, unit: Unit) {
  return unit.id === course.id;
}
