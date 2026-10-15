import { createServer, type IncomingMessage } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { verifyTeacher, refreshSession, storeRefreshToken } from './auth.js';
import { SafeError } from './config.js';
async function body(req: IncomingMessage) {
  const chunks: Buffer[] = []; let n = 0;
  for await (const chunk of req) {
    n += chunk.length;
    if (n > 32768) throw new SafeError('LOGIN_REQUEST_TOO_LARGE');
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function loginPage() {
  const nonce = randomBytes(32).toString('hex');
  const script = await readFile(fileURLToPath(new URL('./login-client.js',import.meta.url)));
  let origin = '';
  let finish!: (error?: SafeError) => void;
  const done = new Promise<void>((resolve,reject) => {finish = e => e ? reject(e) : resolve();});
  // Attach immediately so an asynchronous failure cannot become unhandled.
  void done.catch(() => {});
  const server = createServer(async (req,res) => {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    if ('http://' + req.headers.host !== origin) {res.writeHead(403).end();return;}
    if (req.method === 'GET' && req.url === '/') {
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="login-nonce" content="' + nonce + '"><title>AP2 本機唯讀連接器登入</title><body><h1>AP2 本機唯讀連接器</h1><p>請教師本人以學校 Google 帳號登入。登入資料僅存於記憶體與 macOS 鑰匙圈。</p><button id="login">以學校 Google 帳號登入</button><p id="status">等待教師操作</p><script type="module" src="/login-client.js"></script></body></html>');
      return;
    }
    if (req.method === 'GET' && req.url === '/login-client.js') {res.setHeader('Content-Type','text/javascript');res.end(script);return;}
    if (req.method !== 'POST' || !['/session','/failure'].includes(req.url || '') || req.headers.origin !== origin || req.headers['x-login-nonce'] !== nonce || req.headers['content-type'] !== 'application/json') {res.writeHead(403).end();return;}
    res.setHeader('Content-Type','application/json');
    try {
      const data = await body(req);
      if (req.url === '/failure') {
        const code = typeof data.code === 'string' && /^(auth\/[a-z-]+|[A-Z_]+)$/.test(data.code) ? data.code : 'auth/login-failed';
        res.end(JSON.stringify({stopped:true}));
        process.stderr.write('登入停止：' + code + '\n');
        finish(new SafeError(code)); return;
      }
      if (typeof data.idToken !== 'string' || typeof data.refreshToken !== 'string') throw new SafeError('INVALID_LOGIN_REQUEST');
      const claims = await verifyTeacher(data.idToken);
      if (claims.email_verified !== true || typeof claims.email !== 'string' || !claims.email.toLowerCase().endsWith('@ctcn.edu.tw') || (claims.firebase as any)?.sign_in_provider !== 'google.com') throw new SafeError('SCHOOL_ACCOUNT_REQUIRED');
      // Confirm that refresh token belongs to the same verified teacher, without exposing it.
      const refreshed = await refreshSession(data.refreshToken);
      const current = await verifyTeacher(refreshed.idToken);
      if (current.sub !== claims.sub) throw new SafeError('TOKEN_IDENTITY_MISMATCH');
      await storeRefreshToken(refreshed.refreshToken || data.refreshToken);
      res.end(JSON.stringify({ok:true}));
      process.stderr.write('教師登入成功；鑰匙圈已保存。\n');
      // Keep page available briefly for the non-sensitive success screenshot.
      finish();
    } catch(e) {
      const code = e instanceof SafeError ? e.message.split(':')[0] : 'LOGIN_FAILED';
      res.writeHead(403).end(JSON.stringify({code}));
    }
  });
  server.requestTimeout = 30000;
  await new Promise<void>((resolve,reject) => {server.once('error',reject); server.listen(0,'127.0.0.1',resolve);});
  const address = server.address();
  if (!address || typeof address === 'string') throw new SafeError('LOGIN_SERVER_FAILED');
  origin = 'http://localhost:' + address.port;
  // Listen only on loopback IPv4, use localhost as Firebase authorized domain.
  process.stderr.write('請教師本人開啟 ' + origin + ' 並按登入；15 分鐘後關閉。\n');
  const opener = spawn('/usr/bin/open',[origin],{stdio:'ignore'});
  opener.on('error', () => {});
  const timeout = setTimeout(() => finish(new SafeError('LOGIN_TIMEOUT')),15 * 60 * 1000);
  try {await done; await new Promise(resolve => setTimeout(resolve,30000));}
  finally {clearTimeout(timeout);server.closeAllConnections();await new Promise<void>(r => server.close(() => r()));}
}
