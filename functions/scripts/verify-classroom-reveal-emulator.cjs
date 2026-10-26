/*
 * 真實 Firestore Emulator 課堂互動「公佈答案（甲案）」完整一輪驗證腳本
 * 執行：firebase emulators:exec --only firestore "node functions/scripts/verify-classroom-reveal-emulator.cjs"
 */
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_CONFIG ||= JSON.stringify({ projectId: 'course-platform-reveal-test' });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { getFirestore } = require('firebase-admin/firestore');
const handlers = require('../lib/functions/src/index.js');

const db = getFirestore();
const courseId = 'reveal-emulator-course';

const teacherAuth = {
  uid: 'teacher-1',
  token: { email: 'teacher@example.test', email_verified: true, teacher: true, firebase: { sign_in_provider: 'google.com' } },
};
const studentCorrectAuth = {
  uid: 'student-correct',
  token: { email: 's.correct@example.test', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
};
const studentWrongAuth = {
  uid: 'student-wrong',
  token: { email: 's.wrong@example.test', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
};
const studentUnansweredAuth = {
  uid: 'student-unanswered',
  token: { email: 's.unanswered@example.test', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
};
const studentOtherClassAuth = {
  uid: 'student-other',
  token: { email: 's.other@example.test', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
};

const interactions = [
  {
    slideId: 'R-REV-04',
    title: '支氣管樹分支階層與組織構造特徵判斷',
    prompt: '有關人類支氣管樹由上而下的分支階層與管壁構造變化，下列敘述何者正確？',
    fields: [
      {
        id: 'f1',
        label: '請選擇最符合解剖與生理事實的敘述',
        kind: 'choice',
        options: [
          '主支氣管進入肺門後直接分支為終末細支氣管，再進入呼吸細支氣管',
          '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）',
          '主支氣管與次級支氣管管壁完全不含軟骨，僅由平滑肌維持管腔開放',
          '細支氣管管壁具有完整環狀軟骨，以防止呼氣時氣道塌陷',
        ],
      },
    ],
  },
  {
    slideId: 'R-REV-07',
    title: '平靜吸氣週期各階段變化定性順序排列',
    prompt: '請將正常人平靜吸氣時，由呼吸肌開始收縮到空氣流入肺泡的因果過程依先後順序排列。',
    fields: [
      {
        id: 'f1',
        label: '平靜吸氣四階段順序',
        kind: 'order',
        options: [
          '橫膈膜與外肋間肌收縮使胸腔擴大',
          '胸膜腔密閉負壓增加（胸內壓更負）',
          '肺泡向外擴張，肺內壓降至低於大氣壓',
          '外界空氣順壓力差流入肺泡',
        ],
      },
    ],
  },
];

const answerKeys = {
  'R-REV-04': {
    f1: {
      answer: '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）',
      explanation: '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）。主支氣管與各級支氣管管壁仍有支持軟骨，至細支氣管軟骨消失。',
    },
  },
  'R-REV-07': {
    f1: {
      answer: [
        '橫膈膜與外肋間肌收縮使胸腔擴大',
        '胸膜腔密閉負壓增加（胸內壓更負）',
        '肺泡向外擴張，肺內壓降至低於大氣壓',
        '外界空氣順壓力差流入肺泡',
      ],
      explanation: '呼吸肌收縮擴大胸腔 → 胸內壓更負 → 肺擴張且肺內壓低於大氣壓 → 空氣流入。',
    },
  },
};

async function main() {
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

  const enrollments = [
    { auth: studentCorrectAuth, classId: 'A', studentId: '115001', name: '王答對' },
    { auth: studentWrongAuth, classId: 'A', studentId: '115002', name: '李答錯' },
    { auth: studentUnansweredAuth, classId: 'A', studentId: '115003', name: '張未答' },
    { auth: studentOtherClassAuth, classId: 'B', studentId: '115004', name: '陳別班' },
  ];
  for (const e of enrollments) {
    const email = e.auth.token.email;
    await db.doc(`enrollments/${courseId}__${email}`).set({
      courseId,
      email,
      classId: e.classId,
      studentId: e.studentId,
      name: e.name,
      enabled: true,
      uid: e.auth.uid,
    });
  }

  // 1. saveClassroomConfig & getClassroomConfig
  const savedCfg = await handlers.saveClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId, interactions, answerKeys },
  });
  assert.equal(savedCfg.interactions.length, 2);
  assert.deepEqual(savedCfg.answerKeys, answerKeys);

  const loadedCfg = await handlers.getClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId },
  });
  assert.deepEqual(loadedCfg.answerKeys, answerKeys);

  // 2. Open Round 1 (R-REV-04, choice)
  const opened1 = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'open', slideId: 'R-REV-04', classIds: ['A'], durationSeconds: 60 },
  });
  const round1Id = opened1.round.id;
  assert.equal(opened1.round.status, 'open');

  // Cannot reveal while open
  await assert.rejects(
    handlers.controlClassroomInteraction.run({
      auth: teacherAuth,
      data: { courseId, action: 'reveal', roundId: round1Id },
    }),
    /請先結束作答再公佈答案/,
  );

  // 3. Submit answers for Round 1
  await handlers.submitClassroomInteraction.run({
    auth: studentCorrectAuth,
    data: {
      courseId,
      roundId: round1Id,
      answers: { f1: '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）' },
    },
  });
  await handlers.submitClassroomInteraction.run({
    auth: studentWrongAuth,
    data: {
      courseId,
      roundId: round1Id,
      answers: { f1: '主支氣管進入肺門後直接分支為終末細支氣管，再進入呼吸細支氣管' },
    },
  });

  // Negative check while open: no answer/explanation/reveal/judgement leaked
  const beforeCloseStudent = await handlers.getClassroomInteraction.run({
    auth: studentWrongAuth,
    data: { courseId },
  });
  assert.equal(beforeCloseStudent.submitted, true);
  assert.equal(beforeCloseStudent.reveal, undefined);
  assert.equal(beforeCloseStudent.judgement, undefined);
  assert.equal(JSON.stringify(beforeCloseStudent).includes('至細支氣管軟骨消失'), false);

  // 4. Close Round 1
  const closed1 = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'close', roundId: round1Id },
  });
  assert.equal(closed1.round.status, 'closed');

  // Negative check after close before reveal: results tally returned, but NO answer/explanation/reveal/judgement
  const afterCloseBeforeReveal = await handlers.getClassroomInteraction.run({
    auth: studentWrongAuth,
    data: { courseId },
  });
  assert.equal(afterCloseBeforeReveal.results.total, 2);
  assert.equal(afterCloseBeforeReveal.reveal, undefined);
  assert.equal(afterCloseBeforeReveal.judgement, undefined);
  assert.equal(JSON.stringify(afterCloseBeforeReveal).includes('至細支氣管軟骨消失'), false);

  const historyBeforeReveal = await handlers.studentClassroomHistory.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.deepEqual(historyBeforeReveal.rounds, []);

  // 5. Reveal Round 1
  const revealed1 = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'reveal', roundId: round1Id },
  });
  assert.ok(revealed1.round.reveal);
  assert.equal(
    revealed1.round.reveal.key.f1.answer,
    '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）',
  );

  // Idempotent second reveal
  const revealed1Again = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'reveal', roundId: round1Id },
  });
  assert.equal(revealed1Again.round.reveal.revealedAt, revealed1.round.reveal.revealedAt);

  // Snapshot immutability: modify answerKeys in config and verify revealed round1 keeps original snapshot
  const mutatedKeys = structuredClone(answerKeys);
  mutatedKeys['R-REV-04'].f1.explanation = '事後修改的解析文字';
  await handlers.saveClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId, interactions, answerKeys: mutatedKeys },
  });

  // 6. Check getClassroomInteraction after reveal for all 3 students
  const afterRevealCorrect = await handlers.getClassroomInteraction.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.equal(afterRevealCorrect.judgement.allCorrect, true);
  assert.equal(afterRevealCorrect.judgement.fields.f1.correct, true);
  assert.equal(
    afterRevealCorrect.reveal.key.f1.explanation,
    answerKeys['R-REV-04'].f1.explanation,
    '已公佈場次必須保留公佈當下快照',
  );

  const afterRevealWrong = await handlers.getClassroomInteraction.run({
    auth: studentWrongAuth,
    data: { courseId },
  });
  assert.equal(afterRevealWrong.judgement.allCorrect, false);
  assert.equal(afterRevealWrong.judgement.fields.f1.correct, false);

  const afterRevealUnanswered = await handlers.getClassroomInteraction.run({
    auth: studentUnansweredAuth,
    data: { courseId },
  });
  assert.equal(afterRevealUnanswered.submitted, false);
  assert.equal(afterRevealUnanswered.judgement.answered, false);
  assert.equal(
    afterRevealUnanswered.reveal.key.f1.answer,
    answerKeys['R-REV-04'].f1.answer,
  );

  // 7. Open -> Submit -> Close -> Reveal Round 2 (R-REV-07, order)
  const opened2 = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'open', slideId: 'R-REV-07', classIds: ['A'], durationSeconds: 60 },
  });
  const round2Id = opened2.round.id;

  await handlers.submitClassroomInteraction.run({
    auth: studentCorrectAuth,
    data: {
      courseId,
      roundId: round2Id,
      answers: { f1: answerKeys['R-REV-07'].f1.answer },
    },
  });
  await handlers.submitClassroomInteraction.run({
    auth: studentWrongAuth,
    data: {
      courseId,
      roundId: round2Id,
      answers: {
        f1: [
          '橫膈膜與外肋間肌收縮使胸腔擴大',
          '肺泡向外擴張，肺內壓降至低於大氣壓',
          '胸膜腔密閉負壓增加（胸內壓更負）',
          '外界空氣順壓力差流入肺泡',
        ],
      },
    },
  });

  await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'close', roundId: round2Id },
  });
  await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'reveal', roundId: round2Id },
  });

  // 8. Check studentClassroomHistory
  const histCorrect = await handlers.studentClassroomHistory.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.equal(histCorrect.rounds.length, 2);
  assert.equal(histCorrect.rounds[0].slideId, 'R-REV-04');
  assert.equal(histCorrect.rounds[0].judgement.allCorrect, true);
  assert.equal(histCorrect.rounds[1].slideId, 'R-REV-07');
  assert.equal(histCorrect.rounds[1].judgement.allCorrect, true);

  const histWrong = await handlers.studentClassroomHistory.run({
    auth: studentWrongAuth,
    data: { courseId },
  });
  assert.equal(histWrong.rounds.length, 2);
  assert.equal(histWrong.rounds[0].judgement.allCorrect, false);
  assert.equal(histWrong.rounds[1].judgement.allCorrect, false);
  assert.deepEqual(
    histWrong.rounds[1].judgement.fields.f1.stepCorrect,
    [true, false, false, true],
  );

  const histUnanswered = await handlers.studentClassroomHistory.run({
    auth: studentUnansweredAuth,
    data: { courseId },
  });
  assert.equal(histUnanswered.rounds.length, 2);
  assert.equal(histUnanswered.rounds[0].submitted, false);
  assert.equal(histUnanswered.rounds[0].judgement.answered, false);

  const histOtherClass = await handlers.studentClassroomHistory.run({
    auth: studentOtherClassAuth,
    data: { courseId },
  });
  assert.deepEqual(histOtherClass.rounds, []);

  // 9. F1 Regression on Emulator: remove/invalidate answerKey on unrevealed round3 vs already-revealed round1
  const opened3 = await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'open', slideId: 'R-REV-04', classIds: ['A'], durationSeconds: 60 },
  });
  const round3Id = opened3.round.id;
  await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'close', roundId: round3Id },
  });
  await handlers.saveClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId, answerKeys: {} },
  });
  const repAfterClear = await handlers.classroomInteractionReport.run({
    auth: teacherAuth,
    data: { courseId, roundId: round3Id, history: true },
  });
  assert.equal(
    repAfterClear.round.hasAnswerKey,
    undefined,
    '移除答案鍵後，未公佈輪次不可繼續回傳 hasAnswerKey: true',
  );
  const r1InHist = repAfterClear.rounds.find((x) => x.id === round1Id);
  assert.equal(r1InHist.hasAnswerKey, true, '已公佈輪次仍保留 hasAnswerKey 與 reveal 快照');
  assert.equal(r1InHist.reveal.key.f1.explanation, answerKeys['R-REV-04'].f1.explanation);
  await assert.rejects(
    handlers.controlClassroomInteraction.run({
      auth: teacherAuth,
      data: { courseId, action: 'reveal', roundId: round3Id },
    }),
    /尚未設定答案/,
  );

  // Restore valid answerKeys -> round3 regains hasAnswerKey: true
  await handlers.saveClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId, answerKeys },
  });
  const repAfterRestore = await handlers.classroomInteractionReport.run({
    auth: teacherAuth,
    data: { courseId, roundId: round3Id },
  });
  assert.equal(repAfterRestore.round.hasAnswerKey, true);

  // Invalidate answerKey by changing R-REV-04 options in interactions -> round3 loses hasAnswerKey
  const invalidatingInteractions = structuredClone(interactions);
  invalidatingInteractions[0].fields[0].options = ['選項甲', '選項乙'];
  await handlers.saveClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId, interactions: invalidatingInteractions },
  });
  const repAfterInvalid = await handlers.classroomInteractionReport.run({
    auth: teacherAuth,
    data: { courseId, roundId: round3Id },
  });
  assert.equal(
    repAfterInvalid.round.hasAnswerKey,
    undefined,
    '修改題目選項使舊答案鍵失效後，未公佈輪次不可繼續顯示 hasAnswerKey: true',
  );

  // Restore valid interactions & answerKeys, then reveal round3
  await handlers.saveClassroomConfig.run({
    auth: teacherAuth,
    data: { courseId, interactions, answerKeys },
  });
  await handlers.controlClassroomInteraction.run({
    auth: teacherAuth,
    data: { courseId, action: 'reveal', roundId: round3Id },
  });

  // 10. F2 Regression on Emulator: 105 newer Class B rounds & >100 Class A rounds
  const batchB = db.batch();
  const baseTime = Date.now() + 100000;
  for (let i = 0; i < 105; i++) {
    const bId = `emu-class-b-${String(i).padStart(3, '0')}`;
    batchB.set(db.doc(`courses/${courseId}/classroomRounds/${bId}`), {
      ...opened1.round,
      id: bId,
      classIds: ['B'],
      status: 'closed',
      openedAt: baseTime + i,
      closedAt: baseTime + i,
      hasAnswerKey: true,
      reveal: {
        revealedAt: baseTime + i,
        key: answerKeys['R-REV-04'],
      },
    });
  }
  await batchB.commit();

  const histAfter105B = await handlers.studentClassroomHistory.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.equal(
    histAfter105B.rounds.length,
    3,
    '別班新增 105 輪較新紀錄後，本班 3 輪已公佈紀錄不可消失',
  );
  assert.deepEqual(
    histAfter105B.rounds.map((r) => r.id),
    [round1Id, round2Id, round3Id],
  );

  const batchA = db.batch();
  for (let i = 0; i < 105; i++) {
    const aId = `emu-class-a-${String(i).padStart(3, '0')}`;
    batchA.set(db.doc(`courses/${courseId}/classroomRounds/${aId}`), {
      ...opened1.round,
      id: aId,
      classIds: ['A'],
      status: 'closed',
      openedAt: baseTime + 5000 + i,
      closedAt: baseTime + 5000 + i,
      hasAnswerKey: true,
      reveal: {
        revealedAt: baseTime + 5000 + i,
        key: answerKeys['R-REV-04'],
      },
    });
  }
  await batchA.commit();

  const histOver100A = await handlers.studentClassroomHistory.run({
    auth: studentCorrectAuth,
    data: { courseId },
  });
  assert.equal(histOver100A.rounds.length, 108, '本班超過 100 輪已公佈紀錄應完整取得');

  // 11. Check teacher classroomInteractionRecords & invariants
  const records = await handlers.classroomInteractionRecords.run({
    auth: teacherAuth,
    data: { courseId, roundId: round1Id },
  });
  assert.equal(records.rows.length, 2);

  const progressSnap = await db.collection(`courses/${courseId}/progress`).get();
  assert.equal(progressSnap.empty, true, '課堂互動與公佈答案不可寫入成績或完成度 progress');

  const summary = {
    verifiedAt: new Date().toISOString(),
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
    courseId,
    roundsTested: [round1Id, round2Id, round3Id],
    checks: {
      saveAndLoadAnswerKeys: 'PASS',
      rejectRevealWhenOpen: 'PASS',
      noLeakWhileOpen: 'PASS',
      noLeakWhenClosedBeforeReveal: 'PASS',
      revealIdempotent: 'PASS',
      revealSnapshotImmutableAfterConfigEdit: 'PASS',
      f1UnrevealedKeyRemovedOrInvalidatedHidesReveal: 'PASS',
      f2HistoryNotEvictedBy105OtherClassAndSupportsOver100OwnClass: 'PASS',
      studentFeedbackCorrectWrongUnanswered: 'PASS',
      orderStepByStepJudgement: 'PASS',
      studentClassroomHistoryChronologicalAndIsolated: 'PASS',
      teacherClassroomInteractionRecords: 'PASS',
      zeroGradeOrProgressWrites: 'PASS',
    },
  };
  const outPath = process.env.EMULATOR_REPORT_PATH;
  if (outPath) {
    fs.mkdirSync(require('node:path').dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n');
  }
  console.log('PASS: Firestore Emulator complete reveal roundtrip verified.');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
