import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { explanationTokens } from '../shared/explanationText';
import { ExplanationText, Explanations } from '../src/QuestionContent';
import { Question } from '../shared/model';
test('paired bold, multiple sections, unmatched markers and literal Markdown', () => {
  assert.deepEqual(explanationTokens('甲**乙**丙**丁**'), [{text:'甲',bold:false},{text:'乙',bold:true},{text:'丙',bold:false},{text:'丁',bold:true}]);
  assert.deepEqual(explanationTokens('**未結束'), [{text:'**未結束',bold:false}]);
  assert.deepEqual(explanationTokens('***三個星號***'), [{text:'***三個星號***',bold:false}]);
  assert.deepEqual(explanationTokens('**完整** / **未結束'), [{text:'完整',bold:true},{text:' / **未結束',bold:false}]);
  assert.deepEqual(explanationTokens('_斜體_ [連結](url)'), [{text:'_斜體_ [連結](url)',bold:false}]);
});
test('br variants become newlines but HTML and scripts remain escaped text', () => {
  assert.deepEqual(explanationTokens('甲<br>乙<BR/>丙<br />丁'), [{text:'甲\n乙\n丙\n丁',bold:false}]);
  const html=renderToStaticMarkup(createElement(ExplanationText,{value:'**<script>alert(1)</script>**<img onerror="x"><br>'}));
  assert.match(html, /<strong>&lt;script&gt;/);assert.doesNotMatch(html, /<script|<img/);assert.match(html, /&lt;img/);
});
test('student and teacher headings hide only emoji from assistive text; trace teacher only', () => {
  const q={id:'q',text:'題',answer:'a',options:[{id:'a',text:'甲'},{id:'b',text:'乙'}],explanation:'**傳統**',socratic:{keyword:'**關鍵字**',chain:'條件→概念',decide:'答案',memory:'記憶',trace:'**來源**'}} as Question;
  const student=renderToStaticMarkup(createElement(Explanations,{q}));
  const teacher=renderToStaticMarkup(createElement(Explanations,{q,audience:'teacher'}));
  for(const emoji of ['🔑','🧭','✅','💡','📖'])assert(student.includes(`<span aria-hidden="true">${emoji}</span>`));
  assert(student.includes('對答案'));assert(student.includes('<strong>關鍵字</strong>'));assert(!student.includes('追溯原子卡'));
  assert(teacher.includes('<span aria-hidden="true">🔎</span> 追溯原子卡'));assert(teacher.includes('<strong>來源</strong>'));
});
