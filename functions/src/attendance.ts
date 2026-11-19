// 課堂點名（#67）：掃 QR／數字碼簽到、後台修改、學生查看、Email 通知。
// 規畫：docs/attendance/ATTENDANCE_PLAN_2026-11-16.md（v3＋第 0 節 23:10、23:16 教師決定）。
// 所有資料只經由這裡的 callable 讀寫；Firestore rules 對這些路徑全拒。
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Firestore } from 'firebase-admin/firestore';
import { featureAccess } from './features';
import { featureEnabled } from '../../shared/features';
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
  nextSendAt,
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
  validDailyTime,
  validDeviceId,
  validEmailKey,
  validateClassIds,
  validateStartInput,
} from '../../shared/attendance';

export type AttendanceMailer = (
  endpoint: { url: string; key: string },
  mail: {
    mailId: string;
    to: string;
    subject: string;
    text: string;
    fromName: string;
    forceResend?: boolean;
  },
) => Promise<{ duplicate?: boolean } | void>;
type Deps = { now?: () => number; sendMail?: AttendanceMailer; random?: (n: number) => Buffer };
type Member = { email: string; studentId: string; name: string; classId: string };

/** 預設寄信方式：呼叫教師自己學校帳號裡的 Apps Script 網頁程式（apps-script/AttendanceMailer.gs）。 */
export const appsScriptMailer: AttendanceMailer = async (endpoint, mail) => {
  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: endpoint.key, ...mail }),
    redirect: 'follow',
    // 逾時就當作結果不明：這封信會還原成待寄，下次用同一個 mailId 重送，由寄信程式去重。
    signal: AbortSignal.timeout(30000),
  });
  const body: any = await res.json().catch(() => null);
  if (!res.ok || body?.ok !== true) {
    const err: any = new Error(String(body?.error || `寄信程式回應 ${res.status}`).slice(0, 200));
    if (body?.uncertain === true) err.uncertain = true;
    throw err;
  }
  return { duplicate: body.duplicate === true };
};

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
  const sendMail = deps.sendMail || appsScriptMailer;
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
  const mailerRef = (c: string) => db.doc(`courses/${c}/attendanceSecrets/mailer`);
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
  const pendingMail = async (courseId: string, c: any, date: string) => {
    const list = (await rollSessions(courseId, c)).filter((s) => s.status === 'closed');
    const confirmed = list.filter((s) => s.confirmedAt);
    const student: {
      session: AttendanceSession;
      record: AttendanceRecord;
      kind: 'absent' | 'correction';
    }[] = [];
    const bySession = new Map<string, AttendanceRecord[]>();
    for (const s of confirmed) {
      const rs = await allRecords(courseId, s.id);
      bySession.set(s.id, rs);
      for (const record of rs) {
        const kind = pendingStudentMail(record);
        if (kind) student.push({ session: s, record, kind });
      }
    }
    const cfg = (await configRef(courseId).get()).data() || {};
    const mentors: Record<string, { name?: string; email?: string }> = cfg.mentors || {};
    const digest: {
      classId: string;
      mentor: { name: string; email: string };
      sessions: { session: AttendanceSession; records: AttendanceRecord[] }[];
    }[] = [];
    const today = confirmed.filter((s) => s.date === date);
    for (const classId of [...new Set(today.flatMap((s) => s.classIds))].sort()) {
      const m = mentors[classId];
      if (!m?.email) continue;
      const done = (
        await mails(courseId)
          .doc(`digest__${date}__${encodeURIComponent(classId)}`)
          .get()
      ).data();
      if (done && (done.status === 'sent' || done.status === 'sending' || done.status === 'uncertain'))
        continue;
      digest.push({
        classId,
        mentor: { name: String(m.name || ''), email: m.email },
        sessions: today
          .filter((s) => s.classIds.includes(classId))
          .map((s) => ({ session: s, records: bySession.get(s.id)! })),
      });
    }
    return {
      student,
      digest,
      unconfirmedToday: list.filter((s) => s.date === date && !s.confirmedAt).map(publicSession),
    };
  };
  /** 寄出目前待寄的信。每封信先在交易裡「認領」（同時更新紀錄的通知狀態並建立寄送紀錄），再呼叫寄信程式，所以同一封不會寄兩次。 */
  const runSend = async (courseId: string, c: any, p: any, kinds: string[], only?: string) => {
    const endpoint = (await mailerRef(courseId).get()).data();
    if (!endpoint?.url || !endpoint?.key)
      throw new HttpsError(
        'failed-precondition',
        '尚未設定寄信程式（請先到點名頁的寄信設定貼上網址與密鑰）',
      );
    const date = taipeiDate(now());
    const { ctx } = await mailContext(courseId, c, p);
    const pending = await pendingMail(courseId, c, date);
    const out = { sent: 0, failed: 0, skipped: 0 };
    const deliver = async (
      mailId: string,
      to: string,
      mail: { subject: string; text: string },
      onFail?: () => Promise<void>,
    ) => {
      try {
        // mailId 一併送給寄信程式：同一個 mailId 寄信程式只會寄一次（結果不明後重送也不會變成兩封）。
        const result = await sendMail(
          { url: endpoint.url, key: endpoint.key },
          { mailId, to, ...mail, fromName: ctx.teacherName },
        );
        await mails(courseId)
          .doc(mailId)
          .set(
            {
              status: 'sent',
              sentAt: now(),
              ...(result && result.duplicate ? { deduped: true } : {}),
            },
            { merge: true },
          );
        out.sent++;
      } catch (e) {
        if ((e as any)?.uncertain === true) {
          // Apps Script 端存在未確認的占位：暫停自動重寄（不還原 notifySeq / 維持 uncertain 狀態），待教師確認後處理。
          await mails(courseId)
            .doc(mailId)
            .set(
              {
                status: 'uncertain',
                uncertainAt: now(),
                error: String((e as Error).message || e).slice(0, 200),
              },
              { merge: true },
            );
          out.failed++;
          return;
        }
        await mails(courseId)
          .doc(mailId)
          .set(
            {
              status: 'failed',
              failedAt: now(),
              error: String((e as Error).message || e).slice(0, 200),
            },
            { merge: true },
          );
        if (onFail) await onFail();
        out.failed++;
      }
    };
    if (kinds.includes('student'))
      for (const item of pending.student.slice(0, 300)) {
        if (only && only !== item.session.id) continue;
        const ref = records(courseId, item.session.id).doc(item.record.email);
        const claim = await db.runTransaction(async (tx) => {
          const [rSnap, sSnap] = [
            await tx.get(ref),
            await tx.get(sessionRef(courseId, item.session.id)),
          ];
          const r = rSnap.data() as AttendanceRecord | undefined;
          const s = sSnap.data() as AttendanceSession | undefined;
          const kind = r && s?.confirmedAt ? pendingStudentMail(r) : null;
          if (!r || !kind) return null;
          const seq = (r.notifySeq || 0) + 1;
          const mailId = `${item.session.id}__${r.email}__${seq}`;
          tx.set(ref, { ...r, lastNotified: r.status, notifySeq: seq });
          tx.set(mails(courseId).doc(mailId), {
            id: mailId,
            kind,
            to: r.email,
            name: r.name,
            sessionId: item.session.id,
            status: 'sending',
            createdAt: now(),
            by: p?.uid || 'schedule',
          });
          return { mailId, kind, seq, previous: r.lastNotified, name: r.name, email: r.email };
        });
        if (!claim) {
          out.skipped++;
          continue;
        }
        const mail =
          claim.kind === 'absent'
            ? absentMail(ctx, item.session, claim.name)
            : correctionMail(ctx, item.session, claim.name);
        await deliver(claim.mailId, claim.email, mail, () =>
          // 寄失敗或結果不明：把通知狀態與序號都還原，這封信會回到待寄，而且下次認領會得到同一個 mailId，
          // 寄信程式因此能認出「這封其實寄過了」而不再寄。如果期間又有新的認領就不動。
          db.runTransaction(async (tx) => {
            const r = (await tx.get(ref)).data() as AttendanceRecord | undefined;
            if (!r || r.notifySeq !== claim.seq) return;
            const { lastNotified: _drop, ...rest } = r;
            const back = { ...rest, notifySeq: claim.seq - 1 };
            tx.set(ref, claim.previous ? { ...back, lastNotified: claim.previous } : back);
          }),
        );
      }
    if (kinds.includes('mentor') && !only)
      for (const d of pending.digest) {
        const mailId = `digest__${date}__${encodeURIComponent(d.classId)}`;
        const claimed = await db.runTransaction(async (tx) => {
          const old = (await tx.get(mails(courseId).doc(mailId))).data();
          if (old && (old.status === 'sent' || old.status === 'sending' || old.status === 'uncertain'))
            return false;
          tx.set(mails(courseId).doc(mailId), {
            id: mailId,
            kind: 'digest',
            to: d.mentor.email,
            name: d.mentor.name,
            classId: d.classId,
            date,
            status: 'sending',
            createdAt: now(),
            by: p?.uid || 'schedule',
          });
          return true;
        });
        if (!claimed) {
          out.skipped++;
          continue;
        }
        await deliver(
          mailId,
          d.mentor.email,
          mentorDigestMail(ctx, d.classId, d.mentor.name, date, d.sessions),
        );
      }
    return out;
  };
  const reschedule = async (courseId: string) => {
    const cfg = (await configRef(courseId).get()).data() || {};
    await db.doc(`courses/${courseId}`).update({ attendanceNextSendAt: nextSendAt(now(), cfg) });
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

    /* ═════════ Email ═════════ */
    /** 寄信設定：導師姓名與信箱、每日預設寄送時間、寄信程式網址與密鑰。密鑰只寫不讀，不回傳前端。 */
    attendanceMailConfig: onCall(options, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['set']);
      const courseId = req.data.courseId;
      if (d.set !== undefined) {
        let set: Record<string, unknown>;
        try {
          set = onlyKeys(d.set, [
            'mentors',
            'dailyTime',
            'platformUrl',
            'teacherName',
            'mailerUrl',
            'mailerKey',
          ]);
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
        if (set.dailyTime !== undefined) {
          if (set.dailyTime !== '' && !validDailyTime(set.dailyTime))
            bad('每日寄送時間格式為 HH:MM');
          patch.dailyTime = set.dailyTime;
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
        if (set.mailerUrl !== undefined || set.mailerKey !== undefined) {
          if (
            typeof set.mailerUrl !== 'string' ||
            !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(set.mailerUrl)
          )
            bad('寄信程式網址須為 https://script.google.com/macros/s/…/exec');
          if (typeof set.mailerKey !== 'string' || !/^[A-Za-z0-9_-]{24,200}$/.test(set.mailerKey))
            bad('密鑰需為 24 個字以上的英數字');
          await mailerRef(courseId).set({
            url: set.mailerUrl,
            key: set.mailerKey,
            updatedAt: now(),
            updatedBy: p.uid,
          });
        }
        await configRef(courseId).set(patch, { merge: true });
        await reschedule(courseId);
      }
      const cfg = (await configRef(courseId).get()).data() || {};
      return {
        mentors: cfg.mentors || {},
        dailyTime: cfg.dailyTime || '',
        scheduledAt: cfg.scheduledAt || 0,
        platformUrl: cfg.platformUrl || '',
        teacherName: cfg.teacherName || '',
        mailerReady: !!(await mailerRef(courseId).get()).data()?.url,
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
    /** 待寄清單、今天尚未確認的節次、排程與最近的寄送紀錄。 */
    attendanceMailStatus: onCall(options, async (req) => {
      const { c } = await teacher(req);
      input(req.data, []);
      const courseId = req.data.courseId;
      const pending = await pendingMail(courseId, c, taipeiDate(now()));
      const cfg = (await configRef(courseId).get()).data() || {};
      const log = (await mails(courseId).orderBy('createdAt', 'desc').limit(100).get()).docs
        .map((x) => x.data())
        .map((m: any) => ({
          id: m.id,
          kind: m.kind,
          to: m.to,
          name: m.name || '',
          sessionId: m.sessionId || '',
          classId: m.classId || '',
          date: m.date || '',
          status: m.status,
          createdAt: m.createdAt,
          sentAt: m.sentAt || 0,
          error: m.error || '',
        }));
      return {
        student: pending.student.map((x) => ({
          sessionId: x.session.id,
          date: x.session.date,
          period: x.session.period,
          email: x.record.email,
          name: x.record.name,
          kind: x.kind,
        })),
        digest: pending.digest.map((x) => ({
          classId: x.classId,
          mentorName: x.mentor.name,
          mentorEmail: x.mentor.email,
          periods: x.sessions.map((y) => y.session.period),
        })),
        unconfirmedToday: pending.unconfirmedToday,
        dailyTime: cfg.dailyTime || '',
        scheduledAt: cfg.scheduledAt || 0,
        nextSendAt: nextSendAt(now(), cfg),
        mailerReady: !!(await mailerRef(courseId).get()).data()?.url,
        lastAuto: cfg.lastAuto
          ? {
              at: Number(cfg.lastAuto.at) || 0,
              sent: Number(cfg.lastAuto.sent) || 0,
              failed: Number(cfg.lastAuto.failed) || 0,
              error: String(cfg.lastAuto.error || ''),
            }
          : null,
        log,
      };
    }),
    /** 寄信時間由老師決定：現在寄出、設定一次性的時間、取消排定；另可把中斷的信放回待寄。 */
    attendanceSendMail: onCall({ ...options, timeoutSeconds: 300 }, async (req) => {
      const { p, c } = await teacher(req);
      const d = input(req.data, ['mode', 'at', 'kinds', 'sessionId', 'mailId']);
      const courseId = req.data.courseId;
      const kinds = d.kinds === undefined ? ['student', 'mentor'] : d.kinds;
      if (
        !Array.isArray(kinds) ||
        !kinds.length ||
        kinds.some((k) => k !== 'student' && k !== 'mentor')
      )
        bad('信件種類無效');
      if (d.mode === 'now') {
        if (d.sessionId !== undefined) sessionRef(courseId, d.sessionId);
        return runSend(courseId, c, p, kinds as string[], d.sessionId as string | undefined);
      }
      if (d.mode === 'schedule') {
        if (
          typeof d.at !== 'number' ||
          !Number.isFinite(d.at) ||
          d.at <= now() ||
          d.at > now() + 7 * 86400000
        )
          bad('排定時間需在現在之後、7 天以內');
        await configRef(courseId).set({ scheduledAt: Math.floor(d.at as number) }, { merge: true });
      } else if (d.mode === 'cancel') {
        await configRef(courseId).set({ scheduledAt: 0 }, { merge: true });
      } else if (d.mode === 'requeue') {
        // 寄送中斷（停在 sending 超過 10 分鐘）：標成失敗並還原通知狀態，讓它回到待寄；不會自動重寄。
        if (typeof d.mailId !== 'string' || d.mailId.length > 400) bad('信件無效');
        const ref = mails(courseId).doc(d.mailId as string);
        const m = (await ref.get()).data();
        if (!m || m.status !== 'sending' || now() - m.createdAt < 600000)
          throw new HttpsError('failed-precondition', '這封信不需要處理');
        await ref.set(
          { status: 'failed', failedAt: now(), error: '寄送中斷，已放回待寄' },
          { merge: true },
        );
        if (m.kind !== 'digest') {
          const rRef = records(courseId, m.sessionId).doc(m.to);
          await db.runTransaction(async (tx) => {
            const r = (await tx.get(rRef)).data() as AttendanceRecord | undefined;
            if (!r || `${m.sessionId}__${r.email}__${r.notifySeq}` !== m.id) return;
            const { lastNotified: _drop, ...rest } = r;
            const back = { ...rest, notifySeq: Math.max(0, (r.notifySeq || 1) - 1) }; // 下次認領沿用同一個 mailId
            tx.set(rRef, m.kind === 'correction' ? { ...back, lastNotified: 'absent' } : back);
          });
        }
      } else if (d.mode === 'confirmSent') {
        if (typeof d.mailId !== 'string' || d.mailId.length > 400) bad('信件無效');
        const ref = mails(courseId).doc(d.mailId as string);
        await db.runTransaction(async (tx) => {
          const m = (await tx.get(ref)).data();
          if (!m || m.status !== 'uncertain')
            throw new HttpsError('failed-precondition', '這封信不需要處理');
          tx.set(
            ref,
            { status: 'sent', sentAt: now(), error: '', confirmedBy: p?.uid || '' },
            { merge: true },
          );
        });
        return { ok: true };
      } else if (d.mode === 'resendOne') {
        if (typeof d.mailId !== 'string' || d.mailId.length > 400) bad('信件無效');
        const endpoint = (await mailerRef(courseId).get()).data();
        if (!endpoint?.url || !endpoint?.key)
          throw new HttpsError(
            'failed-precondition',
            '尚未設定寄信程式（請先到點名頁的寄信設定貼上網址與密鑰）',
          );
        const ref = mails(courseId).doc(d.mailId as string);
        const claim = await db.runTransaction(async (tx) => {
          const m = (await tx.get(ref)).data();
          if (!m || m.status !== 'uncertain')
            throw new HttpsError('failed-precondition', '這封信不需要處理');
          let sessionDoc: AttendanceSession | undefined;
          if (m.kind !== 'digest') {
            const [rSnap, sSnap] = await Promise.all([
              tx.get(records(courseId, m.sessionId).doc(m.to)),
              tx.get(sessionRef(courseId, m.sessionId)),
            ]);
            const r = rSnap.data() as AttendanceRecord | undefined;
            sessionDoc = sSnap.data() as AttendanceSession | undefined;
            if (!r || !sessionDoc)
              throw new HttpsError('failed-precondition', '找不到對應的點名紀錄或節次');
            const expectedStatus = m.kind === 'correction' ? 'present' : 'absent';
            if (r.status !== expectedStatus || `${m.sessionId}__${r.email}__${r.notifySeq}` !== m.id)
              throw new HttpsError(
                'failed-precondition',
                '學生點名狀態已變更，這封舊通知已過時，不可重送',
              );
          }
          const resendSeq = Number(m.resendSeq || 0) + 1;
          tx.set(
            ref,
            { status: 'sending', resendSeq, sendingAt: now(), error: '' },
            { merge: true },
          );
          return { m, resendSeq, sessionDoc };
        });
        const { m, resendSeq, sessionDoc } = claim;
        const { ctx } = await mailContext(courseId, c, p);
        let mail: { subject: string; text: string };
        if (m.kind === 'digest') {
          const confirmed = (await sessions(courseId).where('date', '==', m.date).get()).docs
            .map((x) => x.data() as AttendanceSession)
            .filter((s) => s.confirmedAt && s.classIds.includes(m.classId))
            .sort((a, b) => a.period - b.period);
          const digestSessions = await Promise.all(
            confirmed.map(async (s) => ({
              session: s,
              records: (await records(courseId, s.id).get()).docs
                .map((r) => r.data() as AttendanceRecord)
                .filter((r) => r.classId === m.classId),
            })),
          );
          mail = mentorDigestMail(ctx, m.classId, m.name || '', m.date, digestSessions);
        } else {
          mail =
            m.kind === 'correction'
              ? correctionMail(ctx, sessionDoc!, m.name || m.to)
              : absentMail(ctx, sessionDoc!, m.name || m.to);
        }
        try {
          const result = await sendMail(
            { url: endpoint.url, key: endpoint.key },
            { mailId: m.id, to: m.to, ...mail, fromName: ctx.teacherName, forceResend: true },
          );
          await db.runTransaction(async (tx) => {
            const cur = (await tx.get(ref)).data();
            if (!cur || cur.status !== 'sending' || Number(cur.resendSeq || 0) !== resendSeq) return;
            tx.set(
              ref,
              {
                status: 'sent',
                sentAt: now(),
                error: '',
                resentBy: p?.uid || '',
                ...(result && result.duplicate ? { deduped: true } : {}),
              },
              { merge: true },
            );
          });
          return { ok: true, deduped: !!(result && result.duplicate) };
        } catch (e) {
          await db.runTransaction(async (tx) => {
            const cur = (await tx.get(ref)).data();
            if (!cur || cur.status !== 'sending' || Number(cur.resendSeq || 0) !== resendSeq) return;
            tx.set(
              ref,
              {
                status: 'uncertain',
                failedAt: now(),
                error: String((e as Error).message || e).slice(0, 200),
              },
              { merge: true },
            );
          });
          throw e;
        }
      } else bad('寄送方式無效');
      await reschedule(courseId);
      const cfg = (await configRef(courseId).get()).data() || {};
      return { scheduledAt: cfg.scheduledAt || 0, nextSendAt: nextSendAt(now(), cfg) };
    }),
    /** 每 5 分鐘檢查：老師排定的時間（一次性或每日預設）到了就寄出待寄的信。沒有設定時間的課程不會被寄。 */
    attendanceMailTick: onSchedule(
      { ...options, timeoutSeconds: 540, schedule: 'every 5 minutes', timeZone: 'Asia/Taipei' },
      async () => {
        const due = await db
          .collection('courses')
          .where('attendanceNextSendAt', '>', 0)
          .where('attendanceNextSendAt', '<=', now())
          .get();
        for (const doc of due.docs) {
          const c: any = doc.data();
          try {
            // 先把一次性排定清掉並算好下一次，再寄；即使這一輪中途失敗也不會整批重跑。
            await configRef(doc.id).set({ scheduledAt: 0 }, { merge: true });
            await reschedule(doc.id);
            if (featureEnabled(c, 'attendance') && !c.archived) {
              const result = await runSend(doc.id, c, null, ['student', 'mentor']);
              console.log('attendanceMailTick', doc.id, JSON.stringify(result));
              // 讓寄信分頁看得到「上次自動寄送」的結果。
              await configRef(doc.id).set(
                { lastAuto: { at: now(), ...result, error: '' } },
                { merge: true },
              );
            }
          } catch (e) {
            console.error('attendanceMailTick', doc.id, String(e));
            const error = String((e as Error)?.message || e).slice(0, 200);
            await configRef(doc.id)
              .set(
                { lastAuto: { at: now(), sent: 0, failed: 0, skipped: 0, error } },
                { merge: true },
              )
              .catch(() => undefined);
          }
        }
      },
    ),
  };
}
