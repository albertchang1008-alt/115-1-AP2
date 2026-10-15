import { PROJECT_ID, REGION, SafeError } from './config.js';
import { authenticatedToken } from './auth.js';
// Audited by effects, not by name. bootstrap/getReflections/assessmentReport are excluded.
export const READONLY_CALLABLES = Object.freeze(['getPublished','getSyncStatus','getCompletion'] as const);
export function assertReadonly(name: string) {
  if (!(READONLY_CALLABLES as readonly string[]).includes(name)) throw new SafeError('CALLABLE_NOT_ALLOWLISTED');
}
export type Call = (name: string, data: Record<string,unknown>) => Promise<any>;
export class CallableClient {
  private blocked = false;
  constructor(private token = authenticatedToken, private transport: typeof fetch = fetch) {}
  async call(name: string, data: Record<string,unknown>): Promise<any> {
    assertReadonly(name); // Must precede even token access or network.
    if (this.blocked) throw new SafeError('APP_CHECK_BLOCKED: 已停止連線，請回報教師；不可關閉 App Check。');
    const token = await this.token();
    let response: Response;
    try {
      response = await this.transport('https://' + REGION + '-' + PROJECT_ID + '.cloudfunctions.net/' + name, {
        method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer ' + token},body:JSON.stringify({data}),signal:AbortSignal.timeout(120000),redirect:'error',
      });
    } catch { throw new SafeError('CALLABLE_NETWORK_FAILED'); }
    let result: any;
    try { result = await response.json(); } catch { throw new SafeError('CALLABLE_INVALID_RESPONSE'); }
    if (!response.ok || result.error) {
      // Fail closed for unauthenticated/App Check. Never echo raw errors/details.
      if (response.status === 401 || result.error?.status === 'UNAUTHENTICATED' || /app.?check|app attestation/i.test(JSON.stringify(result.error || {}))) {
        this.blocked = true;
        throw new SafeError('APP_CHECK_OR_AUTH_BLOCKED: 已停止連線；請教師檢查登入或 App Check，不可繞過。');
      }
      const status = String(result.error?.status || '');
      throw new SafeError(['PERMISSION_DENIED','FAILED_PRECONDITION','NOT_FOUND','INVALID_ARGUMENT','RESOURCE_EXHAUSTED'].includes(status) ? 'CALLABLE_' + status : 'CALLABLE_REJECTED');
    }
    if (!('result' in result) && !('data' in result)) throw new SafeError('CALLABLE_INVALID_RESPONSE');
    return result.result ?? result.data;
  }
}
