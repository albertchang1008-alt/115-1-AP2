import { parseRosterSheet, parseBankSheet } from '../../shared/sheets';
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
  validateRoster,
  safeId,
  applyAttempt,
  aggregate,
  youtubeId,
  forClass,
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
function size(data: unknown, max = 300000) {
  if (Buffer.byteLength(JSON.stringify(data)) > max) fail('資料過大，請拆分後再提交');
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
  if (
    t.email_verified !== true ||
    t.firebase?.sign_in_provider !== 'google.com' ||
    !String(t.email).endsWith('@ctcn.edu.tw')
  )
    throw new HttpsError('permission-denied', '請使用已驗證的學校 Google 帳號');
  return { uid: req.auth.uid, email: String(t.email).toLowerCase(), teacher: false, name: t.name || '', studentId: '', classId: '', enabled: true } as any;
}
function enrollmentRef(courseId: string, email: string) {
  return db.doc(`enrollments/${id(courseId)}__${email}`);
}
async function access(req: any, courseId: string, teacherOnly = false) {
  const p = await identity(req);
  const doc = await db.doc(`courses/${id(courseId)}`).get();
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
    return { profile: p, courses: snap.docs.map((d) => ({ ...d.data().draft, id: d.id, archived: !!d.data().archived, publishedAt: d.data().published?.publishedAt || 0 })), version: VERSION };
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
  id(course.id);
  size(course);
  if (!course.title?.trim() || !course.term || !Array.isArray(course.classIds) || !Array.isArray(course.units) || course.units.length > 50 || course.classIds.length > 50)
    fail('請填寫課程與學期，最多 50 班、50 單元');
  if (new Set(course.classIds).size !== course.classIds.length) fail('班級代碼重複');
  course.classIds.forEach(id);
  for (const [cl, units] of Object.entries(course.classUnits || {}))
    if (!course.classIds.includes(cl) || !Array.isArray(units) || new Set(units).size !== units.length || units.some((u) => !course.units.some((unit) => unit.id === u))) fail('班級適用單元設定無效');
  const unitIds = new Set();
  for (const u of course.units) {
    id(u.id);
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
    for (const a of u.activities)
      if (a.type === 'html' && !validMaterialUrl(a.url)) fail(`${a.title} 尚未提供有效教材網址`);
  }
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
export const deleteCourse = onCall(options, async (req) => {
  await access(req, req.data.courseId, true);
  await db.doc(`courses/${id(req.data.courseId)}`).delete();
  return { ok: true };
});
async function writeEnrollments(uid: string, courseId: string, rows: Roster[], migrating = false) {
  const errors = validateRoster(rows);
  if (errors.length) fail(errors.join('；'));
  let updated = 0;
  for (let i = 0; i < rows.length; i += 100) {
    updated += await db.runTransaction(async (tx) => {
      const course = await tx.get(db.doc(`courses/${id(courseId)}`));
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
  const classId = id(req.data.classId);
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
  const version = createHash('sha256').update(JSON.stringify(questions)).digest('hex').slice(0, 20);
  const key = `${id(courseId)}_${id(unitId)}_${version}`;
  const ref = db.doc(`banks/${key}`);
  if (!(await ref.get()).exists) {
    const batch = db.batch();
    const chunks = [];
    for (let i = 0; i < questions.length; i += 20) {
      const chunk = String(i / 20);
      chunks.push(chunk);
      batch.set(ref.collection('chunks').doc(chunk), { questions: questions.slice(i, i + 20) });
    }
    batch.set(ref, {
      courseId,
      unitId,
      version,
      chunks,
      count: questions.length,
      questionOptions: Object.fromEntries(questions.map((q) => [q.id, q.options.map((o) => o.id)])),
      createdAt: Date.now(),
    });
    await batch.commit();
  }
  return { version, count: questions.length };
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
    const allowed = await db.doc(`syncAllowlist/${id(req.body.courseId)}`).get();
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
    `banks/${id(req.data.courseId)}_${id(req.data.unitId)}_${id(req.data.version)}`,
  );
  const manifest = await ref.get();
  if (!manifest.exists) fail('題庫未發布');
  const docs = await Promise.all(
    manifest.data()!.chunks.map((ch: string) => ref.collection('chunks').doc(ch).get()),
  );
  return { questions: docs.flatMap((d) => d.data()?.questions || []) };
});
export const getProgress = onCall(options, async (req) => {
  const { p } = await access(req, req.data.courseId);
  const uid = req.data.uid || p.uid;
  if (uid !== p.uid && !p.teacher) throw new HttpsError('permission-denied', '無法讀取他人進度');
  return (
    (await db.doc(`courses/${req.data.courseId}/progress/${id(uid)}`).get()).data() ||
    emptyProgress()
  );
});
export const submitAttempt = onCall(options, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', '請先登入');
  const a = req.data?.attempt as Attempt;
  if (!a || typeof a !== 'object' || Array.isArray(a)) fail('作答格式錯誤');
  id(a.id);
  id(a.unitId);
  id(a.version);
  size(a, 80000);
  const { p, c } = await access(req, a.courseId);
  if (p.teacher) fail('教師請使用不寫入紀錄的前台預覽');
  const unit =
    c.published && forClass(c.published, p.classId).units.find((u: any) => u.id === a.unitId);
  if (!unit || Date.parse(unit.opensAt) > Date.now()) fail('單元尚未開放');
  const bank = await db.doc(`banks/${a.courseId}_${a.unitId}_${a.version}`).get();
  if (!bank.exists) fail('題庫版本不存在');
  if (
    !['quiz', 'flashcard', 'review'].includes(a.mode) ||
    !Array.isArray(a.answers) ||
    !a.answers.length ||
    a.answers.length > 100 ||
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
  a.full = a.full === true && a.mode !== 'review' && a.answers.length === bank.data()!.count;
  a.score = Math.round((a.answers.filter((x) => x.correct).length / a.answers.length) * 100);
  const ref = db.doc(`courses/${a.courseId}/attempts/${a.id}`),
    pr = db.doc(`courses/${a.courseId}/progress/${p.uid}`);
  return db.runTransaction(async (tx) => {
    const [old, progress] = await Promise.all([tx.get(ref), tx.get(pr)]);
    if (old.exists) {
      if (old.data()?.uid !== p.uid) throw new HttpsError('permission-denied', '作答 ID 衝突');
      return { progress: progress.data() || emptyProgress(), duplicate: true };
    }
    const saved = {
      ...a,
      uid: p.uid,
      classId: p.classId,
      receivedAt: FieldValue.serverTimestamp(),
      processed: false,
    };
    const next = applyAttempt((progress.data() || emptyProgress()) as Progress, {
      ...a,
      receivedAt: Date.now(),
    });
    tx.create(ref, saved);
    if (a.mode !== 'review') tx.set(pr, { ...next, uid: p.uid, classId: p.classId });
    return { progress: next, duplicate: false };
  });
});
export const saveActivity = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  if (p.teacher) fail('預覽不能寫入正式進度');
  const { unitId, activityId, position, completed } = req.data;
  const u = c.published && forClass(c.published, p.classId).units.find((x: any) => x.id === unitId);
  if (
    !u ||
    !u.activities.some((x: any) => x.id === activityId) ||
    Date.parse(u.opensAt) > Date.now() ||
    !Number.isFinite(position) ||
    position < 0 ||
    typeof completed !== 'boolean'
  )
    fail('活動資料無效');
  const activity = u.activities.find((a: any) => a.id === activityId);
  if (activity?.tracking === 'interactive') fail('互動教材需由事件回報通關');
  const ref = db.doc(`courses/${req.data.courseId}/progress/${p.uid}`);
  await ref.set(
    {
      uid: p.uid,
      classId: p.classId,
      activities: {
        [`${id(unitId)}_${id(activityId)}`]: { position, completed, updatedAt: Date.now() },
      },
    },
    { merge: true },
  );
  return { ok: true };
});
export const getHistory = onCall(options, async (req) => {
  const { p, c } = await access(req, req.data.courseId);
  let q = db
    .collection(`courses/${req.data.courseId}/attempts`)
    .where('classId', '==', p.teacher ? id(req.data.classId) : p.classId);
  if (p.teacher && !c.classIds.includes(req.data.classId)) fail('班級不屬於課程');
  if (!p.teacher || req.data.uid) q = q.where('uid', '==', p.teacher ? id(req.data.uid) : p.uid);
  q = q.orderBy('receivedAt', 'desc').orderBy('__name__', 'desc');
  if (req.data.after)
    q = q.startAfter(
      new Timestamp(req.data.after.seconds, req.data.after.nanoseconds),
      req.data.after.id,
    );
  const snap = await q.limit(20).get();
  return {
    rows: snap.docs.map((d) => ({ ...d.data(), receivedAt: d.data().receivedAt.toMillis() })),
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
    .where('unitId', '==', id(req.data.unitId))
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
async function syncRosterFromSheet(sheetId: string, token: string, p: any) {
  const students = parseRosterSheet(await readSheetRows(sheetId, token, '名冊'));
  const results = [];
  for (const courseId of new Set(students.map((s) => s.courseId!))) {
    try { results.push({ courseId, ...await writeEnrollments(p.uid, courseId, students.filter((s) => s.courseId === courseId)) }); }
    catch (e) { results.push({ courseId, error: (e as Error).message + '；先前批次可能已保存，可修正後重試' }); }
  }
  return { count: students.length, changed: results.some((r) => 'changed' in r && r.changed), results, error: results.some((r) => 'error' in r) ? '部分課程名冊未完成' : '' };
}
async function syncBankTabFromSheet(sheetId: string, token: string, unitId: string, uid: string) {
  const groups = parseBankSheet(await readSheetRows(sheetId, token, unitId), unitId);
  const results = [];
  for (const [courseId, questions] of groups) {
    try {
      const ref = db.doc(`courses/${courseId}`);
      const course = await ref.get();
      if (!course.data()?.teacherIds?.includes(uid)) fail('未獲授權管理此課程');
      if (!course.data()?.draft?.units.some((u: Unit) => u.id === unitId)) fail('請先建立並保存單元：' + unitId);
      const result = await publishBank(courseId, unitId, questions);
      await db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        const draft = current.data()?.draft as Course;
        if (!current.data()?.teacherIds?.includes(uid) || !draft?.units.some((u) => u.id === unitId)) fail('課程權限或單元已變更');
        if (draft.units.find((u) => u.id === unitId)?.bankVersion !== result.version)
          tx.update(ref, { draft: { ...draft, units: draft.units.map((u) => u.id === unitId ? { ...u, bankVersion: result.version } : u) } });
      });
      results.push({ courseId, unitId, ...result });
    } catch (e) { results.push({ courseId, unitId, error: (e as Error).message }); }
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
    let roster: any;
    try {
      roster = titles.includes('名冊')
        ? await syncRosterFromSheet(sheetId, token, p)
        : { error: '找不到「名冊」分頁，未同步名單' };
    } catch (e) {
      roster = { error: (e as Error).message + '；較早批次可能已寫入，修正後可重試' };
    }
    const banks: any[] = [];
    for (const title of titles) {
      if (title === '名冊') continue;
      try {
        const r = await syncBankTabFromSheet(sheetId, token, title, p.uid);
        banks.push(...r);
      } catch (e) {
        banks.push({ unitId: title, error: (e as Error).message });
      }
    }
    const hasErrors = !!roster?.error || banks.some((bank) => bank.error);
    const lastSyncedAt = Date.now();
    const result = { roster, banks, hasErrors, lastSyncedAt };
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
  const unitId = id(req.data.unitId), activityId = id(req.data.activityId);
  const unit = forClass(c.published, p.classId).units.find((u) => u.id === unitId);
  const activity = unit?.activities.find((a) => a.id === activityId);
  if (!activity || activity.type !== 'html' || activity.tracking !== 'interactive' || Date.parse(unit!.opensAt) > Date.now()) fail('互動教材未開放');
  const version = id(req.data.materialVersion);
  if (version !== (activity.materialVersion || 'v1')) fail('教材版本已更新，請重新開啟教材');
  const events = req.data.events as LearningEvent[];
  if (!Array.isArray(events) || !events.length || events.length > 30 || new Set(events.map((e) => e.id)).size !== events.length) fail('事件批次無效');
  size(events, 20000);
  const ref = db.doc(`courses/${req.data.courseId}/diagnostics/${p.uid}_${unitId}_${activityId}_${version}`);
  const eventRefs = events.map((e) => ref.collection('events').doc(id(e.id)));
  const progressRef = db.doc(`courses/${req.data.courseId}/progress/${p.uid}`);
  return db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    const stored = await Promise.all(eventRefs.map((r) => tx.get(r)));
    const fresh = events.filter((_, i) => !stored[i].exists);
    const summary = reduceLearning(current.data()?.summary || emptyLearning(), fresh);
    if (fresh.length) {
      tx.set(ref, { uid: p.uid, email: p.email, name: p.name, studentId: p.studentId, classId: p.classId, unitId, activityId, materialVersion: version, nodeTotal: activity.nodeTotal || 0, questionTotal: activity.questionTotal || 0, formulaVersion: 1, summary, updatedAt: Date.now() });
      events.forEach((e, i) => { if (!stored[i].exists) tx.create(eventRefs[i], { ...e, receivedAt: Date.now() }); });
      if (fresh.some((e) => e.type === 'completed')) tx.set(progressRef, { uid: p.uid, classId: p.classId, activities: { [`${unitId}_${activityId}`]: { position: 1, completed: true } } }, { merge: true });
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
