// CLI-only test preload for import-teaching-deck.mjs: no Firebase module or network is accessed.
const Module = require('node:module');
const fs = require('node:fs');

const writes = [];
const existingPresentation = {
  title: '舊版測試簡報',
  slides: [
    {
      id: 'R-REV-01',
      title: '舊標題',
      html: '<section>old</section>',
      notes: 'old note',
      answerPage: false,
    },
    {
      id: 'OLD-ONLY-SLIDE',
      title: '即將移除頁',
      html: '<section>legacy</section>',
      notes: '',
      answerPage: false,
    },
  ],
};

const makeRef = (docPath) => ({
  path: docPath,
  get: async () => {
    if (docPath.endsWith('/teacherAssets/presentation')) {
      return {
        exists: true,
        data: () => structuredClone(existingPresentation),
      };
    }
    return {
      exists: true,
      data: () => ({ id: '115-1-AP2', draft: {}, published: {} }),
    };
  },
  set: async (data, options) => {
    writes.push({ operation: 'set', path: docPath, data, options: options || null });
    if (process.env.FAKE_AP2_WRITES) {
      fs.writeFileSync(process.env.FAKE_AP2_WRITES, JSON.stringify(writes, null, 2));
    }
  },
  collection: (name) => ({
    doc: (id) => makeRef(`${docPath}/${name}/${id}`),
  }),
});

const db = {
  doc: (docPath) => makeRef(docPath),
};

for (const name of ['node:http', 'node:https', 'node:net', 'node:tls']) {
  const mod = require(name);
  for (const key of ['request', 'get', 'connect', 'createConnection']) {
    if (typeof mod[key] === 'function') {
      mod[key] = () => {
        throw new Error('Network forbidden in import-teaching-deck test');
      };
    }
  }
}
global.fetch = () => {
  throw new Error('Network forbidden in import-teaching-deck test');
};

const load = Module._load;
Module._load = function (name, ...args) {
  if (name === 'firebase-admin/app') {
    return {
      initializeApp: (options) => {
        if (options.projectId !== 'ap2-7ed91') throw new Error('Unexpected project');
      },
      applicationDefault: () => ({ fake: true }),
    };
  }
  if (name === 'firebase-admin/firestore') {
    return { getFirestore: () => db };
  }
  if (name.startsWith('firebase')) {
    throw new Error('Unmocked Firebase module: ' + name);
  }
  return load.call(this, name, ...args);
};
