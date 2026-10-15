import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { authenticatedToken } from './auth.js';
import { CallableClient } from './callable.js';
import { executeTool, type ToolName } from './tools.js';
import { privacyFindings, safeOutput } from './privacy.js';
import { SafeError } from './config.js';
export async function smoke() {
  await authenticatedToken();
  const client = new CallableClient();
  const args: Record<ToolName,unknown> = {
    list_courses:{}, get_course_draft:{courseId:'115-1-AP2'},
    get_published:{courseId:'115-1-AP2'}, diff_draft_published:{courseId:'115-1-AP2'},
    get_sync_status:{}, list_materials:{courseId:'115-1-AP2'},
    get_completion_summary:{courseId:'115-1-AP2',classId:'test'},
  };
  const directory = resolve(import.meta.dirname,'../../../docs/platform-mcp/readonly-smoke');
  for (const [name,input] of Object.entries(args)) {
    const result = safeOutput(await executeTool(name as ToolName,input,client.call.bind(client)));
    const findings = privacyFindings(result);
    if (findings) throw new SafeError('PRIVACY_SCAN_FAILED');
    await mkdir(directory,{recursive:true});
    await writeFile(resolve(directory,name + '.json'),JSON.stringify({tool:name,mode:'live',privacyFindings:findings,result},null,2) + '\n',{mode:0o600});
    process.stderr.write(name + ': ' + ((result as any)?.available === false ? 'UNAVAILABLE (audited backend gap)' : 'PASS') + '; privacy findings 0\n');
  }
}
