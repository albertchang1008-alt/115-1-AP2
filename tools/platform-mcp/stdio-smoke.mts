import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { writeFile } from 'node:fs/promises';
import { privacyFindings, safeOutput } from './src/privacy.ts';
const client = new Client({name:'platform-readonly-smoke',version:'1.0.0'});
const transport = new StdioClientTransport({command:'/Users/HHC/.nvm/versions/node/v22.23.2/bin/node',args:[process.cwd()+'/dist/cli.js'],stderr:'pipe'});
transport.stderr?.on('data', () => {});
try {
  await client.connect(transport);
  const list = await client.listTools();
  const result = await client.callTool({name:'get_published',arguments:{courseId:'115-1-AP2'}});
  if (result.isError) throw Error('STDIO_TOOL_FAILED');
  const evidence = safeOutput({mode:'live',transport:'stdio',toolCount:list.tools.length,readOnlyTools:list.tools.filter(t=>t.annotations?.readOnlyHint === true).length,destructiveTools:list.tools.filter(t=>t.annotations?.destructiveHint === true).length,tool:'get_published',privacyFindings:privacyFindings(result),result});
  await writeFile('../../docs/platform-mcp/readonly-smoke/stdio-handshake.json',JSON.stringify(evidence,null,2)+'\n');
  console.log('STDIO tools='+list.tools.length+'; get_published PASS; privacy findings '+privacyFindings(result));
} finally {await client.close();}
