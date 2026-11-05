import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import type { LearningEvent } from '../shared/learning';

function clock(acknowledge = true) {
  const window = new EventTarget() as EventTarget & { CourseLearning: { complete(): void; explore(nodeId: string): void } };
  const document = Object.assign(new EventTarget(), { hidden: false, documentElement: {} });
  const messages: LearningEvent[][] = [];
  let now = 0, timer = () => {}, id = 0;
  const message = (data: object) => window.dispatchEvent(Object.assign(new Event('message'), { source: parent, data }));
  const ack = (events: LearningEvent[]) => message({ type: 'learning-ack', sessionId: 's', accepted: events.map((e) => e.id) });
  const parent = { postMessage(data: { events?: LearningEvent[] }) {
    if (!data.events) return;
    messages.push(data.events);
    if (acknowledge) ack(data.events);
  }};
  runInNewContext(readFileSync(new URL('../public/materials/course-learning.js', import.meta.url), 'utf8'), {
    window, document, parent, Date: { now: () => now }, crypto: { randomUUID: () => String(++id) },
    MutationObserver: class { observe() {} },
    setInterval(fn: () => void, interval: number) { assert.equal(interval, 15000); timer = fn; },
  });
  message({ type: 'init', protocolVersion: 1, activityId: 'a', sessionId: 's' });
  return { window, document, messages, ack, tick() { now += 15000; timer(); } };
}

test('SDK keeps 15-second accounting, emits at 60 seconds, and flushes partial time at each boundary', () => {
  const c = clock();
  c.tick(); c.tick(); c.tick();
  assert.equal(c.messages.length, 0);
  c.window.dispatchEvent(new Event('pointerdown'));
  c.tick();
  assert.deepEqual(c.messages.flat().map((e) => e.seconds), [60]);

  c.tick();
  c.document.hidden = true;
  c.document.dispatchEvent(new Event('visibilitychange'));
  c.tick();
  c.window.dispatchEvent(new Event('pagehide'));
  assert.deepEqual(c.messages.flat().map((e) => e.seconds), [60, 15]);

  c.document.hidden = false;
  c.document.dispatchEvent(new Event('visibilitychange'));
  c.window.dispatchEvent(new Event('keydown'));
  c.tick();
  c.window.dispatchEvent(new Event('pagehide'));
  c.tick();
  c.window.CourseLearning.complete();
  assert.deepEqual(c.messages.flat().map((e) => e.seconds ?? e.type), [60, 15, 15, 15, 'completed']);
  assert.deepEqual(Array.from(c.messages.at(-1) ?? [], (e) => e.type), ['time', 'completed']);
});

test('SDK preserves the strict 60-second inactivity cutoff', () => {
  const c = clock();
  for (let i = 0; i < 8; i++) c.tick();
  c.window.CourseLearning.complete();
  assert.deepEqual(c.messages.flat().map((e) => e.seconds ?? e.type), [45, 'completed']);
});

test('SDK reserves a completion slot when offline time would otherwise fill the queue', () => {
  const c = clock(false);
  c.tick();
  for (let i = 0; i < 1999; i++) c.window.CourseLearning.explore('node');
  c.window.CourseLearning.complete();
  const drained: LearningEvent[] = [];
  for (let i = 0; i < 67; i++) {
    const batch = c.messages.at(-1)!;
    drained.push(...batch);
    c.ack(batch);
  }
  assert.equal(new Set(drained.map(e => e.id)).size, 2000);
  assert.equal(drained.at(-1)?.type, 'completed');
});
