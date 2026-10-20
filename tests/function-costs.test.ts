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

// Use real callable handlers and transaction code; only Firestore I/O is in memory.
async function actualEventServer(t: TestContext) {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
  const handlers = require('../functions/lib/functions/src/index.js');
  const { memoryDb } = require('../functions/tests/helpers/reflection-memory.cjs');
  const db = memoryDb();
  t.after(() => db.restore());
  const email = 'student@example.edu';
  db.data.set('courses/course', { rosterVersion: 2, published: {
    id: 'course', title: '合成課程', classIds: ['A'], units: [{ id: 'unit', title: '單元', bankVersion: 'v1', activities: [
      { id: 'html', type: 'html', tracking: 'interactive', materialVersion: 'v1' },
    ] }],
  } });
  db.data.set(`enrollments/course__${email}`, { email, uid: context.uid, classId: 'A', studentId: 'synthetic', name: '合成學生', enabled: true });
  const auth = { uid: context.uid, token: { email, email_verified: true, firebase: { sign_in_provider: 'google.com' } } };
  return { db, call: (name: string, data: unknown) => handlers[name].run({ auth, data }) };
}

for (const kind of ['learning', 'research'] as const) test(`${kind}: actual server committed but response lost; replay acknowledges all IDs without double counting`, async (t) => {
  const env = environment(t);
  const server = await actualEventServer(t);
  let calls = 0, complete = 0;
  const api = apiFor(async (name, data) => {
    calls++;
    const response = await server.call(name, data);
    if (calls === 1) throw Object.assign(Error('response lost after commit'), { code: 'functions/unavailable' });
    return response;
  });
  const events = kind === 'learning'
    ? [{ id: 'e1', type: 'time' as const, seconds: 15 }, { id: 'e2', type: 'completed' as const }]
    : [{ id: 'e1', questionId: 'q1', attemptId: 'attempt', clientAt: 100, format: 'guided' as const, action: 'exposed' as const, seconds: 3 }];
  const bridge = kind === 'learning'
    ? learningBridge(api, context, () => {}, () => { complete++; })
    : researchBridge(api, { uid: context.uid, courseId: 'course', unitId: 'unit', version: 'v1' }, () => {});
  // Register cleanup before restoring the in-memory server.
  env.cleanup.push(() => bridge.close());
  const result = kind === 'learning'
    ? (bridge as ReturnType<typeof learningBridge>).receive(events as any)
    : (bridge as ReturnType<typeof researchBridge>).enqueue(events as any, true);
  assert.deepEqual(await result, []);
  assert.equal(calls, 1); assert.equal(complete, 0);
  const key = [...env.data.keys()][0];
  assert.deepEqual(JSON.parse(env.data.get(key)!).map((e: any) => e.id), events.map((e) => e.id));
  const writesAfterCommit = server.db.writes.length;
  const snapshotAfterCommit = structuredClone([...server.db.data]);
  await tick();
  env.win.dispatchEvent(new Event('online'));
  // Firebase auth/transaction promises have more layers than a simple send mock.
  for (let i = 0; i < 12; i++) await tick();
  assert.equal(calls, 2);
  assert.deepEqual(JSON.parse(env.data.get(key)!), []);
  assert.equal(server.db.writes.length, writesAfterCommit);
  assert.deepEqual([...server.db.data], snapshotAfterCommit);
  if (kind === 'learning') assert.equal(complete, 1);
  const root = kind === 'learning' ? `courses/course/diagnostics/${context.uid}_unit_html_v1` : `courses/course/research/${context.uid}_unit_v1`;
  assert.equal(server.db.data.get(root).summary[kind === 'learning' ? 'activeSeconds' : 'events'], kind === 'learning' ? 15 : 1);
});

for (const code of ['functions/invalid-argument', 'functions/failed-precondition', 'permission-denied']) {
  test(`queue: ${code} drops rejected batch, never acknowledges it, and suppresses iframe replay across reopen`, async (t) => {
    const env = environment(t);
    let calls = 0, notices = 0, saved = 0;
    const options = { key: `permanent:${code}`, valid: (e: { id: string }) => !!e?.id,
      send: async () => { calls++; throw Object.assign(Error('明確拒絕'), { code }); },
      rejected: () => { notices++; }, saved: () => { saved++; },
    };
    const batch = eventBatcher(options);
    assert.deepEqual(await batch.enqueue([{ id: 'bad' }], true), []);
    await tick();
    assert.deepEqual(JSON.parse(env.data.get(options.key)!), []);
    assert.equal(saved, 0); assert.equal(notices, 1);
    assert.deepEqual(await batch.enqueue([{ id: 'bad' }], true), []);
    t.mock.timers.tick(300000); env.win.dispatchEvent(new Event('online'));
    env.doc.visibilityState = 'hidden'; env.doc.dispatchEvent(new Event('visibilitychange')); await tick();
    batch.close(); assert.equal(calls, 1); assert.equal(notices, 1);
    const reopened = eventBatcher(options);
    env.cleanup.push(() => reopened.close());
    assert.deepEqual(await reopened.enqueue([{ id: 'bad' }], true), []);
    t.mock.timers.tick(60000); await tick(); assert.equal(calls, 1);
  });
}

for (const code of ['functions/unavailable', 'functions/deadline-exceeded', 'functions/internal', 'functions/network-request-failed', undefined]) {
  test(`queue: ${code || 'uncoded network failure'} remains durable and retries successfully`, async (t) => {
    const env = environment(t);
    let calls = 0, rejected = 0;
    const batch = eventBatcher<{ id: string }>({ key: 'transient', valid: (e) => !!e?.id, rejected: () => { rejected++; },
      send: async (events) => { calls++; if (calls === 1) throw Object.assign(Error('Failed to fetch: network offline'), code ? { code } : {}); return events.map((e) => e.id); },
    });
    env.cleanup.push(() => batch.close());
    assert.deepEqual(await batch.enqueue([{ id: 'retry' }], true), []);
    await tick(); assert.equal(JSON.parse(env.data.get('transient')!).length, 1);
    t.mock.timers.tick(30000); await tick();
    assert.equal(calls, 2); assert.deepEqual(JSON.parse(env.data.get('transient')!), []); assert.equal(rejected, 0);
  });
}

test('learning: rejected old material version asks to reopen, does not complete or retry', async (t) => {
  const env = environment(t);
  let calls = 0, completed = 0;
  const messages: string[] = [];
  const bridge = learningBridge(apiFor(async () => {
    calls++; throw Object.assign(Error('教材版本已更新，請重新開啟教材'), { code: 'functions/failed-precondition' });
  }), context, (message) => messages.push(message), () => { completed++; });
  env.cleanup.push(() => bridge.close());
  const done = { id: 'rejected-done', type: 'completed' as const };
  assert.deepEqual(await bridge.receive([done]), []); await tick();
  assert.match(messages.at(-1)!, /請重新開啟教材/); assert.match(messages.at(-1)!, /未儲存/);
  assert.equal(completed, 0);
  assert.deepEqual(await bridge.receive([done]), []);
  t.mock.timers.tick(120000); await tick(); assert.equal(calls, 1);
  assert.equal(messages.filter((m) => m.includes('教材版本已更新')).length, 1);
});

test('research: permanent refusal is reported once and fresh future IDs can still be saved', async (t) => {
  const env = environment(t);
  let calls = 0;
  const notices: (boolean | undefined)[] = [];
  const bridge = researchBridge(apiFor(async (_, data) => {
    calls++; if (calls === 1) throw Object.assign(Error('研究資料活動未開放'), { code: 'functions/failed-precondition' });
    return { accepted: data.events.map((e: any) => e.id) };
  }), { uid: context.uid, courseId: 'course', unitId: 'unit', version: 'v1' }, (permanent) => notices.push(permanent));
  env.cleanup.push(() => bridge.close());
  const bad = { id: 'bad', questionId: 'q', attemptId: 'attempt', clientAt: 100, format: 'guided' as const, action: 'exposed' as const, seconds: 3 };
  assert.deepEqual(await bridge.enqueue([bad], true), []); await tick();
  assert.deepEqual(notices, [true]);
  assert.deepEqual(await bridge.enqueue([bad], true), []);
  t.mock.timers.tick(60000); await tick(); assert.equal(calls, 1);
  assert.deepEqual(await bridge.enqueue([{ ...bad, id: 'new' }], true), ['new']);
  assert.equal(calls, 2); assert.deepEqual(notices, [true]);
});
