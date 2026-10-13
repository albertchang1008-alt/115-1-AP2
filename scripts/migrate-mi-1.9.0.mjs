import fs from 'node:fs';
import { createRequire } from 'node:module';
const args = process.argv.slice(2);
const project = args[args.indexOf('--project') + 1];
if (!args.includes('--project') || project !== 'mi-bd885') throw Error('必須明確指定 --project mi-bd885，拒絕其他專案');
if (!args.includes('--dry-run') && !args.includes('--apply')) throw Error('請選擇 --dry-run 或 --apply');
if (args.includes('--dry-run') && args.includes('--apply')) throw Error('模式不可同時指定');
const courseId = '115-1-MI-國考精準對焦';
const { interactions } = JSON.parse(fs.readFileSync(new URL('../docs/unify-1.9.0/mi-interactions.json', import.meta.url)));
const presentation = JSON.parse(fs.readFileSync(new URL('../docs/unify-1.9.0/mi-slide-transforms.json', import.meta.url)));
const features = { assessments: true, teachingConsole: true, classroomInteraction: true };
const plan = { project, courseId, writes: [
  { path: `courses/${courseId}`, operation: 'update features; mirror into existing draft/published', features },
  { path: `courses/${courseId}/classroomConfig/interactions`, operation: 'set definitions and existing MI presentation wording transforms', interactions, ...presentation },
], preserve: ['classroomState', 'classroomRounds', 'assessments', 'assessmentSources', 'teacherAssets', 'progress', 'enrollments'] };
if (args.includes('--dry-run')) { console.log(JSON.stringify(plan, null, 2)); }
else {
  if (!args.includes('--confirm-mi-only')) throw Error('正式寫入需教師授權及 --confirm-mi-only');
  const require = createRequire(new URL('../functions/package.json', import.meta.url));
  const { initializeApp, applicationDefault } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  initializeApp({ projectId: project, credential: applicationDefault() });
  const db = getFirestore();
  const ref = db.doc(`courses/${courseId}`);
  const current = await ref.get();
  if (!current.exists) throw Error('MI 課程不存在，拒絕建立新課程');
  // Read existing legacy paths before applying. Never move, rewrite or clear records.
  const [state, rounds, exams, presentationSnap] = await Promise.all([
    ref.collection('classroomState').doc('current').get(),
    ref.collection('classroomRounds').limit(1).get(),
    ref.collection('assessments').limit(1).get(),
    ref.collection('teacherAssets').doc('presentation').get(),
  ]);
  if (!state.exists || rounds.empty || exams.empty || !presentationSnap.exists) throw Error('舊輪次／測驗／簡報路徑未確認，停止；請 Claude 與教師核對');
  await db.runTransaction(async tx => {
    const c = (await tx.get(ref)).data();
    if (!c?.draft || !c?.published) throw Error('MI 已發布課程資料不完整');
    tx.update(ref, { features, 'draft.features': features, 'published.features': features });
    tx.set(ref.collection('classroomConfig').doc('interactions'), { interactions, ...presentation }, { merge: true });
  });
  console.log('已寫入指定 MI features 與 12 題互動定義；既有資料保留。');
}
