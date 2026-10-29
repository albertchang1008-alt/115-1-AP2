import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { forClass, type Course } from '../../shared/model';
import { isTestClass, type IntegrityStudent } from '../../shared/answerIntegrity';
import {
  taipeiDay,
  dayStart,
  buildUsageDaily,
  combineUsageDaily,
  type UsageRecord,
  type UsageDaily,
} from '../../shared/usageStats';
import { statsRoster } from './statsRoster';
export const USAGE_LIMITS = {
  roster: 2000,
  attempts: 10000,
  diagnostics: 2000,
  events: 20000,
  progress: 2000,
};
export const millis = (v: any): number =>
  typeof v === 'number' ? v : typeof v?.toMillis === 'function' ? v.toMillis() : NaN;
export async function readUsageRange(
  db: Firestore,
  cid: string,
  cl: string,
  course: Course,
  students: IntegrityStudent[],
  start: number,
  end: number,
  legacyProgress = false,
) {
  const reads: Record<string, number> = { attempts: 0, diagnostics: 0, events: 0, progress: 0 },
    records: UsageRecord[] = [],
    ids = new Set(students.map((s) => s.uid)),
    units = new Set(course.units.filter((u) => !u.review).map((u) => u.id));
  async function bounded(q: any, key: string, max: number) {
    const s = await q.limit(max + 1).get();
    reads[key] += s.size;
    if (s.size > max)
      throw new HttpsError('resource-exhausted', '使用紀錄超過單次統計上限，未回傳截斷結果');
    return s.docs;
  }
  // receivedAt is a Timestamp for attempts, milliseconds for learning events.
  const attempts = await bounded(
    db
      .collection(`courses/${cid}/attempts`)
      .where('classId', '==', cl)
      .where('receivedAt', '>=', Timestamp.fromMillis(start))
      .where('receivedAt', '<', Timestamp.fromMillis(end)),
    'attempts',
    USAGE_LIMITS.attempts,
  );
  for (const d of attempts) {
    const a = d.data();
    if (ids.has(a.uid) && units.has(a.unitId))
      records.push({ uid: a.uid, unitId: a.unitId, kind: 'attempt', at: millis(a.receivedAt) });
  }
  const summaries = await bounded(
    db
      .collection(`courses/${cid}/diagnostics`)
      .where('classId', '==', cl)
      .where('updatedAt', '>=', start),
    'diagnostics',
    USAGE_LIMITS.diagnostics,
  );
  for (const d of summaries) {
    const a = d.data();
    if (
      !ids.has(a.uid) ||
      (!units.has(a.unitId) && !a.chapterName) ||
      course.units.find((u) => u.id === a.unitId)?.review
    )
      continue;
    const es = await bounded(
      db
        .collection(`courses/${cid}/diagnostics/${d.id}/events`)
        .where('receivedAt', '>=', start)
        .where('receivedAt', '<', end),
      'events',
      USAGE_LIMITS.events - reads.events,
    );
    for (const e of es)
      records.push({
        uid: a.uid,
        unitId: a.unitId,
        kind: 'learning',
        at: millis(e.data().receivedAt),
      });
  }
  let progress = db.collection(`courses/${cid}/progress`).where('classId', '==', cl);
  if (!legacyProgress) progress = progress.where('activityUpdatedAt', '>=', start);
  const ps = await bounded(progress, 'progress', USAGE_LIMITS.progress);
  for (const d of ps) {
    const a = d.data(),
      uid = a.uid || d.id;
    if (!ids.has(uid)) continue;
    for (const [key, v] of Object.entries(a.activities || {}) as [string, any][]) {
      if (course.units.find((u) => key.startsWith(u.id + '_'))?.review) continue;
      const at = millis(v.updatedAt);
      if (at >= start && at < end) records.push({ uid, kind: 'progress', at });
    }
  }
  return { records, reads };
}
export const usageRef = (db: Firestore, cid: string, cl: string, date: string) =>
  db.doc(`courses/${cid}/usageDaily/${encodeURIComponent(cl)}_${date.replaceAll('-', '')}`);
export async function writeUsageDay(
  db: Firestore,
  cid: string,
  cl: string,
  course: Course,
  students: IntegrityStudent[],
  date: string,
  legacyProgress = false,
) {
  const start = dayStart(date),
    { records, reads } = await readUsageRange(
      db,
      cid,
      cl,
      course,
      students,
      start,
      start + 86400000,
      legacyProgress,
    ),
    summary = buildUsageDaily(records, students, course.units, cl, date);
  await usageRef(db, cid, cl, date).set(summary);
  return { summary, reads };
}
export function createUsageHandler(
  db: Firestore,
  access: (r: any, id: string, t?: boolean) => Promise<any>,
  rosterQuery: (id: string, c: any) => any,
  options: any,
) {
  return onCall(options, async (req) => {
    const cid = String(req.data?.courseId || ''),
      { c } = await access(req, cid, true),
      cl = req.data?.classId;
    if (typeof cl !== 'string' || isTestClass(cl) || !c.published?.classIds?.includes(cl))
      throw new HttpsError('invalid-argument', '請選擇課程內非 test 班級');
    const roster = await statsRoster(db, rosterQuery, cid, c, cl),
      course = forClass(c.published, cl),
      now = Date.now(),
      today = taipeiDay(now),
      start = dayStart(today),
      days: UsageDaily[] = [],
      missing: string[] = [];
    for (let i = 27; i >= 1; i--) {
      const date = taipeiDay(start - i * 86400000),
        s = await usageRef(db, cid, cl, date).get();
      if (s.data()?.schema === 1) days.push(s.data() as UsageDaily);
      else missing.push(date);
    }
    const live = await readUsageRange(
      db,
      cid,
      cl,
      course,
      roster.students,
      Math.min(start, now - 600000),
      now + 1,
    );
    days.push(buildUsageDaily(live.records, roster.students, course.units, cl, today, now));
    return {
      ...combineUsageDaily(days, live.records, roster.students, course.units, now),
      missingDays: missing,
      reads: { ...live.reads, roster: roster.reads, summaries: 27 },
      source: 'usageDaily+live',
    };
  });
}
