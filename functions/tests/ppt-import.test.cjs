const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createTeachingHandlers } = require('../lib/functions/src/teaching.js');
const { createClassroomHandlers } = require('../lib/functions/src/classroom.js');

const COURSE_ID = '115-1-AP2';

function createFixture() {
  let clock = 1760000000000;
  const docs = new Map();
  const storageFiles = new Map();

  // Seed 2 enrolled students in class A
  docs.set('enrollments/e1', { courseId: COURSE_ID, classId: 'A', enabled: true, email: 's1@test.edu.tw' });
  docs.set('enrollments/e2', { courseId: COURSE_ID, classId: 'A', enabled: true, email: 's2@test.edu.tw' });

  const snap = (docPath) => ({
    id: docPath.split('/').pop(),
    exists: docs.has(docPath),
    data: () => (docs.has(docPath) ? structuredClone(docs.get(docPath)) : undefined),
  });

  const collection = (colPath, filter) => ({
    where: (field, op, value) =>
      collection(
        colPath,
        (row) =>
          (!filter || filter(row)) &&
          (op === 'array-contains'
            ? Array.isArray(row?.[field]) && row[field].includes(value)
            : row?.[field] === value),
      ),
    doc: (id) => ref(`${colPath}/${id}`),
    orderBy: () => ({
      limit: () => ({
        get: async () => ({
          docs: [...docs.keys()]
            .filter(
              (k) =>
                k.startsWith(colPath + '/') &&
                !k.slice(colPath.length + 1).includes('/') &&
                (!filter || filter(docs.get(k))),
            )
            .map((k) => snap(k))
            .sort((a, b) => (b.data()?.openedAt || 0) - (a.data()?.openedAt || 0))
            .slice(0, 100),
        }),
      }),
    }),
    get: async () => ({
      docs: [...docs.keys()]
        .filter(
          (k) =>
            k.startsWith(colPath + '/') &&
            !k.slice(colPath.length + 1).includes('/') &&
            (!filter || filter(docs.get(k))),
        )
        .map((k) => snap(k)),
    }),
  });

  const assertFirestoreLimits = (docPath, val) => {
    const serialized = JSON.stringify(val);
    assert(
      Buffer.byteLength(serialized) <= 1048576,
      `Document ${docPath} exceeds 1 MiB limit: ${Buffer.byteLength(serialized)} bytes`,
    );
    for (const [k, v] of Object.entries(val || {})) {
      if (typeof v === 'string') {
        assert(
          Buffer.byteLength(v) <= 1048487,
          `Field ${docPath}.${k} exceeds 1,048,487 bytes: ${Buffer.byteLength(v)} bytes`,
        );
      }
    }
  };

  const ref = (docPath) => ({
    path: docPath,
    get: async () => snap(docPath),
    set: async (val, opts) => {
      const nextVal =
        opts && opts.merge && docs.has(docPath)
          ? { ...structuredClone(docs.get(docPath)), ...structuredClone(val) }
          : structuredClone(val);
      assertFirestoreLimits(docPath, nextVal);
      docs.set(docPath, nextVal);
    },
    collection: (name) => collection(`${docPath}/${name}`),
  });

  const db = {
    doc: ref,
    collection,
    runTransaction: async (fn) => {
      const writes = [];
      const out = await fn({
        get: async (r) => snap(r.path),
        set: (r, v) => writes.push([r.path, structuredClone(v)]),
      });
      writes.forEach(([k, v]) => docs.set(k, v));
      return out;
    },
  };

  const storage = {
    bucket: () => ({
      file: (storagePath) => ({
        save: async (buf, opts) => {
          storageFiles.set(storagePath, { size: buf.length, contentType: opts?.contentType });
        },
        getSignedUrl: async ({ expires }) => [
          `https://storage.googleapis.com/demo-bucket/${storagePath}?signedExp=${expires}`,
        ],
      }),
    }),
  };

  const access = async (req, id, teacher) => {
    if (!req.auth) throw Error('unauthenticated');
    if (id !== COURSE_ID) throw Error('permission');
    if (teacher && (!req.auth.teacher || req.auth.uid !== 'teacher-1')) throw Error('permission');
    return {
      p: req.auth,
      c: {
        features: { teachingConsole: true, classroomInteraction: true },
        classIds: ['A', 'B'],
        rosterVersion: 2,
      },
    };
  };

  const teaching = createTeachingHandlers(db, access, { region: 'asia-east1' }, storage, () => clock);
  const classroom = createClassroomHandlers(db, access, { region: 'asia-east1' }, () => clock);
  const all = { ...teaching, ...classroom };

  const call = (name, data = {}, auth = { uid: 'teacher-1', teacher: true }) =>
    all[name].run({ data: { courseId: COURSE_ID, ...data }, auth });

  const student = (i = 1) => ({
    uid: `student-${i}`,
    classId: 'A',
    name: `學生${i}`,
    studentId: `S0${i}`,
  });

  return { docs, storageFiles, call, student, advanceClock: (ms) => (clock += ms) };
}

test('saveTeachingDeck 與 getTeachingDeck：多份簡報獨立儲存、Storage 短期有效網址、28 頁合併版拆分遷移', async () => {
  const { docs, storageFiles, call, student } = createFixture();

  // Seed legacy 28-page combined presentation and existing interactions
  docs.set(`courses/${COURSE_ID}/teacherAssets/presentation`, {
    title: '期中複習合併版',
    slides: Array.from({ length: 28 }, (_, i) => ({
      id: i < 14 ? `R-REV-${String(i + 1).padStart(2, '0')}` : `U-REV-${String(i - 13).padStart(2, '0')}`,
      title: `頁 ${i + 1}`,
      html: `<section><h1>頁 ${i + 1}</h1></section>`,
      notes: `備註 ${i + 1}`,
      answerPage: false,
    })),
  });
  docs.set(`courses/${COURSE_ID}/classroomConfig/interactions`, {
    interactions: [
      {
        slideId: 'R-REV-04',
        title: '呼吸舊題',
        fields: [{ id: 'f1', label: '呼吸題幹', kind: 'choice', options: ['甲', '乙'] }],
      },
      {
        slideId: 'U-REV-07',
        title: '泌尿舊題',
        fields: [{ id: 'f1', label: '泌尿題幹', kind: 'choice', options: ['丙', '丁'] }],
      },
    ],
  });
  docs.set(`courses/${COURSE_ID}/classroomConfig/answerKeys`, {
    answerKeys: {
      'R-REV-04': { f1: { answer: '甲', explanation: '呼吸舊解析' } },
      'U-REV-07': { f1: { answer: '丁', explanation: '泌尿舊解析' } },
    },
  });

  // Migrate 28-page legacy combined deck into 呼吸複習 & 泌尿＋體液複習
  const mig = await call('saveTeachingDeck', { action: 'migrateLegacy28' });
  assert.equal(mig.ok, true);
  assert.equal(mig.migratedDecks.length, 2);
  assert.deepEqual(
    mig.migratedDecks.map((d) => d.title),
    ['呼吸複習', '泌尿＋體液複習'],
  );

  // Switch between decks via getTeachingDeck
  const respDeck = await call('getTeachingDeck', { deckId: 'respiratory-review' });
  assert.equal(respDeck.title, '呼吸複習');
  assert.equal(respDeck.slides.length, 14);
  assert.equal(respDeck.decks.length, 2);

  const uriDeck = await call('getTeachingDeck', { deckId: 'urinary-fluid-review' });
  assert.equal(uriDeck.title, '泌尿＋體液複習');
  assert.equal(uriDeck.slides.length, 14);

  // Import a new PDF + XLSX deck ("消化複習") with單選、排序、是非 and verify Storage upload & short-lived URLs
  const samplePdfDataUrl = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 mock').toString('base64');
  const sampleImgDataUrl = 'data:image/webp;base64,' + Buffer.from('RIFFmockWEBP').toString('base64');

  const saved = await call('saveTeachingDeck', {
    deckId: 'digestive-review',
    title: '消化複習',
    pdfDataUrl: samplePdfDataUrl,
    slides: Array.from({ length: 8 }, (_, idx) => ({
      pageNumber: idx + 1,
      title: `消化第 ${idx + 1} 頁`,
      notes: `講者提示 ${idx + 1}`,
      answerPage: idx === 7,
      imageDataUrl: sampleImgDataUrl,
    })),
    questionRows: [
      {
        rowNumber: 2,
        page: 3,
        kind: '單選',
        stem: '胃酸主要由哪一種細胞分泌？',
        options: ['壁細胞（parietal cell）', '主細胞（chief cell）', 'G 細胞'],
        answer: 'A',
        explanation: '壁細胞分泌鹽酸與內在因子。',
      },
      {
        rowNumber: 3,
        page: 5,
        kind: '排序',
        stem: '請排列消化道由口側至肛側的順序：',
        options: ['空腸', '十二指腸', '迴腸'],
        answer: 'B A C',
        explanation: '小腸依序為十二指腸、空腸、迴腸。',
      },
      {
        rowNumber: 4,
        page: 7,
        kind: '是非',
        stem: '膽汁由肝細胞製造，儲存在膽囊中濃縮。',
        options: [],
        answer: '對',
        explanation: '肝臟製造膽汁，膽囊負責儲存與濃縮。',
      },
    ],
  });

  assert.equal(saved.ok, true);
  assert.equal(saved.slideCount, 8);
  assert.equal(saved.questionCount, 3);
  assert(storageFiles.has(`courses/${COURSE_ID}/teachingDecks/digestive-review/source.pdf`));
  assert(storageFiles.has(`courses/${COURSE_ID}/teachingDecks/digestive-review/slides/page-01.webp`));

  // Verify old questions from respiratory & urinary decks are preserved after merge!
  assert.equal(saved.interactions.length, 5); // 2 old + 3 new
  assert(saved.interactions.some((q) => q.slideId === 'R-REV-04'));
  assert(saved.interactions.some((q) => q.slideId === 'U-REV-07'));
  assert(saved.interactions.some((q) => q.slideId === 'digestive-review-P03'));
  assert(saved.interactions.some((q) => q.slideId === 'digestive-review-P05'));
  assert(saved.interactions.some((q) => q.slideId === 'digestive-review-P07'));
  assert.equal(saved.answerKeys['digestive-review-P07'].f1.answer, '○ 對');

  // Verify getTeachingDeck returns short-lived signed URLs for PDF and slide images
  const loadedDig = await call('getTeachingDeck', { deckId: 'digestive-review' });
  assert.equal(loadedDig.title, '消化複習');
  assert(loadedDig.pdfUrl.includes('signedExp='));
  assert(loadedDig.urlExpiresAt > 1760000000000);
  assert(loadedDig.slides[0].imageUrl.includes('signedExp='));

  // Security: students, unauthenticated, and wrong teachers cannot call saveTeachingDeck or getTeachingDeck
  for (const badAuth of [null, student(1), { uid: 'other-teacher', teacher: true }]) {
    await assert.rejects(call('getTeachingDeck', { deckId: 'digestive-review' }, badAuth));
    await assert.rejects(
      call(
        'saveTeachingDeck',
        {
          deckId: 'digestive-review',
          title: '竄改',
          slides: [{ pageNumber: 1, title: 'P1' }],
        },
        badAuth,
      ),
    );
  }
});

test('重新匯入同一份簡報：顯示新增／變更／刪除差異，且已公佈輪次維持原快照、學生公佈前讀不到答案', async () => {
  const { call, student } = createFixture();

  // 1. Initial import of deck "resp-sample" (8 pages, 3 questions)
  await call('saveTeachingDeck', {
    deckId: 'resp-sample',
    title: '呼吸複習樣本',
    slides: Array.from({ length: 8 }, (_, i) => ({
      pageNumber: i + 1,
      title: `第 ${i + 1} 頁`,
      html: `<section>P${i + 1}</section>`,
      notes: '',
      answerPage: i === 7,
    })),
    questionRows: [
      {
        rowNumber: 2,
        page: 3,
        kind: '單選',
        stem: '原單選題幹',
        options: ['選項A', '選項B'],
        answer: 'A',
        explanation: '原單選解析',
      },
      {
        rowNumber: 3,
        page: 5,
        kind: '是非',
        stem: '原是非題幹：中樞化學受器感應腦脊髓液 H⁺。',
        options: [],
        answer: 'O',
        explanation: '原是非解析（第一版）',
      },
    ],
  });

  // 2. Open round on resp-sample-P05 (True/False question), student submits, verify student CANNOT read answer before reveal
  const opened = await call('controlClassroomInteraction', {
    action: 'open',
    slideId: 'resp-sample-P05',
    classIds: ['A'],
    durationSeconds: 60,
  });
  const roundId = opened.round.id;

  const studentBeforeSubmit = await call('getClassroomInteraction', {}, student(1));
  assert.equal(studentBeforeSubmit.round.slideId, 'resp-sample-P05');
  assert.equal('reveal' in studentBeforeSubmit, false);
  assert(!JSON.stringify(studentBeforeSubmit).includes('原是非解析'));

  await call(
    'submitClassroomInteraction',
    {
      roundId,
      answers: { f1: '○ 對' },
    },
    student(1),
  );

  // Close round, still before reveal: student still cannot read answer key or explanation
  await call('controlClassroomInteraction', { action: 'close', roundId });
  const studentAfterClose = await call('getClassroomInteraction', {}, student(1));
  assert.equal('reveal' in studentAfterClose, false);
  assert(!JSON.stringify(studentAfterClose).includes('原是非解析'));

  // Reveal round 1
  await call('controlClassroomInteraction', { action: 'reveal', roundId });
  const studentAfterReveal = await call('getClassroomInteraction', {}, student(1));
  assert.equal(studentAfterReveal.reveal.key.f1.answer, '○ 對');
  assert.equal(studentAfterReveal.reveal.key.f1.explanation, '原是非解析（第一版）');
  assert.equal(studentAfterReveal.judgement.allCorrect, true);

  // 3. Re-import "resp-sample":
  //    - Remove question on P03
  //    - Change question on P05 (flip answer to X and change explanation)
  //    - Add new question on P07
  //    - Add slide P09
  const reimported = await call('saveTeachingDeck', {
    deckId: 'resp-sample',
    title: '呼吸複習樣本（更新版）',
    slides: Array.from({ length: 9 }, (_, i) => ({
      pageNumber: i + 1,
      title: i === 1 ? '第 2 頁（已修訂）' : `第 ${i + 1} 頁`,
      html: `<section>P${i + 1}</section>`,
      notes: '',
      answerPage: i === 8,
    })),
    questionRows: [
      {
        rowNumber: 2,
        page: 5,
        kind: '是非',
        stem: '更新後是非題幹：改為錯誤敘述。',
        options: [],
        answer: 'X',
        explanation: '更新後是非解析（第二版）',
      },
      {
        rowNumber: 3,
        page: 7,
        kind: '單選',
        stem: '新增第 7 頁單選題',
        options: ['新A', '新B'],
        answer: 'B',
        explanation: '新解析',
      },
    ],
  });

  assert.equal(reimported.diff.isUpdate, true);
  assert.deepEqual(reimported.diff.slides.added, ['resp-sample-P09']);
  assert.deepEqual(reimported.diff.slides.changed, ['resp-sample-P02', 'resp-sample-P08']);
  assert.deepEqual(reimported.diff.questions.added, ['resp-sample-P07']);
  assert.deepEqual(reimported.diff.questions.changed, ['resp-sample-P05']);
  assert.deepEqual(reimported.diff.questions.removed, ['resp-sample-P03']);

  // 4. Verify the already-revealed round from step 2 STILL retains its immutable first-edition snapshot!
  const history = await call('studentClassroomHistory', {}, student(1));
  assert.equal(history.rounds.length, 1);
  assert.equal(history.rounds[0].id, roundId);
  assert.equal(history.rounds[0].reveal.key.f1.answer, '○ 對');
  assert.equal(history.rounds[0].reveal.key.f1.explanation, '原是非解析（第一版）');
});

test('saveTeachingDeck 拒絕有錯誤的題目表，且 storage.rules 嚴格限制僅授權教師可讀寫簡報與 PDF', async () => {
  const { call, docs } = createFixture();

  await assert.rejects(
    call('saveTeachingDeck', {
      deckId: 'bad-deck',
      title: '錯誤題目表測試',
      slides: [{ pageNumber: 1, title: 'P1' }],
      questionRows: [
        {
          rowNumber: 2,
          page: 99,
          kind: '單選',
          stem: '超出頁碼',
          options: ['A', 'B'],
          answer: 'A',
          explanation: '',
        },
      ],
    }),
    /頁碼超出簡報總頁數/,
  );
  assert.equal(docs.has(`courses/${COURSE_ID}/teachingDecks/bad-deck`), false);

  const storageRules = fs.readFileSync(path.resolve(__dirname, '../../storage.rules'), 'utf8');
  assert.match(storageRules, /match \/courses\/\{courseId\}\/teachingDecks\/\{deckId\}\/\{allPaths=\*\*\}/);
  assert.match(storageRules, /allow read, write: if isCourseTeacher\(courseId\);/);
});

test('F1 回歸：900 KB 以上有效 PDF 與多頁高畫質圖檔不將巨型 Base64 寫入 teachingDecks 主文件（不觸發 Firestore 1 MiB 限制）', async () => {
  const { call, docs, storageFiles } = createFixture();

  // Construct a ~900 KB valid PDF (> 1.2 MB in Base64)
  const stream =
    'q\n0 0 720 540 re S\n' +
    ' '.repeat(900000) +
    '\nBT /F1 24 Tf 50 250 Td (Large Vector PDF) Tj ET\nQ';
  const pdfBuf = Buffer.from(`%PDF-1.4\n${stream}\n%%EOF\n`);
  assert(pdfBuf.length > 900000);
  const largePdfDataUrl = 'data:application/pdf;base64,' + pdfBuf.toString('base64');
  assert(Buffer.byteLength(largePdfDataUrl) > 1200000);

  const slideImgDataUrl =
    'data:image/webp;base64,' + Buffer.alloc(90000, 0x41).toString('base64');

  const res = await call('saveTeachingDeck', {
    deckId: 'large-valid-pdf',
    title: '大型向量 PDF 簡報',
    pdfDataUrl: largePdfDataUrl,
    slides: Array.from({ length: 12 }, (_, idx) => ({
      pageNumber: idx + 1,
      title: `大型簡報第 ${idx + 1} 頁`,
      notes: '',
      answerPage: false,
      imageDataUrl: slideImgDataUrl,
      html: `<section><img src="${slideImgDataUrl}"></section>`,
    })),
    questionRows: [],
  });

  assert.equal(res.ok, true);
  assert.equal(res.slideCount, 12);

  const storedDeck = docs.get(`courses/${COURSE_ID}/teachingDecks/large-valid-pdf`);
  assert(storedDeck, 'teachingDecks/large-valid-pdf 必須成功建立');
  assert.equal('pdfDataUrl' in storedDeck, false, 'Storage 已存時不應把 pdfDataUrl 寫入 Firestore');
  assert.equal(
    storedDeck.pdfStoragePath,
    `courses/${COURSE_ID}/teachingDecks/large-valid-pdf/source.pdf`,
  );
  assert(
    storageFiles.has(`courses/${COURSE_ID}/teachingDecks/large-valid-pdf/source.pdf`),
    'PDF 必須已存入 Storage',
  );
  for (const s of storedDeck.slides) {
    assert.equal('imageDataUrl' in s, false, 'Storage 已存時不應把巨型 imageDataUrl 留存於 slide');
    assert(!String(s.html).includes('data:image/'), 'slide.html 不應內嵌巨型 Base64');
  }

  const loaded = await call('getTeachingDeck', { deckId: 'large-valid-pdf' });
  assert(loaded.pdfUrl.includes('courses/' + COURSE_ID + '/teachingDecks/large-valid-pdf/source.pdf'));
  assert(loaded.slides[0].imageUrl.includes('signedExp='));
  assert(loaded.slides[0].html.includes(loaded.slides[0].imageUrl));
});

test('F2 回歸：saveTeachingDeck 拒絕跨課程／越權 Storage 路徑，且 getTeachingDeck 絕不替其他課程路徑簽章', async () => {
  const { call, docs } = createFixture();
  const signedPaths = [];
  const origDoc = docs;

  // 1. saveTeachingDeck must reject foreign course pdfStoragePath
  await assert.rejects(
    call('saveTeachingDeck', {
      deckId: 'cross-path',
      title: '越權路徑測試',
      pdfStoragePath: 'courses/other-course-b/teachingDecks/private/source.pdf',
      slides: [{ pageNumber: 1, title: 'Slide 1', html: '<section>P1</section>' }],
      questionRows: [],
    }),
    (err) => err.code === 'permission-denied',
  );
  assert.equal(origDoc.has(`courses/${COURSE_ID}/teachingDecks/cross-path`), false);

  // 2. saveTeachingDeck must reject foreign course imageStoragePath or traversal '..'
  await assert.rejects(
    call('saveTeachingDeck', {
      deckId: 'cross-img',
      title: '越權圖片路徑測試',
      slides: [
        {
          pageNumber: 1,
          title: 'Slide 1',
          imageStoragePath: 'courses/other-course-b/teachingDecks/private/slides/page-01.webp',
        },
      ],
      questionRows: [],
    }),
    (err) => err.code === 'permission-denied',
  );

  await assert.rejects(
    call('saveTeachingDeck', {
      deckId: 'traversal-path',
      title: '目錄穿越測試',
      pdfStoragePath: `courses/${COURSE_ID}/teachingDecks/traversal-path/../../other/source.pdf`,
      slides: [{ pageNumber: 1, title: 'Slide 1' }],
      questionRows: [],
    }),
    (err) => err.code === 'permission-denied',
  );

  // 3. Even if a legacy document in Firestore had a foreign pdfStoragePath, getTeachingDeck must refuse to sign it
  origDoc.set(`courses/${COURSE_ID}/teachingDecks/tampered-doc`, {
    deckId: 'tampered-doc',
    title: '遭竄改路徑簡報',
    pdfStoragePath: 'courses/other-course-b/teachingDecks/private/source.pdf',
    slides: [
      {
        id: 'tampered-doc-P01',
        pageNumber: 1,
        title: 'P1',
        html: '<section>P1</section>',
        imageStoragePath: 'courses/other-course-b/teachingDecks/private/slides/page-01.webp',
      },
    ],
    updatedAt: Date.now(),
  });

  const loaded = await call('getTeachingDeck', { deckId: 'tampered-doc' });
  assert.equal('pdfUrl' in loaded, false, '不應簽發非本課程之 pdfUrl');
  assert.equal('imageUrl' in loaded.slides[0], false, '不應簽發非本課程之 imageUrl');
  assert.equal(signedPaths.length, 0);
});
