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
  const doc = await db.doc(`roster/${t.email}`).get();
  if (!doc.exists || !doc.data()?.enabled)
    throw new HttpsError('permission-denied', '尚未列入名冊或帳號已停用，請聯絡教師');
  return { ...doc.data(), uid: req.auth.uid, email: t.email, teacher: false } as any;
}
async function access(req: any, courseId: string, teacherOnly = false) {
  const p = await identity(req);
  const doc = await db.doc(`courses/${id(courseId)}`).get();
  if (!doc.exists) fail('課程不存在');
  const c = doc.data()!;
  if (p.teacher) {
    if (!c.teacherIds?.includes(p.uid))
      throw new HttpsError('permission-denied', '未獲授權管理此課程');
  } else if (teacherOnly || !c.classIds?.includes(p.classId))
    throw new HttpsError('permission-denied', '不屬於此課程');
  return { p, c };
}
async function ownsClass(uid: string, classId: string) {
  const c = await db.doc(`classes/${id(classId)}`).get();
  if (c.exists && !c.data()?.teacherIds?.includes(uid))
    throw new HttpsError('permission-denied', '班級由其他教師管理');
  return c;
}
export const bootstrap = onCall(options, async (req) => {
  const p = await identity(req);
  await db.doc(`profiles/${p.uid}`).set(p);
  const snap = await db
    .collection('courses')
    .where(p.teacher ? 'teacherIds' : 'classIds', 'array-contains', p.teacher ? p.uid : p.classId)
    .limit(100)
    .get();
  return {
    profile: p,
    courses: snap.docs
      .filter((d) => p.teacher || d.data().published)
      .map((d) => ({
        ...(p.teacher ? d.data().draft : forClass(d.data().published, p.classId)),
        id: d.id,
      })),
    version: VERSION,
  };
});
export const saveCourse = onCall(options, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const course = req.data.course as Course;
  id(course.id);
  size(course);
  if (!course.title?.trim() || !course.term || !course.classIds?.length || course.units.length > 50)
    fail('請填寫課程、學期及班級（最多 50 單元）');
  for (const cl of course.classIds) await ownsClass(p.uid, cl);
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
        classIds: course.classIds,
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
  for (const u of course.units) {
    if (u.required && !u.bankVersion) fail(`${u.title} 尚未指定題庫`);
    if (u.bankVersion) {
      const b = await db.doc(`banks/${course.id}_${u.id}_${id(u.bankVersion)}`).get();
      if (!b.exists) fail('題庫版本不存在');
    }
    for (const a of u.activities)
      if (a.type === 'html' && !validMaterialUrl(a.url)) fail(`${a.title} 尚未提供有效教材網址`);
  }
  const published = { ...course, publishedAt: Date.now() };
  await db.doc(`courses/${course.id}`).update({ published });
  return published;
});
export const importRoster = onCall(options, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const rows = req.data.rows as Roster[];
  if (!Array.isArray(rows) || !rows.length || rows.length > 200) fail('每次匯入 1–200 人');
  const errors = validateRoster(rows);
  if (errors.length) fail(errors.join('\n'));
  const classIds = [...new Set(rows.map((r) => r.classId))];
  if (classIds.length > 50) fail('每次最多 50 個班級');
  await db.runTransaction(async (tx) => {
    const classes = new Map();
    const originals = new Map();
    for (const cl of classIds) classes.set(cl, await tx.get(db.doc(`classes/${cl}`)));
    for (const r of rows) {
      const old = await tx.get(db.doc(`roster/${r.email}`));
      originals.set(r.email, old);
      if (old.exists && !classes.has(old.data()!.classId))
        classes.set(old.data()!.classId, await tx.get(db.doc(`classes/${old.data()!.classId}`)));
      const key = await tx.get(db.doc(`studentIds/${r.studentId}`));
      if (key.exists && key.data()!.email !== r.email) fail('學號已屬於另一個信箱：' + r.studentId);
    }
    for (const c of classes.values()) {
      if (c.exists && !c.data().teacherIds?.includes(p.uid))
        throw new HttpsError('permission-denied', '無權修改此班級名冊');
    }
    for (const cl of classIds)
      tx.set(
        db.doc(`classes/${cl}`),
        { teacherIds: FieldValue.arrayUnion(p.uid) },
        { merge: true },
      );
    for (const r of rows) {
      tx.set(db.doc(`roster/${r.email}`), r);
      tx.set(db.doc(`studentIds/${r.studentId}`), { email: r.email });
    }
  });
  return { count: rows.length };
});
export const getRoster = onCall(options, async (req) => {
  const { c } = await access(req, req.data.courseId, true);
  const classId = id(req.data.classId);
  if (!c.classIds.includes(classId)) fail('班級不屬於課程');
  const snap = await db
    .collection('roster')
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
  await access(req, req.data.courseId, true);
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
  const source = p.teacher && req.data.draft ? c.draft : c.published;
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
  if (!c.classIds.includes(req.data.classId)) fail('班級不存在');
  const roster = await db
    .collection('roster')
    .where('classId', '==', req.data.classId)
    .orderBy('studentId')
    .startAfter(req.data.after || '')
    .limit(50)
    .get();
  const emails = roster.docs.map((d) => d.id);
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
      const uid = byEmail.get(d.id);
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
  return { rows, next: roster.size === 50 ? roster.docs.at(-1)!.data().studentId : null };
});
export const createSnapshot = onCall(options, async (req) => {
  const { c, p } = await access(req, req.data.courseId, true);
  if (!c.classIds.includes(req.data.classId)) fail('班級不存在');
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
  const roster = await db
    .collection('roster')
    .where('classId', '==', meta.classId)
    .orderBy('studentId')
    .startAfter(meta.cursor || '')
    .limit(30)
    .get();
  const rows: any[] = [];
  for (const r of roster.docs) {
    const users = await db.collection('profiles').where('email', '==', r.id).limit(1).get();
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
    { headers: { 'Metadata-Flavor': 'Google' } },
  );
  if (!res.ok) fail('無法取得 Google 服務帳戶權杖');
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}
async function sheetsGet(sheetId: string, path: string, token: string): Promise<any> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) fail('讀取 Google Sheet 失敗：' + (await res.text()));
  return res.json();
}
function sheetCol(headers: string[], names: string[]) {
  for (const n of names) {
    const i = headers.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}
async function syncRosterFromSheet(sheetId: string, token: string, p: any) {
  const data = await sheetsGet(sheetId, '/values/' + encodeURIComponent('名冊'), token);
  const rows: string[][] = data.values || [];
  if (rows.length < 2) return { count: 0, changed: false };
  const headers = rows[0].map((h) => String(h || '').trim());
  const cClass = sheetCol(headers, ['班級', 'classId']);
  const cStudentId = sheetCol(headers, ['學號', 'studentId']);
  const cName = sheetCol(headers, ['姓名', 'name']);
  const cEmail = sheetCol(headers, ['Gmail', 'gmail', 'Email', 'email', '信箱']);
  if (cClass < 0 || cStudentId < 0 || cName < 0 || cEmail < 0)
    fail('名冊分頁缺少班級、學號、姓名或 Gmail 欄位');
  const students: Roster[] = rows
    .slice(1)
    .map((r) => ({
      classId: String(r[cClass] || '').trim(),
      studentId: String(r[cStudentId] || '').trim(),
      name: String(r[cName] || '').trim(),
      email: String(r[cEmail] || '')
        .trim()
        .toLowerCase(),
      enabled: true,
    }))
    .filter((s) => s.email || s.studentId);
  if (students.length > 3000) fail('名冊筆數過多，請分批處理');
  const errors = validateRoster(students);
  if (errors.length) fail('名冊格式錯誤：' + errors.slice(0, 5).join('；'));
  const hash = createHash('sha256').update(JSON.stringify(students)).digest('hex');
  const statusRef = db.doc('sync/status');
  const status = await statusRef.get();
  if (status.data()?.rosterHash === hash) return { count: students.length, changed: false };
  const classIds = [...new Set(students.map((s) => s.classId))];
  const classSnaps = await Promise.all(classIds.map((cl) => db.doc(`classes/${cl}`).get()));
  classSnaps.forEach((snap, i) => {
    if (snap.exists && !snap.data()?.teacherIds?.includes(p.uid))
      fail('班級由其他教師管理：' + classIds[i]);
  });
  for (let i = 0; i < classIds.length; i += 400) {
    const batch = db.batch();
    for (const cl of classIds.slice(i, i + 400))
      batch.set(db.doc(`classes/${cl}`), { teacherIds: FieldValue.arrayUnion(p.uid) }, { merge: true });
    await batch.commit();
  }
  for (let i = 0; i < students.length; i += 400) {
    const batch = db.batch();
    for (const s of students.slice(i, i + 400)) {
      batch.set(db.doc(`roster/${s.email}`), s);
      batch.set(db.doc(`studentIds/${s.studentId}`), { email: s.email });
    }
    await batch.commit();
  }
  await statusRef.set(
    { rosterHash: hash, rosterCount: students.length, rosterSyncedAt: Date.now() },
    { merge: true },
  );
  return { count: students.length, changed: true };
}
function parseSheetQuestionRow(headers: string[], row: string[]): Question {
  const get = (name: string) => {
    const i = headers.indexOf(name);
    return i >= 0 ? String(row[i] || '').trim() : '';
  };
  const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    .filter((k) => get(k))
    .map((k) => ({ id: k, text: get(k) }));
  return {
    id: get('id'),
    text: get('text'),
    options,
    answer: get('answer').toLowerCase(),
    explanation: get('explanation'),
    concept: get('concept'),
    image: get('image'),
    socratic: {
      concept: get('socraticConcept'),
      misconception: get('socraticMisconception'),
      hint1: get('socraticHint1'),
      hint2: get('socraticHint2'),
      hint3: get('socraticHint3'),
    },
    remedialUrl: get('remedialUrl'),
  };
}
async function syncBankTabFromSheet(sheetId: string, token: string, unitId: string) {
  const data = await sheetsGet(sheetId, '/values/' + encodeURIComponent(unitId), token);
  const rows: string[][] = data.values || [];
  if (rows.length < 2) return null;
  const headers = rows[0].map((h) => String(h || '').trim());
  const cCourse = sheetCol(headers, ['課程', 'course', 'courseId']);
  const cId = sheetCol(headers, ['id']);
  if (cCourse < 0 || cId < 0) return null;
  const groups = new Map<string, string[][]>();
  for (const r of rows.slice(1)) {
    const courseId = String(r[cCourse] || '').trim();
    if (!courseId || !String(r[cId] || '').trim()) continue;
    if (!groups.has(courseId)) groups.set(courseId, []);
    groups.get(courseId)!.push(r);
  }
  const results: any[] = [];
  for (const [courseId, qrows] of groups) {
    try {
      if (!safeId(courseId)) throw new Error('課程代碼格式錯誤');
      const courseSnap = await db.doc(`courses/${courseId}`).get();
      if (!courseSnap.exists) throw new Error('課程不存在：' + courseId);
      const questions = qrows.map((r) => parseSheetQuestionRow(headers, r));
      const errs = validateQuestions(questions);
      if (errs.length) throw new Error(errs.join('；'));
      const r = await publishBank(courseId, unitId, questions);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(db.doc(`courses/${courseId}`));
        if (!snap.exists) return;
        const draft = snap.data()!.draft as Course;
        const unit = draft?.units?.find((u) => u.id === unitId);
        if (!unit || unit.bankVersion === r.version) return;
        tx.update(snap.ref, {
          draft: {
            ...draft,
            units: draft.units.map((u) => (u.id === unitId ? { ...u, bankVersion: r.version } : u)),
          },
        });
      });
      results.push({ courseId, unitId, version: r.version, count: r.count });
    } catch (e) {
      results.push({ courseId, unitId, error: (e as Error).message });
    }
  }
  return results;
}
export const saveSheetConfig = onCall(options, async (req) => {
  const p = await identity(req);
  if (!p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
  const sheetId = String(req.data?.sheetId || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(sheetId)) fail('Google Sheet ID 格式錯誤');
  await db.doc('sync/config').set({ sheetId, updatedBy: p.uid, updatedAt: Date.now() }, { merge: true });
  return { ok: true };
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
  await db.runTransaction(async (tx) => {
    const s = await tx.get(statusRef);
    if (s.data()?.syncing) fail('已有同步正在執行，請稍後再試');
    tx.set(statusRef, { syncing: true }, { merge: true });
  });
  try {
    const token = await metadataToken('https://www.googleapis.com/auth/spreadsheets.readonly');
    const meta = await sheetsGet(sheetId, '?fields=sheets.properties.title', token);
    const titles: string[] = (meta.sheets || []).map((s: any) => s.properties.title);
    const roster = titles.includes('名冊') ? await syncRosterFromSheet(sheetId, token, p) : null;
    const banks: any[] = [];
    for (const title of titles) {
      if (title === '名冊') continue;
      const r = await syncBankTabFromSheet(sheetId, token, title);
      if (r) banks.push(...r);
    }
    await statusRef.set({ syncing: false, lastSyncedAt: Date.now() }, { merge: true });
    return { roster, banks };
  } catch (e) {
    await statusRef.set({ syncing: false }, { merge: true });
    throw e;
  }
});
