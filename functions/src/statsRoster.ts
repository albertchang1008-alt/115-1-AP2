import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import type { IntegrityStudent } from '../../shared/answerIntegrity';
export const statsHash = (v: unknown) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const rosterCacheRef = (db: Firestore, cid: string, cl: string) =>
  db.doc(`courses/${cid}/statsPrivate/roster_${encodeURIComponent(cl)}`);
export async function statsRoster(
  db: Firestore,
  query: (id: string, c: any) => any,
  cid: string,
  c: any,
  cl: string,
  refresh = false,
  writeCache = true,
) {
  const ref = rosterCacheRef(db, cid, cl),
    cache = await ref.get(),
    sync = await db.doc('sync/status').get();
  const stamp = statsHash([
    c.rosterVersion || 1,
    c.rosterUpdatedAt || 0,
    sync.data()?.lastRosterSyncedAt || 0,
  ]);
  const cached = cache.data();
  if (
    !refresh &&
    cached?.stamp === stamp &&
    cached.expiresAt > Date.now() &&
    cached.unresolvedCount === 0
  )
    return {
      students: cached.students as IntegrityStudent[],
      reads: 2,
      cache: true,
      rosterCount: cached.rosterCount,
      enabledCount: cached.enabledCount,
      emailToUid: cached.emailToUid || {},
      rows: cached.rows || cached.students,
    };
  const snap = await query(cid, c).where('classId', '==', cl).limit(2001).get();
  if (snap.size > 2000) throw new HttpsError('resource-exhausted', '名冊超過統計上限');
  const members = snap.docs
      .map((d: any) => d.data())
      .filter((r: any) => r.enabled === true && !r.test),
    emails = [...new Set(members.map((r: any) => r.email).filter(Boolean))],
    byEmail = new Map<string, string>();
  let reads = 2 + snap.size;
  for (let i = 0; i < emails.length; i += 30) {
    const ps = await db
      .collection('profiles')
      .where('email', 'in', emails.slice(i, i + 30))
      .limit(2001)
      .get();
    reads += ps.size;
    if (ps.size > 2000) throw new HttpsError('resource-exhausted', '帳號對應過多');
    for (const p of ps.docs) byEmail.set(p.data().email, p.id);
  }
  const students = [
    ...new Map(
      members
        .map((r: any) => ({
          uid: byEmail.get(r.email) || r.uid || '',
          name: String(r.name || r.studentId || '未命名'),
          studentId: String(r.studentId || ''),
          classId: cl,
        }))
        .filter((s: any) => s.uid)
        .map((s: any) => [s.uid, s] as const),
    ).values(),
  ] as IntegrityStudent[];
  const rows = members.map((r: any) => ({
    uid: byEmail.get(r.email) || r.uid || '',
    name: String(r.name || r.studentId || '未命名'),
    studentId: String(r.studentId || ''),
    classId: cl,
  }));
  const emailToUid = Object.fromEntries(
    members
      .filter((r: any) => r.email)
      .map((r: any) => [r.email, byEmail.get(r.email) || r.uid || '']),
  );
  if (writeCache)
    await ref.set({
      schema: 1,
      stamp,
      students,
      rows,
      emailToUid,
      unresolvedCount: members.filter((r: any) => !(byEmail.get(r.email) || r.uid)).length,
      rosterCount: snap.size,
      enabledCount: members.length,
      expiresAt: Date.now() + 86400000,
      updatedAt: Date.now(),
    });
  return {
    students,
    reads,
    cache: false,
    rosterCount: snap.size,
    enabledCount: members.length,
    emailToUid,
    rows,
  };
}
export async function progressRows(db: Firestore, cid: string, students: IntegrityStudent[]) {
  const out = new Map<string, any>();
  for (let i = 0; i < students.length; i += 50) {
    const g = students.slice(i, i + 50),
      ps = await Promise.all(g.map((s) => db.doc(`courses/${cid}/progress/${s.uid}`).get()));
    ps.forEach((p, j) => out.set(g[j].uid, p.data() || { units: {}, activities: {} }));
  }
  return out;
}
