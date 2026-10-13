// CLI-only test preload: no Firebase module or credentials are loaded.
const Module = require('node:module');
const fs = require('node:fs');
const writes = [];
const snapshot = { exists: true, _snapshotMarker: 'must never be written', _reference: { fake: true }, data: () => ({ draft: {}, published: {} }) };
const ref = path => ({
  path,
  get: async () => snapshot,
  collection: name => ({
    doc: id => ref(path + '/' + name + '/' + id),
    limit: () => ({ get: async () => ({ empty: false }) }),
  }),
});
const db = {
  doc: ref,
  runTransaction: async callback => {
    await callback({
      get: async () => snapshot,
      update: (target, data) => writes.push({ operation: 'update', path: target.path, data }),
      set: (target, data, options) => writes.push({ operation: 'set', path: target.path, data, options }),
    });
    fs.writeFileSync(process.env.FAKE_MI_WRITES, JSON.stringify(writes));
  },
};
// Fail closed on network access or an unmocked Firebase import.
for (const name of ['node:http', 'node:https', 'node:net', 'node:tls']) {
  const module = require(name);
  for (const key of ['request', 'get', 'connect', 'createConnection']) if (typeof module[key] === 'function') module[key] = () => { throw Error('Network forbidden in migration test'); };
}
global.fetch = () => { throw Error('Network forbidden in migration test'); };
const load = Module._load;
Module._load = function(name, ...args) {
  if (name === 'firebase-admin/app') return {
    initializeApp: options => { if (options.projectId !== 'mi-bd885') throw Error('Unexpected project'); },
    applicationDefault: () => ({ fake: true }),
  };
  if (name === 'firebase-admin/firestore') return { getFirestore: () => db };
  if (name.startsWith('firebase')) throw Error('Unmocked Firebase module');
  return load.call(this, name, ...args);
};
