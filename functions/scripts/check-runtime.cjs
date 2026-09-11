const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  console.error(
    '後端需要 Node.js 22.12+（部署使用 22.x）。請先切換 Node.js，再執行 npm ci --prefix functions。',
  );
  process.exit(1);
}
const backendRequire = createRequire(resolve(__dirname, '../package.json'));
for (const name of ['@google-cloud/firestore', 'firebase-admin', 'firebase-functions']) {
  try {
    backendRequire.resolve(name);
  } catch {
    console.error(`缺少後端套件 ${name}。請使用支援的 Node.js 執行 npm ci --prefix functions。`);
    process.exit(1);
  }
}
