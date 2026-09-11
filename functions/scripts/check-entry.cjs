// 只驗證編譯產物可載入；不呼叫 Firebase API 或使用正式專案。
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-course-platform',
});
const handlers = require('../lib/functions/src/index.js');
const expected = [
  'bootstrap',
  'saveCourse',
  'publishCourse',
  'deleteCourse',
  'importRoster',
  'getRoster',
  'getPublished',
  'publishQuestions',
  'sheetsPublish',
  'getBank',
  'getProgress',
  'submitAttempt',
  'saveActivity',
  'getHistory',
  'updateReports',
  'getReports',
  'setSchedule',
  'dailyReports',
  'getCompletion',
  'createSnapshot',
  'getSnapshots',
  'questionStudents',
  'saveSheetConfig',
  'getSyncStatus',
  'syncSheet',
  'migrateRoster',
  'archiveCourse',
  'saveLearningEvents',
  'getLearningDiagnostics',
];
for (const name of expected) {
  if (typeof handlers[name] !== 'function') throw new Error(`缺少後端入口：${name}`);
}
console.log(`後端入口載入通過：${expected.length} 個函式（未連接雲端）。`);
