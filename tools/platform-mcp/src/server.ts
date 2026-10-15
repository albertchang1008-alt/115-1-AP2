import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallableClient, type Call } from './callable.js';
import { executeTool, toolSchemas, type ToolName } from './tools.js';
import { SafeError } from './config.js';
export function createServer(call: Call) {
  const server = new McpServer({name:'platform-mcp-ap2',version:'0.1.0'});
  for (const name of Object.keys(toolSchemas) as ToolName[]) {
    server.registerTool(name, {
      description: name + '（AP2 唯讀；草稿／課程列表因後端有副作用而明確回報不可用）',
      inputSchema:toolSchemas[name].shape,
      annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true},
    }, async (args: Record<string, unknown>) => {
      try { return {content:[{type:'text' as const,text:JSON.stringify(await executeTool(name,args,call))}]}; }
      catch(e) { return {isError:true,content:[{type:'text' as const,text:e instanceof SafeError ? e.message : 'TOOL_FAILED: 輸入、連線或資料驗證失敗；未輸出原始內容。'}]}; }
    });
  }
  return server;
}
export async function serve(token: string) {
  const client = new CallableClient();
  // Startup token already verified; each actual call refreshes and verifies again.
  if (!token) throw new SafeError('TEACHER_SESSION_REQUIRED');
  await createServer(client.call.bind(client)).connect(new StdioServerTransport());
}
