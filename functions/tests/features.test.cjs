const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAssessmentHandlers } = require('../lib/functions/src/assessments');
const { createTeachingHandlers } = require('../lib/functions/src/teaching');
const { createClassroomHandlers } = require('../lib/functions/src/classroom');
function fixture() {
  const courses = { AP2: { features: {} }, MI: { features: { assessments: true, teachingConsole: true, classroomInteraction: true } } };
  let reads = [];
  const db = { doc: path => ({ get: async () => { reads.push(path); return { data: () => path.endsWith('/interactions') ? { interactions: [] } : undefined }; } }) };
  const access = async (req, id) => { if (!req.auth || !courses[id]) throw Error('denied'); return { p: req.auth, c: courses[id] }; };
  const h = { ...createAssessmentHandlers(db, access, {}), ...createTeachingHandlers(db, access, {}), ...createClassroomHandlers(db, access, {}) };
  const call = (name, courseId) => h[name].run({ auth: { uid: 'teacher', teacher: true }, data: { courseId } });
  return { courses, call, reads };
}
test('未設定 features 的課程，所有新 callable 都拒絕且不讀寫功能資料', async () => {
  const { call, reads } = fixture();
  for (const name of ['getAssessments','prepareAssessment','controlAssessment','startAssessment','saveAssessment','previewAssessment','assessmentReport','getTeachingDeck','getClassroomCourse','getClassroomConfig','saveClassroomConfig','controlClassroomInteraction','getClassroomInteraction','submitClassroomInteraction','classroomInteractionReport','classroomInteractionRecords']) await assert.rejects(call(name, 'AP2'), e => e.code === 'permission-denied', name);
  assert.deepEqual(reads, []);
});
test('features 按課程隔離，單一開關不啟用別的功能；缺簡報返回空 slides', async () => {
  const { courses, call, reads } = fixture();
  assert.deepEqual(await call('getTeachingDeck','MI'), { title: '', slides: [] });
  assert.deepEqual(await call('getClassroomConfig','MI'), { interactions: [] });
  courses.AP2.features.classroomInteraction = true;
  assert.deepEqual(await call('getClassroomConfig','AP2'), { interactions: [] });
  await assert.rejects(call('getTeachingDeck','AP2'));
  await assert.rejects(call('getAssessments','AP2'));
  courses.MI.features.classroomInteraction = false;
  await assert.rejects(call('getClassroomConfig','MI'));
  assert.deepEqual(await call('getClassroomConfig','AP2'), { interactions: [] });
  assert(reads.includes('courses/AP2/classroomConfig/interactions'));
  assert(reads.includes('courses/MI/classroomConfig/interactions'));
});
