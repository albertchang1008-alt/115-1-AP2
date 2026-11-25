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
    listCollections: async () => [...new Set([...docs.keys()]
      .filter((k) => k.startsWith(path + '/'))
      .map((k) => k.slice(path.length + 1).split('/')[0]))].map((name) => collection(path + '/' + name)),
  });
  const ops = {
    '==': (a, b) => a === b,
    in: (a, b) => b.includes(a),
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
  };
  const collection = (path, filters = [], order = null, max = Infinity, group = false) => ({
    collectionPath: path,
    doc: (id) => ref(path + '/' + id),
    where: (field, op, value) =>
      collection(
        path,
        [...filters, (row) => row?.[field] !== undefined && ops[op](row[field], value)],
        order,
        max,
        group,
      ),
    orderBy: (field, dir = 'asc') => collection(path, filters, [field, dir], max, group),
    limit: (n) => collection(path, filters, order, n, group),
    get: async () => {
      let rows = [...docs.keys()]
        .filter(
          (k) =>
            (group ? k.split('/').at(-2) === path : k.startsWith(path + '/') &&
              !k.slice(path.length + 1).includes('/')) &&
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
    collectionGroup: (name) => collection(name, [], null, Infinity, true),
    recursiveDelete: async (r) => {
      for (const key of docs.keys()) if (key.startsWith(r.collectionPath + '/')) docs.delete(key);
    },
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
            return r.path ? snap(r.path) : r.get();
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
