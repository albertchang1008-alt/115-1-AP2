// Preview data (including teacher slide HTML/notes) is ignored, never built/published.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
const root = process.cwd(),
  dir = path.join(root, '.classroom-preview');
const source = process.argv[2] || '/tmp/115-mi-private-teaching-deck.json';
if (!fs.existsSync(source))
  throw Error(
    '請提供核可的本機教師簡報JSON路徑：node scripts/classroom-preview.mjs <private-deck.json>',
  );
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(source, path.join(dir, 'teacher-deck.json'));
fs.writeFileSync(
  path.join(dir, 'index.html'),
  '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>115-MI互動本機預覽</title><div id="root"></div><script type="module" src="/scripts/classroom-preview-client.tsx"></script></html>',
);
const server = await createServer({
  root,
  server: { host: '127.0.0.1', port: 8771, strictPort: true },
});
await server.listen();
console.log('教師：http://127.0.0.1:8771/.classroom-preview/index.html?role=teacher');
console.log('學生：http://127.0.0.1:8771/.classroom-preview/index.html?role=student&uid=student-1');
