import path from 'node:path';
import { checkApplyScript } from './lib/apply-script-check.mjs';
const args = process.argv.slice(2),
  slug = args[0];
if (!slug) throw Error('Usage: apply-script-check.mjs <slug> [--quick] [--out directory]');
const at = args.indexOf('--out'),
  out = path.resolve(at < 0 ? `docs/urinary-release/script-impl/${slug}` : args[at + 1]);
const r = await checkApplyScript(path.resolve(`materials-src/${slug}/apply.json`), {
  out,
  ...(args.includes('--quick') ? { sizes: [[390, 844]], shots: false } : {}),
});
console.log(JSON.stringify(r));
if (r.summary.fail || !r.diff.pass) process.exitCode = 1;
