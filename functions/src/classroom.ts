import { featureAccess } from './features';
import { randomUUID } from 'node:crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Firestore } from 'firebase-admin/firestore';
import {
  PollRound,
  validateInteractions,
  validateResponses,
  tally,
  visibleRound,
  classroomDurations,
} from '../../shared/classroom';
export function createClassroomHandlers(
  db: Firestore,
  access: (req: any, id: string, teacher?: boolean) => Promise<any>,
  options: any,
  now: () => number = Date.now,
) {
  access = featureAccess(access, 'classroomInteraction');
  const authorize = async (req: any, teacher = false) => {
    return access(req, req.data.courseId, teacher);
  };
  const state = (courseId: string) => db.doc(`courses/${courseId}/classroomState/current`);
  const rounds = (courseId: string) => db.collection(`courses/${courseId}/classroomRounds`);
  const ref = (courseId: string, id: unknown) => {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id))
      throw new HttpsError('invalid-argument', '互動場次無效');
    return rounds(courseId).doc(id);
  };
  const rosterCount = async (courseId: string, c: any, classes: string[]) => {
    const roster =
      c.rosterVersion === 2
        ? await db.collection('enrollments').where('courseId', '==', courseId).get()
        : await db.collection('roster').get();
    return roster.docs.filter((d) => {
      const row = d.data();
      return row.enabled === true && classes.includes(row.classId);
    }).length;
  };
  return {
    getClassroomConfig: onCall(options, async req => {
      await authorize(req, true);
      const config = (await db.doc(`courses/${req.data.courseId}/classroomConfig/interactions`).get()).data();
      return { interactions: validateInteractions(config?.interactions || []) };
    }),
    saveClassroomConfig: onCall(options, async req => {
      await authorize(req, true);
      let interactions;
      try { interactions = validateInteractions(req.data.interactions); }
      catch (e) { throw new HttpsError('invalid-argument', (e as Error).message); }
      await db.doc(`courses/${req.data.courseId}/classroomConfig/interactions`).set({ interactions }, { merge: true });
      return { ok: true };
    }),
    controlClassroomInteraction: onCall(options, async (req) => {
      const { c } = await authorize(req, true);
      const { action } = req.data;
      if (!['open', 'close', 'extend'].includes(action))
        throw new HttpsError('invalid-argument', '操作無效');
      if (action === 'open') {
        const config = (await db.doc(`courses/${req.data.courseId}/classroomConfig/interactions`).get()).data();
        const definitions = validateInteractions(config?.interactions || []);
        const def = definitions.find((q) => q.slideId === req.data.slideId);
        const classes = req.data.classIds;
        if (
          !def ||
          !Array.isArray(classes) ||
          !classes.length ||
          classes.some((x) => typeof x !== 'string' || !c.classIds.includes(x))
        )
          throw new HttpsError('invalid-argument', '請選擇題目及參與班級');
        const seconds = req.data.durationSeconds ?? 0;
        if (!classroomDurations.includes(seconds))
          throw new HttpsError('invalid-argument', '倒數時間無效');
        const eligibleCount = await rosterCount(req.data.courseId, c, classes);
        const id = randomUUID(),
          target = ref(req.data.courseId, id);
        return db.runTransaction(async (tx) => {
          const current = (await tx.get(state(req.data.courseId))).data();
          let previous: PollRound | undefined;
          if (current?.openRoundId) {
            if (req.data.replaceRoundId !== current.openRoundId)
              throw new HttpsError('failed-precondition', '目前互動已變更，請重新確認');
            previous = (await tx.get(ref(req.data.courseId, current.openRoundId))).data() as PollRound;
            if (!previous || previous.status !== 'open')
              throw new HttpsError('failed-precondition', '目前互動已變更，請重新確認');
          } else if (req.data.replaceRoundId) {
            throw new HttpsError('failed-precondition', '目前互動已變更，請重新確認');
          }
          const openedAt = now();
          const number = (current?.numbers?.[def.slideId] || 0) + 1;
          const round: PollRound = {
            id,
            ...def,
            classIds: [...new Set(classes)] as string[],
            number,
            status: 'open',
            openedAt,
            eligibleCount,
            ...(seconds ? { deadlineAt: openedAt + seconds * 1000 } : {}),
            total: 0,
            counts: {},
          };
          if (previous)
            tx.set(ref(req.data.courseId, previous.id), { ...previous, status: 'closed', closedAt: openedAt });
          tx.set(target, round);
          tx.set(state(req.data.courseId), {
            openRoundId: id,
            latestRoundId: id,
            numbers: { ...(current?.numbers || {}), [def.slideId]: number },
            latestBySlide: { ...(current?.latestBySlide || {}), [def.slideId]: id },
          });
          return { round, serverNow: now() };
        });
      }
      const target = ref(req.data.courseId, req.data.roundId);
      return db.runTransaction(async (tx) => {
        const current = (await tx.get(state(req.data.courseId))).data();
        const round = (await tx.get(target)).data() as PollRound | undefined;
        if (!round) throw new HttpsError('not-found', '互動不存在');
        if (action === 'extend') {
          if (
            round.status !== 'open' ||
            current?.openRoundId !== round.id ||
            round.deadlineAt === undefined
          )
            throw new HttpsError('failed-precondition', '只能延長目前開放中的倒數互動');
          round.deadlineAt = Math.max(round.deadlineAt, now()) + 30000;
        }
        if (action === 'close') {
          if (round.status === 'closed') return { round, serverNow: now() };
          round.status = 'closed';
          round.closedAt = now();
          if (current?.openRoundId === round.id) tx.set(state(req.data.courseId), { ...current, openRoundId: '' });
        }
        tx.set(target, round);
        return { round: visibleRound(round), serverNow: now() };
      });
    }),
    getClassroomInteraction: onCall(options, async (req) => {
      const { p } = await authorize(req);
      if (p.teacher) throw new HttpsError('permission-denied', '此入口供學生使用');
      const current = (await state(req.data.courseId).get()).data();
      if (!current?.latestRoundId) return { round: null, serverNow: now() };
      const target = ref(req.data.courseId, current.latestRoundId),
        round = (await target.get()).data() as PollRound;
      if (!round || !round.classIds.includes(p.classId)) return { round: null, serverNow: now() };
      const response = (await target.collection('responses').doc(p.uid).get()).data();
      const { counts, total, ...prompt } = round;
      return {
        round: prompt,
        serverNow: now(),
        submitted: !!response,
        answers: response?.answers || null,
        ...(round.status === 'closed' ? { results: visibleRound(round) } : {}),
      };
    }),
    submitClassroomInteraction: onCall(options, async (req) => {
      const { p } = await authorize(req);
      if (p.teacher) throw new HttpsError('permission-denied', '教師不建立學生作答');
      const target = ref(req.data.courseId, req.data.roundId),
        response = target.collection('responses').doc(p.uid);
      return db.runTransaction(async (tx) => {
        const round = (await tx.get(target)).data() as PollRound | undefined;
        const existing = (await tx.get(response)).data();
        if (!round || !round.classIds.includes(p.classId))
          throw new HttpsError('permission-denied', '不屬於此互動班級');
        if (existing) return { submitted: true, answers: existing.answers };
        if (round.status !== 'open') throw new HttpsError('failed-precondition', '教師已結束作答');
        if (round.deadlineAt !== undefined && now() > round.deadlineAt + 3000)
          throw new HttpsError('deadline-exceeded', '時間到，作答已截止');
        // Bound a round document well below Firestore's 1MiB limit, using only fixed-choice statistics.
        if (round.total >= 200) throw new HttpsError('resource-exhausted', '此輪人數已達上限');
        let answers;
        try {
          answers = validateResponses(round, req.data.answers);
        } catch (e) {
          throw new HttpsError('invalid-argument', (e as Error).message);
        }
        tx.set(response, {
          answers,
          submittedAt: now(),
          uid: p.uid,
          classId: p.classId,
          name: p.name || '',
          studentId: p.studentId || '',
        });
        tx.set(target, tally(round, answers));
        return { submitted: true, answers };
      });
    }),
    classroomInteractionReport: onCall(options, async (req) => {
      const { c } = await authorize(req, true);
      const current = (await state(req.data.courseId).get()).data();
      const active = current?.openRoundId
        ? ((await ref(req.data.courseId, current.openRoundId).get()).data() as PollRound)
        : undefined;
      if (active && active.eligibleCount === undefined)
        active.eligibleCount = await rosterCount(req.data.courseId, c, active.classIds);
      let id =
        req.data.roundId ||
        (req.data.slideId ? current?.latestBySlide?.[req.data.slideId] : current?.latestRoundId);
      // Legacy rounds predate latestBySlide; a single-field query needs no new composite index.
      if (!id && req.data.slideId) {
        const list = await rounds(req.data.courseId).where('slideId', '==', req.data.slideId).get();
        id = list.docs
          .map((d) => d.data() as PollRound)
          .sort((a, b) => b.openedAt - a.openedAt)[0]?.id;
      }
      const selected = id ? ((await ref(req.data.courseId, id).get()).data() as PollRound) : undefined;
      const result: any = {
        round: selected ? visibleRound(selected) : null,
        activeRound: active?.status === 'open' ? visibleRound(active) : null,
        serverNow: now(),
      };
      if (req.data.history === true) {
        const list = await rounds(req.data.courseId).orderBy('openedAt', 'desc').limit(100).get();
        result.rounds = list.docs.map((d) => {
          const { id, title, slideId, number, status, classIds, total } = d.data();
          return { id, title, slideId, number, status, classIds, total };
        });
      }
      return result;
    }),
    classroomInteractionRecords: onCall(options, async (req) => {
      await authorize(req, true);
      const target = ref(req.data.courseId, req.data.roundId);
      const list = await target.collection('responses').get();
      return { rows: list.docs.map((d) => d.data()) };
    }),
  };
}
