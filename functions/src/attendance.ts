// 課堂點名（#67）：掃 QR／數字碼簽到、後台修改、學生查看、半自動通知（系統不寄信，產生信件內容給老師自己寄）。
// 規畫：docs/attendance/ATTENDANCE_PLAN_2026-11-16.md（v3＋第 0 節 23:10、23:16 教師決定）。
// 所有資料只經由這裡的 callable 讀寫；Firestore rules 對這些路徑全拒。
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Firestore } from 'firebase-admin/firestore';
import { featureAccess } from './features';
import {
  ATTENDANCE_MAX_WRONG,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  absentMail,
  acceptedSteps,
  attendanceDetailCsv,
  attendanceSessionCsv,
  attendanceSummary,
  attendanceSummaryCsv,
  correctionMail,
  countStatuses,
  mentorDigestMail,
  onlyKeys,
  pendingStudentMail,
  sameDeviceGroups,
  sessionAcceptsCheckIn,
  sessionExpired,
  stepIndex,
  stepRemainingMs,
  taipeiDate,
  termOf,
  validAttendanceDate,
  validDeviceId,
  validEmailKey,
  validReopenMinutes,
  canReopenSession,
  ATTENDANCE_REOPEN_MAX_MIN,
  validateClassIds,
  validateStartInput,
} from '../../shared/attendance';

type Deps = { now?: () => number; random?: (n: number) => Buffer };
type Member = { email: string; studentId: string; name: string; classId: string };

const bad = (message: string): never => {
  throw new HttpsError('invalid-argument', message);
};
/** 學生端看得懂的拒絕原因；details.reason 給畫面判斷要顯示哪一種訊息。 */
const refuse = (reason: string, message: string, extra: Record<string, unknown> = {}): never => {
  throw new HttpsError('failed-precondition', message, { reason, ...extra });
};
const input = (data: unknown, keys: string[]) => {
  try {
    return onlyKeys(data, ['courseId', ...keys]);
  } catch (e) {
    return bad((e as Error).message);
  }
};
const SESSION_ID = /^[0-9a-z-]{1,60}$/;
const TOKEN = /^([0-9a-z-]{1,60})\.(\d{1,7})\.([A-Za-z0-9_-]{22})$/;

export function attendanceCode(secret: string, courseId: string, sessionId: string, step: number) {
  const n = createHmac('sha256', secret)
    .update(`code|${courseId}|${sessionId}|${step}`)
    .digest()
    .readUInt32BE(0);
  return String(n % 10000).padStart(4, '0');
}
function tokenSignature(secret: string, courseId: string, sessionId: string, step: number) {
  return createHmac('sha256', secret)
    .update(`qr|${courseId}|${sessionId}|${step}`)
    .digest()
    .subarray(0, 16);
}
export function attendanceToken(secret: string, courseId: string, sessionId: string, step: number) {
  return `${sessionId}.${step}.${tokenSignature(secret, courseId, sessionId, step).toString('base64url')}`;
}
export function parseAttendanceToken(token: unknown) {
  const m = typeof token === 'string' ? token.match(TOKEN) : null;
  return m ? { sessionId: m[1], step: Number(m[2]), signature: m[3] } : null;
}
function tokenMatches(
  secret: string,
  courseId: string,
  t: { sessionId: string; step: number; signature: string },
) {
  const given = Buffer.from(t.signature, 'base64url');
  const expected = tokenSignature(secret, courseId, t.sessionId, t.step);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
function codeMatches(
  secret: string,
  courseId: string,
  s: AttendanceSession,
  code: string,
  now: number,
) {
  let ok = false;
  for (const step of acceptedSteps(now, s.startedAt, s.codeSec)) {
    const expected = Buffer.from(attendanceCode(secret, courseId, s.id, step));
    const given = Buffer.from(code);
    if (given.length === expected.length && timingSafeEqual(given, expected)) ok = true;
  }
  return ok;
}

/** 給其他後端功能讀取用（#65 等）：已結束的正式點名節次與每人紀錄。呼叫端要自己先做教師權限檢查。 */
export async function readClosedAttendance(db: Firestore, courseId: string) {
  const list = (await db.collection(`courses/${courseId}/attendance`).get()).docs
    .map((d) => d.data() as AttendanceSession)
    .filter((s) => s.kind === 'roll' && s.status === 'closed');
  const out: { session: AttendanceSession; records: AttendanceRecord[] }[] = [];
  for (const s of list)
    out.push({
      session: s,
      records: (
        await db.collection(`courses/${courseId}/attendance/${s.id}/records`).get()
      ).docs.map((d) => d.data() as AttendanceRecord),
    });
  return out;
}

export function createAttendanceHandlers(
  db: Firestore,
  rawAccess: (req: any, id: string, teacher?: boolean) => Promise<any>,
  options: any,
  deps: Deps = {},
) {
  const now = deps.now || Date.now;
  const random = deps.random || randomBytes;
  const access = featureAccess(rawAccess, 'attendance');
  const teacher = async (req: any) => access(req, req.data?.courseId, true);

  const sessions = (c: string) => db.collection(`courses/${c}/attendance`);
  const sessionRef = (c: string, id: unknown) => {
    if (typeof id !== 'string' || !SESSION_ID.test(id)) bad('節次無效');
    return sessions(c).doc(id as string);
  };
  const records = (c: string, sid: string) =>
    db.collection(`courses/${c}/attendance/${sid}/records`);
  const attempts = (c: string, sid: string) =>
    db.collection(`courses/${c}/attendance/${sid}/attempts`);
  const trials = (c: string, sid: string) => db.collection(`courses/${c}/attendance/${sid}/trial`);
  const stateRef = (c: string) => db.doc(`courses/${c}/attendanceState/current`);
  const secretRef = (c: string, sid: string) => db.doc(`courses/${c}/attendanceSecrets/${sid}`);
  const configRef = (c: string) => db.doc(`courses/${c}/attendanceConfig/mail`);
  const audit = (c: string) => db.collection(`courses/${c}/attendanceAudit`);
  const mails = (c: string) => db.collection(`courses/${c}/attendanceMail`);

  const roster = async (courseId: string, c: any, classIds: string[]): Promise<Member[]> => {
    const snap =
      c.rosterVersion === 2
        ? await db.collection('enrollments').where('courseId', '==', courseId).get()
        : await db.collection('roster').get();
    const out: Member[] = [];
    for (const d of snap.docs) {
      const row: any = d.data();
      const email = String(row.email || d.id).toLowerCase();
      if (row.enabled !== true || !classIds.includes(row.classId) || !validEmailKey(email))
        continue;
      out.push({
        email,
        studentId: String(row.studentId || ''),
        name: String(row.name || row.studentId || '未命名'),
        classId: row.classId,
      });
    }
    return out;
  };
  const allRecords = async (courseId: string, sid: string) =>
    (await records(courseId, sid).get()).docs.map((d) => d.data() as AttendanceRecord);
  const publicSession = (s: AttendanceSession) => ({
    id: s.id,
    kind: s.kind,
    date: s.date,
    period: s.period,
    classIds: s.classIds,
    status: s.status,
    startedAt: s.startedAt,
    endsAt: s.endsAt,
    ...(s.closedAt ? { closedAt: s.closedAt } : {}),
    durationSec: s.durationSec,
    codeSec: s.codeSec,
    qrSec: s.qrSec,
    expected: s.expected || 0,
    counts: s.counts || { present: 0, absent: 0 },
    backfilled: s.backfilled === true,
    confirmedAt: s.confirmedAt || 0,
    reopenCount: s.reopenCount || 0,
  });

  /** 未簽到的人補成「未到」。只在節次已關閉後執行，而且只寫還沒有紀錄的人，不會蓋掉已簽到的紀錄。 */
  const materialize = async (courseId: string, c: any, s: AttendanceSession) => {
    if (s.kind !== 'roll') return;
    const members = await roster(courseId, c, s.classIds);
    const have = new Set((await allRecords(courseId, s.id)).map((r) => r.email));
    const missing = members.filter((m) => !have.has(m.email));
    for (let i = 0; i < missing.length; i += 100) {
      const chunk = missing.slice(i, i + 100);
      await db.runTransaction(async (tx) => {
        const snaps: any[] = [];
        for (const m of chunk) snaps.push(await tx.get(records(courseId, s.id).doc(m.email)));
        chunk.forEach((m, k) => {
          if (!snaps[k].exists)
            tx.set(records(courseId, s.id).doc(m.email), { ...m, status: 'absent', via: 'auto' });
        });
      });
    }
    const all = await allRecords(courseId, s.id);
    await sessionRef(courseId, s.id).set(
      { settled: true, expected: all.length, counts: countStatuses(all) },
      { merge: true },
    );
  };
  /** 結束點名。force=false 時只在時間（含寬限）已過才結束。回傳是否由這次呼叫關閉。 */
  const settle = async (courseId: string, c: any, sid: string, force: boolean) => {
    const closed = await db.runTransaction(async (tx) => {
      const [snap, st] = [
        await tx.get(sessionRef(courseId, sid)),
        await tx.get(stateRef(courseId)),
      ];
      const s = snap.data() as AttendanceSession | undefined;
      if (!s || s.status !== 'open') return null;
      const t = now();
      if (!force && !sessionExpired(s, t)) return null;
      const next = {
        ...s,
        status: 'closed' as const,
        closedAt: Math.min(t, s.endsAt),
        settled: false,
      };
      tx.set(sessionRef(courseId, sid), next);
      if (st.data()?.openSessionId === sid) tx.set(stateRef(courseId), { openSessionId: '' });
      return next;
    });
    const s =
      closed || ((await sessionRef(courseId, sid).get()).data() as AttendanceSession | undefined);
    if (s && s.status === 'closed' && s.settled !== true) await materialize(courseId, c, s);
    return !!closed;
  };
  /** 讀取目前開啟中的節次；過期的順便結束。 */
  const current = async (courseId: string, c: any) => {
    const sid = (await stateRef(courseId).get()).data()?.openSessionId;
    if (!sid) return null;
    const s = (await sessionRef(courseId, sid).get()).data() as AttendanceSession | undefined;
    if (!s || s.status !== 'open') return null;
    if (sessionExpired(s, now())) {
      await settle(courseId, c, sid, false);
      return null;
    }
    return s;
  };
  const closedSession = async (courseId: string, c: any, id: unknown) => {
    const ref = sessionRef(courseId, id);
    let s = (await ref.get()).data() as AttendanceSession | undefined;
    if (!s || s.kind !== 'roll') throw new HttpsError('not-found', '找不到這一節');
    if (s.status === 'open' && sessionExpired(s, now())) await settle(courseId, c, s.id, false);
    else if (s.status === 'closed' && s.settled !== true) await materialize(courseId, c, s);
    s = (await ref.get()).data() as AttendanceSession;
    if (s.status !== 'closed')
      throw new HttpsError('failed-precondition', '點名還在進行中，請先結束');
    return s;
  };
  const rollSessions = async (courseId: string, c: any) => {
    await current(courseId, c);
    const list = (await sessions(courseId).get()).docs
      .map((d) => d.data() as AttendanceSession)
      .filter((s) => s.kind === 'roll');
    for (const s of list)
      if (s.status === 'closed' && s.settled !== true) await materialize(courseId, c, s);
    return list.sort(
      (a, b) => b.date.localeCompare(a.date) || b.period - a.period || a.id.localeCompare(b.id),
    );
  };
  const sessionId = (date: string, period: number, classIds: string[]) =>
    `${date}-p${String(period).padStart(2, '0')}-${createHash('sha256').update(classIds.join('|')).digest('hex').slice(0, 8)}`;
  const courseInfo = (courseId: string, c: any) => ({
    term: String(c.published?.term || c.draft?.term || c.term || termOf(courseId)),
    code: courseId,
    name: String(c.published?.title || c.draft?.title || c.title || courseId),
  });

  /* ───────── 寄信 ───────── */
  const mailContext = async (courseId: string, c: any, p: any) => {
    const cfg = (await configRef(courseId).get()).data() || {};
    const base = typeof cfg.platformUrl === 'string' ? cfg.platformUrl : '';
    return {
      cfg,
      ctx: {
        courseName: courseInfo(courseId, c).name,
        teacherName: String(cfg.teacherName || p?.name || ''),
        link: base ? `${base}#/course/${encodeURIComponent(courseId)}/attendance` : '',
      },
    };
  };
  /* ───────── 半自動通知（教師 2026-11-19 12:42）：系統不寄信，只產生信件內容，老師自己貼到 Gmail 寄出後標記「已通知」 ───────── */
  const DAY_MS = 86400000;
  const digestDocId = (date: string, classId: string) =>
    `digest__${date}__${encodeURIComponent(classId)}`;
  /** 待通知清單：只看已確認的節次；學生信沿用 pendingStudentMail（紀錄與上次通知不一致時才需通知）。 */
  const notifyState = async (courseId: string, c: any, p: any, date: string) => {
    const list = await rollSessions(courseId, c);
    const confirmed = list.filter((s) => s.status === 'closed' && s.confirmedAt);
    const { cfg, ctx } = await mailContext(courseId, c, p);
    const student: Record<string, unknown>[] = [];
    const bySession = new Map<string, AttendanceRecord[]>();
    for (const s of confirmed) {
      const rs = (await allRecords(courseId, s.id)).sort(
        (a, b) => a.classId.localeCompare(b.classId) || a.studentId.localeCompare(b.studentId),
      );
      bySession.set(s.id, rs);
      for (const r of rs) {
        const kind = pendingStudentMail(r);
        if (!kind) continue;
        const mail = kind === 'absent' ? absentMail(ctx, s, r.name) : correctionMail(ctx, s, r.name);
        student.push({
          draftId: `${s.id}__${r.email}`,
          kind,
          sessionId: s.id,
          date: s.date,
          period: s.period,
          classId: r.classId,
          to: r.email,
          name: r.name,
          subject: mail.subject,
          text: mail.text,
          expect: { status: r.status, notifySeq: r.notifySeq || 0 },
        });
      }
    }
    const mentors: Record<string, { name?: string; email?: string }> = cfg.mentors || {};
    const digest: Record<string, unknown>[] = [];
    const noMentor: string[] = [];
    const today = list.filter((s) => s.date === date);
    for (const classId of [...new Set(today.flatMap((s) => s.classIds))].sort()) {
      const mine = today.filter((s) => s.classIds.includes(classId));
      const covered: number[] =
        (await mails(courseId).doc(digestDocId(date, classId)).get()).data()?.periods || [];
      const fresh = mine
        .filter((s) => s.confirmedAt && !covered.includes(s.period))
        .sort((a, b) => a.period - b.period);
      if (!fresh.length) continue;
      const m = mentors[classId];
      if (!m?.email) {
        noMentor.push(classId);
        continue;
      }
      const mail = mentorDigestMail(
        ctx,
        classId,
        String(m.name || ''),
        date,
        fresh.map((s) => ({ session: s, records: bySession.get(s.id) || [] })),
      );
      const supplement = covered.length > 0;
      digest.push({
        draftId: digestDocId(date, classId),
        kind: 'digest',
        classId,
        date,
        to: m.email,
        name: String(m.name || ''),
        subject: supplement ? `${mail.subject}（補充）` : mail.subject,
        text: mail.text,
        periods: fresh.map((s) => s.period),
        supplement,
        // 該班今天的節次都確認了才提示；還有未確認的節次時老師仍可先產生。
        unconfirmed: mine.filter((s) => !s.confirmedAt).map((s) => s.period).sort((a, b) => a - b),
        ready: mine.every((s) => s.confirmedAt),
        expect: { periods: fresh.map((s) => s.period) },
      });
    }
    return {
      cfg,
      student,
      digest,
      noMentor,
      unconfirmedToday: list.filter((s) => s.date === date && !s.confirmedAt).map(publicSession),
    };
  };
  const markStudent = async (courseId: string, p: any, draftId: string, expect: any) => {
    const cut = draftId.indexOf('__');
    const sid = cut > 0 ? draftId.slice(0, cut) : '';
    const email = cut > 0 ? draftId.slice(cut + 2) : '';
    if (!validEmailKey(email)) bad('通知編號無效');
    if (
      !expect ||
      typeof expect !== 'object' ||
      (expect.status !== 'present' && expect.status !== 'absent') ||
      !Number.isInteger(expect.notifySeq) ||
      expect.notifySeq < 0
    )
      bad('通知內容無效');
    const sRef = sessionRef(courseId, sid);
    const rRef = records(courseId, sid).doc(email);
    return db.runTransaction(async (tx) => {
      const [rSnap, sSnap] = [await tx.get(rRef), await tx.get(sRef)];
      const r = rSnap.data() as AttendanceRecord | undefined;
      const s = sSnap.data() as AttendanceSession | undefined;
      if (!r || !s || s.kind !== 'roll' || !s.confirmedAt) return 'stale' as const;
      const n = r.notifySeq || 0;
      // 同一封重按（或兩個分頁同時按）：已經標過，回原結果，不再加序號。
      if (n === expect.notifySeq + 1 && r.status === expect.status && r.lastNotified === r.status)
        return 'already' as const;
      const kind = pendingStudentMail(r);
      if (!kind || r.status !== expect.status || n !== expect.notifySeq) return 'stale' as const;
      const seq = n + 1;
      const t = now();
      const logId = `${draftId}__${seq}`;
      tx.set(rRef, { ...r, lastNotified: r.status, notifySeq: seq });
      tx.set(mails(courseId).doc(logId), {
        id: logId,
        kind,
        to: r.email,
        name: r.name,
        sessionId: sid,
        date: s.date,
        period: s.period,
        classId: r.classId,
        seq,
        prevLastNotified: r.lastNotified || null,
        status: 'marked',
        markedAt: t,
        updatedAt: t,
        by: p.uid,
        byName: String(p.name || p.email || ''),
      });
      return 'marked' as const;
    });
  };
  const markDigest = async (courseId: string, c: any, p: any, draftId: string, expect: any) => {
    const m = draftId.match(/^digest__(\d{4}-\d{2}-\d{2})__([^/]{1,200})$/);
    let classId = '';
    try {
      classId = m ? decodeURIComponent(m[2]) : '';
    } catch {
      classId = '';
    }
    if (
      !m ||
      !validAttendanceDate(m[1]) ||
      !(c.classIds || []).includes(classId) ||
      digestDocId(m[1], classId) !== draftId
    )
      bad('通知編號無效');
    const date = m![1];
    if (
      !expect ||
      typeof expect !== 'object' ||
      !Array.isArray(expect.periods) ||
      !expect.periods.length ||
      expect.periods.length > 20 ||
      expect.periods.some((x: unknown) => !Number.isInteger(x) || (x as number) < 1 || (x as number) > 20)
    )
      bad('通知內容無效');
    const want = [...new Set(expect.periods as number[])].sort((a, b) => a - b);
    const eligible = (await sessions(courseId).where('date', '==', date).get()).docs
      .map((x) => x.data() as AttendanceSession)
      .filter((s) => s.kind === 'roll' && s.status === 'closed' && s.confirmedAt && s.classIds.includes(classId));
    if (want.some((x) => !eligible.some((s) => s.period === x))) return 'stale' as const;
    const ref = mails(courseId).doc(draftId);
    return db.runTransaction(async (tx) => {
      const old = (await tx.get(ref)).data();
      const mentor = ((await tx.get(configRef(courseId))).data()?.mentors || {})[classId];
      if (!mentor?.email) return 'stale' as const;
      // 確認狀態在同一交易內重讀；與取消確認並行時不可使用交易外的舊快照。
      for (const period of want) {
        const s = eligible.find((s) => s.period === period)!;
        const cur = (await tx.get(sessionRef(courseId, s.id))).data() as AttendanceSession | undefined;
        if (!cur || cur.kind !== 'roll' || cur.status !== 'closed' || !cur.confirmedAt ||
            cur.date !== date || cur.period !== period || !cur.classIds.includes(classId))
          return 'stale' as const;
      }
      const covered: number[] = old?.periods || [];
      const fresh = want.filter((x) => !covered.includes(x));
      if (!fresh.length) return 'already' as const;
      const t = now();
      tx.set(ref, {
        id: draftId,
        kind: 'digest',
        to: mentor.email,
        name: String(mentor.name || ''),
        classId,
        date,
        periods: [...covered, ...fresh].sort((a, b) => a - b),
        marks: [
          ...(old?.marks || []),
          { periods: fresh, at: t, by: p.uid, byName: String(p.name || p.email || '') },
        ],
        status: 'marked',
        markedAt: t,
        updatedAt: t,
      });
      return 'marked' as const;
    });
  };

  return {
    /* ═════════ 教師：開始／控制／投影 ═════════ */
    attendanceStart: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const courseId = req.data.courseId;
      let v: ReturnType<typeof validateStartInput>;
      try {
        v = validateStartInput(req.data, c.classIds || [], taipeiDate(now()));
      } catch (e) {
        return bad((e as Error).message);
      }
      if (await current(courseId, c))
        throw new HttpsError('failed-precondition', '已有進行中的點名，請先結束');
      const t = now();
      const id = v.trial ? `trial-${t}` : sessionId(v.date, v.period, v.classIds);
      if (!v.trial) {
        const same = (await sessions(courseId).where('date', '==', v.date).get()).docs.map(
          (d) => d.data() as AttendanceSession,
        );
        if (
          same.some(
            (s) =>
              s.kind === 'roll' &&
              s.period === v.period &&
              s.id !== id &&
              s.classIds.some((x) => v.classIds.includes(x)),
          )
        )
          throw new HttpsError(
            'failed-precondition',
            '這一節已經有包含同一班的點名紀錄，請到後台直接修改',
          );
      }
      const expected = v.trial ? 0 : (await roster(courseId, c, v.classIds)).length;
      const secret = random(32).toString('base64url');
      const session = await db.runTransaction(async (tx) => {
        const [st, oldSnap] = [
          await tx.get(stateRef(courseId)),
          await tx.get(sessionRef(courseId, id)),
        ];
        if (st.data()?.openSessionId)
          throw new HttpsError('failed-precondition', '已有進行中的點名，請先結束');
        const old = oldSnap.data() as AttendanceSession | undefined;
        if (old?.confirmedAt)
          throw new HttpsError(
            'failed-precondition',
            '這一節已經確認，不能重新點名；請到後台直接修改',
          );
        // 同一節重新開始：沿用原節次，已簽到的保留，未到的可以再簽。
        const s: AttendanceSession = {
          ...(old || {}),
          id,
          kind: v.trial ? 'trial' : 'roll',
          date: v.date,
          period: v.period,
          classIds: v.classIds,
          status: 'open',
          startedAt: t,
          endsAt: t + v.durationSec * 1000,
          durationSec: v.durationSec,
          codeSec: v.codeSec,
          qrSec: v.qrSec,
          expected,
          settled: false,
        };
        delete (s as any).closedAt;
        tx.set(sessionRef(courseId, id), { ...s, createdBy: p.uid });
        tx.set(secretRef(courseId, id), { secret, createdAt: t });
        tx.set(stateRef(courseId), { openSessionId: id });
        return s;
      });
      return { session: publicSession(session) };
    }),
    attendanceControl: onCall(options, async (req) => {
      const { c } = await teacher(req);
      const d = input(req.data, ['action']);
      const courseId = req.data.courseId;
      const sid = (await stateRef(courseId).get()).data()?.openSessionId;
      if (!sid) throw new HttpsError('failed-precondition', '目前沒有進行中的點名');
      if (d.action === 'end') {
        await settle(courseId, c, sid, true);
      } else if (d.action === 'extend') {
        await db.runTransaction(async (tx) => {
          const s = (await tx.get(sessionRef(courseId, sid))).data() as
            AttendanceSession | undefined;
          if (!s || s.status !== 'open')
            throw new HttpsError('failed-precondition', '點名已經結束');
          tx.set(sessionRef(courseId, sid), { ...s, endsAt: Math.max(s.endsAt, now()) + 60000 });
        });
      } else bad('操作無效');
      const s = (await sessionRef(courseId, sid).get()).data() as AttendanceSession;
      return { session: publicSession(s) };
    }),
    /** 再開放（教師 2026-11-25，#73）：今天已結束的節次以原節次、原班級重開；已簽到保留，未到可補簽。
     *  已確認的節次也可再開放，會撤銷確認並寫入修改紀錄；再結束後需重新確認。 */
    attendanceReopen: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['sessionId', 'minutes']);
      const courseId = req.data.courseId;
      if (!validReopenMinutes(d.minutes)) bad(`再開放時間需為 1–${ATTENDANCE_REOPEN_MAX_MIN} 分鐘`);
      if (await current(courseId, c))
        throw new HttpsError('failed-precondition', '已有進行中的點名，請先結束');
      const s0 = await closedSession(courseId, c, d.sessionId);
      const t = now();
      if (!canReopenSession(s0, taipeiDate(t)))
        throw new HttpsError('failed-precondition', '只能再開放今天已結束的點名節次');
      const secret = random(32).toString('base64url');
      const session = await db.runTransaction(async (tx) => {
        const [st, snap] = [await tx.get(stateRef(courseId)), await tx.get(sessionRef(courseId, s0.id))];
        if (st.data()?.openSessionId)
          throw new HttpsError('failed-precondition', '已有進行中的點名，請先結束');
        const cur = snap.data() as AttendanceSession | undefined;
        if (!canReopenSession(cur, taipeiDate(t)))
          throw new HttpsError('failed-precondition', '只能再開放今天已結束的點名節次');
        const durationSec = (d.minutes as number) * 60;
        const next: AttendanceSession = {
          ...cur!,
          status: 'open',
          startedAt: t,
          endsAt: t + durationSec * 1000,
          durationSec,
          settled: false,
          reopenCount: (cur!.reopenCount || 0) + 1,
          reopenedAt: t,
        };
        delete next.closedAt;
        delete next.confirmedAt;
        tx.set(sessionRef(courseId, cur!.id), next);
        tx.set(secretRef(courseId, cur!.id), { secret, createdAt: t });
        tx.set(stateRef(courseId), { openSessionId: cur!.id });
        tx.set(audit(courseId).doc(`${t}-${random(6).toString('hex')}`), {
          at: t,
          action: 'reopen',
          sessionId: cur!.id,
          date: cur!.date,
          period: cur!.period,
          minutes: d.minutes,
          ...(cur!.confirmedAt ? { unconfirmed: cur!.confirmedAt } : {}),
          by: p.uid,
          byName: String(p.name || p.email || ''),
        });
        return next;
      });
      return { session: publicSession(session) };
    }),
    /** 投影畫面每隔幾秒讀一次：目前的數字碼、QR 憑證、倒數與已簽到人數。 */
    attendanceLive: onCall(options, async (req) => {
      const { c } = await teacher(req);
      input(req.data, []);
      const courseId = req.data.courseId;
      const s = await current(courseId, c);
      if (!s) return { session: null };
      const t = now();
      const secret = (await secretRef(courseId, s.id).get()).data()?.secret;
      const signed =
        s.kind === 'trial'
          ? (await trials(courseId, s.id).get()).docs.length
          : (await records(courseId, s.id).where('status', '==', 'present').get()).docs.length;
      return {
        session: publicSession(s),
        now: t,
        remainingMs: Math.max(0, s.endsAt - t),
        signed,
        code: attendanceCode(secret, courseId, s.id, stepIndex(t, s.startedAt, s.codeSec)),
        codeRemainingMs: stepRemainingMs(t, s.startedAt, s.codeSec),
        token: attendanceToken(secret, courseId, s.id, stepIndex(t, s.startedAt, s.qrSec)),
        qrRemainingMs: stepRemainingMs(t, s.startedAt, s.qrSec),
      };
    }),

    /* ═════════ 學生：簽到／目前點名／我的出缺席 ═════════ */
    attendanceCheckIn: onCall(options, async (req) => {
      const { p, c } = await access(req, req.data?.courseId);
      const d = input(req.data, ['token', 'code', 'deviceId']);
      const courseId = req.data.courseId;
      if (p.teacher)
        throw new HttpsError('permission-denied', '教師帳號不能簽到', { reason: 'teacher' });
      const email = String(p.email || '').toLowerCase();
      if (!validEmailKey(email)) throw new HttpsError('permission-denied', '帳號無效');
      if (d.deviceId !== undefined && !validDeviceId(d.deviceId)) bad('裝置編號無效');
      const hasToken = d.token !== undefined && d.token !== '';
      if (hasToken === (d.code !== undefined)) bad('請提供 QR 憑證或數字碼其中一種');
      const t = now();
      let sid: string;
      let via: 'qr' | 'code';
      let fresh = true;
      if (hasToken) {
        const tok = parseAttendanceToken(d.token);
        if (!tok) return refuse('expired', 'QR 已過期，請再掃一次');
        const secret = (await secretRef(courseId, tok.sessionId).get()).data()?.secret;
        if (!secret || !tokenMatches(secret, courseId, tok))
          return refuse('expired', 'QR 已過期，請再掃一次');
        const s0 = (await sessionRef(courseId, tok.sessionId).get()).data() as
          AttendanceSession | undefined;
        if (!s0) return refuse('expired', 'QR 已過期，請再掃一次');
        fresh = acceptedSteps(t, s0.startedAt, s0.qrSec).includes(tok.step);
        sid = tok.sessionId;
        via = 'qr';
      } else {
        if (typeof d.code !== 'string' || !/^\d{4}$/.test(d.code)) bad('請輸入 4 位數字碼');
        sid = (await stateRef(courseId).get()).data()?.openSessionId || '';
        if (!sid) return refuse('closed', '目前沒有進行中的點名');
        via = 'code';
      }
      const s = (await sessionRef(courseId, sid).get()).data() as AttendanceSession | undefined;
      if (!s) return refuse('closed', '目前沒有進行中的點名');
      if (!s.classIds.includes(p.classId))
        return refuse('not-in-class', '這一節點名的名單裡沒有你');
      const label = { date: s.date, period: s.period };
      if (s.kind === 'roll') {
        const mine = (await records(courseId, sid).doc(email).get()).data() as
          AttendanceRecord | undefined;
        if (mine?.status === 'present')
          return { result: 'duplicate', signedAt: mine.signedAt || 0, ...label };
      }
      if (!sessionAcceptsCheckIn(s, t)) return refuse('closed', '點名已經結束');
      if (via === 'qr' && !fresh) return refuse('expired', 'QR 已過期，請再掃一次');
      if (via === 'code') {
        const secret = (await secretRef(courseId, sid).get()).data()?.secret;
        const attemptRef = attempts(courseId, sid).doc(email);
        const wrong = await db.runTransaction(async (tx) => {
          const a = (await tx.get(attemptRef)).data() || { wrongCount: 0 };
          if (a.wrongCount >= ATTENDANCE_MAX_WRONG) return { locked: true, left: 0 };
          if (secret && codeMatches(secret, courseId, s, d.code as string, t)) return null;
          const wrongCount = a.wrongCount + 1;
          tx.set(attemptRef, { email, wrongCount, updatedAt: t });
          return {
            locked: wrongCount >= ATTENDANCE_MAX_WRONG,
            left: ATTENDANCE_MAX_WRONG - wrongCount,
          };
        });
        if (wrong?.locked)
          return refuse('locked', '已經輸入錯誤 5 次，這一節不能再輸入，請直接告訴老師');
        if (wrong)
          return refuse('wrong-code', `數字碼不對，還可以再試 ${wrong.left} 次`, {
            left: wrong.left,
          });
      }
      // 寫入簽到：在交易裡再讀一次節次。節次如果同時被結束，這筆交易會重跑並在這裡被拒絕。
      return db.runTransaction(async (tx) => {
        const cur = (await tx.get(sessionRef(courseId, sid))).data() as
          AttendanceSession | undefined;
        if (s.kind === 'trial') {
          const mine = await tx.get(trials(courseId, sid).doc(email));
          if (!sessionAcceptsCheckIn(cur, now())) return refuse('closed', '點名已經結束');
          if (!mine.exists) tx.set(trials(courseId, sid).doc(email), { email, at: t });
          return { result: 'trial', signedAt: t, ...label };
        }
        const ref = records(courseId, sid).doc(email);
        const old = (await tx.get(ref)).data() as AttendanceRecord | undefined;
        if (!sessionAcceptsCheckIn(cur, now())) return refuse('closed', '點名已經結束');
        if (old?.status === 'present')
          return { result: 'duplicate', signedAt: old.signedAt || 0, ...label };
        const record: AttendanceRecord = {
          ...(old || {}),
          email,
          uid: p.uid,
          studentId: String(p.studentId || ''),
          name: String(p.name || p.studentId || '未命名'),
          classId: p.classId,
          status: 'present',
          signedAt: t,
          via,
          ...(d.deviceId ? { deviceId: d.deviceId as string } : {}),
          ...(cur?.reopenedAt ? { reopened: true } : {}),
        };
        tx.set(ref, record);
        return { result: 'ok', signedAt: t, ...label };
      });
    }),
    /** 學生首頁橫幅：我的班級現在有沒有在點名。 */
    attendanceCurrent: onCall(options, async (req) => {
      const { p, c } = await access(req, req.data?.courseId);
      input(req.data, []);
      const courseId = req.data.courseId;
      if (p.teacher) return { session: null };
      const s = await current(courseId, c);
      if (!s || !s.classIds.includes(p.classId)) return { session: null };
      const email = String(p.email || '').toLowerCase();
      const mine =
        s.kind === 'roll'
          ? ((await records(courseId, s.id).doc(email).get()).data() as
              AttendanceRecord | undefined)
          : undefined;
      const wrongCount = (await attempts(courseId, s.id).doc(email).get()).data()?.wrongCount || 0;
      return {
        session: { id: s.id, kind: s.kind, date: s.date, period: s.period, endsAt: s.endsAt },
        now: now(),
        signedAt: mine?.status === 'present' ? mine.signedAt || 0 : 0,
        locked: wrongCount >= ATTENDANCE_MAX_WRONG,
      };
    }),
    /** 我的出缺席：只回自己的狀態與簽到時間；不含修改原因、修改人、同裝置提醒。 */
    attendanceMine: onCall(options, async (req) => {
      const { p } = await access(req, req.data?.courseId);
      input(req.data, []);
      const courseId = req.data.courseId;
      const email = String(p.email || '').toLowerCase();
      if (p.teacher || !validEmailKey(email)) return { rows: [] };
      const list = (await sessions(courseId).get()).docs
        .map((d) => d.data() as AttendanceSession)
        .filter(
          (s) => s.kind === 'roll' && s.status === 'closed' && s.classIds.includes(p.classId),
        );
      const rows = [];
      for (const s of list) {
        const r = (await records(courseId, s.id).doc(email).get()).data() as
          AttendanceRecord | undefined;
        if (r)
          rows.push({
            date: s.date,
            period: s.period,
            status: r.status,
            signedAt: r.status === 'present' && r.via !== 'teacher' ? r.signedAt || 0 : 0,
          });
      }
      rows.sort((a, b) => b.date.localeCompare(a.date) || b.period - a.period);
      return { rows };
    }),

    /* ═════════ 教師後台 ═════════ */
    attendanceSessions: onCall(options, async (req) => {
      const { c } = await teacher(req);
      input(req.data, []);
      const courseId = req.data.courseId;
      const open = await current(courseId, c);
      return {
        sessions: (await rollSessions(courseId, c)).map(publicSession),
        open: open ? publicSession(open) : null,
      };
    }),
    attendanceRoster: onCall(options, async (req) => {
      const { c } = await teacher(req);
      const d = input(req.data, ['sessionId']);
      const courseId = req.data.courseId;
      const s = await closedSession(courseId, c, d.sessionId);
      const rows = await allRecords(courseId, s.id);
      const locked = new Set(
        (await attempts(courseId, s.id).get()).docs
          .map((x) => x.data())
          .filter((a: any) => a.wrongCount >= ATTENDANCE_MAX_WRONG)
          .map((a: any) => a.email),
      );
      const same = sameDeviceGroups(rows);
      const nameOf = new Map(rows.map((r) => [r.email, r.name]));
      return {
        session: publicSession(s),
        rows: rows
          .sort(
            (a, b) => a.classId.localeCompare(b.classId) || a.studentId.localeCompare(b.studentId),
          )
          .map((r) => ({
            email: r.email,
            studentId: r.studentId,
            name: r.name,
            classId: r.classId,
            status: r.status,
            signedAt: r.signedAt || 0,
            via: r.via || 'auto',
            edited: r.edited === true,
            editedAt: r.editedAt || 0,
            reopened: r.reopened === true,
            locked: locked.has(r.email),
            sameDevice: (same[r.email] || []).map((e) => nameOf.get(e) || e),
            pendingMail: s.confirmedAt ? pendingStudentMail(r) : null,
            lastNotified: r.lastNotified || null,
          })),
      };
    }),
    /** 改狀態（準時↔未到）：單筆或多筆；每次修改都寫一筆修改紀錄（時間、改前→改後、原因、修改人）。 */
    attendanceSetStatus: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['sessionId', 'emails', 'status', 'reason']);
      const courseId = req.data.courseId;
      if (d.status !== 'present' && d.status !== 'absent') bad('狀態無效');
      const status = d.status as AttendanceStatus;
      if (
        !Array.isArray(d.emails) ||
        !d.emails.length ||
        d.emails.length > 200 ||
        d.emails.some((e) => !validEmailKey(e))
      )
        bad('學生清單無效');
      if (d.reason !== undefined && (typeof d.reason !== 'string' || d.reason.length > 200))
        bad('原因最多 200 字');
      const reason = String(d.reason || '').trim();
      const s = await closedSession(courseId, c, d.sessionId);
      let changed = 0;
      for (const email of [...new Set(d.emails as string[])]) {
        const ref = records(courseId, s.id).doc(email);
        const did = await db.runTransaction(async (tx) => {
          const [rSnap, sSnap] = [await tx.get(ref), await tx.get(sessionRef(courseId, s.id))];
          const r = rSnap.data() as AttendanceRecord | undefined;
          const cur = sSnap.data() as AttendanceSession;
          if (!r || r.status === status || cur.status !== 'closed') return false;
          const t = now();
          const counts = { ...(cur.counts || { present: 0, absent: 0 }) };
          counts[r.status] = Math.max(0, counts[r.status] - 1);
          counts[status]++;
          tx.set(ref, { ...r, status, edited: true, editedAt: t, via: 'teacher' });
          tx.set(sessionRef(courseId, s.id), { ...cur, counts });
          tx.set(audit(courseId).doc(`${t}-${random(6).toString('hex')}`), {
            at: t,
            sessionId: s.id,
            date: s.date,
            period: s.period,
            email,
            studentId: r.studentId,
            name: r.name,
            from: r.status,
            to: status,
            reason,
            by: p.uid,
            byName: String(p.name || p.email || ''),
          });
          return true;
        });
        if (did) changed++;
      }
      return { changed };
    }),
    /** 補建漏開的節次：全班預設未到，再逐一改。 */
    attendanceBackfill: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['classIds', 'period', 'date']);
      const courseId = req.data.courseId;
      let v: ReturnType<typeof validateStartInput>;
      try {
        if (!validAttendanceDate(d.date)) throw new Error('日期無效');
        v = validateStartInput(
          { classIds: d.classIds, period: d.period, date: d.date },
          c.classIds || [],
          taipeiDate(now()),
        );
      } catch (e) {
        return bad((e as Error).message);
      }
      if (v.date > taipeiDate(now())) bad('不能補建未來的節次');
      const id = sessionId(v.date, v.period, v.classIds);
      const same = (await sessions(courseId).where('date', '==', v.date).get()).docs.map(
        (x) => x.data() as AttendanceSession,
      );
      if (
        same.some(
          (s) =>
            s.kind === 'roll' &&
            s.period === v.period &&
            s.classIds.some((x) => v.classIds.includes(x)),
        )
      )
        throw new HttpsError('already-exists', '這一節已經有點名紀錄');
      const t = now();
      const s: AttendanceSession = {
        id,
        kind: 'roll',
        date: v.date,
        period: v.period,
        classIds: v.classIds,
        status: 'closed',
        startedAt: t,
        endsAt: t,
        closedAt: t,
        durationSec: 0,
        codeSec: 60,
        qrSec: 15,
        backfilled: true,
        settled: false,
      };
      await db.runTransaction(async (tx) => {
        if ((await tx.get(sessionRef(courseId, id))).exists)
          throw new HttpsError('already-exists', '這一節已經有點名紀錄');
        tx.set(sessionRef(courseId, id), { ...s, createdBy: p.uid });
      });
      await materialize(courseId, c, s);
      return {
        session: publicSession((await sessionRef(courseId, id).get()).data() as AttendanceSession),
      };
    }),
    attendanceSummary: onCall(options, async (req) => {
      const { c } = await teacher(req);
      const d = input(req.data, ['classId']);
      const courseId = req.data.courseId;
      if (d.classId !== undefined && !(c.classIds || []).includes(d.classId)) bad('班級不屬於課程');
      const list = (await rollSessions(courseId, c)).filter(
        (s) => s.status === 'closed' && (!d.classId || s.classIds.includes(d.classId as string)),
      );
      const data = [];
      for (const s of list)
        data.push({
          session: s,
          records: (await allRecords(courseId, s.id)).filter(
            (r) => !d.classId || r.classId === d.classId,
          ),
        });
      const out = attendanceSummary(data);
      return {
        sessions: out.sessions.map(publicSession),
        rows: out.rows.map((r) => ({
          email: r.email,
          studentId: r.studentId,
          name: r.name,
          classId: r.classId,
          present: r.present,
          absent: r.absent,
          cells: r.cells.map((x) => (x ? { status: x.status, edited: x.edited === true } : null)),
        })),
      };
    }),
    attendanceAuditLog: onCall(options, async (req) => {
      await teacher(req);
      input(req.data, []);
      const rows = (await audit(req.data.courseId).orderBy('at', 'desc').limit(300).get()).docs.map(
        (x) => x.data(),
      );
      return { rows };
    }),
    /** 匯出 CSV。課程封存後仍可匯出（教師權限不看封存）。 */
    attendanceExport: onCall(options, async (req) => {
      const { c } = await teacher(req);
      const d = input(req.data, ['kind', 'sessionId']);
      const courseId = req.data.courseId;
      if (d.kind === 'session') {
        const s = await closedSession(courseId, c, d.sessionId);
        return {
          filename: `點名_${courseId}_${s.date}_第${s.period}節.csv`,
          csv: attendanceSessionCsv(s, await allRecords(courseId, s.id)),
        };
      }
      if (d.kind !== 'detail' && d.kind !== 'summary') bad('匯出種類無效');
      const list = (await rollSessions(courseId, c)).filter((s) => s.status === 'closed');
      const data = [];
      for (const s of list) data.push({ session: s, records: await allRecords(courseId, s.id) });
      return d.kind === 'detail'
        ? {
            filename: `點名明細_${courseId}.csv`,
            csv: attendanceDetailCsv(courseInfo(courseId, c), data, now()),
          }
        : { filename: `點名總表_${courseId}.csv`, csv: attendanceSummaryCsv(data) };
    }),

    /* ═════════ 通知（半自動） ═════════ */
    /** 通知設定：導師姓名與信箱、信件署名、開啟 Gmail 用的帳號。系統不寄信，沒有寄信程式或密鑰。 */
    attendanceMailConfig: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['set']);
      const courseId = req.data.courseId;
      if (d.set !== undefined) {
        let set: Record<string, unknown>;
        try {
          set = onlyKeys(d.set, ['mentors', 'platformUrl', 'teacherName', 'gmailAccount']);
        } catch (e) {
          return bad((e as Error).message);
        }
        const patch: Record<string, unknown> = { updatedAt: now(), updatedBy: p.uid };
        if (set.mentors !== undefined) {
          if (!set.mentors || typeof set.mentors !== 'object' || Array.isArray(set.mentors))
            bad('導師設定無效');
          const mentors: Record<string, { name: string; email: string }> = {};
          for (const [classId, m] of Object.entries(set.mentors as Record<string, any>)) {
            if (!(c.classIds || []).includes(classId)) bad('班級不屬於課程');
            const name = String(m?.name || '').trim(),
              email = String(m?.email || '')
                .trim()
                .toLowerCase();
            if (name.length > 40 || (email && !validEmailKey(email))) bad('導師姓名或信箱無效');
            mentors[classId] = { name, email };
          }
          patch.mentors = mentors;
        }
        if (set.platformUrl !== undefined) {
          if (
            typeof set.platformUrl !== 'string' ||
            !/^https:\/\/[A-Za-z0-9.-]+(\/[A-Za-z0-9._~\/-]*)?$/.test(set.platformUrl) ||
            set.platformUrl.length > 200
          )
            bad('平台網址無效');
          patch.platformUrl = set.platformUrl;
        }
        if (set.teacherName !== undefined) {
          if (typeof set.teacherName !== 'string' || set.teacherName.length > 40) bad('署名無效');
          patch.teacherName = (set.teacherName as string).trim();
        }
        if (set.gmailAccount !== undefined) {
          const g = String(set.gmailAccount || '')
            .trim()
            .toLowerCase();
          if (typeof set.gmailAccount !== 'string' || (g && !validEmailKey(g)))
            bad('Gmail 帳號無效');
          patch.gmailAccount = g;
        }
        await configRef(courseId).set(patch, { merge: true });
      }
      const cfg = (await configRef(courseId).get()).data() || {};
      return {
        mentors: cfg.mentors || {},
        platformUrl: cfg.platformUrl || '',
        teacherName: cfg.teacherName || '',
        gmailAccount: cfg.gmailAccount || '',
      };
    }),
    /** 該節〔確認〕：確認後這一節的未到通知才會列入待寄。 */
    attendanceConfirm: onCall(options, async (req) => {
      const { c } = await teacher(req);
      const d = input(req.data, ['sessionId', 'confirmed']);
      const courseId = req.data.courseId;
      if (typeof d.confirmed !== 'boolean') bad('確認設定無效');
      const s = await closedSession(courseId, c, d.sessionId);
      await db.runTransaction(async (tx) => {
        const cur = (await tx.get(sessionRef(courseId, s.id))).data() as AttendanceSession;
        const next = { ...cur };
        if (d.confirmed) next.confirmedAt = cur.confirmedAt || now();
        else delete next.confirmedAt;
        tx.set(sessionRef(courseId, s.id), next);
      });
      return {
        session: publicSession(
          (await sessionRef(courseId, s.id).get()).data() as AttendanceSession,
        ),
      };
    }),
    /** 待通知的信件內容（收件人、主旨、內文）與通知紀錄。內文當場產生，不寫進資料庫。 */
    attendanceNotifyDrafts: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['date']);
      const courseId = req.data.courseId;
      if (d.date !== undefined && !validAttendanceDate(d.date)) bad('日期無效');
      const date = (d.date as string | undefined) || taipeiDate(now());
      const st = await notifyState(courseId, c, p, date);
      const t = now();
      const log: Record<string, unknown>[] = [];
      for (const m of (await mails(courseId).orderBy('updatedAt', 'desc').limit(100).get()).docs.map(
        (x) => x.data() as any,
      )) {
        if (m.kind === 'digest') {
          const marks: any[] = m.marks || [];
          const last = marks.map((k, i) => (k.undoneAt ? -1 : i)).reduce((a, b) => Math.max(a, b), -1);
          // 新的在前（同一時間標記時也維持順序）
          [...marks.entries()].reverse().forEach(([i, k]) =>
            log.push({
              id: `${m.id}#${i}`,
              key: `${m.id}#${i}`,
              kind: 'digest',
              to: m.to,
              name: m.name || '',
              classId: m.classId,
              date: m.date,
              periods: k.periods,
              status: k.undoneAt ? 'undone' : 'marked',
              markedAt: k.at,
              byName: k.byName || '',
              canUndo: i === last && !k.undoneAt && t - k.at <= DAY_MS,
            }),
          );
        } else {
          const r = (await records(courseId, m.sessionId).doc(m.to).get()).data();
          log.push({
            id: m.id,
            key: m.id,
            kind: m.kind,
            to: m.to,
            name: m.name || '',
            sessionId: m.sessionId,
            date: m.date,
            period: m.period,
            status: m.status,
            markedAt: m.markedAt,
            byName: m.byName || '',
            canUndo: m.status === 'marked' && r?.notifySeq === m.seq && t - m.markedAt <= DAY_MS,
          });
        }
      }
      log.sort((a: any, b: any) => b.markedAt - a.markedAt);
      return {
        date,
        student: st.student,
        digest: st.digest,
        noMentor: st.noMentor,
        unconfirmedToday: st.unconfirmedToday,
        gmailAccount: st.cfg.gmailAccount || String(p?.email || ''),
        log,
      };
    }),
    /** 老師自己寄出後標記「已通知」：每封都核對學生現況（expect），狀態已變就不標；同一封重按只算一次。 */
    attendanceMarkNotified: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['items']);
      const courseId = req.data.courseId;
      if (!Array.isArray(d.items) || !d.items.length || d.items.length > 100) bad('通知清單無效');
      const out = { marked: 0, already: 0, stale: 0 };
      for (const raw of d.items as unknown[]) {
        let item: Record<string, any>;
        try {
          item = onlyKeys(raw, ['draftId', 'expect']);
        } catch (e) {
          return bad((e as Error).message);
        }
        if (typeof item.draftId !== 'string' || !item.draftId || item.draftId.length > 400)
          bad('通知編號無效');
        const r = item.draftId.startsWith('digest__')
          ? await markDigest(courseId, c, p, item.draftId, item.expect)
          : await markStudent(courseId, p, item.draftId, item.expect);
        out[r]++;
      }
      return out;
    }),
    /** 撤銷「已通知」（按錯時用）：只限 24 小時內；學生信只能撤銷該生最新的一筆，導師彙整撤銷最近一次標記。 */
    attendanceUndoNotified: onCall(options, async (req) => {
      const { p } = await teacher(req);
      const d = input(req.data, ['logId']);
      const courseId = req.data.courseId;
      if (typeof d.logId !== 'string' || !/^[^/]{1,400}$/.test(d.logId)) bad('紀錄編號無效');
      // 導師每次標記共用一份文件；撤銷必須指向畫面上那一次，避免舊分頁或雙按撤銷別筆。
      const digestLog = (d.logId as string).startsWith('digest__')
        ? (d.logId as string).match(/^(.*)#(\d+)$/)
        : null;
      if ((d.logId as string).startsWith('digest__') && !digestLog) bad('紀錄編號無效');
      const ref = mails(courseId).doc(digestLog ? digestLog[1] : d.logId as string);
      const head = (await ref.get()).data() as any;
      if (!head) throw new HttpsError('not-found', '找不到這筆通知紀錄');
      if (head.kind === 'digest') {
        await db.runTransaction(async (tx) => {
          const m = (await tx.get(ref)).data() as any;
          const marks: any[] = (m?.marks || []).map((k: any) => ({ ...k }));
          const i = marks.map((k, j) => (k.undoneAt ? -1 : j)).reduce((a, b) => Math.max(a, b), -1);
          if (i < 0 || !digestLog || Number(digestLog[2]) !== i)
            throw new HttpsError('failed-precondition', '這筆不是最新的通知紀錄或已撤銷，請重新整理');
          const t = now();
          if (t - marks[i].at > DAY_MS)
            throw new HttpsError('failed-precondition', '超過 24 小時，不能撤銷');
          marks[i] = { ...marks[i], undoneAt: t, undoneBy: p.uid };
          const periods = (m.periods as number[]).filter((x) => !marks[i].periods.includes(x));
          tx.set(ref, {
            ...m,
            marks,
            periods,
            status: periods.length ? 'marked' : 'undone',
            updatedAt: t,
          });
        });
        return { ok: true };
      }
      const rRef = records(courseId, sessionRef(courseId, head.sessionId).id).doc(head.to);
      await db.runTransaction(async (tx) => {
        const [mSnap, rSnap] = [await tx.get(ref), await tx.get(rRef)];
        const m = mSnap.data() as any;
        const r = rSnap.data() as AttendanceRecord | undefined;
        if (!m || m.status !== 'marked') throw new HttpsError('failed-precondition', '這筆不能撤銷');
        const t = now();
        if (t - m.markedAt > DAY_MS)
          throw new HttpsError('failed-precondition', '超過 24 小時，不能撤銷');
        if (!r || r.notifySeq !== m.seq)
          throw new HttpsError('failed-precondition', '之後已有新的通知紀錄，不能撤銷這一筆');
        // 序號不倒退：撤銷後重新標記會得到新的序號與新的紀錄，舊紀錄保留為「已撤銷」。
        const { lastNotified: _drop, ...rest } = r;
        tx.set(rRef, m.prevLastNotified ? { ...rest, lastNotified: m.prevLastNotified } : rest);
        tx.set(ref, { ...m, status: 'undone', undoneAt: t, undoneBy: p.uid, updatedAt: t });
      });
      return { ok: true };
    }),
  };
}
