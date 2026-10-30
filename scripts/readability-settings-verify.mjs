import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
if (
  !/^demo-/.test(process.env.GCLOUD_PROJECT || '') ||
  !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')
)
  throw Error('Only local demo Firestore Emulator allowed');
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const h = require('../functions/lib/functions/src/index.js');
const db = require('firebase-admin/firestore').getFirestore();
const out = process.argv[process.argv.indexOf('--out') + 1] || '/tmp/readability-settings';
fs.mkdirSync(out, { recursive: true });
const teacher = {
    uid: 'readability-teacher',
    token: { teacher: true, email: 'readability-teacher@example.edu' },
  },
  student = {
    uid: 'readability-student',
    token: {
      email: 'readability-student@example.edu',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    },
  };
const id = 'readability-demo',
  course = {
    id,
    title: 'Emulator readability fixture',
    term: 'test',
    description: '',
    sheetsUrl: '',
    classIds: ['A'],
    units: [],
    features: {
      assessments: true,
      readabilityOverlay: false,
      readabilityOverlayExclusions: ['kidney-anatomy-v1'],
    },
  };
await db
  .doc(`courses/${id}`)
  .set({
    teacherIds: [teacher.uid],
    classIds: ['A'],
    rosterVersion: 2,
    draft: { ...course, features: {} },
    published: { ...course, features: {} },
    revision: 0,
  });
await db
  .doc(`enrollments/${id}__${student.token.email}`)
  .set({ courseId: id, email: student.token.email, classId: 'A', studentId: 'S00', enabled: true });
const call = (name, auth, data) => h[name].run({ auth, data });
const results = [];
for (const [name, auth] of [
  ['student denied', student],
  [
    'foreign teacher denied',
    { uid: 'other', token: { teacher: true, email: 'other@example.edu' } },
  ],
]) {
  await assert.rejects(
    call('saveCourse', auth, { course, expectedRevision: 0 }),
    (e) => e.code === 'permission-denied',
  );
  results.push({ name, pass: true });
}
let revision = 0;
for (const features of [
  course.features,
  { readabilityOverlay: true, readabilityOverlayExclusions: ['airway-structure-v1'] },
  {},
]) {
  const result = await call('saveCourse', teacher, {
    course: { ...course, features },
    expectedRevision: revision,
  });
  revision = result.revision;
  const expected = features.readabilityOverlay !== false,
    exclusions = features.readabilityOverlayExclusions || [];
  const saved = (await db.doc(`courses/${id}`).get()).data();
  assert.equal(saved.features.readabilityOverlay, expected);
  assert.deepEqual(saved.features.readabilityOverlayExclusions, exclusions);
  for (const auth of [teacher, student]) {
    const data = await call('bootstrap', auth, {});
    const c = data.courses.find((c) => c.id === id);
    assert(c);
    assert.equal(c.features.readabilityOverlay, expected);
    assert.deepEqual(c.features.readabilityOverlayExclusions, exclusions);
  }
  assert.equal(
    saved.published.features.readabilityOverlay,
    undefined,
    'published material is not rewritten',
  );
  results.push({
    name: 'save and teacher/student bootstrap',
    expected,
    exclusions,
    revision,
    pass: true,
  });
}
await assert.rejects(
  call('saveCourse', teacher, { course, expectedRevision: 0 }),
  (e) => e.code === 'failed-precondition',
);
results.push({ name: 'stale revision denied', pass: true });
for (const features of [
  { readabilityOverlay: 'yes' },
  { readabilityOverlayExclusions: ['../bad'] },
  { readabilityOverlayExclusions: ['same', 'same'] },
  { readabilityOverlayExclusions: Array.from({ length: 201 }, (_, i) => 'v' + i) },
])
  await assert.rejects(
    call('saveCourse', teacher, { course: { ...course, features }, expectedRevision: revision }),
  );
assert.equal((await db.doc(`courses/${id}`).get()).data().revision, revision);
results.push({ name: 'invalid settings rejected without revision change', pass: true });
fs.writeFileSync(
  path.join(out, 'emulator.json'),
  JSON.stringify(
    {
      project: process.env.GCLOUD_PROJECT,
      host: process.env.FIRESTORE_EMULATOR_HOST,
      results,
      pass: true,
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ pass: true, checks: results.length, revision }));
await db.terminate();
