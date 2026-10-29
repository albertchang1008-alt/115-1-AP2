import { statsRoster, progressRows } from './statsRoster';
import { timingUnitStats } from '../../shared/timingStats';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Firestore } from 'firebase-admin/firestore';
import { ANSWER_INTEGRITY, isTestClass, validateLeaveMetrics } from '../../shared/answerIntegrity';
import { forClass, type Course } from '../../shared/model';
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
      const roster = await statsRoster(db, rosterQuery, courseId, c, classId);
      const students = roster.students.filter((s) => !uid || s.uid === uid);
      if (uid && !students.length) throw new HttpsError('permission-denied', '學生不屬於此班');
      const ps = await progressRows(db, courseId, students);
      const computed = units.map((u) => timingUnitStats(u, students, ps, !uid));
      return {
        scope: uid ? 'student' : 'class',
        units: computed,
        reads: {
          attempts: 0,
          roster: roster.reads,
          progress: students.length,
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
