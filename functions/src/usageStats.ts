import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Firestore } from 'firebase-admin/firestore';
import { forClass } from '../../shared/model';
import { isTestClass } from '../../shared/answerIntegrity';
import { computeUsageStats, type UsageRecord } from '../../shared/usageStats';
// Read-only, explicit bounded reads. Never present a truncated data set as a complete statistic.
export const USAGE_LIMITS = { roster: 2000, attempts: 10000, diagnostics: 1000, events: 20000 };
export function createUsageHandler(
  db: Firestore,
  access: (r: any, id: string, t?: boolean) => Promise<any>,
  rosterQuery: (id: string, c: any) => any,
  options: any,
) {
  return onCall(options, async (req) => {
    const courseId = String(req.data?.courseId || ''),
      { c } = await access(req, courseId, true),
      classId = req.data?.classId;
    if (
      typeof classId !== 'string' ||
      isTestClass(classId) ||
      !c.published?.classIds?.includes(classId)
    )
      throw new HttpsError('invalid-argument', '請選擇課程內非 test 班級');
    const reads: Record<string, number> = {
      roster: 0,
      profiles: 0,
      attempts: 0,
      diagnostics: 0,
      events: 0,
      progress: 0,
    };
    async function bounded(query: any, key: string, max: number) {
      const s = await query.limit(max + 1).get();
      reads[key] += s.docs.length;
      if (s.docs.length > max)
        throw new HttpsError(
          'resource-exhausted',
          '使用紀錄超過單次統計上限；未回傳不完整統計，請聯絡教師',
        );
      return s.docs;
    }
    const roster = await bounded(
      rosterQuery(courseId, c).where('classId', '==', classId),
      'roster',
      USAGE_LIMITS.roster,
    );
    const members = roster
        .map((d: any) => d.data())
        .filter((r: any) => r.enabled !== false && !r.test),
      emails = [...new Set(members.map((r: any) => r.email).filter(Boolean))],
      byEmail = new Map<string, string>();
    for (let i = 0; i < emails.length; i += 30) {
      const ps = await bounded(
        db.collection('profiles').where('email', 'in', emails.slice(i, i + 30)),
        'profiles',
        USAGE_LIMITS.roster - reads.profiles,
      );
      for (const p of ps) byEmail.set(p.data().email, p.id);
    }
    const students = [
      ...new Map(
        members
          .map((r: any) => ({
            uid: byEmail.get(r.email) || r.uid || '',
            name: String(r.name || r.studentId || '未命名'),
            studentId: String(r.studentId || ''),
          }))
          .filter((s: any) => s.uid)
          .map((s: any) => [s.uid, s] as const),
      ).values(),
    ] as { uid: string; name: string; studentId: string }[];
    const ids = new Set(students.map((s) => s.uid)),
      records: UsageRecord[] = [],
      course = forClass(c.published, classId),
      unitIds = new Set(course.units.filter((u) => !u.review).map((u) => u.id));
    function millis(v: any): number {
      return typeof v === 'number' ? v : typeof v?.toMillis === 'function' ? v.toMillis() : NaN;
    }
    const attempts = await bounded(
      db.collection(`courses/${courseId}/attempts`).where('classId', '==', classId),
      'attempts',
      USAGE_LIMITS.attempts,
    );
    for (const d of attempts) {
      const a = d.data();
      if (ids.has(a.uid) && unitIds.has(a.unitId))
        records.push({
          uid: a.uid,
          unitId: a.unitId,
          kind: 'attempt',
          at: millis(a.receivedAt ?? a.clientAt),
        });
    }
    const diagnostics = await bounded(
      db.collection(`courses/${courseId}/diagnostics`).where('classId', '==', classId),
      'diagnostics',
      USAGE_LIMITS.diagnostics,
    );
    for (const d of diagnostics) {
      const a = d.data();
      if (!ids.has(a.uid) || (!unitIds.has(a.unitId) && !a.chapterName)) continue;
      const events = await bounded(
        db.collection(`courses/${courseId}/diagnostics/${d.id}/events`),
        'events',
        USAGE_LIMITS.events - reads.events,
      );
      for (const e of events) {
        const v = e.data();
        records.push({
          uid: a.uid,
          unitId: a.unitId,
          kind: 'learning',
          at: millis(v.receivedAt ?? v.at ?? v.clientAt),
        });
      }
    }
    // Generic activity progress retains only its latest timestamp. It cannot reconstruct prior visits.
    for (let i = 0; i < students.length; i += 50) {
      const ps = await Promise.all(
        students.slice(i, i + 50).map((s) => db.doc(`courses/${courseId}/progress/${s.uid}`).get()),
      );
      reads.progress += ps.length;
      ps.forEach((p, j) => {
        for (const [key, a] of Object.entries(p.data()?.activities || {}) as [string, any][]) {
          const unit = course.units.find((u) => key.startsWith(u.id + '_'));
          if (unit?.review) continue;
          records.push({ uid: students[i + j].uid, kind: 'progress', at: millis(a.updatedAt) });
        }
      });
    }
    return { ...computeUsageStats(records, students, course.units, Date.now()), reads };
  });
}
