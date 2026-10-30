import { patchQuestion, questionSnapshot } from '../../shared/questionManager';
import { featureAccess } from './features';
import { randomUUID } from 'node:crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Firestore } from 'firebase-admin/firestore';
import {
  AnswerKeys,
  Interaction,
  PollRound,
  SlideAnswerKeys,
  StudentHistoryItem,
  validateInteractions,
  validateAnswerKeys,
  extractValidSlideKey,
  validateResponses,
  judgeResponses,
  tally,
  visibleRound,
  studentPromptRound,
  studentResultsRound,
  classroomDurations,
} from '../../shared/classroom';

function extractAnswerKeysMap(data: any): Record<string, any> | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  const raw =
    data.answerKeys && typeof data.answerKeys === 'object' && !Array.isArray(data.answerKeys)
      ? data.answerKeys
      : data;
  const copy: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === 'updatedAt' || k === 'updatedBy') continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) copy[k] = v;
  }
  return copy;
}

function safeFilterAnswerKeys(interactions: Interaction[], data: any): AnswerKeys {
  const map = extractAnswerKeysMap(data);
  if (!map) return {};
  const bySlide = new Map(interactions.map((d) => [d.slideId, d]));
  const filtered: AnswerKeys = {};
  for (const [slideId, slideVal] of Object.entries(map)) {
    const def = bySlide.get(slideId);
    if (!def || !slideVal || typeof slideVal !== 'object' || Array.isArray(slideVal)) continue;
    try {
      const valid = validateAnswerKeys([def], { [slideId]: slideVal });
      if (valid[slideId]) filtered[slideId] = valid[slideId];
    } catch {
      // Ignore orphaned keys if interaction options were edited after keys were saved
    }
  }
  return filtered;
}

function extractSlideKey(
  data: any,
  def: Pick<Interaction, 'slideId' | 'fields'>,
): SlideAnswerKeys | null {
  const map = extractAnswerKeysMap(data);
  if (!map || !map[def.slideId]) return null;
  return extractValidSlideKey(def, map);
}

function decorateRoundWithKey(r: PollRound | undefined, keyData: any): PollRound | null {
  if (!r) return null;
  const hasKey = Boolean(r.reveal || extractSlideKey(keyData, r));
  const { hasAnswerKey: _drop, ...clean } = r;
  return visibleRound(hasKey ? { ...clean, hasAnswerKey: true } : clean);
}

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
  const interactionsDoc = (courseId: string) =>
    db.doc(`courses/${courseId}/classroomConfig/interactions`);
  const answerKeysDoc = (courseId: string) =>
    db.doc(`courses/${courseId}/classroomConfig/answerKeys`);
  const ref = (courseId: string, id: unknown) => {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id))
      throw new HttpsError('invalid-argument', '互動場次無效');
    return rounds(courseId).doc(id);
  };
  const writeConfigDoc = async (docRef: any, value: Record<string, unknown>, merge = true) => {
    if (typeof docRef.set === 'function') {
      await docRef.set(value, merge ? { merge: true } : undefined);
    } else {
      await (db as any).runTransaction(async (tx: any) => {
        const old = merge ? (await tx.get(docRef)).data() || {} : {};
        tx.set(docRef, { ...old, ...value });
      });
    }
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
    updateClassroomQuestions: onCall(options, async (req) => {
      await authorize(req, true);
      const { courseId, slideId, expected, next } = req.data;
      return db.runTransaction(async tx => {
        const [configSnap, keysSnap] = await Promise.all([
          tx.get(interactionsDoc(courseId)), tx.get(answerKeysDoc(courseId)),
        ]);
        let patched;
        try {
          patched = patchQuestion(configSnap.data()?.interactions || [],
            extractAnswerKeysMap(keysSnap.data()) || {}, slideId, expected, next);
        } catch (e) {
          const message = (e as Error).message;
          throw new HttpsError(message.startsWith('CONFLICT') ? 'aborted' : 'invalid-argument', message);
        }
        tx.set(interactionsDoc(courseId), { interactions: patched.interactions }, { merge: true });
        tx.set(answerKeysDoc(courseId), { ...keysSnap.data(), answerKeys: patched.answerKeys });
        return { ok: true, snapshot: questionSnapshot(patched.interactions, patched.answerKeys, slideId) };
      });
    }),
    getClassroomConfig: onCall(options, async (req) => {
      await authorize(req, true);
      const [configSnap, keySnap] = await Promise.all([
        interactionsDoc(req.data.courseId).get(),
        answerKeysDoc(req.data.courseId).get(),
      ]);
      const config = configSnap.data();
      const interactions = validateInteractions(config?.interactions || []);
      const rawKeyData = keySnap.data();
      const requestedIds = req.data?.slideIds || [];
      if (!Array.isArray(requestedIds) || requestedIds.length > 500 || requestedIds.some((id:any) => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id))) throw new HttpsError('invalid-argument', '投影片 ID 清單無效');
      const roundCounts = req.data?.includeQuestionManager
        ? Object.fromEntries(await Promise.all([...new Set([...interactions.map(q => q.slideId), ...requestedIds])].map(async slideId => [slideId,
          (await rounds(req.data.courseId).where('slideId', '==', slideId).count().get()).data().count])))
        : undefined;
      if (rawKeyData !== undefined || req.data?.includeAnswerKeys) {
        return {
          interactions,
          answerKeys: req.data?.includeQuestionManager
            ? extractAnswerKeysMap(rawKeyData) || {} : safeFilterAnswerKeys(interactions, rawKeyData),
          ...(roundCounts ? { roundCounts } : {}),
        };
      }
      return { interactions };
    }),
    saveClassroomConfig: onCall(options, async (req) => {
      await authorize(req, true);
      const hasInteractions = req.data.interactions !== undefined;
      const hasAnswerKeys = req.data.answerKeys !== undefined;
      if (!hasInteractions && !hasAnswerKeys)
        throw new HttpsError('invalid-argument', '請提供互動題目或答案設定');
      let interactions: Interaction[];
      try {
        if (hasInteractions) {
          interactions = validateInteractions(req.data.interactions);
        } else {
          const config = (await interactionsDoc(req.data.courseId).get()).data();
          interactions = validateInteractions(config?.interactions || []);
        }
      } catch (e) {
        throw new HttpsError('invalid-argument', (e as Error).message);
      }
      let answerKeys: AnswerKeys | undefined;
      if (hasAnswerKeys) {
        try {
          answerKeys = validateAnswerKeys(interactions, req.data.answerKeys);
        } catch (e) {
          throw new HttpsError('invalid-argument', (e as Error).message);
        }
      }
      if (hasInteractions) {
        await writeConfigDoc(interactionsDoc(req.data.courseId), { interactions }, true);
        if (!hasAnswerKeys) {
          const existingKeySnap = await answerKeysDoc(req.data.courseId).get();
          const existingKeyData = existingKeySnap.data();
          if (existingKeyData !== undefined) {
            const prunedKeys = safeFilterAnswerKeys(interactions, existingKeyData);
            await writeConfigDoc(answerKeysDoc(req.data.courseId), { answerKeys: prunedKeys }, false);
          }
        }
      }
      if (hasAnswerKeys && answerKeys !== undefined) {
        await writeConfigDoc(answerKeysDoc(req.data.courseId), { answerKeys }, false);
      }
      return {
        ok: true,
        interactions,
        ...(answerKeys !== undefined ? { answerKeys } : {}),
      };
    }),
    controlClassroomInteraction: onCall(options, async (req) => {
      const { c } = await authorize(req, true);
      const { action } = req.data;
      if (!['open', 'close', 'extend', 'reveal'].includes(action))
        throw new HttpsError('invalid-argument', '操作無效');
      if (action === 'open') {
        const config = (await interactionsDoc(req.data.courseId).get()).data();
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
            previous = (
              await tx.get(ref(req.data.courseId, current.openRoundId))
            ).data() as PollRound;
            if (!previous || previous.status !== 'open')
              throw new HttpsError('failed-precondition', '目前互動已變更，請重新確認');
          } else if (req.data.replaceRoundId) {
            throw new HttpsError('failed-precondition', '目前互動已變更，請重新確認');
          }
          const keySnap = await tx.get(answerKeysDoc(req.data.courseId));
          const keyData = keySnap.data();
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
          if (previous) {
            const { hasAnswerKey: _dropPrev, ...cleanPrev } = previous;
            tx.set(ref(req.data.courseId, previous.id), {
              ...cleanPrev,
              ...(previous.reveal ? { hasAnswerKey: true } : {}),
              status: 'closed',
              closedAt: openedAt,
            });
          }
          tx.set(target, round);
          tx.set(state(req.data.courseId), {
            openRoundId: id,
            latestRoundId: id,
            numbers: { ...(current?.numbers || {}), [def.slideId]: number },
            latestBySlide: { ...(current?.latestBySlide || {}), [def.slideId]: id },
          });
          return { round: decorateRoundWithKey(round, keyData)!, serverNow: now() };
        });
      }
      const target = ref(req.data.courseId, req.data.roundId);
      return db.runTransaction(async (tx) => {
        const current = (await tx.get(state(req.data.courseId))).data();
        const round = (await tx.get(target)).data() as PollRound | undefined;
        const keySnap = await tx.get(answerKeysDoc(req.data.courseId));
        const keyData = keySnap.data();
        if (!round) throw new HttpsError('not-found', '互動不存在');
        const slideKey = extractSlideKey(keyData, round);
        if (action === 'extend') {
          if (
            round.status !== 'open' ||
            current?.openRoundId !== round.id ||
            round.deadlineAt === undefined
          )
            throw new HttpsError('failed-precondition', '只能延長目前開放中的倒數互動');
          round.deadlineAt = Math.max(round.deadlineAt, now()) + 30000;
        }
        if (action === 'reveal') {
          if (round.status !== 'closed')
            throw new HttpsError('failed-precondition', '請先結束作答再公佈答案');
          if (round.reveal) {
            return { round: decorateRoundWithKey(round, keyData)!, serverNow: now() };
          }
          if (!slideKey)
            throw new HttpsError('failed-precondition', '此題尚未設定答案與解析');
          round.reveal = {
            revealedAt: now(),
            key: structuredClone(slideKey),
          };
          round.hasAnswerKey = true;
          tx.set(target, round);
          return { round: decorateRoundWithKey(round, keyData)!, serverNow: now() };
        }
        if (!round.reveal && 'hasAnswerKey' in round) {
          delete round.hasAnswerKey;
        }
        if (action === 'close') {
          if (round.status === 'closed')
            return { round: decorateRoundWithKey(round, keyData)!, serverNow: now() };
          round.status = 'closed';
          round.closedAt = now();
          if (current?.openRoundId === round.id)
            tx.set(state(req.data.courseId), { ...current, openRoundId: '' });
        }
        tx.set(target, round);
        return { round: decorateRoundWithKey(round, keyData)!, serverNow: now() };
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
      const answers = response?.answers || null;
      const submitted = !!response;
      const prompt = studentPromptRound(round);
      if (round.status === 'closed' && round.reveal) {
        return {
          round: prompt,
          serverNow: now(),
          submitted,
          answers,
          results: studentResultsRound(round),
          reveal: structuredClone(round.reveal),
          judgement: judgeResponses(round, round.reveal.key, answers),
        };
      }
      return {
        round: prompt,
        serverNow: now(),
        submitted,
        answers,
        ...(round.status === 'closed' ? { results: studentResultsRound(round) } : {}),
      };
    }),
    studentClassroomHistory: onCall(options, async (req) => {
      const { p } = await authorize(req);
      if (p.teacher) throw new HttpsError('permission-denied', '此入口供學生使用');
      const snap = await rounds(req.data.courseId)
        .where('classIds', 'array-contains', p.classId)
        .get();
      const revealedDocs = snap.docs.filter((d) => {
        const r = d.data() as PollRound;
        return r.classIds?.includes(p.classId) && r.status === 'closed' && Boolean(r.reveal);
      });
      const items: StudentHistoryItem[] = await Promise.all(
        revealedDocs.map(async (d) => {
          const r = d.data() as PollRound;
          const own = (
            await ref(req.data.courseId, r.id).collection('responses').doc(p.uid).get()
          ).data();
          const answers = own?.answers || null;
          const submitted = Boolean(own);
          return {
            id: r.id,
            slideId: r.slideId,
            number: r.number,
            title: r.title,
            fields: structuredClone(r.fields),
            openedAt: r.openedAt,
            ...(r.closedAt !== undefined ? { closedAt: r.closedAt } : {}),
            revealedAt: r.reveal!.revealedAt,
            reveal: structuredClone(r.reveal!),
            submitted,
            answers: answers ? structuredClone(answers) : null,
            judgement: judgeResponses(r, r.reveal!.key, answers),
          };
        }),
      );
      items.sort((a, b) => a.openedAt - b.openedAt || a.id.localeCompare(b.id));
      return { rounds: items, serverNow: now() };
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
      const [currentSnap, keySnap] = await Promise.all([
        state(req.data.courseId).get(),
        answerKeysDoc(req.data.courseId).get(),
      ]);
      const current = currentSnap.data();
      const keyData = keySnap.data();
      const decorate = (r: PollRound | undefined): PollRound | null =>
        decorateRoundWithKey(r, keyData);
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
      const selected = id
        ? ((await ref(req.data.courseId, id).get()).data() as PollRound)
        : undefined;
      const result: any = {
        round: decorate(selected),
        activeRound: active?.status === 'open' ? decorate(active) : null,
        serverNow: now(),
      };
      if (req.data.history === true) {
        const list = await rounds(req.data.courseId).orderBy('openedAt', 'desc').limit(100).get();
        result.rounds = list.docs.map((d) => {
          const r = d.data() as PollRound;
          const { id, title, slideId, number, status, classIds, total, reveal } = r;
          const hasKey = Boolean(reveal || extractSlideKey(keyData, r));
          return {
            id,
            title,
            slideId,
            number,
            status,
            classIds,
            total,
            ...(hasKey ? { hasAnswerKey: true } : {}),
            ...(reveal ? { reveal } : {}),
          };
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
