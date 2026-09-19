import { parseRosterSheet, parseBankSheet, looksLikeBankSheet } from '../../shared/sheets';
import { emptyLearning, reduceLearning, LearningEvent } from '../../shared/learning';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { VERSION } from '../../shared/version';
import {
  materialUrl as validMaterialUrl,
  Course,
  Unit,
  Attempt,
  Report,
  Seen,
  Roster,
  Question,
  Progress,
  emptyProgress,
  validateQuestions,
  MAX_BANK_QUESTIONS,
  validateRoster,
  allowedEmail,
  safeId,
  safeCode,
  applyAttempt,
  aggregate,
  youtubeId,
  forClass,
  CURRENT_COMPLETION_FORMULA_VERSION,
  UnitVisibility,
  unitVisibility,
  chapterName,
  chaptersOf,
  chapterActivityKey,
  parseCourseTime,
  normalizeProgress,
} from '../../shared/model';
initializeApp();
const db = getFirestore();
const options = {
  region: 'asia-east1',
  maxInstances: 5,
  timeoutSeconds: 120,
  memory: '512MiB' as const,
};
const syncSecret = defineSecret('SHEETS_SYNC_KEY');
function fail(message: string): never {
  throw new HttpsError('failed-precondition', message);
}
function id(v: unknown) {
  if (typeof v !== 'string' || !safeId(v)) fail('識別碼格式錯誤');
  return v as string;
}
// 教師自訂代碼（課程、單元、班級）允許中文。
function code(v: unknown) {
  if (typeof v !== 'string' || !safeCode(v)) fail('代碼格式錯誤，可用中文、英數字、- 或 _，不能有空白');
  return v as string;
}
function size(data: unknown, max = 300000) {
  if (Buffer.byteLength(JSON.stringify(data)) > max) fail('資料過大，請拆分後再提交');
}
function cleanLabel(value: unknown, max = 30) {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (text.length > max) fail(`文字最多 ${max} 字`);
  return text;
}
function visibility(value: unknown): UnitVisibility {
  if (!['hidden', 'current', 'archived'].includes(String(value))) fail('區域設定無效');
  return value as UnitVisibility;
}
// Firestore 不接受 undefined 欄位值（未開 ignoreUndefinedProperties），要清掉的欄位必須直接省略，
// 否則從「尚未開放」移到「目前學習」會丟出 INTERNAL。
export function patchVisibility(unit: Unit, next: UnitVisibility, label: string, at: number): Unit {
  const { archiveLabel: _label, archivedAt: _at, ...rest } = unit;
  if (next === 'archived') return { ...rest, visibility: next, ...(label ? { archiveLabel: label } : {}), archivedAt: at, visibilityUpdatedAt: at };
  return { ...rest, visibility: next, visibilityUpdatedAt: at };
}
function withNotice(course: any, text: string) {
  const { studentNotice: _old, ...rest } = course;
  return text ? { ...rest, studentNotice: text } : rest;
}
function visibleProgress(progress: Progress, course: Course) {
  const ids = new Set(course.units.map((u) => u.id));
  const chapterPrefixes = new Set(course.units.map((u) => `chapter:${chapterName(u)}_`));
  const activityVisible = (key: string) => key.startsWith('chapter:')
    ? [...chapterPrefixes].some((prefix) => key.startsWith(prefix))
    : ids.has(key.split('_')[0]);
  return { ...progress, units: Object.fromEntries(Object.entries(progress.units || {}).filter(([id]) => ids.has(id))), activities: Object.fromEntries(Object.entries(progress.activities || {}).filter(([key]) => activityVisible(key))), attempted: Object.fromEntries(Object.entries(progress.attempted || {}).filter(([id]) => ids.has(id))) } as Progress;
}
// 測試帳號白名單：config/testStudents { emails: ["..."] }。清空即立刻失效。
let testCache = { at: 0, emails: [] as string[] };
async function testStudents(): Promise<string[]> {
  if (Date.now() - testCache.at < 60000) return testCache.emails;
  const raw = (await db.doc('config/testStudents').get()).data()?.emails;
  const emails = Array.isArray(raw)
    ? raw.slice(0, 20).map((e: unknown) => String(e).trim().toLowerCase()).filter(Boolean)
    : [];
  testCache = { at: Date.now(), emails };
  return emails;
}
async function identity(req: any) {
  if (!req.auth) throw new HttpsError('unauthenticated', '請先登入');
  const t = req.auth.token;
  if (t.teacher === true)
    return {
      uid: req.auth.uid,
      email: t.email,
      teacher: true,
      name: t.name || '教師',
      studentId: '',
      classId: '',
      enabled: true,
    };
  const email = String(t.email ?? '').trim().toLowerCase();
  if (t.email_verified !== true || t.firebase?.sign_in_provider !== 'google.com' || !email)
    throw new HttpsError('permission-denied', '請使用已驗證的 Google 帳號');
  // 2026-09-15 起不再限制信箱網域（見 shared/model.ts 的 allowedEmail 註解）；
  // 這裡只是基本格式檢查，真正能不能進課程由 access() 比對班級名冊決定。
  if (!allowedEmail(email, await testStudents()))
    throw new HttpsError('permission-denied', '信箱格式無效');
  const test = !allowedEmail(email);
  return { uid: req.auth.uid, email, teacher: false, name: t.name || '', studentId: '', classId: '', enabled: true, test } as any;
}
function enrollmentRef(courseId: string, email: string) {
  return db.doc(`enrollments/${code(courseId)}__${email}`);
}
async function access(req: any, courseId: string, teacherOnly = false) {
  const p = await identity(req);
  const doc = await db.doc(`courses/${code(courseId)}`).get();
  if (!doc.exists) fail('課程不存在');
  const c = doc.data()!;
  if (p.teacher) {
    if (!c.teacherIds?.includes(p.uid)) throw new HttpsError('permission-denied', '未獲授權管理此課程');
    c.classIds = [...new Set([...(c.draft?.classIds || []), ...(c.published?.classIds || [])])];
  } else {
    if (teacherOnly || c.archived || !c.published) throw new HttpsError('permission-denied', '課程未開放');
    const member = c.rosterVersion === 2
      ? await enrollmentRef(courseId, p.email).get()
      : await db.doc(`roster/${p.email}`).get();
    if (!member.exists || !member.data()?.enabled || !c.published.classIds.includes(member.data()?.classId))
      throw new HttpsError('permission-denied', '未列入此課程的啟用班級名冊');
    Object.assign(p, member.data());
  }
  return { p, c };
}
export const bootstrap = onCall(options, async (req) => {
  const p = await identity(req);
  await db.doc(`profiles/${p.uid}`).set(p);
  if (p.teacher) {
    const snap = await db.collection('courses').where('teacherIds', 'array-contains', p.uid).limit(100).get();
    return { profile: p, courses: snap.docs.map((d) => ({ ...d.data().draft, id: d.id, archived: !!d.data().archived, publishedAt: d.data().published?.publishedAt || 0 })), testEmails: await testStudents(), version: VERSION };
  }
  const memberships = await db.collection('enrollments').where('email', '==', p.email).limit(100).get();
  const ids = new Set<string>(memberships.docs.filter((d) => d.data().enabled).map((d) => d.data().courseId));
  const legacy = await db.doc(`roster/${p.email}`).get();
  if (legacy.data()?.enabled) {
    const courses = await db.collection('courses').where('classIds', 'array-contains', legacy.data()!.classId).limit(100).get();
    courses.docs.filter((d) => d.data().rosterVersion !== 2).forEach((d) => ids.add(d.id));
  }
  const courses = [];
  for (const courseId of ids) {
    try {
      const { p: student, c } = await access(req, courseId);
      courses.push({ ...forClass(c.published, student.classId), id: courseId, enrollmentClassId: student.classId });
    } catch (e) {
      if (!(e instanceof HttpsError)) throw e;
    }
  }
  return { profile: p, courses, version: VERSION };
});
export const saveCourse = onCall(options, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const course = req.data.course as Course;
  code(course.id);
  size(course);
  if (!course.title?.trim() || !course.term || !Array.isArray(course.classIds) || !Array.isArray(course.units) || course.units.length > 50 || course.classIds.length > 50)
    fail('請填寫課程與學期，最多 50 班、50 單元');
  if (new Set(course.classIds).size !== course.classIds.length) fail('班級代碼重複');
  course.classIds.forEach((cl) => code(cl));
  for (const [cl, units] of Object.entries(course.classUnits || {}))
    if (!course.classIds.includes(cl) || !Array.isArray(units) || new Set(units).size !== units.length || units.some((u) => !course.units.some((unit) => unit.id === u))) fail('班級適用單元設定無效');
  const unitIds = new Set();
  for (const u of course.units) {
    code(u.id);
    if (unitIds.has(u.id)) fail('單元 ID 重複');
    unitIds.add(u.id);
    if (
      !u.title ||
      u.threshold < 0 ||
      u.threshold > 100 ||
      !Number.isFinite(u.threshold) ||
      u.activities.length > 30
    )
      fail('單元設定無效');
    if (u.research && typeof u.research.enabled !== 'boolean') fail('研究資料設定無效');
    if (u.visibility !== undefined) visibility(u.visibility);
    if (u.archiveLabel !== undefined) cleanLabel(u.archiveLabel);
    if (u.visibility === 'archived' && u.archivedAt !== undefined && (!Number.isFinite(u.archivedAt) || u.archivedAt < 0)) fail('封存時間無效');
    const activityIds = new Set();
    for (const a of u.activities) {
      id(a.id);
      if (activityIds.has(a.id)) fail('活動 ID 重複');
      activityIds.add(a.id);
      if (
        !['before', 'during', 'after'].includes(a.phase) ||
        !['html', 'youtube', 'link', 'quiz'].includes(a.type)
      )
        fail('活動類型錯誤');
      if (
        a.type === 'youtube' &&
        (!youtubeId(a.url) ||
          !Number.isFinite(a.start || 0) ||
          (a.start || 0) < 0 ||
          (a.end !== undefined && (!Number.isFinite(a.end) || a.end <= (a.start || 0))))
      )
        fail('YouTube 連結或片段時間無效');
      if (a.tracking && !['reading', 'interactive'].includes(a.tracking)) fail('教材紀錄方式無效');
      if (a.materialVersion) id(a.materialVersion);
      for (const total of [a.nodeTotal, a.questionTotal]) if (total !== undefined && (!Number.isInteger(total) || total < 0 || total > 500)) fail('診斷節點與題目總數需為 0–500');
      if (a.type === 'html' && a.url && !validMaterialUrl(a.url))
        fail('教材網址需使用有效 HTTPS 網址');
      if (a.type === 'link' && !/^https:\/\//.test(a.url)) fail('教材連結需使用 HTTPS');
    }
  }
  if (course.chapters !== undefined && (!course.chapters || Array.isArray(course.chapters) || typeof course.chapters !== 'object')) fail('單元設定無效');
  const chapters = chaptersOf(course);
  for (const [name, chapter] of Object.entries(chapters)) {
    if (!name.trim() || !chapter.title?.trim() || !Number.isFinite(chapter.threshold) || chapter.threshold < 0 || chapter.threshold > 100 || !Array.isArray(chapter.activities) || chapter.activities.length > 30) fail('單元設定無效');
    if (chapter.research && typeof chapter.research.enabled !== 'boolean') fail('研究資料設定無效');
    const activityIds = new Set<string>();
    for (const a of chapter.activities) {
      id(a.id);
      if (activityIds.has(a.id)) fail('活動 ID 重複');
      activityIds.add(a.id);
      if (!a.title?.trim() || !['before', 'during', 'after'].includes(a.phase) || !['html', 'youtube', 'link', 'quiz'].includes(a.type)) fail('活動類型錯誤');
      if (a.type === 'youtube' && (!youtubeId(a.url) || !Number.isFinite(a.start || 0) || (a.start || 0) < 0 || (a.end !== undefined && (!Number.isFinite(a.end) || a.end <= (a.start || 0))))) fail('YouTube 連結或片段時間無效');
      if (a.tracking && !['reading', 'interactive'].includes(a.tracking)) fail('教材紀錄方式無效');
      if (a.materialVersion) id(a.materialVersion);
      for (const total of [a.nodeTotal, a.questionTotal]) if (total !== undefined && (!Number.isInteger(total) || total < 0 || total > 500)) fail('診斷節點與題目總數需為 0–500');
      if (a.type === 'html' && a.url && !validMaterialUrl(a.url)) fail('教材網址需使用有效 HTTPS 網址');
      if (a.type === 'link' && !/^https:\/\//.test(a.url)) fail('教材連結需使用 HTTPS');
    }
  }
  if (course.chapterOrder !== undefined && (!Array.isArray(course.chapterOrder) || course.chapterOrder.some((name) => typeof name !== 'string' || !chapters[name]) || new Set(course.chapterOrder).size !== course.chapterOrder.length)) fail('單元順序設定無效');
  for (const [cl, overrides] of Object.entries(course.chapterOverrides || {})) {
    if (!course.classIds.includes(cl) || !overrides || Array.isArray(overrides) || typeof overrides !== 'object') fail('班級單元設定無效');
    for (const [name, settings] of Object.entries(overrides)) {
      if (!chapters[name] || !settings || Array.isArray(settings) || Object.keys(settings).some((k) => !['threshold', 'required', 'opensAt', 'dueAt'].includes(k))) fail('班級單元設定無效');
      if (settings.threshold !== undefined && (!Number.isFinite(settings.threshold) || settings.threshold < 0 || settings.threshold > 100)) fail('班級達標門檻無效');
      if (settings.required !== undefined && typeof settings.required !== 'boolean') fail('班級必做設定無效');
      if (settings.opensAt !== undefined && typeof settings.opensAt !== 'string') fail('班級開放時間無效');
      if (settings.dueAt !== undefined && typeof settings.dueAt !== 'string') fail('班級期限無效');
    }
  }
  for (const cl of Object.keys(course.classOverrides || {})) {
    if (!course.classIds.includes(cl)) fail('班級設定不屬於課程');
    for (const [unitId, settings] of Object.entries(course.classOverrides![cl])) {
      if (
        !course.units.some((u) => u.id === unitId) ||
        Object.keys(settings).some(
          (k) => !['threshold', 'required', 'opensAt', 'dueAt'].includes(k),
        )
      )
        fail('班級單元設定無效');
      if (
        settings.threshold !== undefined &&
        (!Number.isFinite(settings.threshold) || settings.threshold < 0 || settings.threshold > 100)
      )
        fail('班級達標門檻無效');
    }
  }
  const ref = db.doc(`courses/${course.id}`);
  await db.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (old.exists && !old.data()?.teacherIds?.includes(p.uid))
      throw new HttpsError('permission-denied', '未獲授權');
    tx.set(
      ref,
      {
        draft: course,
        teacherIds: old.data()?.teacherIds || [p.uid],
        classIds: old.data()?.published?.classIds || [],
        rosterVersion: old.exists ? old.data()?.rosterVersion || 1 : 2,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  });
  return { ok: true };
});
export const publishCourse = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  const course = c.draft as Course;
  if (!course.classIds.length || !course.units.length) fail('發布前請建立班級與單元');
  for (const cl of course.classIds) {
    if (!forClass(course, cl).units.length) fail(`班級 ${cl} 尚未勾選單元`);
  }
  const usedUnits = course.units.filter((u) => course.classIds.some((cl) => forClass(course, cl).units.some((x) => x.id === u.id)));
  for (const u of usedUnits) {
    if (course.classIds.some((cl) => forClass(course, cl).units.some((x) => x.id === u.id && x.required)) && !u.bankVersion) fail(`${u.title} 尚未指定題庫`);
    if (u.bankVersion) {
      const b = await db.doc(`banks/${course.id}_${u.id}_${id(u.bankVersion)}`).get();
      if (!b.exists) fail('題庫版本不存在');
    }
  }
  for (const chapter of Object.values(chaptersOf(course))) for (const a of chapter.activities)
    if (a.type === 'html' && !validMaterialUrl(a.url)) fail(`${a.title} 尚未提供有效教材網址`);
  const published = { ...course, publishedAt: Date.now() };
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`courses/${course.id}`);
    const fresh = await tx.get(ref);
    if (!fresh.data()?.teacherIds?.includes(req.auth!.uid)) fail('未獲授權');
    if (JSON.stringify(fresh.data()?.draft) !== JSON.stringify(course)) fail('草稿剛被更新，請重新載入後發布');
    tx.update(ref, { published, classIds: course.classIds });
  });
  return published;
});
async function updateVisibility(req: any, unitIds: string[], next: UnitVisibility, archiveLabel: string, action: string) {
  const { p } = await access(req, req.data.courseId, true);
  const ref = db.doc(`courses/${code(req.data.courseId)}`), at = Date.now();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref), data = snap.data();
    if (!data?.teacherIds?.includes(p.uid)) throw new HttpsError('permission-denied', '未獲授權');
    const draft = data.draft as Course, published = data.published as Course | undefined;
    const ids = [...new Set(unitIds.map(code))];
    if (!ids.length || ids.length > 200 || ids.some((id) => !draft.units.some((u) => u.id === id))) fail('次單元設定無效');
    const before = Object.fromEntries(ids.map((id) => [id, unitVisibility(draft.units.find((u) => u.id === id)!)]));
    const update = (course: Course | undefined) => !course ? course : ({ ...course, units: course.units.map((u) => ids.includes(u.id) ? patchVisibility(u, next, archiveLabel, at) : u) });
    tx.update(ref, { draft: update(draft), ...(published ? { published: update(published) } : {}) });
    tx.create(ref.collection('visibilityLog').doc(), { at: FieldValue.serverTimestamp(), actorUid: p.uid, action, unitIds: ids, from: before, to: next, archiveLabel });
    return { units: ids, visibility: next, archiveLabel };
  });
}
export const setUnitVisibility = onCall(options, async (req) => updateVisibility(req, req.data.unitIds || [], visibility(req.data.visibility), cleanLabel(req.data.archiveLabel), 'move'));
export const endCurrentExam = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  const current = ((c.draft as Course).units || []).filter((u) => unitVisibility(u) === 'current').map((u) => u.id);
  if (!current.length) fail('目前沒有可結束的單元');
  return updateVisibility(req, current, 'archived', cleanLabel(req.data.archiveLabel), 'endExam');
});
export const renameArchiveLabel = onCall(options, async (req) => {
  const { p } = await access(req, req.data.courseId, true); const from = cleanLabel(req.data.from), to = cleanLabel(req.data.to);
  if (!from || !to) fail('請填寫歷史標籤');
  const ref = db.doc(`courses/${code(req.data.courseId)}`);
  return db.runTransaction(async (tx) => { const snap = await tx.get(ref), data = snap.data(); if (!data?.teacherIds?.includes(p.uid)) throw new HttpsError('permission-denied', '未獲授權'); const change = (course: Course | undefined) => !course ? course : ({ ...course, units: course.units.map((u) => u.visibility === 'archived' && u.archiveLabel === from ? { ...u, archiveLabel: to, visibilityUpdatedAt: Date.now() } : u) }); tx.update(ref, { draft: change(data.draft), ...(data.published ? { published: change(data.published) } : {}) }); tx.create(ref.collection('visibilityLog').doc(), { at: FieldValue.serverTimestamp(), actorUid: p.uid, action: 'renameLabel', from, to }); return { ok: true }; });
});
export const setStudentNotice = onCall(options, async (req) => {
  const { p } = await access(req, req.data.courseId, true); const text = cleanLabel(req.data.text, 60), ref = db.doc(`courses/${code(req.data.courseId)}`);
  await db.runTransaction(async (tx) => { const snap = await tx.get(ref), data = snap.data(); if (!data?.teacherIds?.includes(p.uid)) throw new HttpsError('permission-denied', '未獲授權'); tx.update(ref, { draft: withNotice(data.draft, text), ...(data.published ? { published: withNotice(data.published, text) } : {}) }); tx.create(ref.collection('visibilityLog').doc(), { at: FieldValue.serverTimestamp(), actorUid: p.uid, action: 'notice', notice: text }); });
  return { text };
});
export const deleteCourse = onCall(options, async (req) => {
  await access(req, req.data.courseId, true);
  await db.doc(`courses/${code(req.data.courseId)}`).delete();
  return { ok: true };
});
async function writeEnrollments(uid: string, courseId: string, rows: Roster[], migrating = false) {
  const errors = validateRoster(rows, await testStudents());
  if (errors.length) fail(errors.join('；'));
  let updated = 0;
  for (let i = 0; i < rows.length; i += 100) {
    updated += await db.runTransaction(async (tx) => {
      const course = await tx.get(db.doc(`courses/${code(courseId)}`));
      if (!course.data()?.teacherIds?.includes(uid)) fail('未獲授權管理此課程');
      if (!migrating && course.data()?.rosterVersion !== 2) fail('請先在班級名冊預覽並轉換舊名冊');
      const batch = rows.slice(i, i + 100);
      const originals = [];
      for (const row of batch) {
        if (!course.data()?.draft?.classIds.includes(row.classId)) fail('班級尚未建立並保存：' + row.classId);
        const ref = enrollmentRef(courseId, row.email);
        const old = await tx.get(ref);
        const key = db.doc(`courses/${courseId}/studentIds/${id(row.studentId)}`);
        const existing = await tx.get(key);
        if (existing.exists && existing.data()!.email !== row.email) fail('此課程學號已屬於其他信箱：' + row.studentId);
        const oldKey = old.exists && old.data()!.studentId !== row.studentId ? db.doc(`courses/${courseId}/studentIds/${id(old.data()!.studentId)}`) : null;
        const oldKeySnap = oldKey ? await tx.get(oldKey) : null;
        originals.push({ row, ref, old, key, existing, oldKey, oldKeySnap });
      }
      let count = 0;
      for (const { row, ref, old, key, existing, oldKey, oldKeySnap } of originals) {
        if (migrating && old.exists) continue;
        const value = { ...row, courseId };
        if (!old.exists || Object.entries(value).some(([k, v]) => old.data()![k] !== v)) { tx.set(ref, value); count++; }
        if (!existing.exists) tx.set(key, { email: row.email });
        if (oldKey && oldKeySnap?.data()?.email === row.email) tx.delete(oldKey);
      }
      return count;
    });
  }
  return { count: rows.length, updated, changed: updated > 0 };
}
export const importRoster = onCall(options, async (req) => {
  const { p } = await access(req, req.data.courseId, true);
  const rows = req.data.rows as Roster[];
  if (!Array.isArray(rows) || !rows.length || rows.length > 200) fail('每次匯入 1–200 人');
  return writeEnrollments(p.uid, req.data.courseId, rows.map((r) => ({ ...r, courseId: req.data.courseId })));
});
export const migrateRoster = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId, true);
  if (c.rosterVersion === 2) return { done: true, count: 0, rows: [] };
  const rows: Roster[] = [];
  for (const cl of c.draft.classIds) {
    const owner = await db.doc(`classes/${cl}`).get();
    if (owner.exists && !owner.data()?.teacherIds?.includes(p.uid)) fail('無權轉換舊班級：' + cl);
    const snap = await db.collection('roster').where('classId', '==', cl).limit(1001).get();
    if (snap.size > 1000 || rows.length + snap.size > 3000) fail('舊名冊過大，請先分批整理');
    rows.push(...snap.docs.map((d) => ({ ...d.data(), courseId: req.data.courseId }) as Roster));
  }
  if (req.data.apply === true) {
    await writeEnrollments(p.uid, req.data.courseId, rows, true);
    await db.doc(`courses/${req.data.courseId}`).update({ rosterVersion: 2 });
  }
  return { done: req.data.apply === true, count: rows.length, rows: rows.slice(0, 20) };
});
export const archiveCourse = onCall(options, async (req) => {
  await access(req, req.data.courseId, true);
  await db.doc(`courses/${req.data.courseId}`).update({ archived: req.data.archived === true });
  return { ok: true };
});
function rosterQuery(courseId: string, c: any) {
  return c.rosterVersion === 2 ? db.collection('enrollments').where('courseId', '==', courseId) : db.collection('roster');
}
export const getRoster = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  const classId = code(req.data.classId);
  if (!c.classIds.includes(classId)) fail('班級不屬於課程');
  const snap = await rosterQuery(req.data.courseId, c)
    .where('classId', '==', classId)
    .orderBy('studentId')
    .startAfter(req.data.after || '')
    .limit(50)
    .get();
  return {
    rows: snap.docs.map((d) => d.data()),
    next: snap.size === 50 ? snap.docs.at(-1)!.data().studentId : null,
  };
});
export const getPublished = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  if (!c.published) fail('尚未發布課程');
  return c.published;
});
async function publishBank(courseId: string, unitId: string, questions: Question[]) {
  const errors = validateQuestions(questions);
  if (errors.length) fail(errors.join('\n'));
  size(questions, 600000);
  // 依「題序、題目ID」穩定排序後才算雜湊，Sheet 上拖動列順序不會產生新版本，只有內容真的變了才會。
  const sorted = [...questions].sort(
    (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.id.localeCompare(b.id),
  );
  const version = createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 20);
  const key = `${code(courseId)}_${code(unitId)}_${version}`;
  const ref = db.doc(`banks/${key}`);
  if (!(await ref.get()).exists) {
    const batch = db.batch();
    const chunks = [];
    for (let i = 0; i < sorted.length; i += 20) {
      const chunk = String(i / 20);
      chunks.push(chunk);
      batch.set(ref.collection('chunks').doc(chunk), { questions: sorted.slice(i, i + 20) });
    }
    batch.set(ref, {
      courseId,
      unitId,
      version,
      chunks,
      count: sorted.length,
      questionOptions: Object.fromEntries(sorted.map((q) => [q.id, q.options.map((o) => o.id)])),
      createdAt: Date.now(),
    });
    // 僅供 Cloud Functions 批改；getBank 絕不讀取／回傳此文件。
    batch.set(ref.collection('grading').doc('answers'), { answers: Object.fromEntries(sorted.map((q) => [q.id, q.answer])), count: sorted.length });
    await batch.commit();
  }
  return { version, count: sorted.length };
}
export const publishQuestions = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  if (!c.draft?.units?.some((u: Unit) => u.id === req.data.unitId)) fail('請先建立並保存單元');
  return publishBank(req.data.courseId, req.data.unitId, req.data.questions);
});
export const sheetsPublish = onRequest({ ...options, secrets: [syncSecret] }, async (req, res) => {
  try {
    const raw = req.rawBody;
    const stamp = String(req.get('x-timestamp') || '');
    const sig = String(req.get('x-signature') || '');
    const expected = createHmac('sha256', syncSecret.value())
      .update(stamp + '.')
      .update(raw)
      .digest('hex');
    if (
      req.method !== 'POST' ||
      Math.abs(Date.now() - Number(stamp)) > 300000 ||
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      res.status(403).json({ error: 'unauthorized' });
      return;
    }
    const allowed = await db.doc(`syncAllowlist/${code(req.body.courseId)}`).get();
    if (!allowed.exists || allowed.data()?.enabled !== true) fail('課程尚未授權 Sheets 同步');
    const result = await publishBank(req.body.courseId, req.body.unitId, req.body.questions);
    res.json({ ...result, platformVersion: VERSION });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});
export const getBank = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  const source = p.teacher ? (req.data.draft ? c.draft : c.published) : forClass(c.published, p.classId);
  if (
    !source?.units.some(
      (u: any) => u.id === req.data.unitId && u.bankVersion === req.data.version,
    ) &&
    !p.teacher
  )
    fail('無法讀取此版本');
  const ref = db.doc(
    `banks/${code(req.data.courseId)}_${code(req.data.unitId)}_${id(req.data.version)}`,
  );
  const manifest = await ref.get();
  if (!manifest.exists) fail('題庫未發布');
  const docs = await Promise.all(
    manifest.data()!.chunks.map((ch: string) => ref.collection('chunks').doc(ch).get()),
  );
  return { questions: docs.flatMap((d) => d.data()?.questions || []) };
});
export const getProgress = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  const uid = req.data.uid || p.uid;
  if (uid !== p.uid && !p.teacher) throw new HttpsError('permission-denied', '無法讀取他人進度');
  const progress = (
    (await db.doc(`courses/${req.data.courseId}/progress/${id(uid)}`).get()).data() ||
    emptyProgress()
  );
  return p.teacher ? progress : visibleProgress(progress as Progress, forClass(c.published, p.classId));
});
// 舊題庫發布時尚無私有答案表；同一個版本只記錄一次 fallback，避免監控雜訊。
const gradingFallbackWarned = new Set<string>();
export const submitAttempt = onCall(options, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', '請先登入');
  const a = req.data?.attempt as Attempt;
  if (!a || typeof a !== 'object' || Array.isArray(a)) fail('作答格式錯誤');
  id(a.id);
  code(a.unitId);
  id(a.version);
  size(a, 300000);
  const { p, c } = await access(req, a.courseId);
  if (p.teacher) fail('教師請使用不寫入紀錄的前台預覽');
  const unit =
    c.published && forClass(c.published, p.classId).units.find((u: any) => u.id === a.unitId);
  if (!unit || parseCourseTime(unit.opensAt) > Date.now()) fail('單元尚未開放');
  const bankRef = db.doc(`banks/${a.courseId}_${a.unitId}_${a.version}`);
  const bank = await bankRef.get();
  if (!bank.exists) fail('題庫版本不存在');
  if (
    !['quiz', 'flashcard', 'review'].includes(a.mode) ||
    !Array.isArray(a.answers) ||
    !a.answers.length ||
    a.answers.length > MAX_BANK_QUESTIONS ||
    new Set(a.answers.map((x) => x.questionId)).size !== a.answers.length ||
    !Number.isFinite(a.duration) ||
    a.duration < 0
  )
    fail('作答格式錯誤');
  for (const r of a.answers) {
    id(r.questionId);
    if (
      typeof r.selected !== 'string' ||
      r.selected.length > 100 ||
      typeof r.correct !== 'boolean' ||
      !Number.isFinite(r.seconds) ||
      r.seconds < 0
    )
      fail('選答格式錯誤');
  }
  const questionOptions = bank.data()!.questionOptions || {};
  for (const r of a.answers) {
    if (
      !questionOptions[r.questionId] ||
      (r.selected && !questionOptions[r.questionId].includes(r.selected))
    )
      fail('題目或選項不屬於本次題庫');
  }
  const grading = await bankRef.collection('grading').doc('answers').get();
  let answersById: Map<string, string>;
  if (grading.exists) answersById = new Map(Object.entries(grading.data()!.answers || {}) as [string, string][]);
  else {
    const warningKey = `${a.courseId}/${a.unitId}/${a.version}`;
    if (!gradingFallbackWarned.has(warningKey)) {
      gradingFallbackWarned.add(warningKey);
      console.warn(`grading fallback: ${warningKey}`);
    }
    const chunks = await Promise.all(bank.data()!.chunks.map((ch: string) => db.doc(`banks/${a.courseId}_${a.unitId}_${a.version}/chunks/${ch}`).get()));
    answersById = new Map(chunks.flatMap((d) => d.data()?.questions || []).map((q: Question) => [q.id, q.answer]));
  }
  // 前端傳來的 score／correct 僅供相容，絕不採用；一律以不可變題庫快照的正解重批。
  a.answers = a.answers.map((r) => ({ ...r, correct: answersById.get(r.questionId) === r.selected }));
  a.full = a.full === true && a.mode !== 'review' && a.answers.length === bank.data()!.count;
  a.score = Math.round((a.answers.filter((x) => x.correct).length / a.answers.length) * 100);
  const ref = db.doc(`courses/${a.courseId}/attempts/${a.id}`),
    pr = db.doc(`courses/${a.courseId}/progress/${p.uid}`);
  return db.runTransaction(async (tx) => {
    const [old, progress] = await Promise.all([tx.get(ref), tx.get(pr)]);
    if (old.exists) {
      if (old.data()?.uid !== p.uid) throw new HttpsError('permission-denied', '作答 ID 衝突');
      return { progress: normalizeProgress(progress.data() as Progress), duplicate: true };
    }
    const saved = {
      ...a,
      uid: p.uid,
      classId: p.classId,
      receivedAt: FieldValue.serverTimestamp(),
      processed: false,
    };
    const next = applyAttempt(normalizeProgress(progress.data() as Progress), {
      ...a,
      receivedAt: Date.now(),
    });
    tx.create(ref, saved);
    if (a.mode !== 'review') tx.set(pr, { ...next, uid: p.uid, classId: p.classId });
    return { progress: next, duplicate: false };
  });
});
/** 綜合練習只寫一次 progress；每個次單元仍各留一筆不可變作答紀錄。 */
export const submitMixedAttempts = onCall(options, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', '請先登入');
  const attempts = req.data?.attempts as Attempt[];
  if (!Array.isArray(attempts) || !attempts.length || attempts.length > 10) fail('綜合練習格式錯誤');
  const courseId = attempts[0]?.courseId;
  if (!attempts.every((a) => a && a.courseId === courseId && a.mode === 'quiz' && a.full === false && Array.isArray(a.answers) && a.answers.length)) fail('綜合練習格式錯誤');
  const { p, c } = await access(req, courseId);
  if (p.teacher) fail('預覽不能寫入正式進度');
  const visible = c.published && forClass(c.published, p.classId).units || [];
  const prepared = await Promise.all(attempts.map(async (input) => {
    id(input.id); code(input.unitId); id(input.version); size(input, 300000);
    const unit = visible.find((u: any) => u.id === input.unitId);
    // 綜合練習只允許看板「目前」的單元；整批在寫入前驗完，拒絕時不留半套紀錄。
    if (!unit || unitVisibility(unit) !== 'current' || parseCourseTime(unit.opensAt) > Date.now()) fail('單元尚未開放或已移至歷史區');
    const bankRef = db.doc(`banks/${courseId}_${input.unitId}_${input.version}`), bank = await bankRef.get();
    if (!bank.exists || !Number.isFinite(input.duration) || input.duration < 0 || input.answers.length > MAX_BANK_QUESTIONS) fail('作答格式錯誤');
    const options = bank.data()!.questionOptions || {};
    if (new Set(input.answers.map((x) => x.questionId)).size !== input.answers.length) fail('作答格式錯誤');
    for (const answer of input.answers) if (!options[answer.questionId] || typeof answer.selected !== 'string' || !options[answer.questionId].includes(answer.selected)) fail('題目或選項不屬於本次題庫');
    const grading = await bankRef.collection('grading').doc('answers').get();
    let keys: Map<string, string>;
    if (grading.exists) keys = new Map(Object.entries(grading.data()!.answers || {}) as [string, string][]);
    else {
      const warningKey = `${courseId}/${input.unitId}/${input.version}`;
      if (!gradingFallbackWarned.has(warningKey)) { gradingFallbackWarned.add(warningKey); console.warn(`grading fallback: ${warningKey}`); }
      const chunks = await Promise.all(bank.data()!.chunks.map((ch: string) => bankRef.collection('chunks').doc(ch).get()));
      keys = new Map(chunks.flatMap((d) => d.data()?.questions || []).map((q: Question) => [q.id, q.answer]));
    }
    const answers = input.answers.map((x) => ({ ...x, correct: keys.get(x.questionId) === x.selected }));
    return { ...input, answers, score: Math.round(answers.filter((x) => x.correct).length / answers.length * 100), full: false } as Attempt;
  }));
  const progressRef = db.doc(`courses/${courseId}/progress/${p.uid}`);
  return db.runTransaction(async (tx) => {
    const old = await Promise.all(prepared.map((a) => tx.get(db.doc(`courses/${courseId}/attempts/${a.id}`))));
    if (old.some((x) => x.exists && x.data()?.uid !== p.uid)) throw new HttpsError('permission-denied', '作答 ID 衝突');
    const progress = await tx.get(progressRef); let next = normalizeProgress(progress.data() as Progress);
    for (let i = 0; i < prepared.length; i++) if (!old[i].exists) { const a = prepared[i]; next = applyAttempt(next, { ...a, receivedAt: Date.now() }); tx.create(db.doc(`courses/${courseId}/attempts/${a.id}`), { ...a, uid: p.uid, classId: p.classId, receivedAt: FieldValue.serverTimestamp(), processed: false }); }
    tx.set(progressRef, { ...next, uid: p.uid, classId: p.classId });
    return { progress: next };
  });
});
export const saveActivity = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  if (p.teacher) fail('預覽不能寫入正式進度');
  const { unitId, chapterName: requestedChapter, activityId, position, completed } = req.data;
  const studentCourse = c.published && forClass(c.published, p.classId);
  const u = studentCourse?.units.find((x: any) => x.id === unitId);
  const chapter = requestedChapter && studentCourse ? chaptersOf(studentCourse)[String(requestedChapter)] : undefined;
  const activityOwner: any = chapter || u;
  if (
    !activityOwner ||
    !activityOwner.activities.some((x: any) => x.id === activityId) ||
    parseCourseTime((chapter || u)!.opensAt) > Date.now() ||
    !Number.isFinite(position) ||
    position < 0 ||
    typeof completed !== 'boolean'
  )
    fail('活動資料無效');
  const activity = activityOwner.activities.find((a: any) => a.id === activityId);
  if (activity?.tracking === 'interactive') fail('互動教材需由事件回報通關');
  const ref = db.doc(`courses/${req.data.courseId}/progress/${p.uid}`);
  await ref.set(
    {
      uid: p.uid,
      classId: p.classId,
      activities: {
        [chapter ? chapterActivityKey(String(requestedChapter), id(activityId)) : `${code(unitId)}_${id(activityId)}`]: { position, completed, updatedAt: Date.now() },
      },
    },
    { merge: true },
  );
  return { ok: true };
});
// 題庫解析研究資料：僅在授權課程保存粗粒度曝光／展開／停留；不影響成績與完成度。
export const saveExplanationResearchEvents = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  if (p.teacher) fail('教師預覽不寫入研究資料');
  const unitId = code(req.data.unitId), version = id(req.data.version);
  const unit = forClass(c.published, p.classId).units.find((u: Unit) => u.id === unitId);
  if (!unit || !unit.bankVersion || unit.bankVersion !== version || unit.research?.enabled === false || parseCourseTime(unit.opensAt) > Date.now()) fail('研究資料活動未開放');
  const events = req.data.events;
  if (!Array.isArray(events) || !events.length || events.length > 30 || new Set(events.map((e: any) => e?.id)).size !== events.length) fail('研究資料事件無效');
  for (const e of events) {
    if (!e || typeof e !== 'object' || !safeId(e.id) || !safeId(e.questionId) || !safeId(e.attemptId) || !['guided', 'traditional'].includes(e.format) || !['exposed', 'opened', 'closed'].includes(e.action) || !Number.isFinite(e.clientAt) || (e.seconds !== undefined && (!Number.isFinite(e.seconds) || e.seconds < 1 || e.seconds > 600))) fail('研究資料事件格式錯誤');
  }
  const root = db.doc(`courses/${req.data.courseId}/research/${p.uid}_${unitId}_${version}`);
  const refs = events.map((e: any) => root.collection('events').doc(e.id));
  return db.runTransaction(async (tx) => {
    const [current, ...stored] = await Promise.all([tx.get(root), ...refs.map((r) => tx.get(r))]);
    const fresh = events.filter((_: any, i: number) => !stored[i].exists);
    const summary = current.data()?.summary || { guidedExposures: 0, guidedSeconds: 0, traditionalOpens: 0, traditionalSeconds: 0, events: 0, questions: {} };
    summary.questions ||= {};
    for (const e of fresh) {
      summary.events++;
      const question = summary.questions[e.questionId] ||= { guidedExposures: 0, guidedSeconds: 0, traditionalOpens: 0, traditionalSeconds: 0, lastAt: 0 };
      question.lastAt = Date.now();
      if (e.format === 'guided' && e.action === 'exposed') { summary.guidedExposures++; summary.guidedSeconds += e.seconds || 0; }
      if (e.format === 'traditional' && e.action === 'opened') summary.traditionalOpens++;
      if (e.format === 'traditional' && e.action === 'closed') summary.traditionalSeconds += e.seconds || 0;
      if (e.format === 'guided' && e.action === 'exposed') { question.guidedExposures++; question.guidedSeconds += e.seconds || 0; }
      if (e.format === 'traditional' && e.action === 'opened') question.traditionalOpens++;
      if (e.format === 'traditional' && e.action === 'closed') question.traditionalSeconds += e.seconds || 0;
    }
    if (fresh.length) {
      tx.set(root, { uid: p.uid, classId: p.classId, name: p.name, studentId: p.studentId, unitId, version, summary, startedAt: current.data()?.startedAt || Date.now(), updatedAt: Date.now() }, { merge: true });
      fresh.forEach((e: any, i: number) => tx.create(refs[events.indexOf(e)], { ...e, receivedAt: Date.now() }));
    }
    return { accepted: fresh.map((e: any) => e.id), summary };
  });
});
export const getExplanationResearchEvidence = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  const classId = code(req.data.classId), unitId = code(req.data.unitId);
  if (!c.classIds.includes(classId)) fail('班級不屬於課程');
  const snap = await db.collection(`courses/${req.data.courseId}/research`).where('classId', '==', classId).limit(500).get();
  const rows: any[] = snap.docs.map((d) => ({ ...d.data(), id: d.id })).filter((r: any) => r.unitId === unitId);
  const attempts = await db.collection(`courses/${req.data.courseId}/attempts`).where('classId', '==', classId).limit(2000).get();
  const diagnostics = await db.collection(`courses/${req.data.courseId}/diagnostics`).where('classId', '==', classId).limit(500).get();
  const researchChapter = chapterName((c.published as Course).units.find((u) => u.id === unitId) || ({ id: unitId, title: unitId } as Unit));
  const htmlByStudent = new Map<string, any[]>();
  diagnostics.docs.forEach((d) => { const x = d.data(); if (x.unitId === unitId || x.chapterName === researchChapter) (htmlByStudent.get(x.uid) || (htmlByStudent.set(x.uid, []), htmlByStudent.get(x.uid)!)).push(x); });
  const byStudent = new Map<string, any[]>();
  attempts.docs.forEach((d) => { const a = d.data(); if (a.unitId === unitId && a.version === rows.find((r: any) => r.uid === a.uid)?.version) (byStudent.get(a.uid) || (byStudent.set(a.uid, []), byStudent.get(a.uid)!)).push(a); });
  return { rows: rows.map((r: any) => {
    let laterAttempts = 0, laterWrong = 0, recovered = 0;
    for (const [questionId, evidence] of Object.entries(r.summary?.questions || {}) as any) {
      const after = (byStudent.get(r.uid) || []).flatMap((a) => (a.answers || []).filter((x: any) => x.questionId === questionId && a.receivedAt?.toMillis?.() > evidence.lastAt));
      laterAttempts += after.length; laterWrong += after.filter((x: any) => !x.correct).length;
      if (after.some((x: any) => x.correct)) recovered++;
    }
    const htmlRows = htmlByStudent.get(r.uid) || [];
    const html = htmlRows.reduce((total: any, x: any) => ({ activities: total.activities + 1, nodes: total.nodes + (x.summary?.nodes?.length || 0), nodeTotal: total.nodeTotal + (x.nodeTotal || 0), firstCorrect: total.firstCorrect + Object.values(x.summary?.answers || {}).filter((q: any) => q.firstCorrect).length, questionTotal: total.questionTotal + (x.questionTotal || 0), activeSeconds: total.activeSeconds + (x.summary?.activeSeconds || 0), completed: total.completed || !!x.summary?.completed }), { activities: 0, nodes: 0, nodeTotal: 0, firstCorrect: 0, questionTotal: 0, activeSeconds: 0, completed: false });
    return { ...r, html, followUp: { laterAttempts, laterWrong, recurrenceRate: laterAttempts ? Math.round(laterWrong / laterAttempts * 100) : null, recovered } };
  }) };
});
export const getHistory = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  let q = db
    .collection(`courses/${req.data.courseId}/attempts`)
    .where('classId', '==', p.teacher ? code(req.data.classId) : p.classId);
  if (p.teacher && !c.classIds.includes(req.data.classId)) fail('班級不屬於課程');
  if (!p.teacher || req.data.uid) q = q.where('uid', '==', p.teacher ? id(req.data.uid) : p.uid);
  q = q.orderBy('receivedAt', 'desc').orderBy('__name__', 'desc');
  if (req.data.after)
    q = q.startAfter(
      new Timestamp(req.data.after.seconds, req.data.after.nanoseconds),
      req.data.after.id,
    );
  const snap = await q.limit(20).get();
  const visible = !p.teacher ? new Set(forClass(c.published, p.classId).units.map((u) => u.id)) : null;
  const rows = snap.docs.map((d) => ({ ...d.data(), receivedAt: d.data().receivedAt.toMillis() }) as any).filter((a: any) => !visible || visible.has(a.unitId));
  return {
    rows,
    next:
      snap.size === 20
        ? {
            seconds: snap.docs.at(-1)!.data().receivedAt.seconds,
            nanoseconds: snap.docs.at(-1)!.data().receivedAt.nanoseconds,
            id: snap.docs.at(-1)!.id,
          }
        : null,
  };
});
async function aggregateBatch(courseId: string) {
  const root = db.doc(`courses/${courseId}`),
    job = root.collection('jobs').doc('aggregate');
  return db.runTransaction(async (tx) => {
    await tx.get(job);
    const pending = await tx.get(
      root
        .collection('attempts')
        .where('processed', '==', false)
        .orderBy('receivedAt')
        .orderBy('__name__')
        .limit(20),
    );
    const attempts = pending.docs.map(
      (d) => ({ ...d.data(), receivedAt: d.data().receivedAt.toMillis() }) as Attempt,
    );
    const reports = new Map<string, Report>(),
      states = new Map<string, Record<string, Seen>>();
    for (const a of attempts) {
      const rk = `${a.classId}_${a.unitId}_${a.version}`,
        sk = `${a.classId}_${a.uid}_${a.unitId}_${a.version}`;
      if (!reports.has(rk)) {
        const d = await tx.get(root.collection('reports').doc(rk));
        reports.set(
          rk,
          (d.data() || {
            id: rk,
            classId: a.classId,
            unitId: a.unitId,
            version: a.version,
            modes: {},
            updatedAt: 0,
          }) as Report,
        );
      }
      if (!states.has(sk)) {
        const d = await tx.get(root.collection('statStates').doc(sk));
        states.set(sk, d.data()?.questions || {});
      }
    }
    for (const a of attempts) {
      const rk = `${a.classId}_${a.unitId}_${a.version}`,
        sk = `${a.classId}_${a.uid}_${a.unitId}_${a.version}`;
      const report = reports.get(rk)!;
      aggregate(report.modes, states.get(sk)!, a);
      report.updatedAt = a.receivedAt!;
    }
    for (const [key, value] of reports) tx.set(root.collection('reports').doc(key), value);
    for (const [key, questions] of states) {
      const a = attempts.find((a) => `${a.classId}_${a.uid}_${a.unitId}_${a.version}` === key)!;
      tx.set(root.collection('statStates').doc(key), {
        questions,
        uid: a.uid,
        classId: a.classId,
        unitId: a.unitId,
        version: a.version,
      });
    }
    pending.docs.forEach((d) => tx.update(d.ref, { processed: true }));
    const result = {
      processed: attempts.length,
      hasMore: attempts.length === 20,
      updatedAt: Date.now(),
    };
    tx.set(job, result, { merge: true });
    return result;
  });
}
export const updateReports = onCall(options, async (req) => {
  await access(req, req.data.courseId, true);
  return aggregateBatch(req.data.courseId);
});
export const getReports = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  if (!c.classIds.includes(req.data.classId)) fail('班級不存在');
  let q = db
    .collection(`courses/${req.data.courseId}/reports`)
    .where('classId', '==', req.data.classId)
    .orderBy('__name__');
  if (req.data.after) q = q.startAfter(req.data.after);
  const snap = await q.limit(50).get();
  const job = await db.doc(`courses/${req.data.courseId}/jobs/aggregate`).get();
  return {
    rows: snap.docs.map((d) => d.data()),
    next: snap.size === 50 ? snap.docs.at(-1)!.id : null,
    job: job.data() || null,
  };
});
export const setSchedule = onCall(options, async (req) => {
  await access(req, req.data.courseId, true);
  await db.doc(`courses/${req.data.courseId}`).update({ dailyReports: req.data.enabled === true });
  return { ok: true };
});
export const dailyReports = onSchedule(
  { ...options, schedule: '0 3 * * *', timeZone: 'Asia/Taipei' },
  async () => {
    const courses = await db
      .collection('courses')
      .where('dailyReports', '==', true)
      .limit(100)
      .get();
    for (const c of courses.docs) {
      for (let i = 0; i < 10; i++) {
        const r = await aggregateBatch(c.id);
        if (!r.hasMore) break;
      }
    }
  },
);
export const getCompletion = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  if (!c.published) fail('請先發布課程再查看完成度');
  if (!c.published.classIds.includes(req.data.classId)) fail('班級不存在');
  const roster = await rosterQuery(req.data.courseId, c)
    .where('classId', '==', req.data.classId)
    .orderBy('studentId')
    .startAfter(req.data.after || '')
    .limit(50)
    .get();
  const emails = roster.docs.map((d) => d.data().email);
  const profiles = [];
  for (let i = 0; i < emails.length; i += 30) {
    const s = await db
      .collection('profiles')
      .where('email', 'in', emails.slice(i, i + 30))
      .get();
    profiles.push(...s.docs);
  }
  const byEmail = new Map(profiles.map((d) => [d.data().email, d.id]));
  const rows = await Promise.all(
    roster.docs.map(async (d) => {
      const uid = byEmail.get(d.data().email);
      return {
        ...d.data(),
        uid: uid || null,
        progress: uid
          ? (await db.doc(`courses/${req.data.courseId}/progress/${uid}`).get()).data() ||
            emptyProgress()
          : emptyProgress(),
      };
    }),
  );
  return { course: c.published, rows, next: roster.size === 50 ? roster.docs.at(-1)!.data().studentId : null };
});
export const createSnapshot = onCall(options, async (req) => {
  const { c, p } = await access(req, req.data.courseId, true);
  if (!c.classIds.includes(req.data.classId)) fail('班級不存在');
  if (!c.published) fail('請先發布課程再結算');
  const sid = id(req.data.snapshotId);
  const ref = db.doc(`courses/${req.data.courseId}/snapshots/${sid}`);
  if (!(await ref.get()).exists)
    await ref.create({
      classId: req.data.classId,
      createdBy: p.uid,
      createdAt: Date.now(),
      course: forClass(c.published || c.draft, req.data.classId),
      completionFormulaVersion: CURRENT_COMPLETION_FORMULA_VERSION,
      status: 'preparing',
    });
  const meta = (await ref.get()).data()!;
  if (meta.classId !== req.data.classId || meta.status === 'complete') return { done: true };
  const roster = await rosterQuery(req.data.courseId, c)
    .where('classId', '==', meta.classId)
    .orderBy('studentId')
    .startAfter(meta.cursor || '')
    .limit(30)
    .get();
  const rows: any[] = [];
  for (const r of roster.docs) {
    const users = await db.collection('profiles').where('email', '==', r.data().email).limit(1).get();
    const uid = users.docs[0]?.id;
    rows.push({
      ...r.data(),
      uid: uid || null,
      progress: uid
        ? (await db.doc(`courses/${req.data.courseId}/progress/${uid}`).get()).data() ||
          emptyProgress()
        : emptyProgress(),
    });
  }
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (current.data()?.cursor !== meta.cursor) fail('快照正在更新，請重試');
    rows.forEach((r) => tx.set(ref.collection('rows').doc(r.studentId), r));
    tx.update(ref, {
      cursor: roster.docs.at(-1)?.data().studentId || meta.cursor || '',
      status: roster.size < 30 ? 'complete' : 'preparing',
      finishedAt: Date.now(),
    });
  });
  return { done: roster.size < 30, snapshotId: sid };
});
export const getSnapshots = onCall(options, async (req) => {
  await access(req, req.data.courseId, true);
  if (req.data.snapshotId) {
    const root = db.doc(`courses/${req.data.courseId}/snapshots/${id(req.data.snapshotId)}`);
    const meta = await root.get();
    const rows = await root
      .collection('rows')
      .orderBy('__name__')
      .startAfter(req.data.after || '')
      .limit(50)
      .get();
    return {
      meta: meta.data(),
      rows: rows.docs.map((d) => d.data()),
      next: rows.size === 50 ? rows.docs.at(-1)!.id : null,
    };
  }
  const rows = await db
    .collection(`courses/${req.data.courseId}/snapshots`)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();
  return { rows: rows.docs.map((d) => ({ id: d.id, ...d.data() })) };
});
export const questionStudents = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  if (!c.classIds.includes(req.data.classId)) fail('班級不存在');
  let q = db
    .collection(`courses/${req.data.courseId}/statStates`)
    .where('classId', '==', req.data.classId)
    .where('unitId', '==', code(req.data.unitId))
    .where('version', '==', id(req.data.version))
    .orderBy('__name__');
  if (req.data.after) q = q.startAfter(req.data.after);
  const docs = await q.limit(30).get();
  const rows: any[] = [];
  for (const doc of docs.docs) {
    const d = doc.data(),
      s = d.questions[id(req.data.questionId)];
    if (!s) continue;
    const p = (await db.doc(`profiles/${d.uid}`).get()).data();
    rows.push({
      uid: d.uid,
      name: p?.name || '學生',
      studentId: p?.studentId || '',
      first: s.first,
      review: s.review || null,
    });
  }
  return { rows, next: docs.size === 30 ? docs.docs.at(-1)!.id : null };
});

async function metadataToken(scope: string) {
  const res = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?scopes=' +
      encodeURIComponent(scope),
    { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) fail('無法取得 Google 服務帳戶權杖');
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}
async function sheetsGet(sheetId: string, path: string, token: string): Promise<any> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.error?.message || `HTTP ${res.status}`;
    if (res.status === 403) fail('Google Sheet 讀取遭拒：請確認 Sheets API 已啟用，且已分享給此函式的執行服務帳戶。' + detail);
    if (res.status === 404) fail('找不到 Google Sheet：請確認網址及執行服務帳戶的檢視權限。');
    fail('讀取 Google Sheet 失敗：' + detail);
  }
  return res.json();
}
async function readSheetRows(sheetId: string, token: string, title: string) {
  const range = "'" + title.replace(/'/g, "''") + "'";
  const data = await sheetsGet(sheetId, '/values/' + encodeURIComponent(range), token);
  return (data.values || []) as unknown[][];
}
async function ensureRosterClasses(uid: string, courseId: string, classIds: string[]) {
  if (!classIds.length) return;
  const ref = db.doc(`courses/${courseId}`);
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (!current.exists) fail('課程不存在，請先在課程與教材建立課程：' + courseId);
    if (!current.data()?.teacherIds?.includes(uid)) fail('未獲授權管理此課程');
    const draft = current.data()?.draft as Course;
    const nextClassIds = [...new Set([...(draft.classIds || []), ...classIds])];
    if (nextClassIds.length !== draft.classIds.length) tx.update(ref, { draft: { ...draft, classIds: nextClassIds } });
  });
}
async function syncRosterFromSheet(sheetId: string, token: string, p: any, titles: string[], courseIds: string[]) {
  const rosterTitle = ['班級名冊', '名冊'].find((title) => titles.includes(title));
  if (!rosterTitle) fail('找不到「班級名冊」分頁');
  const fallbackCourseId = courseIds.length === 1 ? courseIds[0] : '';
  // parseRosterSheet 對整份名冊格式／內容不合法時會丟一般 Error（例如缺欄位、信箱或學號重複、
  // 格式不符），這裡原本沒接住，會讓整個 onCall 以未處理例外結束、前端只看到不明的
  // internal/500，看不到真正原因。改用 fail() 轉成 HttpsError，前端才讀得到具體錯誤訊息。
  let students;
  try {
    students = parseRosterSheet(await readSheetRows(sheetId, token, rosterTitle), await testStudents(), fallbackCourseId);
  } catch (e) {
    fail('名冊格式錯誤：' + (e as Error).message);
  }
  const results = [];
  for (const courseId of new Set(students.map((s) => s.courseId!))) {
    try {
      const rows = students.filter((s) => s.courseId === courseId);
      await ensureRosterClasses(p.uid, courseId, [...new Set(rows.map((row) => row.classId))]);
      results.push({ courseId, ...await writeEnrollments(p.uid, courseId, rows) });
    }
    catch (e) { results.push({ courseId, error: (e as Error).message + '；先前批次可能已保存，可修正後重試' }); }
  }
  return { count: students.length, changed: results.some((r) => 'changed' in r && r.changed), results, error: results.some((r) => 'error' in r) ? '部分課程名冊未完成' : '' };
}
// 次單元在課程草稿裡不存在時，直接依 Sheet 資料建立一個新單元（id=次單元、
// title=次單元、group=單元），不再要求老師先手動在後台逐一建立——教師仍需
// 先建立課程本身（title／term／teacherIds 等沒有合理預設值，不會自動生成），
// 但單元本身純粹是內容分組，跟著 Sheet 走比較符合「Sheet 是主要編輯來源」的設計。
// 新單元不會自動加進任何既有班級的 classUnits（跟手動建立單元時的行為一致），
// 老師仍要到班級名冊勾選才會對學生開放。
function newUnitFromSheet(unitId: string, group: string | undefined, bankVersion: string, questionCount = 0): Unit {
  return { id: unitId, title: unitId, description: '', required: true, threshold: 80, opensAt: '', dueAt: '', bankVersion, questionCount, activities: [], visibility: 'hidden', ...(group ? { group } : {}) };
}
// 匯出供測試直接呼叫（不是 onCall，Firebase 部署時不會把它當成雲端函式）。
export async function syncBankTabFromSheet(rows: unknown[][], tabTitle: string, uid: string, expectedCourseId?: string) {
  // 題庫分頁名稱就是課程代碼；正式題庫表內不再重複填課程代碼。
  // 第二個參數保留作沒有「次單元」欄的舊格式 fallback，避免既有 Sheet 失效。
  const groups = parseBankSheet(rows, tabTitle, tabTitle);
  const results: any[] = [];
  // 同步入口以工作表分頁決定課程。若表內仍保留舊的「課程代碼」欄，不可讓它
  // 悄悄將同一分頁的題目發布到另一門課。
  if (expectedCourseId) {
    const unexpected = [...groups.keys()].filter((courseId) => courseId !== expectedCourseId);
    if (unexpected.length)
      return unexpected.map((courseId) => ({ courseId: expectedCourseId, error: `課程分頁「${tabTitle}」內的課程代碼「${courseId}」與分頁對應課程「${expectedCourseId}」不一致` }));
  }
  for (const [courseId, units] of groups) {
    const ref = db.doc(`courses/${courseId}`);
    for (const [unitId, { group, questions }] of units) {
      try {
        const course = await ref.get();
        if (!course.exists) fail('課程不存在，請先在課程與教材建立課程：' + courseId);
        if (!course.data()?.teacherIds?.includes(uid)) fail('未獲授權管理此課程');
        const result = await publishBank(courseId, unitId, questions);
        let created = false;
        await db.runTransaction(async (tx) => {
          const current = await tx.get(ref);
          const draft = current.data()?.draft as Course;
          if (!current.data()?.teacherIds?.includes(uid)) fail('課程權限已變更');
          const existing = draft.units.find((u) => u.id === unitId);
          created = !existing;
          const nextUnit = existing
            ? { ...existing, bankVersion: result.version, questionCount: result.count, ...(group ? { group } : {}) }
            : newUnitFromSheet(unitId, group, result.version, result.count);
          const chapterKey = group || unitId;
          const chapters = draft.chapters || {};
          // Sheet 第一次帶來某個單元時，同步建立最小 Chapter；既有教師設定絕不覆蓋。
          const nextChapters = chapters[chapterKey] ? chapters : {
            ...chapters,
            [chapterKey]: { title: chapterKey, description: '', required: true, threshold: 80, opensAt: '', dueAt: '', activities: [] },
          };
          const chapterOrder = [...(draft.chapterOrder || Object.keys(chapters))];
          if (!chapterOrder.includes(chapterKey)) chapterOrder.push(chapterKey);
          const unitChanged = !existing || existing.bankVersion !== result.version || existing.questionCount !== result.count || (!!group && existing.group !== group);
          const chapterChanged = !chapters[chapterKey] || !draft.chapterOrder?.includes(chapterKey);
          if (!unitChanged && !chapterChanged) return;
          tx.update(ref, {
            draft: {
              ...draft,
              chapters: nextChapters,
              chapterOrder,
              units: existing ? draft.units.map((u) => (u.id === unitId ? nextUnit : u)) : [...draft.units, nextUnit],
            },
          });
        });
        results.push({ courseId, unitId, group, created, ...result });
      } catch (e) { results.push({ courseId, unitId, error: (e as Error).message }); }
    }
  }
  // 不自動刪除資料：只回報 Sheet 已不再對應的題目分類，讓教師在後台確認後清理。
  for (const courseId of groups.keys()) {
    const courseRef = db.doc(`courses/${courseId}`);
    const draft = (await courseRef.get()).data()?.draft as Course | undefined;
    const sheetUnitIds = new Set(groups.get(courseId)?.keys() || []);
    const staleUnits = (draft?.units || []).filter((u) => !sheetUnitIds.has(u.id)).map((u) => u.id);
    if (staleUnits.length) results.forEach((result) => { if (result.courseId === courseId) result.staleUnits = staleUnits; });
    if (draft) await db.runTransaction(async (tx) => {
      const current = await tx.get(courseRef), currentDraft = current.data()?.draft as Course;
      tx.update(courseRef, { draft: { ...currentDraft, staleUnits } });
    });
  }
  return results;
}
export const saveSheetConfig = onCall(options, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const raw = String(req.data?.sheetId || '').trim();
  const sheetId = raw.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] || raw;
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(sheetId)) fail('Google Sheet ID 格式錯誤');
  await db.doc('sync/config').set({ sheetId, updatedBy: p.uid, updatedAt: Date.now() }, { merge: true });
  return { ok: true, sheetId };
});
export const getSyncStatus = onCall(options, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const [config, status] = await Promise.all([db.doc('sync/config').get(), db.doc('sync/status').get()]);
  return { sheetId: config.data()?.sheetId || '', status: status.data() || null };
});
export const syncRoster = onCall({ ...options, timeoutSeconds: 300 }, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const sheetId = (await db.doc('sync/config').get()).data()?.sheetId;
  if (!sheetId) fail('尚未設定 Google Sheet ID');
  const token = await metadataToken('https://www.googleapis.com/auth/spreadsheets.readonly');
  const meta = await sheetsGet(sheetId, '?fields=sheets.properties.title', token);
  const titles: string[] = (meta.sheets || []).map((s: any) => s.properties.title);
  const managedCourses = await db.collection('courses').where('teacherIds', 'array-contains', p.uid).limit(100).get();
  const courseIds = managedCourses.docs.map((course) => course.id).filter((courseId) => titles.includes(courseId));
  const roster = await syncRosterFromSheet(sheetId, token, p, titles, courseIds);
  const lastSyncedAt = Date.now();
  await db.doc('sync/status').set({ lastRosterSyncedAt: lastSyncedAt, lastRosterResult: roster }, { merge: true });
  return { roster, hasErrors: !!roster.error, lastSyncedAt };
});
export const syncSheet = onCall({ ...options, timeoutSeconds: 300 }, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const configSnap = await db.doc('sync/config').get();
  const sheetId = configSnap.data()?.sheetId;
  if (!sheetId) fail('尚未設定 Google Sheet ID');
  const statusRef = db.doc('sync/status');
  const runId = randomUUID();
  await db.runTransaction(async (tx) => {
    const s = await tx.get(statusRef);
    if (s.data()?.syncing && s.data()?.leaseUntil > Date.now())
      fail('已有同步正在執行，請稍後再試');
    tx.set(statusRef, { syncing: true, runId, leaseUntil: Date.now() + 360000 }, { merge: true });
  });
  async function finish(result: Record<string, unknown>) {
    await db.runTransaction(async (tx) => {
      const current = await tx.get(statusRef);
      if (current.data()?.runId === runId)
        tx.set(statusRef, { ...result, syncing: false, leaseUntil: 0 }, { merge: true });
    });
  }
  try {
    const token = await metadataToken('https://www.googleapis.com/auth/spreadsheets.readonly');
    const meta = await sheetsGet(sheetId, '?fields=sheets.properties.title', token);
    const titles: string[] = (meta.sheets || []).map((s: any) => s.properties.title);
    const banks: any[] = [];
    // 只把「名稱剛好等於我可管理課程代碼」的分頁當作題庫；例如 115-1-AP2。
    // 題庫ext、說明頁、雙向細目表等即使欄位相似，也不會被誤同步。
    const managedCourses = await db.collection('courses').where('teacherIds', 'array-contains', p.uid).limit(100).get();
    const matches = new Map<string, string[]>();
    for (const title of titles) {
      // Google Sheets 允許分頁尾端空白而 UI 幾乎看不出來；課程代碼本身不允許空白，
      // 因此只忽略分頁名稱前後空白，不放寬中間字元或相似字元的比對。
      const course = managedCourses.docs.find((item) => item.id === title.trim());
      if (course) matches.set(course.id, [...(matches.get(course.id) || []), title]);
    }
    for (const [courseId, matchingTitles] of matches) {
      if (matchingTitles.length !== 1) {
        banks.push({ courseId, error: `找到多個對應「${courseId}」的題庫分頁：${matchingTitles.map((title) => JSON.stringify(title)).join('、')}；請保留一個` });
        continue;
      }
      const title = matchingTitles[0];
      try {
        const rows = await readSheetRows(sheetId, token, title);
        if (!looksLikeBankSheet(rows)) {
          banks.push({ courseId, sourceTab: title, error: `課程分頁「${title}」缺少題庫必要欄位` });
          continue;
        }
        const r = await syncBankTabFromSheet(rows, title, p.uid, courseId);
        banks.push(...r.map((bank) => ({ ...bank, sourceTab: title, sourceCourseId: courseId })));
      } catch (e) {
        banks.push({ courseId, sourceTab: title, error: (e as Error).message });
      }
    }
    const hasErrors = banks.some((bank) => bank.error);
    const lastSyncedAt = Date.now();
    const result = { banks, hasErrors, lastSyncedAt, availableTabs: titles };
    await finish({ lastSyncedAt, lastResult: result, lastError: '' });
    return result;
  } catch (e) {
    await finish({ lastError: (e as Error).message });
    if (e instanceof HttpsError) throw e;
    fail('同步失敗：' + (e as Error).message);
  }
});

export const saveLearningEvents = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  if (p.teacher) fail('教師預覽不寫入正式診斷');
  const unitId = code(req.data.unitId), activityId = id(req.data.activityId);
  const studentCourse = forClass(c.published, p.classId);
  const unit = studentCourse.units.find((u) => u.id === unitId);
  const requestedChapter = typeof req.data.chapterName === 'string' ? req.data.chapterName : '';
  const chapter = requestedChapter ? chaptersOf(studentCourse)[requestedChapter] : undefined;
  const activity = (chapter?.activities || unit?.activities || []).find((a) => a.id === activityId);
  const opensAt = chapter?.opensAt || unit?.opensAt || '';
  if (!activity || activity.type !== 'html' || activity.tracking !== 'interactive' || parseCourseTime(opensAt) > Date.now()) fail('互動教材未開放');
  const version = id(req.data.materialVersion);
  if (version !== (activity.materialVersion || 'v1')) fail('教材版本已更新，請重新開啟教材');
  const events = req.data.events as LearningEvent[];
  if (!Array.isArray(events) || !events.length || events.length > 30 || new Set(events.map((e) => e.id)).size !== events.length) fail('事件批次無效');
  size(events, 20000);
  const owner = chapter ? `chapter-${encodeURIComponent(requestedChapter)}` : unitId;
  const ref = db.doc(`courses/${req.data.courseId}/diagnostics/${p.uid}_${owner}_${activityId}_${version}`);
  const eventRefs = events.map((e) => ref.collection('events').doc(id(e.id)));
  const progressRef = db.doc(`courses/${req.data.courseId}/progress/${p.uid}`);
  return db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    const stored = await Promise.all(eventRefs.map((r) => tx.get(r)));
    const fresh = events.filter((_, i) => !stored[i].exists);
    const summary = reduceLearning(current.data()?.summary || emptyLearning(), fresh);
    if (fresh.length) {
      tx.set(ref, { uid: p.uid, email: p.email, name: p.name, studentId: p.studentId, classId: p.classId, unitId, ...(chapter ? { chapterName: requestedChapter } : {}), activityId, materialVersion: version, nodeTotal: activity.nodeTotal || 0, questionTotal: activity.questionTotal || 0, formulaVersion: 1, summary, updatedAt: Date.now() });
      events.forEach((e, i) => { if (!stored[i].exists) tx.create(eventRefs[i], { ...e, receivedAt: Date.now() }); });
      if (fresh.some((e) => e.type === 'completed')) tx.set(progressRef, { uid: p.uid, classId: p.classId, activities: { [chapter ? chapterActivityKey(requestedChapter, activityId) : `${unitId}_${activityId}`]: { position: 1, completed: true } } }, { merge: true });
    }
    return { accepted: events.map((e) => e.id), summary };
  });
});
export const getLearningDiagnostics = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  if (!c.classIds.includes(req.data.classId)) fail('班級不屬於課程');
  const snap = await db.collection(`courses/${req.data.courseId}/diagnostics`).where('classId', '==', req.data.classId).orderBy('__name__').startAfter(req.data.after || '').limit(50).get();
  return { rows: snap.docs.map((d) => ({ ...d.data(), id: d.id })), next: snap.size === 50 ? snap.docs.at(-1)!.id : null };
});
