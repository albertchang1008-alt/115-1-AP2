import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { checkMatching } from '../scripts/acidbase-matching-check.mjs';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
import { compileStudentScript } from '../materials-src/apply-kit/student-script.mjs';
import { auditScriptText } from '../scripts/lib/acidbase-script-browser.mjs';

test('matching UI: both nodes and sizes use actual guided picks, explicit swap/cancel, whole-step reset and gated next action', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'acidbase-matching-'));
  try {
    const r = await checkMatching(out, { shots: false });
    assert.equal(r.results.length, 28);
    assert.deepEqual(r.errors, []);
    assert.equal(r.pass, true, JSON.stringify(r.results.filter((x) => !x.pass)));
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('guide once per opaque account scope and question, help can reopen; unauthorized interface and changed teaching copy still fail', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acidbase-guide-scope-')),
    base = path.resolve('materials-src/acid-base-homeostasis');
  const data = JSON.parse(fs.readFileSync(path.join(base, 'full.json'))),
    script = compileStudentScript(base),
    file = path.join(dir, 'sample.html');
  fs.writeFileSync(file, renderApply(data, { baseDir: base, view: 'course' }));
  const browser = await chromium.launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(pathToFileURL(file).href);
    await p.locator('#start').click();
    const scope = (value) =>
      p.evaluate(
        (guideScope) =>
          window.dispatchEvent(
            new MessageEvent('message', {
              source: window.parent,
              data: { type: 'init', protocolVersion: 1, guideScope },
            }),
          ),
        value,
      );
    await scope('anonymous-account-aaaaaaaa');
    await p.locator('#match-skip').click();
    await scope('anonymous-account-bbbbbbbb');
    assert.equal(await p.locator('[data-guide-step="1"]').count(), 1);
    await p.locator('#match-skip').click();
    await scope('anonymous-account-aaaaaaaa');
    assert.equal(await p.locator('[data-guide-step]').count(), 0);
    await p.locator('#match-help').click();
    assert.equal(await p.locator('[data-guide-step="1"]').count(), 1);
    assert.deepEqual((await auditScriptText(p, script, data)).errors, []);
    await p
      .locator('[data-interface="match.guide1"]')
      .evaluate((e) => (e.textContent += '多出文字'));
    assert.ok(
      (await auditScriptText(p, script, data)).errors.some(
        (e) => e.kind === 'unapproved-interface-copy',
      ),
    );
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('v3.2 changes only heading and common retry rules; teaching sections retain v3.1 verbatim', () => {
  const file = 'docs/urinary-release/ACIDBASE_STUDENT_SCRIPT.md';
  const before = execFileSync('git', ['show', '984cbdf:' + file], { encoding: 'utf8' });
  const after = fs.readFileSync(file, 'utf8');
  const body = (text) => text.slice(text.indexOf('## 開場')).split('## v3.1 變更')[0];
  assert.equal(body(after), body(before));
  assert.ok(after.startsWith('# 酸鹼互動資訊圖表｜學生腳本 v3.2'));
});
