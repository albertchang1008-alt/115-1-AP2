import { spawn } from 'node:child_process';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { firebaseConfig, KEYCHAIN_SERVICE, PROJECT_ID, SafeError } from './config.js';
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export function requireTeacher(claims: JWTPayload) {
  if (claims.teacher !== true) throw new SafeError('TEACHER_CLAIM_REQUIRED: 請使用已有教師權限的帳號重新登入。');
}
export async function verifyTeacher(token: string) {
  try {
    const { payload } = await jwtVerify(token, keys, {issuer: 'https://securetoken.google.com/' + PROJECT_ID, audience: PROJECT_ID, algorithms: ['RS256']});
    requireTeacher(payload);
    if (!payload.sub || payload.sub.length > 128) throw new SafeError('INVALID_IDENTITY');
    return payload;
  } catch (e) { if (e instanceof SafeError) throw e; throw new SafeError('TOKEN_VERIFICATION_FAILED'); }
}
function security(args: string[], input?: string): Promise<string> {
  if (process.platform !== 'darwin') return Promise.reject(new SafeError('MACOS_KEYCHAIN_REQUIRED'));
  return new Promise((resolve, reject) => {
    const child = spawn('/usr/bin/security', args, {stdio:['pipe','pipe','pipe']});
    let out = '', err = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.stderr.on('data', chunk => { err += chunk; }); // Never forward commands or tokens.
    child.on('error', () => reject(new SafeError('KEYCHAIN_UNAVAILABLE')));
    child.stdin.on('error', () => reject(new SafeError('KEYCHAIN_ACCESS_FAILED')));
    child.on('close', code => code === 0 && !/error|failed|denied|SecKeychain/i.test(err) ? resolve(out.trim()) : reject(new SafeError('KEYCHAIN_ACCESS_FAILED: 請執行 platform-mcp login 或允許鑰匙圈存取。')));
    child.stdin.end(input);
  });
}
export async function storeRefreshToken(token: string) {
  // Interactive stdin avoids putting the token in process argv. No shell.
  if (!/^[A-Za-z0-9._~-]{20,8192}$/.test(token)) throw new SafeError('INVALID_REFRESH_TOKEN');
  await security(['-i'], 'add-generic-password -U -s "' + KEYCHAIN_SERVICE + '" -a "firebase-refresh" -w "' + token + '"\n');
  if (await loadRefreshToken() !== token) throw new SafeError('KEYCHAIN_ACCESS_FAILED');
}
export async function loadRefreshToken() {
  return security(['find-generic-password','-s',KEYCHAIN_SERVICE,'-a','firebase-refresh','-w']);
}
export async function refreshSession(refreshToken: string) {
  let response: Response;
  try {
    response = await fetch('https://securetoken.googleapis.com/v1/token?key=' + firebaseConfig.apiKey, {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken}), signal:AbortSignal.timeout(20000), redirect:'error',
    });
  } catch { throw new SafeError('AUTH_NETWORK_FAILED'); }
  if (!response.ok) throw new SafeError('AUTH_REFRESH_REJECTED: 請重新執行 platform-mcp login。');
  const data = await response.json() as Record<string,string>;
  await verifyTeacher(data.id_token);
  if (data.project_id !== '1005358809895' && data.project_id !== PROJECT_ID) throw new SafeError('AUTH_PROJECT_MISMATCH');
  return { idToken: data.id_token, refreshToken: data.refresh_token };
}
export async function authenticatedToken() {
  const old = await loadRefreshToken();
  const session = await refreshSession(old);
  if (session.refreshToken && session.refreshToken !== old) await storeRefreshToken(session.refreshToken);
  return session.idToken;
}
