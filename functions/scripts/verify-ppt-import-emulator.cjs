/*
 * 真實 Firestore Emulator 授課控制台「匯入投影片＋題目表」與多份簡報（1.12.0）端到端驗證腳本
 * 執行：firebase emulators:exec --only firestore "node functions/scripts/verify-ppt-import-emulator.cjs"
 */
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_CONFIG ||= JSON.stringify({ projectId: 'course-platform-ppt-import-test' });

const assert = require('node:assert/strict');
const { getFirestore } = require('firebase-admin/firestore');
const handlers = require('../lib/functions/src/index.js');

const db = getFirestore();
const courseId = 'ppt-import-emulator-course';

const teacherAuth = {
  uid: 'teacher-1',
  token: {
    email: 'teacher@example.test',
    email_verified: true,
    teacher: true,
    firebase: { sign_in_provider: 'google.com' },
  },
};
const studentCorrectAuth = {
  uid: 'student-correct',
  token: {
    email: 's.correct@example.test',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  },
};
const studentWrongAuth = {
  uid: 'student-wrong',
  token: {
    email: 's.wrong@example.test',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  },
};

async function main() {
  // 1. Seed course, enrollments, legacy 28-page deck, and existing classroomConfig questions
  await db.doc(`courses/${courseId}`).set({
    rosterVersion: 2,
    teacherIds: ['teacher-1'],
    classIds: ['A', 'B'],
    features: { classroomInteraction: true, teachingConsole: true },
    draft: {
      id: courseId,
      classIds: ['A', 'B'],
      features: { classroomInteraction: true, teachingConsole: true },
      units: [],
    },
    published: {
      id: courseId,
      classIds: ['A', 'B'],
      features: { classroomInteraction: true, teachingConsole: true },
      units: [],
    },
  });
  await db.doc(`enrollments/${courseId}__s.correct@example.test`).set({
    courseId,
    email: 's.correct@example.test',
    studentId: 'S001',
    name: '王小明',
    classId: 'A',
    enabled: true,
    uid: studentCorrectAuth.uid,
  });
  await db.doc(`enrollments/${courseId}__s.wrong@example.test`).set({
    courseId,
    email: 's.wrong@example.test',
    studentId: 'S002',
    name: '李小華',
    classId: 'A',
    enabled: true,
    uid: studentWrongAuth.uid,
  });

  await db.doc(`courses/${courseId}/teacherAssets/presentation`).set({
    title: '期中複習合併版',
    slides: Array.from({ length: 28 }, (_, i) => ({
      id: i < 14 ? `R-REV-${String(i + 1).padStart(2, '0')}` : `U-REV-${String(i - 13).padStart(2, '0')}`,
      title: `舊頁 ${i + 1}`,
      html: `<section><h1>舊頁 ${i + 1}</h1></section>`,
      notes: `備註 ${i + 1}`,
      answerPage: false,
    })),
  });

  await db.doc(`courses/${courseId}/classroomConfig/interactions`).set({
    interactions: [
      {
        slideId: 'U-REV-04',
        title: '泌尿既有題目',
        fields: [
          {
            id: 'f1',
            label: '腎元過濾發生於何處？',
            kind: 'choice',
            options: ['腎絲球與鮑氏囊', '遠曲小管', '集尿管'],
          },
        ],
      },
    ],
  });
  await db.doc(`courses/${courseId}/classroomConfig/answerKeys`).set({
    answerKeys: {
      'U-REV-04': {
        f1: { answer: '腎絲球與鮑氏囊', explanation: '血液於腎絲球過濾進入鮑氏囊腔。' },
      },
    },
  });

  // 2. Migrate 28-page combined presentation into 2 decks
  const migRes = await handlers.saveTeachingDeck.run({
    auth: teacherAuth,
    data: { courseId, action: 'migrateLegacy28' },
  });
  assert.equal(migRes.ok, true);
  assert.equal(migRes.migratedDecks.length, 2);

  const getResp = await handlers.getTeachingDeck.run({
    auth: teacherAuth,
    data: { courseId, deckId: 'respiratory-review' },
  });
  assert.equal(getResp.title, '呼吸複習');
  assert.equal(getResp.slides.length, 14);

  // 3. Import a new 8-page review sample deck with 單選、排序、是非
  const importRes = await handlers.saveTeachingDeck.run({
    auth: teacherAuth,
    data: {
      courseId,
      deckId: 'resp-sample-8',
      title: '呼吸系統 30 分鐘複習樣本',
      pdfDataUrl: 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 sample').toString('base64'),
      slides: Array.from({ length: 8 }, (_, idx) => ({
        pageNumber: idx + 1,
        title: `樣本第 ${idx + 1} 頁`,
        notes: `備忘稿提示第 ${idx + 1} 頁`,
        answerPage: idx === 7,
        imageDataUrl:
          'data:image/webp;base64,' + Buffer.from(`RIFFpage${idx + 1}WEBP`).toString('base64'),
      })),
      questionRows: [
        {
          rowNumber: 2,
          page: 3,
          kind: '單選',
          stem: '有關人類支氣管樹由上而下的分支階層與管壁構造變化，下列敘述何者正確？',
          options: [
            '主支氣管進入肺門後直接分支為終末細支氣管',
            '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）',
            '主支氣管管壁完全不含軟骨',
            '細支氣管管壁具有完整環狀軟骨',
          ],
          answer: 'B',
          explanation: '主支氣管先分肺葉支氣管再分肺節支氣管，至細支氣管軟骨消失。',
        },
        {
          rowNumber: 3,
          page: 5,
          kind: '排序',
          stem: '請排列平靜吸氣時由呼吸肌收縮到空氣流入肺泡的先後順序：',
          options: [
            '胸膜腔密閉負壓增加（胸內壓更負）',
            '橫膈膜與外肋間肌收縮使胸腔擴大',
            '外界空氣順壓力差流入肺泡',
            '肺泡向外擴張，肺內壓降至低於大氣壓',
          ],
          answer: 'B A D C',
          explanation: '呼吸肌收縮 → 胸內壓更負 → 肺內壓低於大氣壓 → 空氣流入。',
        },
        {
          rowNumber: 4,
          page: 7,
          kind: '是非',
          stem: '動脈血 CO₂ 分壓升高時，CO₂ 可迅速通過血腦障壁進入腦脊髓液轉化為 H⁺，直接刺激延腦中樞化學受器。',
          options: [],
          answer: '對',
          explanation: '血腦障壁對 CO₂ 通透性極高，中樞化學受器主要感應腦脊髓液 H⁺ 濃度變化。',
        },
      ],
    },
  });

  assert.equal(importRes.ok, true);
  assert.equal(importRes.slideCount, 8);
  assert.equal(importRes.questionCount, 3);
  // Preserves existing U-REV-04 + adds 3 new questions = 4 total
  assert.equal(importRes.interactions.length, 4);
  assert(importRes.interactions.some((q) => q.slideId === 'U-REV-04'));
  assert(importRes.interactions.some((q) => q.slideId === 'resp-sample-8-P07'));

  // 4. Open round on True/False question (resp-sample-8-P07), test student interaction & answer secrecy before reveal
  const openRes = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: {
      courseId,
      action: 'open',
      slideId: 'resp-sample-8-P07',
      classIds: ['A'],
      durationSeconds: 60,
    },
  });
  const roundId = openRes.round.id;

  const s1Before = await handlers.getClassroomInteraction.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.deepEqual(s1Before.round.fields[0].options, ['○ 對', '✕ 錯']);
  assert.equal('reveal' in s1Before, false);

  await handlers.submitClassroomInteraction.run({
    auth: studentCorrectAuth,
    data: { courseId, roundId, answers: { f1: '○ 對' } },
  });
  await handlers.submitClassroomInteraction.run({
    auth: studentWrongAuth,
    data: { courseId, roundId, answers: { f1: '✕ 錯' } },
  });

  await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'close', roundId },
  });
  await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'reveal', roundId },
  });

  const s1After = await handlers.getClassroomInteraction.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.equal(s1After.judgement.allCorrect, true);
  assert.equal(s1After.reveal.key.f1.answer, '○ 對');

  const s2After = await handlers.getClassroomInteraction.run({
    auth: studentWrongAuth,
    data: { courseId },
  });
  assert.equal(s2After.judgement.allCorrect, false);

  // 5. Re-import resp-sample-8 with modified P07 and removed P03, verify diff & preserved revealed round snapshot
  const reimportRes = await handlers.saveTeachingDeck.run({
    auth: teacherAuth,
    data: {
      courseId,
      deckId: 'resp-sample-8',
      title: '呼吸系統 30 分鐘複習樣本（二版）',
      slides: Array.from({ length: 9 }, (_, idx) => ({
        pageNumber: idx + 1,
        title: idx === 0 ? '樣本第 1 頁（修訂）' : `樣本第 ${idx + 1} 頁`,
        notes: `備忘稿提示第 ${idx + 1} 頁`,
        answerPage: idx === 8,
      })),
      questionRows: [
        {
          rowNumber: 2,
          page: 5,
          kind: '排序',
          stem: '請排列平靜吸氣時由呼吸肌收縮到空氣流入肺泡的先後順序：',
          options: [
            '胸膜腔密閉負壓增加（胸內壓更負）',
            '橫膈膜與外肋間肌收縮使胸腔擴大',
            '外界空氣順壓力差流入肺泡',
            '肺泡向外擴張，肺內壓降至低於大氣壓',
          ],
          answer: 'B A D C',
          explanation: '呼吸肌收縮 → 胸內壓更負 → 肺內壓低於大氣壓 → 空氣流入。',
        },
        {
          rowNumber: 3,
          page: 7,
          kind: '是非',
          stem: '修訂後是非題：改為錯誤敘述。',
          options: [],
          answer: '錯',
          explanation: '修訂後第二版解析。',
        },
      ],
    },
  });

  assert.equal(reimportRes.diff.isUpdate, true);
  assert.deepEqual(reimportRes.diff.slides.added, ['resp-sample-8-P09']);
  assert.deepEqual(reimportRes.diff.questions.changed, ['resp-sample-8-P07']);
  assert.deepEqual(reimportRes.diff.questions.removed, ['resp-sample-8-P03']);

  const s1History = await handlers.studentClassroomHistory.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.equal(s1History.rounds.length, 1);
  assert.equal(s1History.rounds[0].reveal.key.f1.answer, '○ 對');
  assert.equal(
    s1History.rounds[0].reveal.key.f1.explanation,
    '血腦障壁對 CO₂ 通透性極高，中樞化學受器主要感應腦脊髓液 H⁺ 濃度變化。',
  );

  console.log(
    JSON.stringify(
      {
        emulatorVerified: true,
        courseId,
        migratedDecks: migRes.migratedDecks.map((d) => d.id),
        importedDeckId: importRes.deckId,
        mergedQuestionCount: importRes.interactions.length,
        reimportDiff: reimportRes.diff,
        revealedSnapshotPreserved: true,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
