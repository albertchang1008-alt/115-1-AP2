import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVersionChecker, deploymentVersion, VERSION_CHECK } from '../src/updateVersion';
import { createUpdateActivity, reloadIfIdle, updateActivity } from '../src/updateActivity';
const response = (version: unknown, ok = true) =>
  ({ ok, json: async () => ({ version }) }) as Response;
test('相同不提示、部署不同才提示（含回復部署），只接受有限長度的x.y.z', async () => {
  const seen: (string | null)[] = [],
    requests: { url: string; init?: RequestInit }[] = [];
  let now = 0,
    v = '1.15.0';
  const c = createVersionChecker({
    current: v,
    baseUrl: 'https://example.test/course/',
    now: () => now,
    onVersion: (x) => seen.push(x),
    fetcher: async (url, init) => {
      requests.push({ url: String(url), init });
      return response(v);
    },
  });
  await c.check();
  assert.deepEqual(seen, [null]);
  now = 60000;
  v = '1.16.0';
  await c.check();
  assert.deepEqual(seen, [null, '1.16.0']);
  now += 60000;
  v = '1.14.0';
  await c.check();
  assert.equal(seen.at(-1), '1.14.0');
  assert.equal(requests[0].init?.cache, 'no-store');
  assert.ok(requests[1].url.includes('version.json?_=60000'));
  assert.equal(new URL(requests[0].url).pathname, '/course/version.json');
  for (const bad of ['', 'x.y.z', '1.2', '1.2.3<script>', null, {}, '1234567.0.0'])
    assert.equal(deploymentVersion({ version: bad }), null);
  c.dispose();
});
test('一分鐘節流、未完成請求不重疊、dispose後晚回應不提示', async () => {
  let now = 0,
    count = 0,
    resolve!: (v: Response) => void;
  const seen: unknown[] = [];
  const c = createVersionChecker({
    current: '1.0.0',
    baseUrl: 'https://example.test/',
    now: () => now,
    onVersion: (v) => seen.push(v),
    fetcher: async () => {
      count++;
      return new Promise((r) => (resolve = r));
    },
  });
  const pending = c.check();
  now = 61000;
  await c.check();
  assert.equal(count, 1);
  resolve(response('1.1.0'));
  await pending;
  const late = c.check();
  assert.equal(count, 2);
  c.dispose();
  resolve(response('1.2.0'));
  await late;
  assert.deepEqual(seen, ['1.1.0']);
  const d = createVersionChecker({
    current: '1.0.0',
    baseUrl: 'https://example.test/',
    now: () => now,
    onVersion: () => {},
    fetcher: async () => {
      count++;
      return response('1.0.0');
    },
  });
  await d.check();
  const n = count;
  now += 59999;
  await d.check();
  assert.equal(count, n);
  now++;
  await d.check();
  assert.equal(count, n + 1);
  d.dispose();
});
test('離線、非成功、無效JSON或版本均靜默；失敗仍受節流', async () => {
  let now = 0,
    count = 0;
  const seen: unknown[] = [];
  for (const fetcher of [
    async () => {
      throw Error('offline');
    },
    async () => response('1.1.0', false),
    async () =>
      ({
        ok: true,
        json: async () => {
          throw Error('bad JSON');
        },
      }) as unknown as Response,
    async () => response('oops'),
  ]) {
    const c = createVersionChecker({
      current: '1.0.0',
      baseUrl: 'https://example.test/',
      now: () => now,
      onVersion: (v) => seen.push(v),
      fetcher: async () => {
        count++;
        return fetcher();
      },
    });
    await c.check();
    const n = count;
    await c.check();
    assert.equal(count, n);
    c.dispose();
    now += 60000;
  }
  assert.deepEqual(seen, []);
  assert.equal(VERSION_CHECK.intervalMs, 1800000);
});
test('多個作答鎖只在全部結束時解除，過期的可點狀態也不能繞過reload守門', () => {
  const store = createUpdateActivity();
  let events = 0;
  const unsubscribe = store.subscribe(() => events++),
    a = store.lock(),
    b = store.lock();
  assert.equal(store.getSnapshot(), true);
  a();
  a();
  assert.equal(store.getSnapshot(), true);
  b();
  assert.equal(store.getSnapshot(), false);
  assert.equal(events, 4);
  unsubscribe();
  let reloads = 0;
  const release = updateActivity.lock();
  assert.equal(
    reloadIfIdle(() => reloads++),
    false,
  );
  assert.equal(reloads, 0);
  release();
  assert.equal(
    reloadIfIdle(() => reloads++),
    true,
  );
  assert.equal(reloads, 1);
});
