const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createAttendanceHandlers,
  attendanceCode,
  attendanceToken,
  parseAttendanceToken,
} = require('../lib/functions/src/attendance.js');
const A = require('../lib/shared/attendance.js');
const { memoryDb } = require('./helpers/attendance-memory.cjs');

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
/** 在 Node 裡執行 Apps Script 寄信程式；PropertiesService、LockService、MailApp、Date 等換成假的。 */
function loadMailerScript({
  key,
  onSend,
  quota = 1500,
  now = () => Date.now(),
  initialProps = {},
  maxStorageBytes = Infinity,
}) {
  const props = new Map(Object.entries(initialProps));
  if (key !== undefined) props.set('MAIL_KEY', key);
  const state = {
    quota,
    locks: 0,
    sentCount: 0,
    failSend: false,
    failQuotaAfterSend: false,
    failPropWrite: false,
    failPropDelete: false,
    propWriteRemaining: Infinity,
  };
  const propsBytes = () => {
    let total = 0;
    for (const [k, v] of props.entries()) total += k.length + v.length;
    return total;
  };
  const FakeDate = Object.assign(
    function (...args) {
      return args.length ? new Date(...args) : new Date(now());
    },
    { now: () => now(), parse: Date.parse, UTC: Date.UTC },
  );
  const sandbox = {
    Date: FakeDate,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (props.has(k) ? props.get(k) : null),
        setProperty: (k, v) => {
          if (state.failPropWrite || state.propWriteRemaining <= 0) {
            throw new Error('Service invoked too many times for one day: properties');
          }
          const strV = String(v);
          const prev = props.has(k) ? k.length + props.get(k).length : 0;
          const nextTotal = propsBytes() - prev + k.length + strV.length;
          if (nextTotal > maxStorageBytes) {
            throw new Error('You have exceeded the property storage limit.');
          }
          if (Number.isFinite(state.propWriteRemaining)) state.propWriteRemaining--;
          props.set(k, strV);
        },
        deleteProperty: (k) => {
          if (state.failPropDelete) {
            throw new Error('Service invoked too many times for one day: properties');
          }
          props.delete(k);
        },
        getProperties: () => Object.fromEntries(props.entries()),
      }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => void state.locks++,
        releaseLock: () => void state.locks--,
      }),
    },
    MailApp: {
      getRemainingDailyQuota: () => {
        if (state.failQuotaAfterSend && state.sentCount > 0) {
          throw new Error('模擬寄後額度查詢失敗');
        }
        return state.quota;
      },
      sendEmail: (to, subject, text, options) => {
        if (state.failSend) throw new Error('模擬 MailApp 寄信失敗');
        state.quota--;
        state.sentCount++;
        onSend({ to, subject, text, fromName: options.name || '' });
      },
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({
        text,
        setMimeType() {
          return this;
        },
      }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, text) => [
        ...require('node:crypto').createHash(alg).update(text, 'utf8').digest(),
      ],
      base64EncodeWebSafe: (bytes) => Buffer.from(bytes).toString('base64url'),
    },
    Session: { getActiveUser: () => ({ getEmail: () => 'teacher@example.edu' }) },
  };
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '../../apps-script/AttendanceMailer.gs'), 'utf8'),
    sandbox,
  );
  return {
    state,
    props,
    post: (body) =>
      JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(body) } }).text),
    get: () => sandbox.doGet().text,
  };
}
const COURSE = '115-1-AP2';
const T0 = Date.parse('2026-11-16T01:10:00Z'); // 台北 09:10
function setup({ feature = true } = {}) {
  const db = memoryDb();
  let clock = T0;
  const course = {
    features: { attendance: feature },
    rosterVersion: 2,
    published: { title: '解剖生理學（二）', classIds: ['A', 'B'] },
    teacherIds: ['owner'],
  };
  db.docs.set(`courses/${COURSE}`, structuredClone(course));
  const student = (i, classId = 'A') => ({
    uid: 's' + i,
    email: `s${i}@example.edu`,
    classId,
    name: '示範學生' + i,
    studentId: '09900' + i,
  });
  for (let i = 1; i <= 5; i++)
    db.docs.set(`enrollments/${COURSE}__s${i}@example.edu`, {
      ...student(i),
      courseId: COURSE,
      enabled: true,
    });
  for (let i = 6; i <= 7; i++)
    db.docs.set(`enrollments/${COURSE}__s${i}@example.edu`, {
      ...student(i, 'B'),
      courseId: COURSE,
      enabled: true,
    });
  db.docs.set(`enrollments/${COURSE}__s8@example.edu`, {
    ...student(8),
    courseId: COURSE,
    enabled: false,
  });
  db.docs.set(`enrollments/OTHER__x@example.edu`, {
    ...student(9),
    courseId: 'OTHER',
    enabled: true,
  });
  const access = async (req, id, teacherOnly) => {
    if (!req.auth) throw Error('unauthenticated');
    if (id !== COURSE) throw Error('permission');
    if (req.auth.teacher) {
      if (req.auth.uid !== 'owner') throw Error('permission');
      return { p: req.auth, c: { ...course, classIds: ['A', 'B'] } };
    }
    if (teacherOnly) throw Error('permission');
    return { p: req.auth, c: course };
  };
  // 寄信端點：直接執行 apps-script/AttendanceMailer.gs（Google 服務換成假的），所以去重邏輯測的是真正會部署的那份程式。
  const sent = [];
  const gas = loadMailerScript({
    key: 'k'.repeat(32),
    onSend: (m) => sent.push(m),
    now: () => clock,
  });
  let failNext = 0;
  let loseReplyNext = 0;
  const posted = [];
  const sendMail = async (endpoint, mail) => {
    assert.equal(endpoint.url, 'https://script.google.com/macros/s/FAKE/exec');
    if (failNext > 0) {
      failNext--;
      throw Error('模擬寄信失敗'); // 要求沒有送到寄信程式
    }
    posted.push(mail.mailId);
    const reply = gas.post({ key: endpoint.key, ...mail });
    if (loseReplyNext > 0) {
      loseReplyNext--;
      throw Error('寄信程式回應 200'); // 寄信程式已處理，但平台沒收到可解析的回應
    }
    if (reply.ok !== true) {
      const err = Error(reply.error);
      if (reply.uncertain === true) err.uncertain = true;
      throw err;
    }
    return { duplicate: reply.duplicate === true };
  };
  let n = 0;
  const h = createAttendanceHandlers(
    db,
    access,
    {},
    { now: () => clock, sendMail, random: (len) => Buffer.alloc(len, ++n) },
  );
  const owner = { uid: 'owner', teacher: true, name: '示範教師', email: 'teacher@example.edu' };
  const call = (name, data = {}, auth = owner) =>
    h[name].run({ data: { courseId: COURSE, ...data }, auth });
  const secret = (sid) => db.docs.get(`courses/${COURSE}/attendanceSecrets/${sid}`).secret;
  const start = async (extra = {}) =>
    (await call('attendanceStart', { classIds: ['A'], period: 3, ...extra })).session;
  const reason = async (promise) => {
    try {
      await promise;
    } catch (e) {
      return e.details?.reason || e.code || e.message;
    }
    return 'resolved';
  };
  const mailer = () =>
    call('attendanceMailConfig', {
      set: {
        mailerUrl: 'https://script.google.com/macros/s/FAKE/exec',
        mailerKey: 'k'.repeat(32),
        mentors: { A: { name: '示範導師', email: 'mentor-a@example.edu' } },
        platformUrl: 'https://platform.example.edu/',
        teacherName: '示範教師',
      },
    });
  return {
    db,
    h,
    call,
    student,
    start,
    secret,
    reason,
    sent,
    mailer,
    course,
    owner,
    tick: (ms) => (clock += ms),
    now: () => clock,
    failNext: (k) => (failNext = k),
    loseReplyNext: (k) => (loseReplyNext = k),
    posted,
    gas,
  };
}
const live = (x) => x.call('attendanceLive');

test('1 碼與 QR 憑證：區段計算、接受目前與上一組、過期拒絕、簽章不可偽造', async () => {
  assert.equal(A.stepIndex(T0 + 59999, T0, 60), 0);
  assert.equal(A.stepIndex(T0 + 60000, T0, 60), 1);
  assert.deepEqual(A.acceptedSteps(T0 + 61000, T0, 60), [1, 0]);
  assert.deepEqual(A.acceptedSteps(T0 + 1000, T0, 60), [0]);
  const x = setup();
  const s = await x.start({ durationSec: 120, qrSec: 15, codeSec: 30 });
  const l0 = await live(x);
  assert.match(l0.code, /^\d{4}$/);
  assert.equal(l0.code, attendanceCode(x.secret(s.id), COURSE, s.id, 0));
  assert.deepEqual(parseAttendanceToken(l0.token), {
    sessionId: s.id,
    step: 0,
    signature: l0.token.split('.')[2],
  });
  x.tick(16000); // 進入第 1 組：上一組仍接受
  assert.equal((await x.call('attendanceCheckIn', { token: l0.token }, x.student(1))).result, 'ok');
  x.tick(15000); // 第 2 組：第 0 組過期
  assert.equal(
    await x.reason(x.call('attendanceCheckIn', { token: l0.token }, x.student(2))),
    'expired',
  );
  // 偽造：改區段編號、改簽章、用別的秘密值、用別的課程
  const good = (await live(x)).token;
  const [sid, step, sig] = good.split('.');
  for (const fake of [
    `${sid}.${Number(step) + 1}.${sig}`,
    `${sid}.${step}.${sig.slice(0, -1)}${sig.at(-1) === 'A' ? 'B' : 'A'}`,
    attendanceToken('other-secret', COURSE, sid, Number(step)),
    attendanceToken(x.secret(sid), 'OTHER', sid, Number(step)),
    'x',
    ''.padEnd(300, 'a'),
  ])
    assert.equal(
      await x.reason(x.call('attendanceCheckIn', { token: fake }, x.student(2))),
      'expired',
      fake,
    );
  assert.equal((await x.call('attendanceCheckIn', { token: good }, x.student(2))).result, 'ok');
  // 數字碼：目前與上一組接受，更早的拒絕
  x.tick(30000); // 第 2 組：第 0 組的碼已是兩組之前
  const oldCode = attendanceCode(x.secret(s.id), COURSE, s.id, 0);
  const curCode = (await live(x)).code;
  if (oldCode !== curCode)
    assert.equal(
      await x.reason(x.call('attendanceCheckIn', { code: oldCode }, x.student(3))),
      'wrong-code',
    );
  assert.equal((await x.call('attendanceCheckIn', { code: curCode }, x.student(4))).result, 'ok');
  // 學生拿不到碼與憑證
  await assert.rejects(x.call('attendanceLive', {}, x.student(1)));
  assert(
    !JSON.stringify(await x.call('attendanceCurrent', {}, x.student(3))).match(
      /secret|token|"code"/,
    ),
  );
});

test('1 數字碼錯 5 次鎖住，鎖住後正確的碼也不能簽，老師可在後台改', async () => {
  const x = setup();
  const s = await x.start();
  const code = (await live(x)).code;
  const wrong = code === '0000' ? '1111' : '0000';
  for (let i = 4; i >= 1; i--) {
    try {
      await x.call('attendanceCheckIn', { code: wrong }, x.student(1));
      assert.fail();
    } catch (e) {
      assert.equal(e.details.reason, 'wrong-code');
      assert.equal(e.details.left, i);
    }
  }
  assert.equal(
    await x.reason(x.call('attendanceCheckIn', { code: wrong }, x.student(1))),
    'locked',
  );
  assert.equal(await x.reason(x.call('attendanceCheckIn', { code }, x.student(1))), 'locked');
  assert.equal((await x.call('attendanceCurrent', {}, x.student(1))).locked, true);
  assert.equal(
    (await x.call('attendanceCheckIn', { code }, x.student(2))).result,
    'ok',
    '別人不受影響',
  );
  await x.call('attendanceControl', { action: 'end' });
  const roster = await x.call('attendanceRoster', { sessionId: s.id });
  assert.equal(roster.rows.find((r) => r.email === 's1@example.edu').locked, true);
  assert.equal(
    (
      await x.call('attendanceSetStatus', {
        sessionId: s.id,
        emails: ['s1@example.edu'],
        status: 'present',
      })
    ).changed,
    1,
  );
});

test('2 簽到：非本班、非開啟中、已結束（含寬限）、教師身分一律拒；重複簽到回原結果；自動結束後未簽到＝未到', async () => {
  const x = setup();
  assert.equal(
    await x.reason(x.call('attendanceCheckIn', { code: '1234' }, x.student(1))),
    'closed',
    '沒有進行中的點名',
  );
  const s = await x.start();
  const l = await live(x);
  assert.equal(
    await x.reason(x.call('attendanceCheckIn', { token: l.token }, x.student(6, 'B'))),
    'not-in-class',
  );
  assert.equal(await x.reason(x.call('attendanceCheckIn', { token: l.token }, x.owner)), 'teacher');
  await assert.rejects(x.call('attendanceCheckIn', { token: l.token }, null));
  await assert.rejects(
    x.call('attendanceCheckIn', { token: l.token, code: l.code }, x.student(1)),
    /其中一種/,
  );
  await assert.rejects(
    x.call('attendanceCheckIn', { token: l.token, extra: 1 }, x.student(1)),
    /不支援的欄位/,
  );
  const first = await x.call(
    'attendanceCheckIn',
    { token: l.token, deviceId: 'device-aaaa' },
    x.student(1),
  );
  assert.deepEqual(
    { result: first.result, signedAt: first.signedAt, date: first.date, period: first.period },
    { result: 'ok', signedAt: T0, date: '2026-11-16', period: 3 },
  );
  x.tick(3000);
  const again = await x.call('attendanceCheckIn', { code: l.code }, x.student(1));
  assert.deepEqual([again.result, again.signedAt], ['duplicate', T0], '重複簽到回原結果，不改時間');
  // 寬限：結束後 5 秒內仍收，之後拒絕
  x.tick(57000 + 4000); // 結束後 4 秒
  const lateCode = attendanceCode(x.secret(s.id), COURSE, s.id, 1);
  assert.equal((await x.call('attendanceCheckIn', { code: lateCode }, x.student(2))).result, 'ok');
  x.tick(2000); // 結束後 6 秒
  assert.equal(
    await x.reason(x.call('attendanceCheckIn', { code: lateCode }, x.student(3))),
    'closed',
  );
  // 自動結束：沒有人按結束，讀取時就會結算；未簽到＝未到
  const list = await x.call('attendanceSessions');
  assert.equal(list.open, null);
  assert.deepEqual(list.sessions[0].counts, { present: 2, absent: 3 });
  assert.equal(list.sessions[0].expected, 5, '停用的學生與別班不算');
  const roster = await x.call('attendanceRoster', { sessionId: s.id });
  assert.deepEqual(
    roster.rows.map((r) => [r.email, r.status]),
    [
      ['s1@example.edu', 'present'],
      ['s2@example.edu', 'present'],
      ['s3@example.edu', 'absent'],
      ['s4@example.edu', 'absent'],
      ['s5@example.edu', 'absent'],
    ],
  );
  assert.equal(
    await x.reason(x.call('attendanceCheckIn', { token: l.token }, x.student(3))),
    'closed',
  );
  assert.equal(
    (await x.call('attendanceCheckIn', { token: l.token }, x.student(1))).result,
    'duplicate',
    '已簽到的人結束後再掃仍看到原結果',
  );
});

test('2 結束與簽到同時發生：結束之後送達的簽到不會寫入，也不會蓋掉未到以外的紀錄', async () => {
  const x = setup();
  const s = await x.start();
  const l = await live(x);
  const results = await Promise.allSettled([
    x.call('attendanceCheckIn', { token: l.token }, x.student(1)),
    x.call('attendanceControl', { action: 'end' }),
    x.call('attendanceCheckIn', { token: l.token }, x.student(2)),
    x.call('attendanceCheckIn', { token: l.token }, x.student(3)),
  ]);
  const roster = await x.call('attendanceRoster', { sessionId: s.id });
  const present = roster.rows.filter((r) => r.status === 'present').map((r) => r.email);
  const okEmails = [1, null, 2, 3]
    .map((i, k) =>
      i && results[k].status === 'fulfilled' && results[k].value.result === 'ok'
        ? `s${i}@example.edu`
        : null,
    )
    .filter(Boolean);
  assert.deepEqual(present.sort(), okEmails.sort(), '回覆成功的人才是準時，回覆失敗的人是未到');
  assert.equal(roster.rows.length, 5);
  assert.deepEqual(roster.session.counts, { present: present.length, absent: 5 - present.length });
});

test('3 延長、提前結束、同時只能一場、重新點名沿用原節次、補建節次', async () => {
  const x = setup();
  const s = await x.start();
  await assert.rejects(x.start({ period: 4 }), /已有進行中/);
  x.tick(50000);
  const ext = await x.call('attendanceControl', { action: 'extend' });
  assert.equal(ext.session.endsAt, T0 + 120000);
  x.tick(40000); // 原本已結束，延長後仍可簽
  assert.equal(
    (await x.call('attendanceCheckIn', { token: (await live(x)).token }, x.student(1))).result,
    'ok',
  );
  const ended = await x.call('attendanceControl', { action: 'end' });
  assert.equal(ended.session.status, 'closed');
  assert.deepEqual(ended.session.counts, { present: 1, absent: 4 });
  await assert.rejects(x.call('attendanceControl', { action: 'extend' }), /沒有進行中/);
  await assert.rejects(x.call('attendanceControl', { action: 'nope' }));
  // 同一節重新點名：同一個節次編號，已簽到保留，未到的人可以再簽
  const again = await x.start();
  assert.equal(again.id, s.id);
  assert.equal(
    (await x.call('attendanceCheckIn', { token: (await live(x)).token }, x.student(2))).result,
    'ok',
  );
  await x.call('attendanceControl', { action: 'end' });
  assert.deepEqual((await x.call('attendanceRoster', { sessionId: s.id })).session.counts, {
    present: 2,
    absent: 3,
  });
  // 同一節、班級有重疊但不同組合：拒絕
  await assert.rejects(x.start({ classIds: ['A', 'B'] }), /已經有包含同一班/);
  // 補建
  const back = await x.call('attendanceBackfill', {
    classIds: ['B'],
    period: 5,
    date: '2026-11-11',
  });
  assert.equal(back.session.backfilled, true);
  assert.deepEqual(back.session.counts, { present: 0, absent: 2 });
  await assert.rejects(
    x.call('attendanceBackfill', { classIds: ['B'], period: 5, date: '2026-11-11' }),
    /已經有點名紀錄/,
  );
  await assert.rejects(
    x.call('attendanceBackfill', { classIds: ['B'], period: 5, date: '2026-12-30' }),
    /未來/,
  );
  await assert.rejects(
    x.call('attendanceBackfill', { classIds: ['C'], period: 5, date: '2026-11-11' }),
    /班級不屬於課程/,
  );
  // 參數範圍
  for (const badInput of [
    { period: 0 },
    { period: 3, codeSec: 10 },
    { period: 3, qrSec: 61 },
    { period: 3, durationSec: 5 },
    { period: 3, classIds: [] },
    { period: 3, date: '2026-13-01' },
  ])
    await assert.rejects(x.call('attendanceStart', { classIds: ['A'], ...badInput }));
});

test('4 改狀態：單筆／多筆、準時與未到互改、修改紀錄完整、學生端看不到原因與修改人', async () => {
  const x = setup();
  const s = await x.start();
  await x.call('attendanceCheckIn', { token: (await live(x)).token }, x.student(1));
  await assert.rejects(
    x.call('attendanceSetStatus', {
      sessionId: s.id,
      emails: ['s2@example.edu'],
      status: 'present',
    }),
    /還在進行中/,
  );
  await x.call('attendanceControl', { action: 'end' });
  x.tick(600000);
  const multi = await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s2@example.edu', 's3@example.edu', 's1@example.edu'],
    status: 'present',
    reason: '手機沒電，當面確認',
  });
  assert.equal(multi.changed, 2, '原本就是準時的不算修改');
  x.tick(60000);
  assert.equal(
    (
      await x.call('attendanceSetStatus', {
        sessionId: s.id,
        emails: ['s3@example.edu'],
        status: 'absent',
        reason: '點錯人，改回',
      })
    ).changed,
    1,
  );
  x.tick(1000);
  assert.equal(
    (
      await x.call('attendanceSetStatus', {
        sessionId: s.id,
        emails: ['s1@example.edu'],
        status: 'absent',
      })
    ).changed,
    1,
    '準時也可以改成未到',
  );
  const roster = await x.call('attendanceRoster', { sessionId: s.id });
  assert.deepEqual(roster.session.counts, { present: 1, absent: 4 });
  const r2 = roster.rows.find((r) => r.email === 's2@example.edu');
  assert.deepEqual(
    [r2.status, r2.edited, r2.editedAt, r2.via],
    ['present', true, T0 + 600000, 'teacher'],
  );
  const log = (await x.call('attendanceAuditLog')).rows;
  assert.equal(log.length, 4);
  assert.deepEqual(
    log.slice(0, 2).map((a) => [a.email, a.from, a.to, a.reason, a.at]),
    [
      ['s1@example.edu', 'present', 'absent', '', T0 + 661000],
      ['s3@example.edu', 'present', 'absent', '點錯人，改回', T0 + 660000],
    ],
  );
  assert.deepEqual(
    log
      .slice(2)
      .map((a) => [a.email, a.from, a.to, a.reason, a.at])
      .sort(),
    [
      ['s2@example.edu', 'absent', 'present', '手機沒電，當面確認', T0 + 600000],
      ['s3@example.edu', 'absent', 'present', '手機沒電，當面確認', T0 + 600000],
    ],
  );
  for (const a of log)
    assert(
      a.at >= T0 + 600000 && a.by === 'owner' && a.byName === '示範教師' && a.sessionId === s.id,
    );
  // 學生端
  const mine = await x.call('attendanceMine', {}, x.student(2));
  assert.deepEqual(
    mine.rows,
    [{ date: '2026-11-16', period: 3, status: 'present', signedAt: 0 }],
    '老師改成準時的沒有簽到時間',
  );
  assert.deepEqual((await x.call('attendanceMine', {}, x.student(1))).rows, [
    { date: '2026-11-16', period: 3, status: 'absent', signedAt: 0 },
  ]);
  assert(!JSON.stringify(mine).match(/reason|手機|by|edited|device|示範教師/));
  assert.deepEqual(
    (await x.call('attendanceMine', {}, x.student(6, 'B'))).rows,
    [],
    '別班看不到這一節',
  );
  for (const name of [
    'attendanceRoster',
    'attendanceAuditLog',
    'attendanceSummary',
    'attendanceExport',
    'attendanceSessions',
    'attendanceSetStatus',
    'attendanceMailStatus',
    'attendanceMailConfig',
    'attendanceSendMail',
    'attendanceConfirm',
    'attendanceStart',
    'attendanceControl',
    'attendanceBackfill',
  ])
    await assert.rejects(x.call(name, { sessionId: s.id }, x.student(1)), name);
  await assert.rejects(
    x.call('attendanceSetStatus', {
      sessionId: s.id,
      emails: ['S2@EXAMPLE.EDU'],
      status: 'present',
    }),
  );
  await assert.rejects(
    x.call('attendanceSetStatus', { sessionId: s.id, emails: ['s2@example.edu'], status: 'late' }),
  );
  await assert.rejects(
    x.call('attendanceSetStatus', {
      sessionId: s.id,
      emails: ['s2@example.edu'],
      status: 'absent',
      reason: 'x'.repeat(201),
    }),
  );
  await assert.rejects(
    x.call('attendanceSetStatus', {
      sessionId: '../x',
      emails: ['s2@example.edu'],
      status: 'absent',
    }),
  );
});

test('5 同裝置提醒：同節同編號兩帳號才標記；不影響簽到結果；學生與信件看不到', async () => {
  const x = setup();
  const s = await x.start();
  const { token } = await live(x);
  assert.equal(
    (await x.call('attendanceCheckIn', { token, deviceId: 'device-same-1' }, x.student(1))).result,
    'ok',
  );
  assert.equal(
    (await x.call('attendanceCheckIn', { token, deviceId: 'device-same-1' }, x.student(2))).result,
    'ok',
    '同裝置不擋',
  );
  assert.equal(
    (await x.call('attendanceCheckIn', { token, deviceId: 'device-other' }, x.student(3))).result,
    'ok',
  );
  assert.equal(
    (await x.call('attendanceCheckIn', { token }, x.student(4))).result,
    'ok',
    '沒有編號也能簽',
  );
  await assert.rejects(x.call('attendanceCheckIn', { token, deviceId: 'bad id!' }, x.student(5)));
  await x.call('attendanceControl', { action: 'end' });
  const rows = (await x.call('attendanceRoster', { sessionId: s.id })).rows;
  assert.deepEqual(
    rows.map((r) => r.sameDevice),
    [['示範學生2'], ['示範學生1'], [], [], []],
  );
  assert(!JSON.stringify(rows).includes('device-same-1'), '後台也只回提醒，不回編號');
  assert(
    !JSON.stringify(await x.call('attendanceMine', {}, x.student(1))).match(/device|sameDevice/),
  );
  assert.deepEqual(
    A.sameDeviceGroups([
      { email: 'a', deviceId: 'd1' },
      { email: 'a', deviceId: 'd1' },
      { email: 'b' },
    ]),
    {},
    '同一帳號重複不算',
  );
});

test('6 Email：只寄未到；確認後才列入；不重複寄；更正信只在已寄後改狀態時寄；失敗可重寄；內容不含成績／情緒', async () => {
  const x = setup();
  const s = await x.start();
  const { token } = await live(x);
  for (const i of [1, 2])
    await x.call('attendanceCheckIn', { token, deviceId: 'device-same-1' }, x.student(i));
  await x.call('attendanceControl', { action: 'end' });
  await assert.rejects(x.call('attendanceSendMail', { mode: 'now' }), /尚未設定寄信程式/);
  const cfg = await x.mailer();
  assert.equal(cfg.mailerReady, true);
  assert(!JSON.stringify(cfg).includes('kkkk'), '密鑰不回傳前端');
  // 未確認：沒有待寄
  let st = await x.call('attendanceMailStatus');
  assert.deepEqual([st.student.length, st.digest.length, st.unconfirmedToday.length], [0, 0, 1]);
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now' }), {
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  st = await x.call('attendanceMailStatus');
  assert.deepEqual(
    st.student.map((m) => [m.email, m.kind]),
    [
      ['s3@example.edu', 'absent'],
      ['s4@example.edu', 'absent'],
      ['s5@example.edu', 'absent'],
    ],
  );
  assert.deepEqual(
    st.digest.map((d) => [d.classId, d.mentorEmail, d.periods]),
    [['A', 'mentor-a@example.edu', [3]]],
  );
  // 第一封失敗 → 回到待寄，其餘成功
  x.failNext(1);
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 2,
    failed: 1,
    skipped: 0,
  });
  assert.deepEqual(
    x.sent.map((m) => m.to),
    ['s4@example.edu', 's5@example.edu'],
  );
  st = await x.call('attendanceMailStatus');
  assert.deepEqual(
    st.student.map((m) => m.email),
    ['s3@example.edu'],
    '失敗的可重寄',
  );
  assert.equal(st.log.filter((m) => m.status === 'failed').length, 1);
  // 再寄：只補寄失敗那封，已寄的不重複
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now' }), {
    sent: 2,
    failed: 0,
    skipped: 0,
  });
  assert.deepEqual(
    x.sent.map((m) => m.to),
    ['s4@example.edu', 's5@example.edu', 's3@example.edu', 'mentor-a@example.edu'],
  );
  // 兩次同時按：不重複
  await Promise.all([
    x.call('attendanceSendMail', { mode: 'now' }),
    x.call('attendanceSendMail', { mode: 'now' }),
  ]);
  assert.equal(x.sent.length, 4, '同一封不重複寄');
  // 準時的學生沒收到信
  assert(!x.sent.some((m) => ['s1@example.edu', 's2@example.edu'].includes(m.to)));
  // 已寄未到通知後改準時 → 更正信；沒寄過的改來改去不寄
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s3@example.edu'],
    status: 'present',
    reason: '不該出現在信裡的原因',
  });
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s1@example.edu'],
    status: 'absent',
  });
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s1@example.edu'],
    status: 'present',
  });
  st = await x.call('attendanceMailStatus');
  assert.deepEqual(
    st.student.map((m) => [m.email, m.kind]),
    [['s3@example.edu', 'correction']],
  );
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now' }), {
    sent: 1,
    failed: 0,
    skipped: 0,
  });
  assert.match(x.sent[4].subject, /紀錄已改為準時/);
  // 準時改未到 → 未到通知（進待寄，老師寄才寄）
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s2@example.edu'],
    status: 'absent',
  });
  assert.equal(x.sent.length, 5, '改狀態本身不會寄信');
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now', sessionId: s.id }), {
    sent: 1,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x.sent[5].to, 's2@example.edu');
  // 導師彙整：一天一封，不重複
  assert.equal(x.sent.filter((m) => m.to === 'mentor-a@example.edu').length, 1);
  const digest = x.sent[3];
  assert.match(digest.text, /應到 5 人，準時 2 人，未到 3 人。/);
  assert.match(digest.text, /示範學生3（099003）/);
  // 內容檢查
  for (const m of x.sent) {
    assert.equal(m.fromName, '示範教師');
    assert(!/成績|分數|情緒|關心|同裝置|device|原因|手機/.test(m.subject + m.text), m.text);
  }
  assert.match(x.sent[0].text, /本節紀錄為未到/);
  assert.match(
    x.sent[0].text,
    /https:\/\/platform\.example\.edu\/#\/course\/115-1-AP2\/attendance/,
  );
  // 收件人只來自名冊紀錄
  const rosterEmails = new Set(
    [1, 2, 3, 4, 5].map((i) => `s${i}@example.edu`).concat('mentor-a@example.edu'),
  );
  assert(x.sent.every((m) => rosterEmails.has(m.to)));
  // 設定驗證
  for (const set of [
    { mailerUrl: 'https://evil.example/exec', mailerKey: 'k'.repeat(32) },
    { mailerUrl: 'https://script.google.com/macros/s/FAKE/exec', mailerKey: 'short' },
    { mentors: { C: { email: 'a@b.cc' } } },
    { mentors: { A: { email: 'not-an-email' } } },
    { dailyTime: '25:00' },
    { platformUrl: 'javascript:alert(1)' },
    { unknown: 1 },
  ])
    await assert.rejects(x.call('attendanceMailConfig', { set }), JSON.stringify(set));
});

test('6 導師彙整只含當天已確認的節次；排定時間與每日預設時間到了才自動寄', async () => {
  const x = setup();
  await x.mailer();
  const s3 = await x.start({ period: 3 });
  await x.call('attendanceControl', { action: 'end' });
  const s4 = await x.start({ period: 4 });
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceBackfill', { classIds: ['A'], period: 1, date: '2026-11-15' });
  await x.call('attendanceConfirm', { sessionId: s3.id, confirmed: true });
  const st = await x.call('attendanceMailStatus');
  assert.deepEqual(
    st.unconfirmedToday.map((s) => s.period),
    [4],
    '提醒今天還有未確認的節次',
  );
  assert.deepEqual(st.digest[0].periods, [3]);
  // 沒設定時間：tick 不寄
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 0);
  assert.equal(x.db.docs.get(`courses/${COURSE}`).attendanceNextSendAt, 0);
  // 排定一次性時間
  await assert.rejects(x.call('attendanceSendMail', { mode: 'schedule', at: x.now() - 1 }));
  await assert.rejects(
    x.call('attendanceSendMail', { mode: 'schedule', at: x.now() + 8 * 86400000 }),
  );
  const at = x.now() + 3600000;
  assert.equal((await x.call('attendanceSendMail', { mode: 'schedule', at })).nextSendAt, at);
  x.tick(3500000);
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 0, '時間未到不寄');
  x.tick(200000);
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 6, '5 封未到通知＋1 封導師彙整');
  const digest = x.sent.find((m) => m.to === 'mentor-a@example.edu');
  assert.match(digest.text, /第 3 節/);
  assert(!/第 4 節|第 1 節/.test(digest.text), '未確認與非當天的節次不放進彙整');
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 6, '一次性排定寄過就清掉');
  assert.equal((await x.call('attendanceMailStatus')).scheduledAt, 0);
  // 取消排定
  await x.call('attendanceSendMail', { mode: 'schedule', at: x.now() + 60000 });
  assert.equal((await x.call('attendanceSendMail', { mode: 'cancel' })).nextSendAt, 0);
  // 每日預設時間 17:00（台北）
  await x.call('attendanceMailConfig', { set: { dailyTime: '17:00' } });
  const next = x.db.docs.get(`courses/${COURSE}`).attendanceNextSendAt;
  assert.equal(A.taipeiDateTime(next), '2026-11-16 17:00');
  await x.call('attendanceConfirm', { sessionId: s4.id, confirmed: true });
  x.tick(next - x.now() + 1000);
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 11, '第 4 節 5 封未到通知；導師彙整當天已寄過不再寄');
  assert.equal(
    A.taipeiDateTime(x.db.docs.get(`courses/${COURSE}`).attendanceNextSendAt),
    '2026-11-17 17:00',
  );
  // 旗標關閉的課程即使到時間也不寄
  x.db.docs.set(`courses/${COURSE}`, {
    ...x.db.docs.get(`courses/${COURSE}`),
    attendanceNextSendAt: x.now() - 1,
    features: { attendance: false },
  });
  await x.call('attendanceSetStatus', {
    sessionId: s4.id,
    emails: ['s1@example.edu'],
    status: 'present',
  });
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 11);
});

test('6 寄送中斷的信可放回待寄，不會自動重寄', async () => {
  const x = setup();
  await x.mailer();
  const s = await x.start();
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  // 模擬認領後當機：紀錄已標 lastNotified、信停在 sending
  const rPath = `courses/${COURSE}/attendance/${s.id}/records/s1@example.edu`;
  x.db.docs.set(rPath, { ...x.db.docs.get(rPath), lastNotified: 'absent', notifySeq: 1 });
  const id = `${s.id}__s1@example.edu__1`;
  x.db.docs.set(`courses/${COURSE}/attendanceMail/${id}`, {
    id,
    kind: 'absent',
    to: 's1@example.edu',
    sessionId: s.id,
    status: 'sending',
    createdAt: x.now(),
  });
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert(!x.sent.some((m) => m.to === 's1@example.edu'), '中斷的信不自動重寄');
  await assert.rejects(x.call('attendanceSendMail', { mode: 'requeue', mailId: id }), /不需要處理/);
  x.tick(700000);
  await x.call('attendanceSendMail', { mode: 'requeue', mailId: id });
  assert.deepEqual(
    (await x.call('attendanceMailStatus')).student.map((m) => m.email),
    ['s1@example.edu'],
  );
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);
});

test('7 旗標關閉時全部 callable 拒絕，且不讀寫點名資料', async () => {
  const x = setup({ feature: false });
  const before = [...x.db.docs.keys()].sort();
  for (const name of Object.keys(x.h)) {
    if (name === 'attendanceMailTick') continue;
    await assert.rejects(x.call(name, { sessionId: 'x', classIds: ['A'], period: 3 }), name);
    await assert.rejects(x.call(name, { token: 'a.1.b', code: '1234' }, x.student(1)), name);
  }
  assert.deepEqual([...x.db.docs.keys()].sort(), before);
  assert.equal(Object.keys(x.h).length, 18);
});

test('試簽：不算點名、不留出缺席紀錄、可讓全班先登入', async () => {
  const x = setup();
  const s = await x.start({ trial: true });
  assert.equal(s.kind, 'trial');
  const { token, code } = await live(x);
  assert.equal((await x.call('attendanceCheckIn', { token }, x.student(1))).result, 'trial');
  assert.equal((await x.call('attendanceCheckIn', { code }, x.student(2))).result, 'trial');
  assert.equal((await x.call('attendanceCheckIn', { token }, x.student(1))).result, 'trial');
  assert.equal((await live(x)).signed, 2);
  await x.call('attendanceControl', { action: 'end' });
  assert.deepEqual((await x.call('attendanceSessions')).sessions, []);
  assert.deepEqual((await x.call('attendanceMine', {}, x.student(1))).rows, []);
  assert.deepEqual((await x.call('attendanceSummary')).rows, []);
});

test('匯出：兩個不同課程的累加用明細檔表頭逐字相同、可直接串接；學號為文字；重複匯出每列鍵相同', async () => {
  const x = setup();
  const s = await x.start();
  await x.call('attendanceCheckIn', { token: (await live(x)).token }, x.student(1));
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s2@example.edu'],
    status: 'present',
    reason: '不放進明細檔',
  });
  const a = (await x.call('attendanceExport', { kind: 'detail' })).csv;
  const linesA = a.replace(/^﻿/, '').trim().split('\r\n');
  assert.equal(
    linesA[0],
    '格式版本,學期,課程代碼,課程名稱,班級,日期,節次,學號,姓名,狀態,簽到時間,是否修改過,匯出時間',
  );
  assert.equal(linesA.length, 6);
  assert.equal(
    linesA[1],
    '1,115-1,115-1-AP2,解剖生理學（二）,A,2026-11-16,3,"=""099001""",示範學生1,準時,09:10:00,否,2026-11-16 09:10',
  );
  assert.equal(
    linesA[2],
    '1,115-1,115-1-AP2,解剖生理學（二）,A,2026-11-16,3,"=""099002""",示範學生2,準時,,是,2026-11-16 09:10',
  );
  assert.match(linesA[3], /,未到,,否,/);
  assert(!a.includes('不放進明細檔') && !a.includes('device'));
  // 另一門課程（另一學期）
  const other = A.attendanceDetailCsv(
    { term: '115-2', code: '115-2-AP1', name: '解剖生理學（一）' },
    [
      {
        session: { id: 'x', kind: 'roll', date: '2027-03-01', period: 2, classIds: ['Z'] },
        records: [
          {
            email: 'z@example.edu',
            studentId: '0001',
            name: '示範',
            classId: 'Z',
            status: 'absent',
          },
        ],
      },
    ],
    T0,
  );
  const linesB = other.replace(/^﻿/, '').trim().split('\r\n');
  assert.equal(linesB[0], linesA[0], '表頭逐字相同');
  const joined = [...linesA, ...linesB.slice(1)];
  assert(
    joined.slice(1).every((l) => l.split(',').length === 13),
    '每列 13 欄，可直接串接',
  );
  // 重複匯出：去掉匯出時間後內容相同；每列鍵（課程代碼、日期、節次、學號）唯一
  x.tick(86400000);
  const again = (await x.call('attendanceExport', { kind: 'detail' })).csv
    .replace(/^﻿/, '')
    .trim()
    .split('\r\n');
  const strip = (l) => l.split(',').slice(0, 12).join(',');
  assert.deepEqual(again.map(strip), linesA.map(strip));
  const keys = linesA
    .slice(1)
    .map((l) => l.split(','))
    .map((c) => [c[2], c[5], c[6], c[7]].join('|'));
  assert.equal(new Set(keys).size, keys.length);
  // 給其他功能的讀取接點
  const { readClosedAttendance } = require('../lib/functions/src/attendance.js');
  const data = await readClosedAttendance(x.db, COURSE);
  assert.equal(data.length, 1);
  assert.equal(A.recentAbsentCount(data, 's3@example.edu'), 1);
  assert.equal(A.recentAbsentCount(data, 's1@example.edu'), 0);
  assert.deepEqual(A.absentEmailsAt(data, '2026-11-16', 3).sort(), [
    's3@example.edu',
    's4@example.edu',
    's5@example.edu',
  ]);
  // 課程封存後教師仍可匯出
  x.course.archived = true;
  assert.equal((await x.call('attendanceExport', { kind: 'detail' })).csv.split('\r\n').length, 7);
  assert.match(
    (await x.call('attendanceExport', { kind: 'session', sessionId: s.id })).csv,
    /日期,節次,班級,學號,姓名,狀態,簽到時間,方式,是否修改過/,
  );
  assert.match(
    (await x.call('attendanceExport', { kind: 'summary' })).csv,
    /班級,學號,姓名,2026-11-16 第3節,準時,未到/,
  );
  await assert.rejects(x.call('attendanceExport', { kind: 'other' }));
});

test('M1 寄信程式（AttendanceMailer.gs）：同一個 mailId 只寄一次；密鑰、收件人、編號都要驗證', async () => {
  const sent = [];
  const gas = loadMailerScript({ key: 'k'.repeat(32), onSend: (m) => sent.push(m) });
  const mail = {
    key: 'k'.repeat(32),
    mailId: '2026-11-16-p03-ab12cd34__s1@example.edu__1',
    to: 's1@example.edu',
    subject: '主旨',
    text: '內容',
    fromName: '示範教師',
  };
  assert.deepEqual(gas.post(mail), { ok: true, remaining: 1499 });
  assert.deepEqual(gas.post(mail), { ok: true, duplicate: true }, '同一編號第二次不寄');
  assert.deepEqual(gas.post({ ...mail, subject: '內容改了也一樣' }), { ok: true, duplicate: true });
  assert.equal(sent.length, 1);
  assert.deepEqual(
    gas.post({ ...mail, mailId: mail.mailId.replace(/1$/, '2') }),
    { ok: true, remaining: 1498 },
    '不同編號照常寄',
  );
  assert.equal(sent.length, 2);
  // 很長的編號（例如長信箱）也能去重
  const long = { ...mail, mailId: 'x'.repeat(400) };
  assert.equal(gas.post(long).ok, true);
  assert.deepEqual(gas.post(long), { ok: true, duplicate: true });
  // 驗證
  for (const [bad, error] of [
    [{ key: 'wrong' }, '密鑰不正確'],
    [{ key: undefined }, '密鑰不正確'],
    [{ mailId: undefined }, '信件編號無效'],
    [{ mailId: '' }, '信件編號無效'],
    [{ mailId: 'x'.repeat(401) }, '信件編號無效'],
    [{ mailId: 'a\nb' }, '信件編號無效'],
    [{ mailId: 'new-1', to: 'a@b.cc, c@d.ee' }, '收件人無效'],
    [{ mailId: 'new-2', subject: '' }, '主旨無效'],
    [{ mailId: 'new-3', text: '' }, '內容無效'],
  ])
    assert.deepEqual(gas.post({ ...mail, ...bad }), { ok: false, error }, JSON.stringify(bad));
  assert.equal(sent.length, 3, '驗證沒過的都不寄');
  // 寄信失敗（額度用完）不記錄，之後同一編號還能寄
  gas.state.quota = 0;
  const later = { ...mail, mailId: 'later-1' };
  assert.deepEqual(gas.post(later), { ok: false, error: '今天的寄信額度已用完' });
  gas.state.quota = 5;
  assert.equal(gas.post(later).ok, true);
  assert.equal(gas.state.locks, 0, '鎖都有釋放');
  assert(!gas.get().includes('k'.repeat(8)));
});

test('M1 寄送結果不明時不重寄：已寄出但平台沒收到回應 → 還原 → 用同一個 mailId 重送 → 學生只收到一封', async () => {
  const x = setup();
  await x.mailer();
  const s = await x.start();
  await x.call(
    'attendanceCheckIn',
    { token: (await x.call('attendanceLive')).token },
    x.student(1),
  );
  await x.call(
    'attendanceCheckIn',
    { token: (await x.call('attendanceLive')).token },
    x.student(2),
  );
  await x.call(
    'attendanceCheckIn',
    { token: (await x.call('attendanceLive')).token },
    x.student(3),
  );
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  // s4、s5 未到。第一封：寄信程式已寄出，但回應遺失
  x.loseReplyNext(1);
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 1,
    failed: 1,
    skipped: 0,
  });
  assert.deepEqual(
    x.sent.map((m) => m.to),
    ['s4@example.edu', 's5@example.edu'],
    '其實兩封都寄出去了',
  );
  let st = await x.call('attendanceMailStatus');
  assert.deepEqual(
    st.student.map((m) => m.email),
    ['s4@example.edu'],
    '平台以為失敗，放回待寄',
  );
  const firstId = `${s.id}__s4@example.edu__1`;
  assert.equal(st.log.find((m) => m.id === firstId).status, 'failed');
  // 重送：同一個 mailId，寄信程式認得，不再寄
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 1,
    failed: 0,
    skipped: 0,
  });
  assert.deepEqual(
    x.posted.filter((id) => id.includes('s4@')),
    [firstId, firstId],
    '重送用的是同一個 mailId',
  );
  assert.equal(x.sent.filter((m) => m.to === 's4@example.edu').length, 1, '學生只收到一封未到通知');
  st = await x.call('attendanceMailStatus');
  assert.equal(st.student.length, 0);
  assert.equal(st.log.find((m) => m.id === firstId).status, 'sent');
  assert.equal(x.db.docs.get(`courses/${COURSE}/attendanceMail/${firstId}`).deduped, true);
  // 連續兩次都遺失回應，也只會有一封
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s4@example.edu'],
    status: 'present',
  });
  x.loseReplyNext(2);
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.equal(
    x.sent.filter((m) => m.to === 's4@example.edu' && /已改為準時/.test(m.subject)).length,
    1,
    '更正通知也只有一封',
  );
  assert.deepEqual(
    x.posted.filter((id) => id.includes('s4@')).slice(2),
    Array(3).fill(`${s.id}__s4@example.edu__2`),
  );
  // 導師彙整：回應遺失後重送，也只寄一封
  x.loseReplyNext(1);
  assert.equal((await x.call('attendanceSendMail', { mode: 'now', kinds: ['mentor'] })).failed, 1);
  assert.equal((await x.call('attendanceSendMail', { mode: 'now', kinds: ['mentor'] })).sent, 1);
  assert.equal(x.sent.filter((m) => m.to === 'mentor-a@example.edu').length, 1);
  // 每封信都帶 mailId，而且各不相同（同一封重送除外）
  assert(x.posted.every((id) => typeof id === 'string' && id.length > 10));
  // 真的沒送到寄信程式的失敗（連線失敗）：重送會寄出
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s1@example.edu'],
    status: 'absent',
  });
  x.failNext(1);
  assert.equal((await x.call('attendanceSendMail', { mode: 'now' })).failed, 1);
  assert.equal((await x.call('attendanceSendMail', { mode: 'now' })).sent, 1);
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);
});

test('排程執行後記錄「上次自動寄送」的結果，寄信分頁看得到', async () => {
  const x = setup();
  const s = await x.start();
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  assert.equal((await x.call('attendanceMailStatus')).lastAuto, null);
  // 還沒設定寄信程式就到時間：記錄錯誤
  await x.call('attendanceSendMail', { mode: 'schedule', at: x.now() + 60000 });
  x.tick(61000);
  await x.h.attendanceMailTick.run({});
  let last = (await x.call('attendanceMailStatus')).lastAuto;
  assert.equal(last.at, x.now());
  assert.match(last.error, /尚未設定寄信程式/);
  // 設定後再排一次：記錄寄出與失敗數
  await x.mailer();
  await x.call('attendanceSendMail', { mode: 'schedule', at: x.now() + 60000 });
  x.tick(61000);
  x.failNext(1);
  await x.h.attendanceMailTick.run({});
  last = (await x.call('attendanceMailStatus')).lastAuto;
  assert.deepEqual(last, { at: x.now(), sent: 5, failed: 1, error: '' });
  assert(!JSON.stringify(await x.call('attendanceMailStatus')).includes('kkkk'), '不含密鑰');
});

test('M1-b 180 天 PropertiesService 去重與清理：立即、24 小時、接近 180 天皆去重；不延長期限；滿 180 天才清理並保留密鑰與其他設定；失敗不記錄', async () => {
  const DAY = 24 * 60 * 60 * 1000;
  let nowMs = T0;
  const sent = [];
  const gas = loadMailerScript({
    key: 'k'.repeat(32),
    onSend: (m) => sent.push(m),
    now: () => nowMs,
    initialProps: { OTHER_SETTING: 'keep-me' },
  });
  const base = {
    key: 'k'.repeat(32),
    to: 's1@example.edu',
    subject: '未到通知',
    text: '內容',
    fromName: '示範教師',
  };

  // 第一次寄送失敗（MailApp 拋錯）不寫入紀錄，之後同一 mailId 仍可重試成功
  gas.state.failSend = true;
  const failRes = gas.post({ ...base, mailId: 'mail-fail-1' });
  assert.equal(failRes.ok, false);
  assert.equal(sent.length, 0);
  assert.equal(
    [...gas.props.keys()].filter((k) => k.startsWith('sent:')).length,
    0,
    '寄送失敗不記為已寄',
  );
  gas.state.failSend = false;
  assert.equal(gas.post({ ...base, mailId: 'mail-fail-1' }).ok, true);
  assert.equal(sent.length, 1);

  // 立即重試、隔 24 小時、第 100 天重試（不延長期限）、接近 180 天（180 天少 1 ms）皆去重
  const idA = 'mail-180d-a';
  assert.equal(gas.post({ ...base, mailId: idA }).ok, true);
  assert.equal(sent.length, 2);
  const sentKeyA = [...gas.props.keys()].find(
    (k) => k.startsWith('sent:') && gas.props.get(k) === String(nowMs),
  );
  assert(sentKeyA, '寫入 sent:<digest> 且值為成功寄出時間');

  // 立即重試
  assert.deepEqual(gas.post({ ...base, mailId: idA }), { ok: true, duplicate: true });
  // 隔 24 小時重試
  nowMs = T0 + 1 * DAY;
  assert.deepEqual(gas.post({ ...base, mailId: idA }), { ok: true, duplicate: true });
  // 第 100 天重試：不刷新保存期限
  nowMs = T0 + 100 * DAY;
  assert.deepEqual(gas.post({ ...base, mailId: idA }), { ok: true, duplicate: true });
  assert.equal(gas.props.get(sentKeyA), String(T0), '重試不得延長保存期限');

  // 接近 180 天（差 1 ms 滿 180 天）：仍去重、尚未清理
  nowMs = T0 + 180 * DAY - 1;
  assert.deepEqual(gas.post({ ...base, mailId: idA }), { ok: true, duplicate: true });
  assert(gas.props.has(sentKeyA), '未滿 180 天不得清理');
  assert.equal(sent.length, 2);

  // 第 150 天另寄一封 B，確認滿 180 天清理時只刪過期的 A，保留未過期的 B 與 MAIL_KEY / OTHER_SETTING
  nowMs = T0 + 150 * DAY;
  assert.equal(gas.post({ ...base, mailId: 'mail-180d-b' }).ok, true);
  assert.equal(sent.length, 3);

  // 推進至剛好滿 180 天（T0 + 180 天）：觸發清理，A 被清理並可再寄，B 與設定皆保留
  nowMs = T0 + 180 * DAY;
  assert.equal(gas.post({ ...base, mailId: idA }).ok, true, '滿 180 天已清理，可視為新寄送');
  assert.equal(sent.length, 4);
  assert.equal(gas.props.get('MAIL_KEY'), 'k'.repeat(32), '保留 MAIL_KEY');
  assert.equal(gas.props.get('OTHER_SETTING'), 'keep-me', '保留其他指令碼屬性');
  assert(
    [...gas.props.values()].includes(String(T0 + 150 * DAY)),
    '未滿 180 天的 B 仍保留',
  );
  assert.equal(gas.state.locks, 0);
});

test('M1-b 跨日排程重試：回應遺失後隔 24 小時再送同一 mailId，仍只寄一封', async () => {
  const x = setup();
  await x.mailer();
  const s = await x.start();
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  // s1 回應遺失（Apps Script 已寄出，但平台當作失敗並放回待寄）
  x.loseReplyNext(1);
  const first = await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.deepEqual(first, { sent: 4, failed: 1, skipped: 0 });
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);

  // 假時鐘推進 24 小時（超過原本 6 小時 CacheService 上限），重試同一 mailId
  x.tick(24 * 60 * 60 * 1000);
  const retry = await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.deepEqual(retry, { sent: 1, failed: 0, skipped: 0 });
  assert.equal(
    x.sent.filter((m) => m.to === 's1@example.edu').length,
    1,
    '隔 24 小時重試仍只寄一封',
  );
  const mailId = `${s.id}__s1@example.edu__1`;
  assert.equal(x.db.docs.get(`courses/${COURSE}/attendanceMail/${mailId}`).deduped, true);
});

test('M1-b 容量與寫入配額耗盡回歸：無法預留去重紀錄時拒絕寄信（MailApp 呼叫 0 次），已寄信仍正常去重，有效紀錄保留 180 天', async () => {
  const DAY = 24 * 60 * 60 * 1000;
  let nowMs = T0;
  const sent = [];
  const gas = loadMailerScript({
    key: 'k'.repeat(32),
    onSend: (m) => sent.push(m),
    now: () => nowMs,
    maxStorageBytes: 512000,
  });
  const base = {
    key: 'k'.repeat(32),
    to: 's1@example.edu',
    subject: '未到通知',
    text: '內容',
    fromName: '示範教師',
  };

  // 先寄出一封有效的信（180 天內）
  assert.equal(gas.post({ ...base, mailId: 'existing-valid-mail' }).ok, true);
  assert.equal(sent.length, 1);

  // 用未到期的 sent: 鍵填滿屬性空間至接近 512,000 B，使新鍵寫入超限
  let idx = 0;
  let totalBytes = 0;
  for (const [k, v] of gas.props.entries()) totalBytes += k.length + v.length;
  while (totalBytes + 70 <= 511993) {
    const k = `sent:filler-${String(idx++).padStart(36, '0')}`;
    const v = String(nowMs);
    gas.props.set(k, v);
    totalBytes += k.length + v.length;
  }
  const fillerCountBefore = idx;

  // 新信無法預留去重紀錄：連送兩次均回 ok:false，MailApp 呼叫 0 次
  const r1 = gas.post({ ...base, mailId: 'new-over-quota-1' });
  const r2 = gas.post({ ...base, mailId: 'new-over-quota-1' });
  assert.equal(r1.ok, false);
  assert.equal(r2.ok, false);
  assert.equal(sent.length, 1, '容量已滿時不得呼叫 MailApp.sendEmail');

  // 既有已寄信仍正常去重，且有效 180 天紀錄全部保留
  assert.deepEqual(gas.post({ ...base, mailId: 'existing-valid-mail' }), {
    ok: true,
    duplicate: true,
  });
  assert.equal(sent.length, 1);
  assert.equal(
    [...gas.props.keys()].filter((k) => k.startsWith('sent:filler-')).length,
    fillerCountBefore,
    '不得提早刪除未滿 180 天的有效紀錄',
  );

  // 模擬 Properties 寫入配額耗盡：既有已寄信仍去重，新信回 ok:false 且 MailApp 呼叫 0 次
  gas.state.failPropWrite = true;
  assert.deepEqual(gas.post({ ...base, mailId: 'existing-valid-mail' }), {
    ok: true,
    duplicate: true,
  });
  assert.equal(gas.post({ ...base, mailId: 'new-write-quota-1' }).ok, false);
  assert.equal(sent.length, 1, '寫入配額耗盡時不得呼叫 MailApp.sendEmail');

  // 釋出過期空間（推進 180 天後清理舊鍵）且恢復配額，新信即可正常預留並寄出
  gas.state.failPropWrite = false;
  nowMs = T0 + 180 * DAY;
  assert.equal(gas.post({ ...base, mailId: 'new-after-cleanup-1' }).ok, true);
  assert.equal(sent.length, 2);
  assert.equal(gas.state.locks, 0);
});

test('M1-b 暫存占位：寄信失敗或寄出前中斷後，同一 mailId 仍能重試並完成正式紀錄', async () => {
  const sent = [];
  const gas = loadMailerScript({
    key: 'k'.repeat(32),
    onSend: (m) => sent.push(m),
    now: () => T0,
  });
  const base = {
    key: 'k'.repeat(32),
    to: 's1@example.edu',
    subject: '未到通知',
    text: '內容',
    fromName: '示範教師',
  };

  // 情境 A：預留成功但 MailApp.sendEmail 拋錯 → 清除占位 → 重試可成功寄出
  gas.state.failSend = true;
  assert.equal(gas.post({ ...base, mailId: 'retry-after-send-err' }).ok, false);
  assert.equal(
    [...gas.props.keys()].filter((k) => k.startsWith('sent:')).length,
    0,
    '寄信失敗應清除 pending 占位',
  );
  gas.state.failSend = false;
  assert.equal(gas.post({ ...base, mailId: 'retry-after-send-err' }).ok, true);
  assert.equal(sent.length, 1);
  assert.deepEqual(gas.post({ ...base, mailId: 'retry-after-send-err' }), {
    ok: true,
    duplicate: true,
  });

  // 情境 B：預留 pending:<ts> 後、MailApp.sendEmail 尚未執行即中斷（屬性內殘留 pending:<ts>）
  const crypto = require('node:crypto');
  const interruptedId = 'interrupted-before-send';
  const interruptedKey =
    'sent:' + crypto.createHash('sha256').update(interruptedId, 'utf8').digest('base64url');
  gas.props.set(interruptedKey, `pending:${T0}`);

  // 選項 B：未經教師授權不得自動重寄，應回傳 uncertain:true
  const autoRetry = gas.post({ ...base, mailId: interruptedId });
  assert.equal(autoRetry.ok, false);
  assert.equal(autoRetry.uncertain, true);
  assert.equal(sent.length, 1, '未經教師確認不得自動重寄');

  // 教師確認未寄後以 forceResend:true 單封重送，應寄出一封並更新為正式時間戳
  assert.equal(gas.post({ ...base, mailId: interruptedId, forceResend: true }).ok, true);
  assert.equal(sent.length, 2, '教師授權單封重送後應實際寄出');
  assert.equal(gas.props.get(interruptedKey), String(T0), '成功寄出後更新為正式時間戳');
  assert.deepEqual(gas.post({ ...base, mailId: interruptedId }), {
    ok: true,
    duplicate: true,
  });
  assert.equal(sent.length, 2);
  assert.equal(gas.state.locks, 0);
});

test('M1-b 預留消耗最後一次屬性寫入後寄出成功，平台不重寄；清理其他過期鍵失敗時有效紀錄仍正常去重', async () => {
  // 情境 1：平台只剩 1 位未到學生，Apps Script 只剩 1 次屬性寫入額度（預留 pending: 用完最後 1 次）
  const x = setup();
  await x.mailer();
  const s = await x.start();
  for (let i = 2; i <= 5; i++) {
    await x.call(
      'attendanceCheckIn',
      { token: (await x.call('attendanceLive')).token },
      x.student(i),
    );
  }
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });

  x.gas.state.propWriteRemaining = 1;
  const first = await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.deepEqual(first, { sent: 1, failed: 0, skipped: 0 });
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);

  // 推進 24 小時並恢復寫入額度，再執行寄信時同一 mailId 不得重寄
  x.tick(24 * 60 * 60 * 1000);
  x.gas.state.propWriteRemaining = Infinity;
  const nextDay = await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.deepEqual(nextDay, { sent: 0, failed: 0, skipped: 0 });
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);

  // 情境 2：清理其他過期鍵（>=180 天）的 deleteProperty 拋錯時，有效已寄紀錄仍正常去重
  const sent = [];
  const DAY = 24 * 60 * 60 * 1000;
  let nowMs = T0;
  const gas = loadMailerScript({
    key: 'k'.repeat(32),
    onSend: (m) => sent.push(m),
    now: () => nowMs,
    initialProps: { 'sent:expired-old-key': String(T0 - 181 * DAY) },
  });
  const base = {
    key: 'k'.repeat(32),
    mailId: 'valid-mail-while-cleanup-fails',
    to: 's1@example.edu',
    subject: '未到通知',
    text: '內容',
    fromName: '示範教師',
  };
  assert.equal(gas.post(base).ok, true);
  assert.equal(sent.length, 1);
  gas.state.failPropDelete = true;
  gas.props.set('sent:expired-old-key-2', String(T0 - 181 * DAY));
  assert.deepEqual(gas.post(base), { ok: true, duplicate: true });
  assert.equal(sent.length, 1, '清理其他過期鍵失敗時，有效已寄紀錄仍應去重且不得寄出');
  assert.equal(gas.state.locks, 0);
});

test('M1-b 選項 B：寄後額度查詢失敗仍回成功；雙重故障進入結果不明，排程與整批手動寄送都不會重寄', async () => {
  // 情境 A：寄後正式寫入失敗 + 寄後額度查詢也拋錯 → 仍回 ok:true，平台不重寄
  const x1 = setup();
  await x1.mailer();
  const s1 = await x1.start();
  for (let i = 2; i <= 5; i++) {
    await x1.call(
      'attendanceCheckIn',
      { token: (await x1.call('attendanceLive')).token },
      x1.student(i),
    );
  }
  await x1.call('attendanceControl', { action: 'end' });
  await x1.call('attendanceConfirm', { sessionId: s1.id, confirmed: true });

  x1.gas.state.propWriteRemaining = 1;
  x1.gas.state.failQuotaAfterSend = true;
  assert.deepEqual(await x1.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 1,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x1.sent.filter((m) => m.to === 's1@example.edu').length, 1);
  x1.tick(24 * 60 * 60 * 1000);
  x1.gas.state.propWriteRemaining = Infinity;
  x1.gas.state.failQuotaAfterSend = false;
  assert.deepEqual(await x1.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x1.sent.filter((m) => m.to === 's1@example.edu').length, 1);

  // 情境 B：預留用完最後一次寫入（寄後覆寫失敗）且成功回應遺失 → 隔日重試觸發 Apps Script 回傳 uncertain → 平台標記 uncertain 並停止自動重寄
  const x2 = setup();
  await x2.mailer();
  const s2 = await x2.start();
  for (let i = 2; i <= 5; i++) {
    await x2.call(
      'attendanceCheckIn',
      { token: (await x2.call('attendanceLive')).token },
      x2.student(i),
    );
  }
  await x2.call('attendanceControl', { action: 'end' });
  await x2.call('attendanceConfirm', { sessionId: s2.id, confirmed: true });

  x2.gas.state.propWriteRemaining = 1;
  x2.loseReplyNext(1);
  assert.deepEqual(await x2.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 0,
    failed: 1,
    skipped: 0,
  });
  assert.equal(x2.sent.filter((m) => m.to === 's1@example.edu').length, 1, '首次已實際寄出 1 封');

  // 隔日恢復寫入後，排程觸發時 Apps Script 見 pending: 回報 uncertain，平台轉為 status: 'uncertain' 且不再寄出
  x2.tick(24 * 60 * 60 * 1000);
  x2.gas.state.propWriteRemaining = Infinity;
  await x2.call('attendanceSendMail', { mode: 'schedule', at: x2.now() + 1000 });
  x2.tick(2000);
  await x2.h.attendanceMailTick.run({});

  const mailId = `${s2.id}__s1@example.edu__1`;
  let st = await x2.call('attendanceMailStatus');
  assert.equal(st.log.find((m) => m.id === mailId).status, 'uncertain');
  assert.equal(st.student.length, 0, '進入 uncertain 後不回待寄清單');
  assert.equal(x2.sent.filter((m) => m.to === 's1@example.edu').length, 1, '排程不得重寄');

  // 教師再按整批手動寄送也不會重寄
  assert.deepEqual(await x2.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x2.sent.filter((m) => m.to === 's1@example.edu').length, 1);

  // 教師確認已寄（confirmSent）後狀態轉為 sent，之後仍不會重寄
  await x2.call('attendanceSendMail', { mode: 'confirmSent', mailId });
  st = await x2.call('attendanceMailStatus');
  assert.equal(st.log.find((m) => m.id === mailId).status, 'sent');
  assert.deepEqual(await x2.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x2.sent.filter((m) => m.to === 's1@example.edu').length, 1);
});

test('M1-b 選項 B：寄出前中斷進入結果不明後，教師確認未寄才可單封重送；導師彙整亦暫停自動重寄', async () => {
  const x = setup();
  await x.mailer();
  const s = await x.start();
  for (let i = 2; i <= 5; i++) {
    await x.call(
      'attendanceCheckIn',
      { token: (await x.call('attendanceLive')).token },
      x.student(i),
    );
  }
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });

  // 預先模擬學生信與導師彙整在 Apps Script 端殘留「寄出前中斷」的 pending:<ts>
  const crypto = require('node:crypto');
  const studentMailId = `${s.id}__s1@example.edu__1`;
  const digestMailId = `digest__${A.taipeiDate(x.now())}__A`;
  for (const id of [studentMailId, digestMailId]) {
    const k = 'sent:' + crypto.createHash('sha256').update(id, 'utf8').digest('base64url');
    x.gas.props.set(k, `pending:${x.now()}`);
  }

  // 整批手動寄送與排程均進入 uncertain，實際寄出 0 封
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now' }), {
    sent: 0,
    failed: 2,
    skipped: 0,
  });
  assert.equal(x.sent.length, 0);

  await x.call('attendanceSendMail', { mode: 'schedule', at: x.now() + 1000 });
  x.tick(2000);
  await x.h.attendanceMailTick.run({});
  assert.equal(x.sent.length, 0, '排程不得重寄 uncertain 的學生信或導師彙整');

  // 整批手動寄送也不得重寄
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now' }), {
    sent: 0,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x.sent.length, 0);

  // 教師確認未寄後單封重送學生信與導師彙整，各成功寄出 1 封並標為 sent
  await x.call('attendanceSendMail', { mode: 'resendOne', mailId: studentMailId });
  await x.call('attendanceSendMail', { mode: 'resendOne', mailId: digestMailId });
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);
  assert.equal(x.sent.filter((m) => m.to === 'mentor-a@example.edu').length, 1);

  const st = await x.call('attendanceMailStatus');
  assert.equal(st.log.find((m) => m.id === studentMailId).status, 'sent');
  assert.equal(st.log.find((m) => m.id === digestMailId).status, 'sent');
});

test('M1-b 選項 B 交易認領互斥：並行 resendOne 只寄一次（含寄後寫入失敗），confirmSent 與 resendOne 互斥', async () => {
  const x = setup();
  await x.mailer();
  const s = await x.start();
  for (let i = 3; i <= 5; i++) {
    await x.call(
      'attendanceCheckIn',
      { token: (await x.call('attendanceLive')).token },
      x.student(i),
    );
  }
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });

  // s1 與 s2 皆因預先殘留 pending: 進入 uncertain
  const crypto = require('node:crypto');
  const id1 = `${s.id}__s1@example.edu__1`;
  const id2 = `${s.id}__s2@example.edu__1`;
  for (const id of [id1, id2]) {
    const k = 'sent:' + crypto.createHash('sha256').update(id, 'utf8').digest('base64url');
    x.gas.props.set(k, `pending:${x.now()}`);
  }
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.equal(x.sent.length, 0);

  // 即使寄後正式覆寫失敗，並行兩次 resendOne 仍只有一次認領成功、MailApp 只呼叫 1 次
  x.gas.state.failPropWrite = true;
  const raceResend = await Promise.allSettled([
    x.call('attendanceSendMail', { mode: 'resendOne', mailId: id1 }),
    x.call('attendanceSendMail', { mode: 'resendOne', mailId: id1 }),
  ]);
  assert.equal(raceResend.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(raceResend.filter((r) => r.status === 'rejected').length, 1);
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu').length, 1);

  // confirmSent 與 resendOne 並行競爭 id2：兩者互斥，只有一個成功
  x.gas.state.failPropWrite = false;
  const raceMutex = await Promise.allSettled([
    x.call('attendanceSendMail', { mode: 'confirmSent', mailId: id2 }),
    x.call('attendanceSendMail', { mode: 'resendOne', mailId: id2 }),
  ]);
  assert.equal(raceMutex.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(raceMutex.filter((r) => r.status === 'rejected').length, 1);
  assert.ok(x.sent.filter((m) => m.to === 's2@example.edu').length <= 1);
  const st = await x.call('attendanceMailStatus');
  assert.equal(st.log.find((m) => m.id === id1).status, 'sent');
  assert.equal(st.log.find((m) => m.id === id2).status, 'sent');
});

test('M1-b 選項 B 單封重送核對現況與序號：學生改準時或已寄更正後，舊未到通知不可重送', async () => {
  const x = setup();
  await x.mailer();
  const s = await x.start();
  for (let i = 3; i <= 5; i++) {
    await x.call(
      'attendanceCheckIn',
      { token: (await x.call('attendanceLive')).token },
      x.student(i),
    );
  }
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });

  const crypto = require('node:crypto');
  const id1 = `${s.id}__s1@example.edu__1`;
  const id2 = `${s.id}__s2@example.edu__1`;
  for (const id of [id1, id2]) {
    const k = 'sent:' + crypto.createHash('sha256').update(id, 'utf8').digest('base64url');
    x.gas.props.set(k, `pending:${x.now()}`);
  }
  await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] });
  assert.equal(x.sent.length, 0);

  // s1 改準時後寄出更正信（序號 2）；s2 改準時但尚未寄更正信
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s1@example.edu'],
    status: 'present',
  });
  assert.deepEqual(await x.call('attendanceSendMail', { mode: 'now', kinds: ['student'] }), {
    sent: 1,
    failed: 0,
    skipped: 0,
  });
  assert.equal(x.sent.filter((m) => m.to === 's1@example.edu' && /已改為準時/.test(m.subject)).length, 1);

  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s2@example.edu'],
    status: 'present',
  });

  // 兩筆過時的未到通知（序號 1）皆不可再重送
  await assert.rejects(
    x.call('attendanceSendMail', { mode: 'resendOne', mailId: id1 }),
    /已過時/,
  );
  await assert.rejects(
    x.call('attendanceSendMail', { mode: 'resendOne', mailId: id2 }),
    /已過時/,
  );
  assert.equal(x.sent.filter((m) => /未到通知/.test(m.subject)).length, 0);
});
