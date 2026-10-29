import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import type { Firestore } from 'firebase-admin/firestore';
import {
  forClass,
  orderedChapters,
  chapterCompletion,
  completion,
  unitCompletion,
  parseCourseTime,
  type Attempt,
  type Progress,
} from '../../shared/model';
import { classCompletionSummary } from '../../shared/completionBoard';
import { emptyTiming, addTiming } from '../../shared/timingStats';
import { isTestClass } from '../../shared/answerIntegrity';
import { taipeiDay, dayStart } from '../../shared/usageStats';
import { statsRoster, progressRows, statsHash } from './statsRoster';
import { writeUsageDay, millis } from './usageStats';
export const completionRef = (db: Firestore, cid: string, cl: string) =>
  db.doc(`courses/${cid}/completionDaily/${encodeURIComponent(cl)}`);
export const completionStamp = (c: any) =>
  statsHash([c.published, c.rosterVersion, c.rosterUpdatedAt || 0]);
export async function readPages(factory: () => any, max: number, pageSize = 500) {
  const docs: any[] = [];
  let after = '';
  while (true) {
    let q = factory().orderBy('__name__');
    if (after) q = q.startAfter(after);
    const s = await q.limit(Math.min(pageSize, max + 1 - docs.length)).get();
    docs.push(...s.docs);
    if (docs.length > max)
      throw new HttpsError('resource-exhausted', '統計來源超過上限，未截斷資料');
    if (s.size < Math.min(pageSize, max + 1 - (docs.length - s.size))) break;
    const next = s.docs.at(-1)?.id;
    if (!next || next === after) throw new HttpsError('internal', '統計分頁游標重複');
    after = next;
  }
  return docs;
}
export async function buildCompletion(
  db: Firestore,
  cid: string,
  c: any,
  cl: string,
  rosterQuery: any,
  refresh = false,
) {
  const roster = await statsRoster(db, rosterQuery, cid, c, cl, refresh),
    students = roster.students,
    ps = await progressRows(db, cid, students),
    course = forClass(c.published, cl),
    now = Date.now();
  const rows = (roster.rows || students).map((s: any) => ({
    ...s,
    email: '',
    enabled: true,
    progress: ps.get(s.uid) || { units: {}, activities: {} },
  }));
  const board = classCompletionSummary(c.published, cl, rows, now),
    chapters = orderedChapters(course).map(({ name }) => ({
      chapterId: name,
      completed: 0,
      opportunities: 0,
    }));
  let completedStudents = 0,
    completedRequiredChapters = 0,
    requiredChapterOpportunities = 0;
  for (const s of rows) {
    const p = s.progress,
      n = completion(course, p);
    completedRequiredChapters += n.done;
    requiredChapterOpportunities += n.total;
    if (n.total > 0 && n.done === n.total) completedStudents++;
    for (const x of chapters) {
      const state = chapterCompletion(course, x.chapterId, p);
      if (state.eligible) {
        x.opportunities++;
        if (state.done) x.completed++;
      }
    }
  }
  const units = course.units.map((u) => {
    let completed = 0,
      overdue = 0,
      pending = 0;
    for (const s of rows) {
      const state = unitCompletion(u, s.progress);
      if (!state.eligible) continue;
      if (state.done) completed++;
      else {
        pending++;
        if (parseCourseTime(u.dueAt) < now && parseCourseTime(u.dueAt) > 0) overdue++;
      }
    }
    return { unitId: u.id, completed, pending, overdue };
  });
  const result = {
    schema: 1,
    classId: cl,
    stamp: completionStamp(c),
    updatedAt: now,
    board,
    units,
    summary: {
      students: roster.rosterCount ?? students.length,
      enabledStudents: roster.enabledCount ?? students.length,
      completedStudents,
      completedRequiredChapters,
      requiredChapterOpportunities,
      chapters,
    },
  };
  const stored = JSON.parse(JSON.stringify(result));
  await completionRef(db, cid, cl).set(stored);
  return { ...stored, reads: roster.reads + students.length };
}
export function createAggregationHandlers(
  db: Firestore,
  access: any,
  rosterQuery: any,
  options: any,
) {
  async function validate(req: any) {
    const cid = String(req.data?.courseId || ''),
      { c } = await access(req, cid, true),
      cl = req.data?.classId;
    if (typeof cl !== 'string' || isTestClass(cl) || !c.published?.classIds?.includes(cl))
      throw new HttpsError('invalid-argument', '請選擇課程內非test班級');
    return { cid, c, cl };
  }
  const getCompletionDaily = onCall(options, async (req) => {
    const { cid, c, cl } = await validate(req),
      old = (await completionRef(db, cid, cl).get()).data();
    if (req.data.refresh === true) return buildCompletion(db, cid, c, cl, rosterQuery, true);
    return {
      cached: !!old && old.stamp === completionStamp(c),
      ...(old && old.stamp === completionStamp(c) ? old : {}),
      stale: !!old && Date.now() - old.updatedAt > 86400000,
    };
  });
  const rebuildStats = onCall({ ...options, timeoutSeconds: 540 }, async (req) => {
    const { cid, c, cl } = await validate(req),
      dryRun = req.data.dryRun !== false,
      roster = await statsRoster(db, rosterQuery, cid, c, cl, true, false),
      students = roster.students.sort((a, b) => a.uid.localeCompare(b.uid));
    const today = dayStart(taipeiDay(Date.now())),
      dates = Array.from({ length: 28 }, (_, i) => taipeiDay(today - (27 - i) * 86400000));
    const tasks = [
        ...students.map((s) => ({ kind: 'timing', id: s.uid })),
        ...dates.map((date) => ({ kind: 'usage', id: date })),
        { kind: 'completion', id: cl },
      ],
      planHash = statsHash([cid, cl, completionStamp(c), students, dates]);
    const plan = {
      planHash,
      documents: students.length + 28 + 2,
      timingDocuments: students.length,
      usageDocuments: 28,
      completionDocuments: 1,
      rosterCacheDocuments: 1,
      tasks: tasks.length,
      readEstimate: {
        rosterPerBatch: roster.reads,
        timingProgress: students.length * 2,
        completionProgress: students.length,
        maxSourceDocuments: students.length * 50000 + 28 * (10000 + 2000 + 20000 + 2000),
        attempts: '全學期逐生分頁，上限每生50000',
        usage: '28日receivedAt範圍＋教材事件＋活動最新進度；每批實際reads回報',
      },
    };
    if (dryRun) return { dryRun: true, ...plan, nextCursor: 0 };
    if (req.data.confirm !== true || req.data.planHash !== planHash)
      throw new HttpsError('failed-precondition', '補算需先dryRun，提供相同planHash及confirm:true');
    const cursor = req.data.cursor ?? 0,
      limit = req.data.limit ?? 3;
    if (
      !Number.isInteger(cursor) ||
      cursor < 0 ||
      cursor >= tasks.length ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 5
    )
      throw new HttpsError('invalid-argument', '補算分批參數無效');
    const done: any[] = [];
    for (const task of tasks.slice(cursor, cursor + limit)) {
      if (task.kind === 'timing') {
        const ref = db.doc(`courses/${cid}/progress/${task.id}`),
          baseline = (await ref.get()).data() || {},
          signature = statsHash(
            Object.fromEntries(
              Object.entries(baseline.units || {}).map(([id, v]: any) => [
                id,
                { attempts: v.attempts, updatedAt: v.updatedAt },
              ]),
            ),
          );
        const docs = await readPages(
          () =>
            db
              .collection(`courses/${cid}/attempts`)
              .where('uid', '==', task.id)
              .where('classId', '==', cl),
          50000,
        );
        const units = forClass(c.published, cl).units.filter((u) => !u.review),
          timings = Object.fromEntries(units.map((u) => [u.id, emptyTiming(true, cl)]));
        for (const d of docs) {
          const a = { ...d.data(), id: d.id } as Attempt;
          const u = units.find((u) => u.id === a.unitId);
          if (u) timings[u.id] = addTiming(timings[u.id], a, u)!;
        }
        await db.runTransaction(async (tx) => {
          const current = await tx.get(ref),
            p = current.data() || {},
            nowSignature = statsHash(
              Object.fromEntries(
                Object.entries(p.units || {}).map(([id, v]: any) => [
                  id,
                  { attempts: v.attempts, updatedAt: v.updatedAt },
                ]),
              ),
            );
          if (nowSignature !== signature)
            throw new HttpsError('aborted', '補算期間新增作答，請重試同一cursor');
          const us = { ...(p.units || {}) };
          for (const [id, timing] of Object.entries(timings))
            us[id] = { ...(us[id] || { best: -1, attempts: 0, updatedAt: 0 }), timing };
          const activityUpdatedAt = Math.max(
            0,
            ...Object.values(p.activities || {})
              .map((v: any) => millis(v.updatedAt))
              .filter(Number.isFinite),
          );
          tx.set(ref, { ...p, uid: task.id, classId: cl, units: us, activityUpdatedAt });
        });
        done.push({ ...task, reads: docs.length + 2 });
      } else if (task.kind === 'usage') {
        const r = await writeUsageDay(
          db,
          cid,
          cl,
          forClass(c.published, cl),
          students,
          task.id,
          true,
        );
        done.push({ ...task, reads: r.reads });
      } else {
        const r = await buildCompletion(db, cid, c, cl, rosterQuery, true);
        done.push({ ...task, reads: r.reads });
      }
    }
    return {
      dryRun: false,
      ...plan,
      done,
      nextCursor: cursor + done.length < tasks.length ? cursor + done.length : null,
    };
  });
  const dailyStats = onSchedule(
    { ...options, timeoutSeconds: 540, schedule: '10 3 * * *', timeZone: 'Asia/Taipei' },
    async () => {
      const deadline = Date.now() + 480000,
        courses = await readPages(() => db.collection('courses'), 500);
      const results: any[] = [];
      for (const doc of courses) {
        const c = doc.data();
        if (c.archived || !c.published) continue;
        for (const cl of c.published.classIds || []) {
          if (isTestClass(cl)) continue;
          const job = db.doc(`courses/${doc.id}/jobs/stats_${encodeURIComponent(cl)}`);
          if (Date.now() >= deadline) {
            await job.set({
              updatedAt: Date.now(),
              pending: true,
              error: '執行時間不足，等待下輪／教師立即更新',
            });
            continue;
          }
          try {
            const roster = await statsRoster(db, rosterQuery, doc.id, c, cl, true),
              date = taipeiDay(dayStart(taipeiDay(Date.now())) - 86400000);
            await writeUsageDay(db, doc.id, cl, forClass(c.published, cl), roster.students, date);
            await buildCompletion(db, doc.id, c, cl, rosterQuery);
            await job.set({ updatedAt: Date.now(), date, pending: false, error: '' });
            results.push({ courseId: doc.id, classId: cl, ok: true });
          } catch (e) {
            await job.set({ updatedAt: Date.now(), pending: true, error: String(e) });
            results.push({ courseId: doc.id, classId: cl, ok: false });
          }
        }
      }
      console.log('dailyStats', JSON.stringify(results));
    },
  );
  return { getCompletionDaily, rebuildStats, dailyStats };
}
