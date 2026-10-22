// Independent Codex review probes; production implementation is left unchanged.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { eventBatcher } from '../../src/EventBatcher';
import { researchBridge } from '../../src/ResearchBridge';
import { learningBridge } from '../../src/LearningBridge';
import { visiblePoll } from '../../src/VisiblePoll';
import type { API } from '../../src/service';
const drain = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
function setup(t: TestContext) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const storage = new Map<string, string>();
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const cleanups: (() => void)[] = [];
  t.after(() => cleanups.forEach(fn => fn()));
  for (const [key, value] of Object.entries({ window: win, document: doc, navigator: { onLine: true }, localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
  } })) {
    const old = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (old) Object.defineProperty(globalThis, key, old); else Reflect.deleteProperty(globalThis, key); });
  }
  return { storage, win, doc, cleanups };
}
for (const code of ['functions/resource-exhausted', 'resource-exhausted', 'functions/aborted', 'aborted']) {
  test(`independent: ${code} preserves IDs and retries after 30000 ms`, async t => {
    const env = setup(t); let calls = 0, rejected = 0, held = 0;
    const q = eventBatcher<{ id: string }>({ key: 'audit-retry', valid: e => !!e?.id,
      send: async events => { if (++calls === 1) throw { code }; return events.map(e => e.id); },
      rejected: () => rejected++, held: () => held++,
    });
    env.cleanups.push(() => q.close());
    assert.deepEqual(await q.enqueue([{ id: 'preserved' }], true), []);
    assert.equal(calls, 1);
    assert.deepEqual(JSON.parse(env.storage.get('audit-retry')!), [{ id: 'preserved' }]);
    t.mock.timers.tick(29999); await drain(); assert.equal(calls, 1);
    t.mock.timers.tick(1); await drain(); assert.equal(calls, 2);
    assert.equal(rejected, 0); assert.equal(held, 0);
    assert.deepEqual(JSON.parse(env.storage.get('audit-retry')!), []);
  });
}
test('independent: research hold retains in-flight additions, blocks every trigger, reopens with identical events', async t => {
  const env = setup(t); let calls = 0, fail = true;
  let reject!: (error: unknown) => void;
  const notices: unknown[][] = [], payloads: unknown[][] = [];
  const api = { preview: false, call: async (_: string, data: { events: { id: string }[] }) => {
    calls++; payloads.push(structuredClone(data.events));
    if (fail) await new Promise((_, bad) => { reject = bad; });
    return { accepted: data.events.map(e => e.id) };
  } } as unknown as API;
  const context = { uid: 'synthetic-student', courseId: 'synthetic-course', unitId: 'unit', version: 'v1' };
  const event = (id: string) => ({ id, questionId: 'q', attemptId: 'a', clientAt: 1, format: 'guided' as const, action: 'opened' as const });
  const events = [event('first'), event('in-flight'), event('after-hold')];
  const q = researchBridge(api, context, (...args) => notices.push(args));
  env.cleanups.push(() => q.close());
  const first = q.enqueue([events[0]], true);
  const second = q.enqueue([events[1]]);
  // A known permission code wins over network-looking message text.
  reject({ code: 'functions/permission-denied', message: 'network unavailable' });
  assert.deepEqual(await first, []); assert.deepEqual(await second, []); await drain();
  assert.deepEqual(notices, [[false, true]]);
  assert.deepEqual(await q.enqueue([events[2]], true), []);
  assert.deepEqual(await q.enqueue([events[0]], true), []);
  await q.flush();
  env.win.dispatchEvent(new Event('online'));
  env.win.dispatchEvent(new Event('pagehide'));
  env.doc.visibilityState = 'hidden'; env.doc.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(300000); await drain(); q.close(); await drain();
  assert.equal(calls, 1);
  const key = [...env.storage.keys()].find(k => !k.endsWith(':discarded'))!;
  assert.deepEqual(JSON.parse(env.storage.get(key)!), events);
  assert.equal(env.storage.has(`${key}:discarded`), false);
  fail = false;
  const reopened = researchBridge(api, context, (...args) => notices.push(args));
  env.cleanups.push(() => reopened.close()); await drain();
  assert.equal(calls, 2); assert.deepEqual(payloads[1], events);
  assert.deepEqual(JSON.parse(env.storage.get(key)!), []);
  assert.deepEqual(await reopened.enqueue([events[0]], true), ['first']);
  assert.equal(calls, 2);
});
function pollDelay(component: string) {
  const source = ts.createSourceFile('ClassroomInteraction.tsx', fs.readFileSync('src/ClassroomInteraction.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fn = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === component) as ts.FunctionDeclaration;
  assert.ok(fn);
  const calls: ts.CallExpression[] = [];
  const walk = (n: ts.Node) => { if (ts.isCallExpression(n) && n.expression.getText(source) === 'usePoll') calls.push(n); ts.forEachChild(n, walk); };
  walk(fn); assert.equal(calls.length, 1);
  const expression = calls[0].arguments[2]; assert.ok(ts.isConditionalExpression(expression));
  assert.match(expression.condition.getText(source), /status === 'open'$/);
  assert.ok(ts.isNumericLiteral(expression.whenTrue)); assert.ok(ts.isNumericLiteral(expression.whenFalse));
  return [Number(expression.whenTrue.text), Number(expression.whenFalse.text)];
}
for (const [component, expected] of [['StudentInteraction', 5000], ['TeacherInteraction', 10000]] as const) {
  test(`independent: ${component} uses active 2000 / idle ${expected} and polls at that cadence`, async t => {
    const env = setup(t), [active, idle] = pollDelay(component);
    assert.equal(active, 2000); assert.equal(idle, expected);
    let calls = 0;
    env.cleanups.push(visiblePoll(async () => { calls++; }, idle));
    await drain(); assert.equal(calls, 1);
    t.mock.timers.tick(idle - 1); await drain(); assert.equal(calls, 1);
    t.mock.timers.tick(1); await drain(); assert.equal(calls, 2);
    env.doc.visibilityState = 'hidden'; env.doc.dispatchEvent(new Event('visibilitychange'));
    t.mock.timers.tick(idle * 20); await drain(); assert.equal(calls, 2);
    env.doc.visibilityState = 'visible'; env.doc.dispatchEvent(new Event('visibilitychange'));
    await drain(); assert.equal(calls, 3);
  });
}

test('independent: held completion with failed localStorage must not falsely promise durable recovery after reopening', async t => {
  const env = setup(t); const messages: string[] = []; let completed = 0, calls = 0;
  localStorage.setItem = () => { throw Error('QuotaExceededError'); };
  const api = { preview: false, call: async () => { calls++; throw { code: 'functions/unauthenticated' }; } } as unknown as API;
  const context = { uid: 'synthetic-student', courseId: 'synthetic-course', unitId: 'unit', activityId: 'html', materialVersion: 'v1' };
  const q = learningBridge(api, context, message => messages.push(message), () => completed++);
  env.cleanups.push(() => q.close());
  assert.deepEqual(await q.receive([{ id: 'cannot-persist', type: 'completed' }]), []);
  await drain(); assert.equal(calls, 1); assert.equal(completed, 0);
  assert.equal(env.storage.size, 0, 'event is only in memory, not in durable storage');
  q.close(); await drain();
  assert.equal(calls, 2, 'close makes exactly one final best-effort send');
  assert.equal(completed, 0);
  assert.ok(messages.length);
  for (const message of messages) assert.doesNotMatch(message, /已暫存在這台裝置.*紀錄會自動送出/);
  assert.match(messages.at(-1)!, /請先不要關閉此頁/);
  t.mock.timers.tick(300000); await drain();
  assert.equal(calls, 2, 'closed queue has no retry timer');
  const reopened = learningBridge(api, context, message => messages.push(message), () => completed++);
  env.cleanups.push(() => reopened.close()); await drain();
  assert.equal(calls, 2, 'close made one best-effort send; reopened queue has nothing durable');
  console.log(JSON.stringify({ scenario: 'quota-plus-held', durableEntries: env.storage.size, callsAfterReopen: calls, messages }));
  assert.doesNotMatch(messages.at(-1)!, /已暫存在這台裝置.*紀錄會自動送出/, 'do not instruct reload with a durable-save promise when both persistence attempts failed');
});
