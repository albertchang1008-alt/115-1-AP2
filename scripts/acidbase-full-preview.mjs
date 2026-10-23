import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { renderApply } from '../materials-src/apply-kit/render.mjs';
const file = path.resolve('materials-src/acid-base-homeostasis/full.json');
const server = http.createServer((request, response) => {
  if (request.url === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.url !== '/') {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  try {
    const html = renderApply(JSON.parse(fs.readFileSync(file, 'utf8')), {
      baseDir: path.dirname(file),
      view: 'course',
    });
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(html);
  } catch (e) {
    response.writeHead(500);
    response.end(e.message);
  }
});
server.listen(8783, '127.0.0.1', () =>
  console.log('酸鹼完整樣張：http://127.0.0.1:8783/（僅本機預覽，不登錄）'),
);
