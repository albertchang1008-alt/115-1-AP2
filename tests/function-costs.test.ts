import { test, TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { eventBatcher } from '../src/EventBatcher';
import { learningBridge } from '../src/LearningBridge';
import { researchBridge } from '../src/ResearchBridge';
import { visiblePoll } from '../src/VisiblePoll';
import type { API } from '../src/service';

const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function environment(t: TestContext) {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  const cleanup: (() => void)[] = [];
  t.after(() => cleanup.forEach((fn) => fn()));
  const data = new Map<string, string>();
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const net = { onLine: true };
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
  for (const [key, value] of Object.entries({ window: win, document: doc, navigator: net, localStorage: storage })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, key, previous); else Reflect.deleteProperty(globalThis, key); });
  }
  return { data, win, doc, net, storage, cleanup };
}
const context = { uid: 'student-1', courseId: 'course', unitId: 'unit', activityId: 'html', materialVersion: 'v1' };
function apiFor(send: (name: string, data: any) => Promise<any>): API {
  return { preview: false, call: send } as API;
}

test('learning: burst becomes one request; no acknowledgement before server success; duplicate IDs stay unique', async (t) => {
  const env = environment(t);
  const sent: any[] = [];
  let accept!: () => void;
  const bridge = learningBridge(apiFor(async (_, data) => {
    sent.push(data);
    await new Promise<void>((r) => { accept = r; });
    return { accepted: data.events.map((e: any) => e.id) };
  }), context, () => {}, () => {});
  env.cleanup.push(() => bridge.close());
  let acknowledged = false;
  const one = bridge.receive([{ id: 'a', type: 'explore', nodeId: 'node' }]);
  void one.then(() => { acknowledged = true; });
  const two = bridge.receive([{ id: 'b', type: 'hint', questionId: 'q' }]);
  const replay = bridge.receive([{ id: 'a', type: 'explore', nodeId: 'node' }]);
  assert.equal(sent.length, 0);
  assert.equal(JSON.parse([...env.data.values()][0]).length, 2);
  t.mock.timers.tick(29999); await tick();
  assert.equal(sent.length, 0);
  t.mock.timers.tick(1); await tick();
  assert.equal(sent.length, 1);
  assert.equal(acknowledged, false);
  assert.deepEqual(sent[0].events.map((e: any) => e.id), ['a', 'b']);
  accept(); await tick();
  assert.deepEqual(await one, ['a']); assert.deepEqual(await two, ['b']); assert.deepEqual(await replay, ['a']);
  assert.deepEqual(JSON.parse([...env.data.values()][0]), []);
});

test('learning: completion flushes immediately, completion callback waits for server and fires once', async (t) => {
  const env = environment(t);
  let done = 0, calls = 0;
  let accept!: () => void;
  const bridge = learningBridge(apiFor(async (_, data) => {
    calls++; await new Promise<void>((r) => { accept = r; });
    return { accepted: data.events.map((e: any) => e.id) };
  }), context, () => {}, () => done++);
  env.cleanup.push(() => bridge.close());
  const pending = bridge.receive([{ id: 'a', type: 'time', seconds: 5 }]);
  const completed = bridge.receive([{ id: 'done', type: 'completed' }]);
  assert.equal(calls, 1); assert.equal(done, 0);
  accept(); await tick(); await pending; await completed;
  assert.equal(done, 1);
  assert.deepEqual(await bridge.receive([{ id: 'done', type: 'completed' }]), ['done']);
  assert.equal(calls, 1); assert.equal(done, 1);
});

test('queue: failed delivery is not acknowledged and reconnect retries original IDs', async (t) => {
  const env = environment(t);
  let fail = true, calls = 0;
  const batch = eventBatcher<{ id: string }>({ key: 'events', valid: (e) => !!e?.id, send: async (events) => {
    calls++; if (fail) throw Error('offline'); return events.map((e) => e.id);
  }});
  env.cleanup.push(() => batch.close());
  const pending = batch.enqueue([{ id: 'retry' }]);
  await batch.flush();
  assert.deepEqual(await pending, []);
  assert.deepEqual(JSON.parse(env.data.get('events')!), [{ id: 'retry' }]);
  fail = false; env.win.dispatchEvent(new Event('online')); await tick();
  assert.equal(calls, 2); assert.deepEqual(JSON.parse(env.data.get('events')!), []);
  assert.deepEqual(await batch.enqueue([{ id: 'retry' }]), ['retry']);
});

test('queue: partial acceptance only acknowledges confirmed IDs and retries the remainder', async (t) => {
  const env = environment(t);
  const batches: string[][] = [];
  const batch = eventBatcher<{ id: string }>({ key: 'partial', valid: (e) => !!e?.id, send: async (events) => {
    batches.push(events.map((e) => e.id)); return [events[0].id];
  }});
  env.cleanup.push(() => batch.close());
  const pending = batch.enqueue([{ id: 'a' }, { id: 'b' }]);
  await batch.flush(); assert.deepEqual(await pending, ['a']);
  assert.deepEqual(JSON.parse(env.data.get('partial')!), [{ id: 'b' }]);
  await batch.flush(); assert.deepEqual(batches, [['a', 'b'], ['b']]);
});

test('research: 20 single events share one request without sending uid or changing payload IDs', async (t) => {
  const env = environment(t);
  const sent: any[] = [];
  const batch = researchBridge(apiFor(async (name, data) => {
    sent.push({ name, data }); return { accepted: data.events.map((e: any) => e.id) };
  }), { uid: 'u', courseId: 'c', unitId: 'unit', version: 'v1' }, () => {});
  env.cleanup.push(() => batch.close());
  const waiting = Array.from({ length: 20 }, (_, i) => batch.enqueue([{ id: `e${i}`, questionId: `q${i}`, attemptId: 'attempt', clientAt: 100, format: 'guided', action: 'exposed', seconds: 3 }]));
  assert.equal(sent.length, 0);
  t.mock.timers.tick(30000); await tick();
  await Promise.all(waiting);
  assert.equal(sent.length, 1); assert.equal(sent[0].data.events.length, 20);
  assert.equal(sent[0].name, 'saveExplanationResearchEvents');
  assert.equal('uid' in sent[0].data, false);
});

test('queue: replay after reopening and final navigation flush preserve IDs; no callbacks after close', async (t) => {
  const env = environment(t);
  env.data.set('restore', JSON.stringify([{ id: 'old' }]));
  const sent: string[][] = [];
  let callbacks = 0;
  const batch = eventBatcher<{ id: string }>({ key: 'restore', valid: (e) => !!e?.id, send: async (events) => { sent.push(events.map((e) => e.id)); return events.map((e) => e.id); }, saved: () => { callbacks++; }});
  await tick();
  assert.deepEqual(sent, [['old']]);
  const pending = batch.enqueue([{ id: 'last' }]);
  batch.close(); await tick();
  assert.deepEqual(await pending, ['last']);
  assert.deepEqual(sent, [['old'], ['last']]);
  assert.equal(callbacks, 1);
  t.mock.timers.tick(60000); await tick();
  assert.equal(sent.length, 2);
});

test('queue: full batches never exceed backend limit and storage failure forces immediate cloud delivery', async (t) => {
  const env = environment(t);
  const sent: number[] = [];
  const batch = eventBatcher<{ id: string }>({ key: 'bounded', valid: (e) => !!e?.id, send: async (events) => { sent.push(events.length); return events.map((e) => e.id); }});
  env.cleanup.push(() => batch.close());
  const waiting = Array.from({ length: 65 }, (_, i) => batch.enqueue([{ id: `e${i}` }]));
  await tick(); await batch.flush(); await Promise.all(waiting);
  assert.deepEqual(sent, [30, 30, 5]);
  env.storage.setItem = () => { throw Error('quota'); };
  const last = batch.enqueue([{ id: 'no-storage' }]);
  await tick(); assert.deepEqual(await last, ['no-storage']); assert.equal(sent.at(-1), 1);
});

test('learning preview neither stores events nor calls cloud', async (t) => {
  const env = environment(t);
  let calls = 0, complete = 0;
  const bridge = learningBridge({ ...apiFor(async () => { calls++; }), preview: true }, context, () => {}, () => { complete++; });
  assert.deepEqual(await bridge.receive([{ id: 'done', type: 'completed' }]), ['done']);
  bridge.close(); assert.equal(calls, 0); assert.equal(env.data.size, 0); assert.equal(complete, 1);
});

test('poll: visible idle makes 6 requests/minute; hidden/offline stops and resuming refreshes immediately', async (t) => {
  const env = environment(t);
  let calls = 0;
  const close = visiblePoll(async () => { calls++; }, 10000);
  env.cleanup.push(close);
  await tick();
  for (let i = 0; i < 5; i++) { t.mock.timers.tick(10000); await tick(); }
  assert.equal(calls, 6);
  env.doc.visibilityState = 'hidden'; env.doc.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(60000); await tick(); assert.equal(calls, 6);
  env.doc.visibilityState = 'visible'; env.doc.dispatchEvent(new Event('visibilitychange')); await tick(); assert.equal(calls, 7);
  env.net.onLine = false; env.win.dispatchEvent(new Event('offline'));
  t.mock.timers.tick(60000); await tick(); assert.equal(calls, 7);
  env.net.onLine = true; env.win.dispatchEvent(new Event('online')); await tick(); assert.equal(calls, 8);
  close(); t.mock.timers.tick(60000); await tick(); assert.equal(calls, 8);
});

test('poll: active interval stays 2 seconds; reconnect never overlaps an outstanding request; cleanup invalidates late response', async (t) => {
  const env = environment(t);
  let calls = 0, resolve!: () => void, alive!: () => boolean;
  const close = visiblePoll(async (isAlive) => { calls++; alive = isAlive; await new Promise<void>((r) => { resolve = r; }); }, 2000);
  await tick();
  env.win.dispatchEvent(new Event('online')); t.mock.timers.tick(10000); await tick(); assert.equal(calls, 1);
  resolve(); await tick(); t.mock.timers.tick(1999); await tick(); assert.equal(calls, 1);
  t.mock.timers.tick(1); await tick(); assert.equal(calls, 2);
  close(); assert.equal(alive(), false); resolve(); await tick();
  t.mock.timers.tick(10000); await tick(); assert.equal(calls, 2);
});

test('queue: completion from a closed view cannot erase newer durable events from a reopened view', async (t) => {
  const env = environment(t);
  let finishOld!: (ids: string[]) => void;
  const old = eventBatcher<{ id: string }>({ key: 'same-view', valid: (e) => !!e?.id, send: async () => new Promise<string[]>((r) => { finishOld = r; }) });
  const oldResult = old.enqueue([{ id: 'old' }], true);
  old.close();
  const reopened = eventBatcher<{ id: string }>({ key: 'same-view', valid: (e) => !!e?.id, send: async () => { throw Error('offline'); } });
  env.cleanup.push(() => reopened.close());
  const newer = reopened.enqueue([{ id: 'new' }]);
  await tick(); await newer;
  finishOld(['old']); await tick(); await oldResult;
  // The closed view may retry new IDs too, but cannot remove them until accepted.
  assert.ok(JSON.parse(env.data.get('same-view')!).some((e: any) => e.id === 'new'));
  finishOld(['new']); await tick();
});
