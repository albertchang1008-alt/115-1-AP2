import { build } from 'esbuild';
import { chmod, mkdir, symlink, unlink } from 'node:fs/promises';
await build({entryPoints:['src/cli.ts'],bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',outfile:'dist/cli.js',banner:{js:'#!/usr/bin/env node'}});
await build({entryPoints:['src/login-client.ts'],bundle:true,platform:'browser',format:'esm',target:'es2022',outfile:'dist/login-client.js'});
await chmod('dist/cli.js',0o755);
await mkdir('node_modules/.bin',{recursive:true});
await unlink('node_modules/.bin/platform-mcp').catch(error => {if (error.code !== 'ENOENT') throw error;});
await symlink('../../dist/cli.js','node_modules/.bin/platform-mcp');
