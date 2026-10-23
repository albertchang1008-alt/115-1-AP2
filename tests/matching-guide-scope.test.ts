import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchingGuideScope } from '../src/matchingGuideScope';
test('matching guide scope is persistent per account, opaque to iframe and isolated between accounts', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) } });
  try {
    const a = matchingGuideScope('student-account-a'), b = matchingGuideScope('student-account-b');
    assert.equal(matchingGuideScope('student-account-a'), a); assert.notEqual(a, b);
    assert.match(a!, /^[a-f0-9-]{36}$/); assert.equal(a!.includes('student-account-a'), false);
  } finally { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});
