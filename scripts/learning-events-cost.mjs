import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const [baseline, output] = process.argv.slice(2);
assert(baseline && output, 'Usage: node scripts/learning-events-cost.mjs BASELINE_WORKTREE REPORT_JSON');
assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^127\.0\.0\.1:\d+$/, 'Local Firestore emulator required');
const current = path.resolve(import.meta.dirname, '..');
const origin = 'http://127.0.0.1:18638';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const epoch = Date.parse('2026-11-05T10:00:00+08:00');

async function walkAg(frame, page) {
  for (let i = 0; i < 400; i++) {
    const step = await frame.evaluate(() => {
      const s = App.state, data = App.data;
      const click = (sel) => {
        const el = [...document.querySelectorAll(sel)].find(e => !e.disabled && e.getClientRects().length && !e.closest('dialog:not([open])'));
        if (!el) return false;
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        el.click();
        return true;
      };
      const by = (key, value) => '[' + key + '=' + JSON.stringify(String(value)) + ']';
      if (s.phase === 'COMPLETE') return 'done';
      if (click('#btn-msg-confirm')) return App.state.phase === 'COMPLETE' ? 'done' : 'step';
      if (s.phase === 'OPENING') return click('#btn-start') ? 'step' : 'stuck';
      if (s.phase === 'TEACH') {
        if (click('#btn-legend-confirm')) return 'step';
        if (click('[data-state-idx]:not(.seen):not([disabled])')) return 'step';
        if (click('#btn-start-quiz')) return 'step';
        return click('#btn-open-legend') ? 'step' : 'stuck';
      }
      if (s.phase === 'QUIZ') {
        if (click('#btn-next-q')) return 'step';
        const q = data.levels[s.levelIdx].questions[s.questionIdx];
        if (q.template === 'explain') return click('[data-sub-idx]:not(.seen)') ? 'step' : 'stuck';
        if (document.querySelector('#btn-retry')) {
          click('#btn-hint');
          click('#btn-retry');
          return 'step';
        }
        window.walkWrong ??= new Set();
        const wrong = !window.walkWrong.has(q.id);
        window.walkWrong.add(q.id);
        if (q.mode === 'multi') {
          const ids = wrong ? q.options.map(o => o.id).filter(id => !q.answer.includes(id)).concat(q.answer).slice(0, q.selectCount || q.answer.length) : q.answer;
          for (const id of ids) click(by('data-opt-id', id));
          click('#btn-submit-multi');
        } else if (q.mode === 'rows') {
          for (const [i, item] of q.items.entries()) {
            const target = wrong && i === q.items.length - 1 ? q.targets.find(t => t.id !== q.answer[item.id]).id : q.answer[item.id];
            click(by('data-item-id', item.id) + by('data-target-id', target));
          }
          click('#btn-submit-match');
        } else if (q.mode === 'order') {
          for (const id of wrong ? [...q.answer].reverse() : q.answer) click(by('data-order-id', id));
          click('#btn-submit-order');
        } else {
          const id = wrong ? q.options.find(o => o.id !== q.answer).id : q.answer;
          click(by('data-opt-id', id));
          if (!click('#btn-submit-choice')) return 'stuck';
        }
        return 'step';
      }
      if (s.phase === 'LEVEL_PASS') return click('#btn-next-level') ? 'step' : 'stuck';
      if (s.phase === 'ENDING') {
        if (click('#btn-to-tf, #btn-next-ending, #btn-retry-ending')) return 'step';
        click(by('data-end-opt', data.ending.steps[s.endingStepIdx].answer));
        return click('#btn-submit-ending') ? 'step' : 'stuck';
      }
      if (s.phase === 'TRUEFALSE') {
        if (click('#btn-start-ass, #btn-next-tf, #btn-retry-tf')) return 'step';
        click(by('data-tf-val', data.truefalse[s.tfIdx].answer));
        return click('#btn-submit-tf') ? 'step' : 'stuck';
      }
      if (s.phase === 'ASSESSMENT') {
        const q = data.assessment[s.assStage][s.assIdx];
        click(by('data-ass-opt', q.answer));
        return click('#btn-submit-ass') ? 'assessment' : 'stuck';
      }
      return click('#app-view button.btn-primary') ? 'step' : 'stuck';
    });
    if (step === 'done') return;
    assert.notEqual(step, 'stuck', JSON.stringify(await frame.evaluate(() => {
      const { phase, levelIdx, questionIdx, endingStepIdx, tfIdx, assIdx } = App.state;
      return { phase, levelIdx, questionIdx, endingStepIdx, tfIdx, assIdx };
    })));
    await page.clock.runFor(step === 'assessment' ? 1000 : 15000);
  }
  throw Error('AG walk exceeded the step limit: ' + JSON.stringify(await frame.evaluate(() => {
    const { phase, levelIdx, questionIdx, endingStepIdx, tfIdx, assIdx } = App.state;
    return { phase, levelIdx, questionIdx, endingStepIdx, tfIdx, assIdx };
  })));
}

async function walkLegacy(frame, page) {
  const act = async (fn, arg, wait = 18000) => {
    await frame.evaluate(() => window.dispatchEvent(new PointerEvent('pointerdown')));
    await frame.evaluate(fn, arg);
    await page.clock.runFor(wait);
  };
  for (let i = 0; i < 6; i++) await act(i => window.selectHeartStructureNode(i), i);
  await act(() => document.querySelector('#btn-mode-quiz').click());
  for (const [prefix, count] of [['s1', 6], ['s2', 5]]) {
    for (let i = 0; i < count; i++) {
      await act(prefix => {
        const q = prefix === 's1' ? FOUNDATION_QUESTIONS[s1CurrentIndex] : s2Questions[s2CurrentIndex];
        const buttons = [...document.querySelectorAll('#' + prefix + '-options-container button')];
        const text = q.options[q.answer];
        const btn = buttons.find(b => b.textContent === text);
        if (!btn) throw Error('Legacy answer control missing');
        btn.click();
        const next = document.querySelector('#' + prefix + '-next-btn');
        if (next.disabled) throw Error('Legacy answer did not unlock next');
        next.click();
      }, prefix, prefix === 's2' && i === count - 1 ? 100 : 18000);
    }
  }
  assert(await frame.locator('#result-banner-pass').isVisible());
}

async function capture(browser, root, slug, walk) {
  const bundle = await build({
    entryPoints: [path.join(root, 'src/LearningBridge.ts')], bundle: true, write: false,
    format: 'iife', globalName: 'Bridge', platform: 'browser',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.clock.install({ time: epoch });
    await page.clock.pauseAt(epoch + 1000);
    await page.addInitScript(() => {
      let seed = 117;
      Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/walk') {
        const parent = bundle.outputFiles[0].text + '\nwindow.trace=[];window.complete=0;const start=Date.now();' +
          'const args={uid:"fixture",courseId:"fixture",unitId:"unit",activityId:"material",materialVersion:' + JSON.stringify(slug) + '};' +
          'const api={preview:false,async call(name,data){window.trace.push({offset:Date.now()-start,events:data.events});return{accepted:data.events.map(e=>e.id)};}};' +
          'const bridge=Bridge.learningBridge(api,args,()=>{},()=>window.complete++);window.closeBridge=()=>bridge.close();' +
          'const ctx={protocolVersion:1,activityId:"material",materialVersion:args.materialVersion,sessionId:"walk"};' +
          'window.addEventListener("message",async e=>{const child=document.querySelector("iframe").contentWindow;if(e.source!==child)return;' +
          'if(e.data.type==="ready"){child.postMessage({type:"init",...ctx},"*");window.ready=true;}' +
          'if(e.data.type==="learning-events"&&e.data.sessionId===ctx.sessionId){const accepted=await bridge.receive(e.data.events);child.postMessage({type:"learning-ack",sessionId:ctx.sessionId,accepted},"*");}});';
        return route.fulfill({ contentType: 'text/html', body: '<script>' + parent + '</script><iframe width="375" height="820" src="/materials/' + slug + '/index.html"></iframe>' });
      }
      const publicRoot = path.join(root, 'public');
      const file = path.resolve(publicRoot, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(publicRoot + path.sep)) return route.abort();
      try {
        return route.fulfill({ body: await readFile(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        return route.fulfill({ status: 404, body: 'Not found' });
      }
    });
    await page.goto(origin + '/walk');
    await page.waitForFunction(() => window.ready, null, { polling: 50 });
    await page.clock.runFor(1000);
    const frame = page.frames().find(f => f.url().endsWith('/index.html'));
    assert(frame);
    await walk(frame, page);
    await page.clock.runFor(100);
    await page.waitForFunction(() => window.complete === 1, null, { polling: 50 });
    await page.evaluate(() => window.closeBridge());
    await page.clock.runFor(100);
    assert.deepEqual(errors, []);
    const trace = await page.evaluate(() => window.trace);
    const events = trace.flatMap(x => x.events);
    assert.equal(events.filter(e => e.type === 'completed').length, 1);
    assert.equal(new Set(events.map(e => e.id)).size, events.length);
    return trace;
  } finally {
    await page.close();
  }
}

function replay(root, traces, label) {
  const worker = path.join(current, 'functions/scripts/learning-events-cost-emulator.cjs');
  const result = spawnSync(process.execPath, [worker, root, label], {
    input: JSON.stringify(traces), encoding: 'utf8', timeout: 120000,
  });
  if (result.status !== 0) throw Error(result.error?.message || result.stderr || 'Emulator replay failed');
  return JSON.parse(result.stdout);
}

const browser = await chromium.launch();
try {
  const runs = [];
  let baselineTraces;
  for (const [label, root] of [['before', path.resolve(baseline)], ['after', current]]) {
    const traces = {};
    for (const [slug, walk] of [['tubular-handling-ag1', walkAg], ['heart-structure-v2', walkLegacy]]) {
      traces[slug] = await capture(browser, root, slug, walk);
      console.log(label, slug, traces[slug].length, 'requests captured');
    }
    if (label === 'before') baselineTraces = traces;
    runs.push(replay(root, traces, label));
  }
  const [before, after] = runs;
  const sameInput = replay(current, baselineTraces, 'same-input');
  const comparisons = Object.keys(before).map(slug => {
    assert.deepEqual(sameInput[slug].summary, before[slug].summary, slug + ': identical input changed the summary');
    assert.deepEqual(sameInput[slug].progress, before[slug].progress, slug + ': identical input changed progress');
    const { activeSeconds: oldSeconds, ...oldSummary } = before[slug].summary;
    const { activeSeconds: newSeconds, ...newSummary } = after[slug].summary;
    assert.deepEqual(newSummary, oldSummary, slug + ': summary changed');
    assert.deepEqual(after[slug].progress, before[slug].progress, slug + ': completion changed');
    const delta = newSeconds - oldSeconds;
    assert(Math.abs(delta) <= 15, slug + ': active seconds changed by ' + delta);
    const {summary: _a, progress: _b, ...oldCounts} = before[slug];
    const {summary: _c, progress: _d, ...newCounts} = after[slug];
    return { slug, before: oldCounts, after: newCounts, oldSeconds, newSeconds, delta, sameInputEquivalent: true, summaryEquivalent: true, completionEquivalent: true };
  });
  await writeFile(output, JSON.stringify({ emulator: true, comparisons }, null, 2) + '\n');
  console.log(JSON.stringify(comparisons, null, 2));
} finally {
  await browser.close();
}
