import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Firestore } from 'firebase-admin/firestore';
import {
  ANSWER_INTEGRITY,
  computeIntegrityUnitStats,
  isTestClass,
  validateLeaveMetrics,
  type IntegrityStudent,
} from '../../shared/answerIntegrity';
import { forClass, type Attempt, type Course } from '../../shared/model';
export function createIntegrityHandlers(
  db: Firestore,
  access: (req: any, id: string, teacher?: boolean) => Promise<any>,
  rosterQuery: (id: string, c: any) => any,
  options: any,
) {
  return {
    getAnswerIntegrityStats: onCall(options, async (req) => {
      const courseId = String(req.data?.courseId || '');
      const { c } = await access(req, courseId, true);
      const classId = req.data?.classId;
      if (
        typeof classId !== 'string' ||
        !c.published?.classIds?.includes(classId) ||
        isTestClass(classId)
      )
        throw new HttpsError('invalid-argument', '請選擇課程內非 test 班級');
      const course = forClass(c.published as Course, classId),
        uid = req.data?.uid;
      if (uid !== undefined && (typeof uid !== 'string' || !uid || uid.length > 150))
        throw new HttpsError('invalid-argument', '學生代碼無效');
      const units = course.units.filter(
        (u) => !u.review && (!req.data?.unitId || u.id === req.data.unitId),
      );
      if (req.data?.unitId && !units.length)
        throw new HttpsError('invalid-argument', '單元不屬於此班或為複習考');
      if (!uid && !req.data?.unitId) throw new HttpsError('invalid-argument', '全班統計請指定單元');
      const roster = await rosterQuery(courseId, c)
        .where('classId', '==', classId)
        .limit(ANSWER_INTEGRITY.maxRosterReads + 1)
        .get();
      if (roster.docs.length > ANSWER_INTEGRITY.maxRosterReads)
        throw new HttpsError('resource-exhausted', '班級資料過大，請聯絡教師');
      const members = roster.docs
        .map((d: any) => d.data())
        .filter((r: any) => r.enabled !== false && !r.test);
      // Enrollment uid may be absent for legacy accounts. Resolve profiles in bounded groups.
      const unresolved = members.filter((r: any) => r.email),
        byEmail = new Map<string, string>();
      let profileReads = 0;
      for (let i = 0; i < unresolved.length; i += 30) {
        const profiles = await db
          .collection('profiles')
          .where(
            'email',
            'in',
            unresolved.slice(i, i + 30).map((r: any) => r.email),
          )
          .limit(ANSWER_INTEGRITY.maxRosterReads + 1 - profileReads)
          .get();
        profileReads += profiles.docs.length;
        if (profileReads > ANSWER_INTEGRITY.maxRosterReads)
          throw new HttpsError('resource-exhausted', '帳號資料過大，請聯絡教師');
        for (const p of profiles.docs) byEmail.set(p.data().email, p.id);
      }
      const candidates: IntegrityStudent[] = members
        .map((r: any) => ({
          uid: byEmail.get(r.email) || r.uid || '',
          name: String(r.name || r.studentId || '未命名'),
          studentId: String(r.studentId || ''),
          classId,
        }))
        .filter((s: IntegrityStudent) => s.uid && (!uid || s.uid === uid));
      const students = [...new Map(candidates.map((s) => [s.uid, s])).values()];
      if (uid && !students.length) throw new HttpsError('permission-denied', '學生不屬於此班');
      let query: any = db
        .collection(`courses/${courseId}/attempts`)
        .where('classId', '==', classId);
      query = uid ? query.where('uid', '==', uid) : query.where('unitId', '==', req.data.unitId);
      const snap = await query.limit(ANSWER_INTEGRITY.maxAttemptReads + 1).get();
      if (snap.docs.length > ANSWER_INTEGRITY.maxAttemptReads)
        throw new HttpsError(
          'resource-exhausted',
          '作答紀錄超過單次統計上限，請聯絡教師；未回傳不完整統計',
        );
      const attempts = snap.docs.map((d: any) => ({ ...d.data(), id: d.id })) as Attempt[];
      const computed = units.map((u) => computeIntegrityUnitStats(u, students, attempts, !uid));
      // Preserve officially retained legacy scores; timing statistics never recalculate progress.
      let progressReads = 0;
      if (!uid)
        for (let i = 0; i < students.length; i += 50) {
          const group = students.slice(i, i + 50);
          const ps = await Promise.all(
            group.map((s) => db.doc(`courses/${courseId}/progress/${s.uid}`).get()),
          );
          progressReads += ps.length;
          ps.forEach((p, index) => {
            for (const u of computed) {
              const best = p.data()?.units?.[u.unitId]?.best;
              if (typeof best === 'number' && Number.isFinite(best)) {
                const row = u.rows.find((r) => r.uid === group[index].uid);
                if (row) row.best = best < 0 ? null : best;
              }
            }
          });
        }
      return {
        scope: uid ? 'student' : 'class',
        units: computed,
        reads: {
          attempts: snap.docs.length,
          roster: roster.docs.length + profileReads,
          progress: progressReads,
        },
        generatedAt: Date.now(),
      };
    }),
    recordPracticeLeaves: onCall(options, async (req) => {
      const courseId = String(req.data?.courseId || '');
      const { p, c } = await access(req, courseId);
      if (p.teacher) throw new HttpsError('permission-denied', '教師預覽不寫入練習紀錄');
      const r = req.data,
        sessionId = r?.sessionId;
      if (
        typeof sessionId !== 'string' ||
        !/^[\w-]{1,150}$/.test(sessionId) ||
        r.mode !== 'flashcard' ||
        !Array.isArray(r.unitIds) ||
        !r.unitIds.length ||
        r.unitIds.length > 50 ||
        new Set(r.unitIds).size !== r.unitIds.length ||
        typeof r.duration !== 'number' ||
        !Number.isFinite(r.duration) ||
        r.duration < 0 ||
        r.duration > ANSWER_INTEGRITY.maxReportedSeconds
      )
        throw new HttpsError('invalid-argument', '練習離開紀錄格式無效');
      const units = forClass(c.published, p.classId).units;
      if (
        r.unitIds.some(
          (id: unknown) => typeof id !== 'string' || !units.some((u: any) => u.id === id),
        )
      )
        throw new HttpsError('permission-denied', '單元不屬於此班');
      let metrics;
      try {
        metrics = validateLeaveMetrics(r);
      } catch (e) {
        throw new HttpsError('invalid-argument', (e as Error).message);
      }
      if (!metrics) throw new HttpsError('invalid-argument', '缺少離開紀錄');
      const ref = db.doc(`courses/${courseId}/practiceLeaves/${sessionId}`);
      return db.runTransaction(async (tx) => {
        const old = await tx.get(ref);
        if (old.exists) {
          if (old.data()?.uid !== p.uid) throw new HttpsError('permission-denied', '練習代碼衝突');
          return { ok: true, duplicate: true };
        }
        tx.create(ref, {
          uid: p.uid,
          classId: p.classId,
          unitIds: r.unitIds,
          mode: 'flashcard',
          duration: r.duration,
          ...metrics,
          receivedAt: Date.now(),
        });
        return { ok: true, duplicate: false };
      });
    }),
  };
}
