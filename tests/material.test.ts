import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materialUrl } from '../shared/model';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HtmlMaterial } from '../src/Player';
import type { API } from '../src/service';

test('教材接受 Pages 子路徑、自訂網域與版本參數，拒絕非 HTTPS 與帳密網址', () => {
  for (const url of [
    'https://teacher.github.io/course/materials/v1/index.html?v=1#start',
    'https://learn.example.edu/教材/index.html',
  ]) {
    assert.equal(materialUrl(url), new URL(url).href);
  }
  for (const value of [
    undefined,
    '',
    '/index.html',
    'http://example.com',
    'javascript:alert(1)',
    'data:text/html,test',
    'https://user:password@example.com/',
    'https://',
  ]) {
    assert.equal(materialUrl(value), null);
  }
});

test('學生與預覽共用教材元件直接嵌入 Pages，無效網址不呈現 iframe', () => {
  const activity = {
    id: 'html-1',
    title: '教材',
    description: '',
    type: 'html' as const,
    phase: 'before' as const,
    url: 'https://teacher.github.io/materials/v1/index.html',
  };
  const render = (url: string) =>
    renderToStaticMarkup(
      createElement(HtmlMaterial, {
        api: {} as API,
        courseId: 'course-1',
        unitId: 'unit-1',
        uid: 'student-1',
        activity: { ...activity, url },
        onSave: () => {},
      }),
    );
  const html = render(activity.url);
  assert.ok(html.includes(`src="${activity.url}"`));
  assert.ok(html.includes('sandbox="allow-scripts"'));
  assert.ok(!html.includes('allow-same-origin'));
  const invalid = render('javascript:alert(1)');
  assert.ok(!invalid.includes('<iframe'));
  assert.ok(invalid.includes('disabled=""'));
});
