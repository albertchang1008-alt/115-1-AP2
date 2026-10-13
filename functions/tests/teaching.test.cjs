const MI_TEACHING_COURSE = '115-1-MI-國考精準對焦';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTeachingHandlers } = require('../lib/functions/src/teaching.js');
const source = {
  id: MI_TEACHING_COURSE,
  classIds: ['A', 'B'],
  classUnits: { A: ['open', 'hidden'], B: ['other'] },
  units: [
    { id: 'open', title: '細菌', visibility: 'current', group: '細菌', activities: [] },
    { id: 'hidden', title: '免疫', visibility: 'hidden', group: '免疫', activities: [] },
    { id: 'other', title: '其他班', visibility: 'current', activities: [] },
  ],
  chapters: {},
  title: 'MI',
};
function handlers() {
  return createTeachingHandlers(
    { doc: () => ({get: async () => ({data: () => ({title: '測試簡報', slides: Array.from({length: 38}, (_, i) => ({id: i === 0 ? 'cover' : 'slide'+i, title: '頁'+i, html: '<section>測試</section>', notes: '教師備註', answerPage: i === 10}))})})}) },
    async (req, id, teacher) => {
      if (id !== MI_TEACHING_COURSE) throw Error('permission');
      if (!req.auth) throw Error('請先登入');
      if (teacher && !req.auth.teacher) throw Error('需要教師權限');
      if (req.auth.teacher && req.auth.uid !== 'owner') throw Error('未獲授權');
      return { p: req.auth, c: { features: { teachingConsole: true }, published: source } };
    },
    { region: 'asia-east1' },
  );
}
const request = (auth) => ({ auth, data: { courseId: MI_TEACHING_COURSE } });
test('38頁教師簡報僅授權教師取得，學生／未登入／其他教師／其他課程皆不可取得', async () => {
  const h = handlers();
  for (const auth of [null, { uid: 's', classId: 'A' }, { uid: 'wrong', teacher: true }])
    await assert.rejects(h.getTeachingDeck.run(request(auth)));
  const deck = await h.getTeachingDeck.run(request({ uid: 'owner', teacher: true }));
  assert.equal(deck.slides.length, 38);
  assert.equal(deck.slides[0].id, 'cover');
  assert(deck.slides.some((s) => s.answerPage));
  assert(deck.slides.some((s) => s.notes));
  assert(deck.slides.every((s) => !/<aside\b|<script\b|on\w+\s*=/i.test(s.html)));
  await assert.rejects(
    h.getTeachingDeck.run({
      auth: { uid: 'owner', teacher: true },
      data: { courseId: '115-2-AP2' },
    }),
  );
});
test('學生課堂更新只回本人班級可見單元，不含教師簡報或備註', async () => {
  const h = handlers();
  const result = await h.getClassroomCourse.run(request({ uid: 's', classId: 'A', name: '測試' }));
  assert.deepEqual(
    result.units.map((u) => u.id),
    ['open'],
  );
  assert.equal(result.enrollmentClassId, 'A');
  assert.equal(result.studentName, '測試');
  assert(!('slides' in result));
  assert(!JSON.stringify(result).includes('notes'));
  await assert.rejects(h.getClassroomCourse.run(request(null)));
  await assert.rejects(h.getClassroomCourse.run(request({ uid: 'owner', teacher: true })));
});
