import { authenticatedToken } from './auth.js';
import { loginPage } from './login.js';
import { serve } from './server.js';
import { smoke } from './smoke.js';
import { SafeError } from './config.js';
try {
  if (process.argv[2] === '--version') process.stdout.write('platform-mcp 1.9.1\n');
  else if (process.argv[2] === 'login') await loginPage();
  else if (process.argv[2] === 'smoke') await smoke();
  else if (!process.argv[2]) await serve(await authenticatedToken());
  else throw new SafeError('UNKNOWN_COMMAND');
} catch(e) {
  process.stderr.write((e instanceof SafeError ? e.message : 'PLATFORM_MCP_FAILED: 未輸出可能含個資的錯誤全文。') + '\n');
  process.exitCode = 1;
}
