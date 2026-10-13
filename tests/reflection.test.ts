import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeReflections,
  reflectionTemplate,
  validateReflectionConfig,
  validateReflectionAnswers,
  reflectionCsv,
  reflectionCanEdit,
  reflectionDraftKey,
  reflectionProgress,
} from '../shared/reflection';
import {
  CURRENT_COMPLETION_FORMULA_VERSION,
  emptyProgress,
  isRequiredActivity,
} from '../shared/model';
test('反思設定：題數、ID、題型、字數、選項驗證及預設值', () => {
  const c = reflectionTemplate();
  assert.equal(validateReflectionConfig(c).prompts.length, 3);
  assert.equal(
    validateReflectionConfig({
      prompts: [{ id: 'text', kind: 'text', text: '題目', required: true }],
    }).prompts[0].maxLength,
    500,
  );
  for (const x of [
    { ...c, prompts: [] },
    { ...c, prompts: Array(9).fill(c.prompts[0]) },
    { ...c, prompts: [c.prompts[0], c.prompts[0]] },
    { ...c, prompts: [{ ...c.prompts[0], id: '可修改?' }] },
    { ...c, prompts: [{ ...c.prompts[0], maxLength: 1001 }] },
    { ...c, prompts: [{ ...c.prompts[0], text: 'a'.repeat(301) }] },
    { ...c, prompts: [{ ...c.prompts[1], options: ['重複', '重複'] }] },
    { ...c, prompts: [{ ...c.prompts[1], options: ['一'] }] },
    { ...c, prompts: [{ ...c.prompts[1], options: ['一', 'x'.repeat(81)] }] },
  ])
    assert.throws(() => validateReflectionConfig(x));
});
test('反思：必做／選做、只增完成、截止台灣時間、草稿以課程與帳號隔離，公式仍為3', () => {
  const c = reflectionTemplate();
  assert.throws(() => validateReflectionAnswers(c, {}), /必做/);
  const answers = validateReflectionAnswers(c, {
    'concept-change': ' 理解機轉 ',
    'helpful-activity': c.prompts[1].options![0],
  });
  assert.equal(answers['concept-change'], '理解機轉');
  assert.equal(answers['remaining-question'], '');
  const p = reflectionProgress(emptyProgress(), 'chapter:心臟_reflect', 1);
  assert(p.activities['chapter:心臟_reflect'].completed);
  assert.equal(CURRENT_COMPLETION_FORMULA_VERSION, 3);
  assert(isRequiredActivity({ type: 'reflection', required: true }));
  assert(!isRequiredActivity({ type: 'reflection', required: false }));
  assert(reflectionCanEdit(c, '2026-10-12T09:00', true, Date.parse('2026-10-12T00:59:00Z')));
  assert(!reflectionCanEdit(c, '2026-10-12T09:00', false, Date.parse('2026-10-12T01:00:00Z')));
  assert(!reflectionCanEdit({ ...c, allowEdit: false }, '', true));
  assert.notEqual(
    reflectionDraftKey('A', 'u', '心臟', 'a'),
    reflectionDraftKey('B', 'u', '心臟', 'a'),
  );
  assert.notEqual(
    reflectionDraftKey('A', 'u', '心臟', 'a'),
    reflectionDraftKey('A', 'v', '心臟', 'a'),
  );
});
test('反思CSV：BOM、欄位、台灣時間、完整長答案、去識別不含身分欄及試算表公式保護', () => {
  const row = {
    uid: 'uid-private',
    studentId: '115001',
    name: '姓名',
    email: 'private@example.edu',
    classCode: '護二甲',
    submittedAt: Date.parse('2026-10-12T01:00:00Z'),
    updatedAt: 1,
    editCount: 0,
    answers: { text: '=HYPERLINK("https://example.org")' },
    promptsSnapshot: [{ id: 'text', kind: 'text' as const, text: '題目', required: true }],
    researchId: 'stable-hash',
  };
  const named = reflectionCsv([row], false),
    anonymous = reflectionCsv([row], true);
  assert(named.startsWith('\ufeff'));
  assert(named.includes('2026-10-12 09:00:00'));
  assert(named.includes("'=HYPERLINK"));
  assert(named.includes('115001'));
  assert(anonymous.includes('stable-hash'));
  assert.doesNotMatch(anonymous, /uid-private|115001|姓名|private@example/);
});

test('反思文字允許換行、正規化 CRLF 與空行，Tab 拒絕，長度以正規化後計', () => {
  const config = { prompts: [{ id: 'text', kind: 'text' as const, text: '反思', required: true, maxLength: 5 }], allowEdit: true };
  assert.equal(validateReflectionAnswers(config, { text: 'a\r\nb\rc' }).text, 'a\nb\nc');
  assert.equal(validateReflectionAnswers(config, { text: 'a\n\n\n\nb' }).text, 'a\n\nb');
  assert.throws(() => validateReflectionAnswers(config, { text: 'a\tb' }), /控制字元/);
  assert.throws(() => validateReflectionAnswers(config, { text: 'abcd\r\nef' }), /最多/);
});

test('反思未作答名單優先學號或 uid，換信箱不重列，無學號才用 email', () => {
  const activity = { id: 'reflect', type: 'reflection', reflection: reflectionTemplate() } as any;
  const rows = [{ studentId: 'S1', uid: 'u1', email: 'old@example.test', promptsSnapshot: [], answers: {} }] as any;
  for (const person of [{ studentId: 'S1', email: 'new@example.test' }, { uid: 'u1', email: 'new@example.test' }]) assert.equal(summarizeReflections(activity, rows, [person as any]).missing.length, 0);
  assert.equal(summarizeReflections(activity, rows, [{ email: 'old@example.test' } as any]).missing.length, 0);
  assert.equal(summarizeReflections(activity, rows, [{ studentId: 'S2', email: 'old@example.test' } as any]).missing.length, 1);
});
