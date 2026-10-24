// Local callable harness: validate and encode every write with the real Firestore SDK.
// No commit() is called, so no credentials, emulator, or remote database is used.
const assert = require('node:assert/strict');
const { Firestore } = require('@google-cloud/firestore');
const { getFirestore } = require('firebase-admin/firestore');
const codec = new Firestore({ projectId: 'demo-snapshot-fix', ignoreUndefinedProperties: false });
function noUndefined(value, path = '$') {
  assert.notEqual(value, undefined, `undefined at ${path}`);
  if (value && typeof value === 'object')
    for (const [key, child] of Object.entries(value)) noUndefined(child, `${path}.${key}`);
}
function serialize(path, value) {
  const batch = codec.batch();
  batch.create(codec.doc(path), value); // SDK's recursive validation, including undefined rejection.
  const proto = batch._ops[0].op(); // Execute the SDK's actual protobuf encoder without an RPC.
  assert(proto.update.fields);
  noUndefined(value);
  return proto;
}
function memoryDb() {
  const db = getFirestore(), originals = { doc: db.doc, collection: db.collection, runTransaction: db.runTransaction, batch: db.batch };
  const data = new Map(), writes = [];
  const snapshot = path => ({ exists: data.has(path), data: () => structuredClone(data.get(path)) });
  function put(path, value) {
    const proto = serialize(path, value);
    writes.push({ path, proto });
    data.set(path, structuredClone(value));
  }
  function doc(path) {
    return {
      path, get: async () => snapshot(path),
      create: async value => { assert(!data.has(path)); put(path, value); },
      collection: name => collection(`${path}/${name}`),
    };
  }
  function collection(path) {
    const q = { where: () => q, orderBy: () => q, startAfter: () => q, limit: () => q,
      doc: (id = require('node:crypto').randomUUID()) => doc(`${path}/${id}`), get: async () => ({ docs: [], size: 0 }) };
    return q;
  }
  db.batch = () => {
    const pending = [];
    return { set: (ref, v) => { serialize(ref.path, v); pending.push([ref.path, v]); },
      commit: async () => pending.forEach(([path, v]) => put(path, v)) };
  };
  db.doc = doc;
  db.collection = collection;
  db.runTransaction = async fn => {
    const pending = [];
    const result = await fn({ get: ref => ref.get(),
      create: (ref, v) => { assert(!data.has(ref.path)); serialize(ref.path, v); pending.push([ref.path, v]); },
      set: (ref, v) => { serialize(ref.path, v); pending.push([ref.path, v]); },
      update: (ref, v) => {
        serialize(ref.path, v);
        const next = structuredClone(data.get(ref.path) || {});
        for (const [key, value] of Object.entries(v)) {
          const parts = key.split('.');
          let target = next;
          for (const part of parts.slice(0, -1)) target = target[part] ??= {};
          target[parts.at(-1)] = value;
        }
        pending.push([ref.path, next]);
      },
    });
    pending.forEach(([path, v]) => put(path, v));
    return result;
  };
  return { data, writes, restore: () => Object.assign(db, originals) };
}
module.exports = { memoryDb, noUndefined, serialize };
