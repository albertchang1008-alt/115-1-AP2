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
  let n = 0;
  const h = createAttendanceHandlers(
    db,
    access,
    {},
    { now: () => clock, random: (len) => Buffer.alloc(len, ++n) },
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
  const notifyCfg = () =>
    call('attendanceMailConfig', {
      set: {
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
    notifyCfg,
    course,
    owner,
    tick: (ms) => (clock += ms),
    now: () => clock,
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
    'attendanceNotifyDrafts',
    'attendanceMarkNotified',
    'attendanceUndoNotified',
    'attendanceMailConfig',
    'attendanceConfirm',
    'attendanceStart',
    'attendanceControl',
    'attendanceReopen',
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

test('6 半自動通知：只列已確認節次；產生收件人／主旨／內文；標記後不再出現；改準時出更正；內容不含成績／情緒；系統不寄信', async () => {
  const x = setup();
  const s = await x.start();
  const { token } = await live(x);
  for (const i of [1, 2])
    await x.call('attendanceCheckIn', { token, deviceId: 'device-same-1' }, x.student(i));
  await x.call('attendanceControl', { action: 'end' });
  await x.notifyCfg();
  const all = [];
  const pick = (m) => ({ draftId: m.draftId, expect: m.expect });
  // 未確認：沒有待通知
  let d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual([d.student.length, d.digest.length, d.unconfirmedToday.length], [0, 0, 1]);
  assert.equal(d.date, '2026-11-16');
  assert.equal(d.gmailAccount, 'teacher@example.edu', '沒設定時用老師登入的帳號開 Gmail');
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  d = await x.call('attendanceNotifyDrafts');
  all.push(...d.student, ...d.digest);
  assert.deepEqual(
    d.student.map((m) => [m.to, m.kind]),
    [
      ['s3@example.edu', 'absent'],
      ['s4@example.edu', 'absent'],
      ['s5@example.edu', 'absent'],
    ],
  );
  const m3 = d.student[0];
  assert.deepEqual(m3.expect, { status: 'absent', notifySeq: 0 });
  assert.match(m3.subject, /^【解剖生理學（二）】.*紀錄為未到$/);
  assert.match(m3.text, /示範學生3 同學：/);
  assert.match(m3.text, /本節紀錄為未到/);
  assert.match(m3.text, /https:\/\/platform\.example\.edu\/#\/course\/115-1-AP2\/attendance/);
  assert.match(m3.text, /示範教師$/);
  assert.deepEqual(
    d.digest.map((g) => [g.classId, g.to, g.periods, g.ready, g.supplement]),
    [['A', 'mentor-a@example.edu', [3], true, false]],
  );
  assert.match(d.digest[0].text, /應到 5 人，準時 2 人，未到 3 人。/);
  assert.match(d.digest[0].text, /示範學生3（099003）/);
  // 系統不寄信；信件內文不寫進資料庫
  assert(!('attendanceSendMail' in x.h) && !('attendanceMailTick' in x.h));
  const stored = () => JSON.stringify([...x.db.docs.values()]);
  assert(!stored().includes('本節紀錄為未到') && !stored().includes('老師您好'));
  // 標記：同一封重按只算一次
  assert.deepEqual(await x.call('attendanceMarkNotified', { items: [pick(m3)] }), {
    marked: 1,
    already: 0,
    stale: 0,
  });
  assert.deepEqual(await x.call('attendanceMarkNotified', { items: [pick(m3)] }), {
    marked: 0,
    already: 1,
    stale: 0,
  });
  d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual(
    d.student.map((m) => m.to),
    ['s4@example.edu', 's5@example.edu'],
  );
  assert.deepEqual(
    d.log.map((l) => [l.to, l.kind, l.status, l.byName, l.canUndo]),
    [['s3@example.edu', 'absent', 'marked', '示範教師', true]],
  );
  assert(!stored().includes('本節紀錄為未到'), '紀錄不存內文');
  // 批次標記（含導師彙整）
  assert.deepEqual(
    await x.call('attendanceMarkNotified', { items: [...d.student, ...d.digest].map(pick) }),
    { marked: 3, already: 0, stale: 0 },
  );
  d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual([d.student.length, d.digest.length], [0, 0]);
  // 已通知未到後改準時 → 更正；沒通知過的改來改去不出現
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s3@example.edu'],
    status: 'present',
    reason: '不該出現在信裡的原因',
  });
  for (const status of ['absent', 'present'])
    await x.call('attendanceSetStatus', { sessionId: s.id, emails: ['s1@example.edu'], status });
  d = await x.call('attendanceNotifyDrafts');
  all.push(...d.student);
  assert.deepEqual(
    d.student.map((m) => [m.to, m.kind, m.expect.notifySeq]),
    [['s3@example.edu', 'correction', 1]],
  );
  assert.match(d.student[0].subject, /紀錄已改為準時/);
  const corr = d.student[0];
  // 標記前狀態又變：舊內容不可標
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s3@example.edu'],
    status: 'absent',
  });
  assert.deepEqual(await x.call('attendanceMarkNotified', { items: [pick(corr)] }), {
    marked: 0,
    already: 0,
    stale: 1,
  });
  assert.equal((await x.call('attendanceNotifyDrafts')).student.length, 0, '又改回未到＝已通知過');
  // 準時改未到 → 出現未到通知
  await x.call('attendanceSetStatus', {
    sessionId: s.id,
    emails: ['s2@example.edu'],
    status: 'absent',
  });
  d = await x.call('attendanceNotifyDrafts');
  all.push(...d.student);
  assert.deepEqual(
    d.student.map((m) => [m.to, m.kind]),
    [['s2@example.edu', 'absent']],
  );
  // 名冊仍標示待通知
  const rows = (await x.call('attendanceRoster', { sessionId: s.id })).rows;
  assert.equal(rows.find((r) => r.email === 's2@example.edu').pendingMail, 'absent');
  // 內容檢查：只有點名資訊，收件人只來自名冊與導師設定
  const okTo = new Set(
    [1, 2, 3, 4, 5].map((i) => `s${i}@example.edu`).concat('mentor-a@example.edu'),
  );
  for (const m of all) {
    assert(!/成績|分數|情緒|關心|同裝置|device|原因|手機/.test(m.subject + m.text), m.text);
    assert(okTo.has(m.to), m.to);
  }
  // 設定驗證（寄信程式、密鑰、每日時間都已移除）
  for (const set of [
    { mailerUrl: 'https://script.google.com/macros/s/FAKE/exec', mailerKey: 'k'.repeat(32) },
    { dailyTime: '17:00' },
    { mentors: { C: { email: 'a@b.cc' } } },
    { mentors: { A: { email: 'not-an-email' } } },
    { platformUrl: 'javascript:alert(1)' },
    { gmailAccount: 'not-an-email' },
    { unknown: 1 },
  ])
    await assert.rejects(x.call('attendanceMailConfig', { set }), JSON.stringify(set));
  const cfg = await x.call('attendanceMailConfig', { set: { gmailAccount: 'Teacher2@Example.edu' } });
  assert.equal(cfg.gmailAccount, 'teacher2@example.edu');
  assert.equal((await x.call('attendanceNotifyDrafts')).gmailAccount, 'teacher2@example.edu');
  assert.deepEqual(Object.keys(cfg).sort(), ['gmailAccount', 'mentors', 'platformUrl', 'teacherName']);
});

test('6 已通知標記：狀態核對、輸入驗證、並行只算一次、撤銷回到待通知、只撤銷最新一筆、超過 24 小時不可撤銷', async () => {
  const x = setup();
  await x.notifyCfg();
  const s = await x.start();
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  const draftOf = async (to) =>
    (await x.call('attendanceNotifyDrafts')).student.find((m) => m.to === to);
  const mark = (m, expect = m.expect) =>
    x.call('attendanceMarkNotified', { items: [{ draftId: m.draftId, expect }] });
  const rec = () =>
    x.db.docs.get(`courses/${COURSE}/attendance/${s.id}/records/s1@example.edu`);
  const m1 = await draftOf('s1@example.edu');
  assert.equal((await mark(m1, { status: 'present', notifySeq: 0 })).stale, 1);
  assert.equal((await mark(m1, { status: 'absent', notifySeq: 5 })).stale, 1);
  for (const items of [
    [],
    [{ draftId: '../x', expect: m1.expect }],
    [{ draftId: m1.draftId }],
    [{ draftId: m1.draftId, expect: { status: 'late', notifySeq: 0 } }],
    [{ draftId: m1.draftId, expect: m1.expect, extra: 1 }],
    [{ draftId: 'digest__2026-11-16__Z', expect: { periods: [3] } }],
    Array.from({ length: 101 }, () => ({ draftId: m1.draftId, expect: m1.expect })),
  ])
    await assert.rejects(x.call('attendanceMarkNotified', { items }), JSON.stringify(items).slice(0, 80));
  // 兩個分頁同時按
  const both = await Promise.all([mark(m1), mark(m1)]);
  assert.deepEqual(
    [both[0].marked + both[1].marked, both[0].already + both[1].already],
    [1, 1],
  );
  assert.deepEqual([rec().notifySeq, rec().lastNotified], [1, 'absent']);
  // 撤銷：回到待通知，序號不倒退
  let log = (await x.call('attendanceNotifyDrafts')).log;
  const first = log.find((l) => l.to === 's1@example.edu');
  await x.call('attendanceUndoNotified', { logId: first.id });
  assert.deepEqual([rec().notifySeq, rec().lastNotified], [1, undefined]);
  const again = await draftOf('s1@example.edu');
  assert.deepEqual(again.expect, { status: 'absent', notifySeq: 1 });
  await assert.rejects(x.call('attendanceUndoNotified', { logId: first.id }), /不能撤銷/);
  await assert.rejects(x.call('attendanceUndoNotified', { logId: 'a/b' }));
  assert.equal((await mark(again)).marked, 1);
  log = (await x.call('attendanceNotifyDrafts')).log.filter((l) => l.to === 's1@example.edu');
  assert.deepEqual(
    log.map((l) => l.status).sort(),
    ['marked', 'undone'],
    '撤銷的紀錄保留',
  );
  const second = log.find((l) => l.status === 'marked');
  // 之後又有新的通知：較舊的一筆不能撤銷
  await x.call('attendanceSetStatus', { sessionId: s.id, emails: ['s1@example.edu'], status: 'present' });
  assert.equal((await mark(await draftOf('s1@example.edu'))).marked, 1);
  await assert.rejects(
    x.call('attendanceUndoNotified', { logId: second.id }),
    /之後已有新的通知紀錄/,
  );
  // 超過 24 小時
  const third = (await x.call('attendanceNotifyDrafts')).log.find(
    (l) => l.to === 's1@example.edu' && l.kind === 'correction',
  );
  x.tick(86400000 + 1000);
  assert.equal(
    (await x.call('attendanceNotifyDrafts')).log.find((l) => l.id === third.id).canUndo,
    false,
  );
  await assert.rejects(x.call('attendanceUndoNotified', { logId: third.id }), /超過 24 小時/);
  // 學生不能呼叫
  for (const name of ['attendanceNotifyDrafts', 'attendanceMarkNotified', 'attendanceUndoNotified'])
    await assert.rejects(
      x.call(name, { items: [{ draftId: m1.draftId, expect: m1.expect }], logId: third.id }, x.student(1)),
      name,
    );
});

test('6 導師彙整：該班當天節次都確認才提示；補充彙整只含新節次；撤銷最近一次；沒填導師信箱會列出', async () => {
  const x = setup();
  await x.notifyCfg();
  const s3 = await x.start({ period: 3 });
  await x.call('attendanceControl', { action: 'end' });
  const s4 = await x.start({ period: 4 });
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceBackfill', { classIds: ['A'], period: 1, date: '2026-11-15' });
  await x.call('attendanceConfirm', { sessionId: s3.id, confirmed: true });
  const mark = (g, expect = g.expect) =>
    x.call('attendanceMarkNotified', { items: [{ draftId: g.draftId, expect }] });
  let d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual(
    d.digest.map((g) => [g.periods, g.ready, g.unconfirmed]),
    [[[3], false, [4]]],
    '還有第 4 節未確認：不提示，但可先產生',
  );
  assert.deepEqual(
    d.unconfirmedToday.map((s) => s.period),
    [4],
  );
  assert(!/第 4 節|第 1 節/.test(d.digest[0].text), '未確認與非當天的節次不放進彙整');
  assert.equal((await mark(d.digest[0])).marked, 1);
  assert.equal((await x.call('attendanceNotifyDrafts')).digest.length, 0);
  await x.call('attendanceConfirm', { sessionId: s4.id, confirmed: true });
  d = await x.call('attendanceNotifyDrafts');
  const sup = d.digest[0];
  assert.deepEqual([sup.periods, sup.ready, sup.supplement], [[4], true, true]);
  assert.match(sup.subject, /（補充）$/);
  assert(/第 4 節/.test(sup.text) && !/第 3 節/.test(sup.text), '補充只含新節次');
  assert.equal((await mark(sup, { periods: [5] })).stale, 1, '沒有這一節');
  assert.equal((await mark(sup, { periods: [3] })).already, 1);
  assert.equal((await mark(sup)).marked, 1);
  assert.equal((await x.call('attendanceNotifyDrafts')).digest.length, 0);
  const log = (await x.call('attendanceNotifyDrafts')).log.filter((l) => l.kind === 'digest');
  assert.deepEqual(
    log.map((l) => [l.periods, l.canUndo]),
    [
      [[4], true],
      [[3], false],
    ],
    '只有最近一次可撤銷',
  );
  await x.call('attendanceUndoNotified', { logId: log[0].id });
  d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual(d.digest[0].periods, [4]);
  assert.equal(d.digest[0].supplement, true);
  // 沒有導師信箱的班
  const s5 = await x.start({ classIds: ['B'], period: 5 });
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s5.id, confirmed: true });
  d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual(d.noMentor, ['B']);
  assert.deepEqual(
    d.digest.map((g) => g.classId),
    ['A'],
  );
  // 指定日期
  assert.equal((await x.call('attendanceNotifyDrafts', { date: '2026-11-15' })).digest.length, 0);
  await assert.rejects(x.call('attendanceNotifyDrafts', { date: '11/15' }));
});

test('7 旗標關閉時全部 callable 拒絕，且不讀寫點名資料', async () => {
  const x = setup({ feature: false });
  const before = [...x.db.docs.keys()].sort();
  for (const name of Object.keys(x.h)) {
    await assert.rejects(x.call(name, { sessionId: 'x', classIds: ['A'], period: 3 }), name);
    await assert.rejects(x.call(name, { token: 'a.1.b', code: '1234' }, x.student(1)), name);
  }
  assert.deepEqual([...x.db.docs.keys()].sort(), before);
  assert.equal(Object.keys(x.h).length, 19);
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


// Codex 11/23 審查回歸：每個缺陷各自驗證實際狀態與拒絕後無寫入。
async function confirmedPeriod(x, period) {
  const session = await x.start({ period });
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: session.id, confirmed: true });
  return session;
}
const markDraft = (x, draft) => x.call('attendanceMarkNotified', {
  items: [{ draftId: draft.draftId, expect: draft.expect }],
});

test('審查：仍在點名中的節次阻擋導師提示，試簽不影響', async () => {
  const x = setup();
  await x.notifyCfg();
  await confirmedPeriod(x, 3);
  const open = await x.start({ period: 4 });
  let d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual(d.digest.map(g => [g.ready, g.periods, g.unconfirmed]), [[false, [3], [4]]]);
  assert.deepEqual(d.unconfirmedToday.map(s => s.id), [open.id]);
  assert(!d.digest[0].text.includes('第 4 節'));
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: open.id, confirmed: true });
  await x.start({ trial: true, period: 5 });
  d = await x.call('attendanceNotifyDrafts');
  assert.deepEqual(d.digest.map(g => [g.ready, g.periods]), [[true, [3, 4]]]);
});

test('審查：學生舊通知不顯示撤銷，最新通知在 24 小時邊界仍可撤銷且序號不退', async () => {
  const x = setup();
  const session = await confirmedPeriod(x, 3);
  const draft = async () => (await x.call('attendanceNotifyDrafts')).student.find(m => m.to === 's1@example.edu');
  await markDraft(x, await draft());
  await x.call('attendanceSetStatus', { sessionId: session.id, emails: ['s1@example.edu'], status: 'present' });
  x.tick(1);
  await markDraft(x, await draft());
  let logs = (await x.call('attendanceNotifyDrafts')).log.filter(l => l.to === 's1@example.edu');
  assert.deepEqual(logs.map(l => [l.kind, l.canUndo]), [['correction', true], ['absent', false]]);
  const before = structuredClone([...x.db.docs]);
  await assert.rejects(x.call('attendanceUndoNotified', { logId: logs[1].id }), /之後已有新的通知紀錄/);
  assert.deepEqual([...x.db.docs], before);
  x.tick(86400000);
  assert.equal((await x.call('attendanceNotifyDrafts')).log.find(l => l.id === logs[0].id).canUndo, true);
  await x.call('attendanceUndoNotified', { logId: logs[0].id });
  const r = x.db.docs.get(`courses/${COURSE}/attendance/${session.id}/records/s1@example.edu`);
  assert.deepEqual([r.notifySeq, r.lastNotified], [2, 'absent']);
});

test('審查：導師撤銷綁定單次標記；舊分頁與並行雙按不可撤銷另一筆', async () => {
  const x = setup();
  await x.notifyCfg();
  await confirmedPeriod(x, 3);
  await markDraft(x, (await x.call('attendanceNotifyDrafts')).digest[0]);
  const first = (await x.call('attendanceNotifyDrafts')).log.find(l => l.kind === 'digest');
  await confirmedPeriod(x, 4);
  const sup = (await x.call('attendanceNotifyDrafts')).digest[0];
  const both = await Promise.all([markDraft(x, sup), markDraft(x, sup)]);
  assert.equal(both.reduce((n, r) => n + r.marked, 0), 1);
  assert.equal(both.reduce((n, r) => n + r.already, 0), 1);
  const latest = (await x.call('attendanceNotifyDrafts')).log.find(l => l.kind === 'digest' && l.canUndo);
  assert.notEqual(latest.id, first.id);
  const before = structuredClone([...x.db.docs]);
  await assert.rejects(x.call('attendanceUndoNotified', { logId: first.id }), /不是最新/);
  assert.deepEqual([...x.db.docs], before);
  const undo = await Promise.allSettled([1, 2].map(() => x.call('attendanceUndoNotified', { logId: latest.id })));
  assert.equal(undo.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(undo.filter(r => r.status === 'rejected').length, 1);
  const record = x.db.docs.get(`courses/${COURSE}/attendanceMail/${sup.draftId}`);
  assert.deepEqual(record.periods, [3]);
  assert.equal(record.marks.length, 2);
  assert(!record.marks[0].undoneAt && record.marks[1].undoneAt);
  assert.deepEqual((await x.call('attendanceNotifyDrafts')).digest[0].periods, [4]);
});

test('審查：導師標記交易內重讀節次，並行取消確認回 stale 且不寫通知', async () => {
  const x = setup();
  await x.notifyCfg();
  const session = await confirmedPeriod(x, 3);
  const draft = (await x.call('attendanceNotifyDrafts')).digest[0];
  const transaction = x.db.runTransaction;
  x.db.runTransaction = async fn => {
    const path = `courses/${COURSE}/attendance/${session.id}`;
    const r = x.db.docs.get(path);
    delete r.confirmedAt;
    return transaction(fn);
  };
  assert.deepEqual(await markDraft(x, draft), { marked: 0, already: 0, stale: 1 });
  assert(![...x.db.docs.keys()].some(k => k.includes('/attendanceMail/')));
});

test('再開放（#73）：今天已結束的節次一鍵重開；已簽到保留、未到可補簽並標示；已確認者撤銷確認並留紀錄；限制條件', async () => {
  const x = setup();
  const s = await x.start();
  assert.equal(
    (await x.call('attendanceCheckIn', { token: (await live(x)).token }, x.student(1))).result,
    'ok',
  );
  await assert.rejects(x.call('attendanceReopen', { sessionId: s.id, minutes: 3 }), /已有進行中/);
  await x.call('attendanceControl', { action: 'end' });
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  const confirmedAt = (await x.call('attendanceRoster', { sessionId: s.id })).session.confirmedAt;
  assert.ok(confirmedAt > 0);
  for (const minutes of [0, 31, 2.5, '3', undefined])
    await assert.rejects(x.call('attendanceReopen', { sessionId: s.id, minutes }), /1–30 分鐘/);
  await assert.rejects(x.call('attendanceReopen', { sessionId: s.id, minutes: 3 }, x.student(2)));
  x.tick(60000);
  const r = await x.call('attendanceReopen', { sessionId: s.id, minutes: 3 });
  assert.equal(r.session.id, s.id);
  assert.equal(r.session.status, 'open');
  assert.equal(r.session.confirmedAt, 0);
  assert.equal(r.session.reopenCount, 1);
  assert.equal(r.session.endsAt, x.now() + 180000);
  // 投影立即回到簽到狀態
  const l = await live(x);
  assert.equal(l.session.id, s.id);
  assert.equal(l.session.status, 'open');
  // 已簽到保留（重複回原結果）；原本未到者可補簽並標示
  assert.equal(
    (await x.call('attendanceCheckIn', { token: l.token }, x.student(1))).result,
    'duplicate',
  );
  assert.equal((await x.call('attendanceCheckIn', { token: l.token }, x.student(2))).result, 'ok');
  // 同時只能一場
  await assert.rejects(x.start({ period: 4 }), /已有進行中/);
  await x.call('attendanceControl', { action: 'end' });
  const roster = await x.call('attendanceRoster', { sessionId: s.id });
  assert.deepEqual(roster.session.counts, { present: 2, absent: 3 });
  assert.equal(roster.session.confirmedAt, 0);
  const rec = (e) => x.db.docs.get(`courses/${COURSE}/attendance/${s.id}/records/${e}`);
  assert.equal(rec('s2@example.edu').reopened, true);
  assert.equal(rec('s1@example.edu').reopened, undefined);
  // 修改紀錄：誰、何時、撤銷的原確認時間
  const audit = (await x.call('attendanceAuditLog')).rows.find((row) => row.action === 'reopen');
  assert.equal(audit.sessionId, s.id);
  assert.equal(audit.minutes, 3);
  assert.equal(audit.unconfirmed, confirmedAt);
  assert.equal(audit.byName, '示範教師');
  // 再確認可正常進行
  await x.call('attendanceConfirm', { sessionId: s.id, confirmed: true });
  // 試簽、補建（非今天）與不存在的節次不可再開放
  const back = await x.call('attendanceBackfill', { classIds: ['B'], period: 5, date: '2026-11-11' });
  await assert.rejects(x.call('attendanceReopen', { sessionId: back.session.id, minutes: 3 }), /今天/);
  const trial = await x.start({ trial: true, period: 6 });
  await x.call('attendanceControl', { action: 'end' });
  await assert.rejects(x.call('attendanceReopen', { sessionId: trial.id, minutes: 3 }));
  await assert.rejects(x.call('attendanceReopen', { sessionId: 'nope', minutes: 3 }));
});
