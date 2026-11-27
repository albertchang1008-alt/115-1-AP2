import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { dirname, resolve } from 'node:path';

const mode = process.argv[2];
const classesOnly = process.argv.includes('--classes-only');
assert.ok(!classesOnly || mode === 'after', '--classes-only requires after');
assert.ok(['before', 'after'].includes(mode), 'Specify before or after');
assert.match(process.env.GCLOUD_PROJECT || '', /^demo-/);
assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { getFirestore } = require('firebase-admin/firestore');
const { getApp, deleteApp } = require('firebase-admin/app');
const handlers = require('../functions/lib/functions/src/index.js');
const db = getFirestore();
const teacher = { uid: 'synthetic-teacher', token: { teacher: true } };
const student = (i, classId) => {
  const uid = classId.toLowerCase() + '-' + i;
  return { uid, token: { email: uid + '@example.test', email_verified: true, firebase: { sign_in_provider: 'google.com' } } };
};
const unit = 'unit';
const bank = 'synthetic';
const questions = Array.from({ length: 20 }, (_, i) => ({
  id: 'q' + i, text: '合成題目 ' + i, options: [{ id: 'a', text: '甲' }, { id: 'b', text: '乙' }],
  answer: 'a', explanation: '合成解析',
}));
const items = questions.map((q) => ({ questionId: q.id, unitId: unit, version: bank, optionOrder: ['a', 'b'] }));
const call = (courseId, name, data = {}, auth = teacher) => handlers[name].run({ data: { courseId, ...data }, auth });
const time = async (fn) => {
  const start = performance.now();
  const value = await fn();
  return { value, ms: performance.now() - start };
};
const roundMs = (ms) => Number(ms.toFixed(2));
const percentile = (values, ratio) => roundMs([...values].sort((a, b) => a - b)[Math.ceil(values.length * ratio) - 1]);

async function seed(courseId) {
  const course = db.doc('courses/' + courseId);
  const bankRef = db.doc('banks/' + [courseId, unit, bank].join('_'));
  const batch = db.batch();
  const published = { classIds: ['A', 'test', 'B'], classNames: { A: '合成甲班', B: '合成乙班' }, units: [{ id: unit, title: '合成單元', bankVersion: bank }] };
  batch.set(course, { teacherIds: [teacher.uid], rosterVersion: 2, features: { attendance: true, zuvioExams: true, zuvioMood: true }, published });
  batch.set(bankRef, { unitId: unit, version: bank, chunks: ['0'] });
  batch.set(bankRef.collection('chunks').doc('0'), { questions });
  batch.set(bankRef.collection('grading').doc('answers'), { answers: Object.fromEntries(questions.map((q) => [q.id, 'a'])) });
  const exams = Array.from({ length: 100 }, () => randomUUID());
  for (const classId of ['A', 'B']) {
    for (let i = 0; i < 54; i++) {
      const s = student(i, classId);
      const email = s.token.email;
      batch.set(db.doc('enrollments/' + courseId + '__' + email), { uid: s.uid, email, studentId: s.uid, classId, name: '合成學生 ' + i, courseId, enabled: true });
    }
    for (let i = 0; i < 12; i++) {
      const id = 'historic-' + classId + '-' + i;
      const ref = course.collection('attendance').doc(id);
      batch.set(ref, { id, kind: 'roll', status: 'closed', settled: true, confirmedAt: 1, date: '2026-10-01', period: i + 1, classIds: [classId], counts: { present: 5 } });
      for (let j = 0; j < 5; j++) batch.set(ref.collection('records').doc('record-' + j), { classId, status: 'present' });
    }
  }
  exams.forEach((id, i) => batch.set(course.collection('zuvioExams').doc(id), {
    title: '合成考卷 ' + i, createdAt: i + 1, classIds: [i % 2 ? 'B' : 'A'],
    items, sittings: [], answerMode: 'platform', score: 5,
  }));
  await batch.commit();
  return call(courseId, 'zuvioCreateSitting', {
    examId: exams[0], label: '合成場次', date: '2026-11-26', classIds: ['A'], durationSeconds: 600,
  });
}

const samples = [];
try {
  if (mode === 'after' && !classesOnly) {
    const callables = Object.entries(handlers).filter(([, fn]) => fn.__endpoint?.callableTrigger);
    assert.ok(callables.length > 100);
    for (const [name, fn] of callables) {
      assert.deepEqual(await fn.run({ data: { warm: true } }), { ok: true }, name);
    }
    const sdkV2 = dirname(require.resolve('firebase-functions/v2'));
    const { stackToWire } = require(resolve(sdkV2, '../runtime/manifest.js'));
    for (const name of ['attendanceCheckIn', 'attendanceCurrent', 'quizGet', 'quizStart', 'quizSave', 'quizLeave']) {
      const { cpu, concurrency, maxInstances, minInstances } = handlers[name].__endpoint;
      // stackToWire mutates its input. Serialize a copy of the settings under test.
      const manifest = stackToWire({
        specVersion: 'v1alpha1', requiredAPIs: [],
        endpoints: { [name]: { cpu, concurrency, maxInstances, minInstances } },
      });
      assert.deepEqual(manifest.endpoints[name], { cpu: 1, concurrency: 80, maxInstances: 20, minInstances: null }, name);
    }
    console.log(JSON.stringify({ warmCallables: callables.length }));
  }
  for (let run = 0; run < 5; run++) {
    const courseId = 'perf-' + randomUUID().slice(0, 12);
    const sitting = await seed(courseId);
    const invoke = (name, data, auth) => call(courseId, name, data, auth);
    const cards = await time(() => invoke('attendanceClassCards'));
    const directory = await time(() => mode === 'before'
      ? Promise.all([invoke('zuvioClassDirectory'), invoke('zuvioListExams')])
      : invoke('zuvioClassDirectory'));
    if (mode === 'after') {
      const expect = [
        { classId: 'A', name: '合成甲班', test: false },
        { classId: 'B', name: '合成乙班', test: false },
        { classId: 'test', name: 'test', test: true },
      ];
      assert.deepEqual(cards.value.classes, expect);
      assert.equal(cards.value.active, null);
      assert.deepEqual(directory.value, expect);
    }
    if (classesOnly) {
      samples.push({ cardsMs: roundMs(cards.ms), directoryMs: roundMs(directory.ms) });
      continue;
    }
    const selected = mode === 'before' ? null : await time(() => invoke('zuvioListExams', { classId: 'A' }));
    if (selected) {
      assert.equal(selected.value.length, 50);
      assert.ok(selected.value.every((row) => /^合成考卷 [02468]$|^合成考卷 [1-9][02468]$/.test(row.title)));
      assert.ok(selected.value.every((row) => !('items' in row) && !('count' in row)));
      await assert.rejects(invoke('zuvioListExams', { classId: 'foreign' }));
    }
    const monitor = await time(() => invoke('quizTeacherGet', { sittingId: sitting.id }));
    assert.equal(Object.keys(monitor.value.monitor.students).length, 54);
    const control = (action, quiz) => invoke('quizControl', { action, sittingId: sitting.id, ctl: quiz.ctl, round: quiz.round });
    const announce = await time(() => control('announce', monitor.value.quiz));
    const announced = await invoke('quizTeacherGet', { sittingId: sitting.id });
    const openWithSnapshot = await time(() => control('open', announced.quiz));
    const first = await time(async () => {
      const start = await invoke('attendanceStart', { classIds: ['A'], durationSec: 120 });
      return mode === 'before' ? invoke('attendanceLive') : start.live;
    });
    assert.match(first.value.code, /^\d{4}$/);
    assert.equal(first.value.session.expected, 54);
    if (mode === 'after') {
      const active = (await invoke('attendanceClassCards')).active;
      assert.deepEqual(active, { kind: 'roll', classIds: ['A'], endsAt: first.value.session.endsAt });
      assert.match(first.value.nextCode, /^\d{4}$/);
      assert.notEqual(first.value.nextToken, first.value.token);
      assert.ok(first.value.nextCodeAt > first.value.now && first.value.nextTokenAt > first.value.now);
    }
    const burst = await Promise.all(Array.from({ length: 54 }, (_, i) =>
      time(() => invoke('attendanceCheckIn', i % 2 ? { code: first.value.code } : { token: first.value.token }, student(i, 'A')))));
    assert.equal(burst.filter((row) => row.value.result === 'ok').length, 54, JSON.stringify(burst.filter((row) => row.value.result !== 'ok')));
    const live = await time(() => invoke('attendanceLive'));
    assert.equal(live.value.signed, 54);
    samples.push({
      cardsMs: roundMs(cards.ms), directoryMs: roundMs(directory.ms), selectedMs: selected ? roundMs(selected.ms) : null,
      monitorMs: roundMs(monitor.ms), announceMs: roundMs(announce.ms), openWithSnapshotMs: roundMs(openWithSnapshot.ms),
      firstCodeMs: roundMs(first.ms), liveMs: roundMs(live.ms), checkInMs: burst.map((row) => roundMs(row.ms)),
    });
  }
  const summary = Object.fromEntries(Object.keys(samples[0]).filter((key) => samples[0][key] !== null).map((key) => {
    const values = samples.flatMap((sample) => sample[key]);
    return [key, { p50: percentile(values, .5), p95: percentile(values, .95), max: roundMs(Math.max(...values)) }];
  }));
  console.log(JSON.stringify({ mode, classesOnly, samples, summary }));
} finally {
  await deleteApp(getApp());
}
