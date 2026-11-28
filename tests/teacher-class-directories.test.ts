import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import type { API } from '../src/service';
import { attendanceClassDirectory, quizClassDirectory } from '../src/teacherClassDirectories';

const oldClass = { classId: 'fixture', name: '合成班級', test: false };
const newClass = { ...oldClass, name: '合成班級新名稱', test: true };

function mockStorage(t: TestContext, storage: Pick<Storage, 'getItem' | 'setItem'>) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
}

test('directory refresh shares an in-flight request, persists only class metadata and retains unchanged rows', async (t) => {
  const storage = new Map<string, string>();
  const writes: string[] = [];
  mockStorage(t, {
    getItem: (key) => storage.get(key) ?? null,
    setItem(key, value) {
      storage.set(key, value);
      writes.push(value);
    },
  });
  const calls: string[] = [];
  let rows = [oldClass];
  const api: API = {
    preview: false,
    async call<T>(name: string, data: unknown): Promise<T> {
      assert.deepEqual(data, { courseId: 'fixture-course' });
      calls.push(name);
      const classes = rows.map((row) => ({ ...row, extra: 'discard' }));
      return (name === 'attendanceClassCards'
        ? { classes, active: { kind: 'trial', classIds: [], endsAt: null }, now: 1 }
        : classes) as T;
    },
  };
  const create = () => attendanceClassDirectory(api, 'fixture-course', 'fixture-teacher');
  const attendance = create();
  assert.equal(attendance.snapshot(), undefined);
  const pending = attendance.refresh();
  assert.equal(attendance.refresh(), pending);
  assert.deepEqual((await pending).classes, [oldClass]);
  assert.deepEqual(calls, ['attendanceClassCards']);
  assert.deepEqual(writes.map((value) => JSON.parse(value)), [[oldClass]]);

  const stored = create();
  const snapshot = stored.snapshot();
  assert.deepEqual(snapshot, [oldClass]);
  assert.equal((await stored.refresh()).classes, snapshot);
  assert.equal(writes.length, 1);
  assert.equal(quizClassDirectory(api, 'fixture-course', 'fixture-teacher').snapshot(), undefined);
  assert.equal(attendanceClassDirectory(api, 'other-course', 'fixture-teacher').snapshot(), undefined);
  assert.equal(attendanceClassDirectory(api, 'fixture-course', 'other-teacher').snapshot(), undefined);
  assert.equal(attendanceClassDirectory({ ...api, preview: true }, 'fixture-course', 'fixture-teacher').snapshot(), undefined);

  rows = [newClass];
  assert.deepEqual((await stored.refresh()).classes, [newClass]);
  assert.deepEqual(create().snapshot(), [newClass]);
  rows = [];
  await stored.refresh();
  assert.deepEqual(create().snapshot(), []);
});

test('invalid or unavailable storage falls back to fresh data and a failed fetch can be retried', async (t) => {
  const read = t.mock.fn(() => '{invalid');
  mockStorage(t, { getItem: read, setItem: () => { throw new Error('blocked storage'); } });
  let online = false;
  const api: API = {
    preview: false,
    async call<T>(): Promise<T> {
      if (!online) throw new Error('offline');
      return [oldClass] as T;
    },
  };
  const directory = quizClassDirectory(api, 'fixture-course', 'fixture-teacher');
  assert.equal(directory.snapshot(), undefined);
  read.mock.mockImplementation(() => JSON.stringify([{ classId: 'fixture', name: 123 }]));
  assert.equal(quizClassDirectory(api, 'fixture-course', 'fixture-teacher').snapshot(), undefined);
  read.mock.mockImplementation(() => { throw new Error('blocked storage'); });
  assert.equal(quizClassDirectory(api, 'fixture-course', 'fixture-teacher').snapshot(), undefined);
  await assert.rejects(directory.refresh(), /offline/);
  online = true;
  assert.deepEqual((await directory.refresh()).classes, [oldClass]);
  assert.deepEqual(directory.snapshot(), [oldClass]);
});

test('an explicit post-mutation refresh reads past a pending attendance snapshot', async () => {
  let finishOriginal!: () => void;
  let calls = 0;
  const api: API = {
    preview: false,
    async call<T>(): Promise<T> {
      const initial = ++calls === 1;
      if (initial) await new Promise<void>((resolve) => { finishOriginal = resolve; });
      return { classes: [oldClass], active: initial ? null : { kind: 'trial', classIds: ['fixture'], endsAt: null }, now: 1 } as T;
    },
  };
  const directory = attendanceClassDirectory(api, 'fixture-course');
  const original = directory.refresh();
  const latest = directory.refresh({ afterPending: true });
  assert.equal(calls, 1);
  finishOriginal();
  assert.equal((await original).active, null);
  assert.equal((await latest).active?.kind, 'trial');
  assert.equal(calls, 2);
});
