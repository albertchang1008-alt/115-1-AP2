// 點名測試用的記憶體 Firestore：支援 doc／collection／where／orderBy／limit／交易（交易依序執行，且先讀後寫）。
const assert = require('node:assert/strict');
function memoryDb() {
  const docs = new Map();
  let queue = Promise.resolve();
  const snap = (path) => ({
    exists: docs.has(path),
    id: path.split('/').pop(),
    ref: ref(path),
    data: () => (docs.has(path) ? structuredClone(docs.get(path)) : undefined),
  });
  const write = (path, value, opts) =>
    docs.set(path, structuredClone(opts?.merge ? { ...(docs.get(path) || {}), ...value } : value));
  const ref = (path) => ({
    path,
    id: path.split('/').pop(),
    get: async () => snap(path),
    set: async (v, opts) => void write(path, v, opts),
    update: async (v) => {
      if (!docs.has(path)) throw Error('NOT_FOUND ' + path);
      write(path, v, { merge: true });
    },
    delete: async () => void docs.delete(path),
    collection: (name) => collection(path + '/' + name),
  });
  const ops = {
    '==': (a, b) => a === b,
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
  };
  const collection = (path, filters = [], order = null, max = Infinity) => ({
    doc: (id) => ref(path + '/' + id),
    where: (field, op, value) =>
      collection(
        path,
        [...filters, (row) => row?.[field] !== undefined && ops[op](row[field], value)],
        order,
        max,
      ),
    orderBy: (field, dir = 'asc') => collection(path, filters, [field, dir], max),
    limit: (n) => collection(path, filters, order, n),
    get: async () => {
      let rows = [...docs.keys()]
        .filter(
          (k) =>
            k.startsWith(path + '/') &&
            !k.slice(path.length + 1).includes('/') &&
            filters.every((f) => f(docs.get(k))),
        )
        .map(snap);
      if (order)
        rows.sort(
          (a, b) =>
            (a.data()[order[0]] > b.data()[order[0]] ? 1 : -1) * (order[1] === 'desc' ? -1 : 1),
        );
      rows = rows.slice(0, max);
      return { docs: rows, size: rows.length, empty: !rows.length };
    },
  });
  return {
    docs,
    doc: ref,
    collection: (path) => collection(path),
    runTransaction: async (fn) => {
      let release;
      const prior = queue;
      queue = new Promise((r) => (release = r));
      await prior;
      const writes = [];
      try {
        const out = await fn({
          get: async (r) => {
            assert.equal(writes.length, 0, '交易必須先讀後寫');
            return snap(r.path);
          },
          set: (r, v, opts) => writes.push(() => write(r.path, v, opts)),
          update: (r, v) => writes.push(() => write(r.path, v, { merge: true })),
          delete: (r) => writes.push(() => docs.delete(r.path)),
        });
        writes.forEach((w) => w());
        return out;
      } finally {
        release();
      }
    },
  };
}
module.exports = { memoryDb };
