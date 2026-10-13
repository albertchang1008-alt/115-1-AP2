// A transactional Firestore test double. Reads-after-writes and undefined values fail like Firestore.
const { getFirestore } = require('firebase-admin/firestore');
function memoryDb() {
  const db = getFirestore(),
    originals = { doc: db.doc, collection: db.collection, runTransaction: db.runTransaction };
  const data = new Map(),
    transactions = [],
    writes = [];
  let failCommit = false;
  const clone = (v) => (v === undefined ? v : structuredClone(v));
  const snapshot = (path) => ({
    id: path.split('/').at(-1),
    exists: data.has(path),
    data: () => clone(data.get(path)),
    ref: doc(path),
  });
  const noUndefined = (v) => {
    if (v === undefined) throw Error('undefined write');
    if (v && typeof v === 'object') Object.values(v).forEach(noUndefined);
  };
  function doc(path) {
    return {
      path,
      id: path.split('/').at(-1),
      get: async () => snapshot(path),
      set: async (v, opt) => {
        noUndefined(v);
        data.set(path, opt?.merge ? { ...data.get(path), ...clone(v) } : clone(v));
      },
      update: async (v) => {
        noUndefined(v);
        data.set(path, { ...data.get(path), ...clone(v) });
      },
      collection: (name) => collection(path + '/' + name),
    };
  }
  function collection(path) {
    let filters = [],
      max = Infinity;
    const q = {
      where(f, op, v) {
        filters.push([f, op, v]);
        return q;
      },
      limit(v) {
        max = v;
        return q;
      },
      orderBy() {
        return q;
      },
      startAfter() {
        return q;
      },
      doc: (id) => doc(path + '/' + id),
      get: async () => {
        const docs = [...data.keys()]
          .filter(
            (key) =>
              key.startsWith(path + '/') &&
              key.slice(path.length + 1).split('/').length === 1 &&
              filters.every(([f, op, v]) =>
                op === 'array-contains' ? data.get(key)[f]?.includes(v) : data.get(key)[f] === v,
              ),
          )
          .slice(0, max)
          .map(snapshot);
        return { docs, size: docs.length };
      },
    };
    return q;
  }
  db.doc = doc;
  db.collection = collection;
  db.runTransaction = async (fn) => {
    const staged = [];
    let didWrite = false;
    const tx = {
      get: async (ref) => {
        if (didWrite) throw Error('read after write');
        return ref.path ? snapshot(ref.path) : ref.get();
      },
      set(ref, v, opt) {
        noUndefined(v);
        didWrite = true;
        staged.push({ ref, v: clone(v), opt });
        return tx;
      },
      update(ref, v) {
        return tx.set(ref, v, { merge: true });
      },
      create(ref, v) {
        if (data.has(ref.path)) throw Error('exists');
        return tx.set(ref, v);
      },
    };
    const result = await fn(tx);
    if (failCommit) throw Error('simulated atomic commit failure');
    for (const { ref, v, opt } of staged)
      data.set(ref.path, opt?.merge ? { ...data.get(ref.path), ...v } : v);
    transactions.push(staged.map((x) => x.ref.path));
    writes.push(...staged);
    return result;
  };
  return {
    data,
    transactions,
    writes,
    doc,
    failCommit(v) {
      failCommit = v;
    },
    restore: () => Object.assign(db, originals),
  };
}
const courseId = 'reflection-test',
  chapterId = '心臟基礎',
  activityId = 'reflection';
function seed(ctx, initialPrompts) {
  const prompts = initialPrompts || [
    { id: 'change', kind: 'text', text: '原本我以為，現在我知道', required: true, maxLength: 20 },
    {
      id: 'activity',
      kind: 'single',
      text: '哪個活動幫助你？',
      required: true,
      options: ['圖表', '討論'],
    },
    { id: 'question', kind: 'text', text: '還想問什麼？', required: false, maxLength: 500 },
  ];
  const activity = {
    id: activityId,
    type: 'reflection',
    title: '課後反思',
    description: '寫下觀念的改變',
    phase: 'after',
    url: '',
    required: true,
    reflection: { allowEdit: true, prompts },
  };
  const chapter = {
    title: chapterId,
    description: '',
    required: true,
    threshold: 80,
    opensAt: '',
    dueAt: '',
    activities: [activity],
    research: { enabled: true },
  };
  const course = {
    id: courseId,
    title: '課後反思測試課程',
    term: '115-1',
    description: '',
    sheetsUrl: '',
    classIds: ['護二甲', '護二乙'],
    units: [
      {
        id: 'heart',
        title: '心臟構造',
        group: chapterId,
        bankVersion: 'v1',
        activities: [],
        required: true,
        threshold: 80,
        opensAt: '',
        dueAt: '',
        research: { enabled: true },
      },
    ],
    chapters: { [chapterId]: chapter },
    chapterOrder: [chapterId],
  };
  ctx.data.set('courses/' + courseId, {
    teacherIds: ['teacher'],
    rosterVersion: 2,
    draft: structuredClone(course),
    published: structuredClone(course),
    classIds: course.classIds,
  });
  ctx.data.set('banks/' + courseId + '_heart_v1', { chunks: [] });
  for (const [email, studentId, name, classId] of [
    ['student@example.edu', '115001', '測試同學', '護二甲'],
    ['missing@example.edu', '115002', '尚未作答同學', '護二甲'],
    ['other@example.edu', '115003', '另一班同學', '護二乙'],
  ])
    ctx.data.set('enrollments/' + courseId + '__' + email, {
      courseId,
      email,
      studentId,
      name,
      classId,
      enabled: true,
    });
  return { course, chapter, activity };
}
function auth(role = 'student') {
  return role === 'teacher'
    ? { uid: 'teacher', token: { teacher: true, email: 'teacher@example.edu' } }
    : {
        uid: role === 'other' ? 'other-uid' : 'student-uid',
        token: {
          email: role === 'other' ? 'other@example.edu' : 'student@example.edu',
          email_verified: true,
          firebase: { sign_in_provider: 'google.com' },
        },
      };
}
const request = (answers = { change: '以前只背答案，現在能說明原因', activity: '圖表' }) => ({
  courseId,
  chapterId,
  activityId,
  answers,
});
module.exports = { memoryDb, seed, auth, request, courseId, chapterId, activityId };
