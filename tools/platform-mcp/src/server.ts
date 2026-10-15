import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallableClient, type Call } from './callable.js';
import { executeTool, toolSchemas, type ToolName } from './tools.js';
import { SafeError } from './config.js';
import {WriteTools,writeSchemas,type WriteTool} from './writes.js';
export function createServer(call: Call,write:Call=async()=>{throw new SafeError('WRITE_TRANSPORT_REQUIRED');}) {
  const server = new McpServer({name:'platform-mcp-ap2',version:'1.9.1'});
  for (const name of Object.keys(toolSchemas) as ToolName[]) {
    server.registerTool(name, {
      description: name + '（AP2 唯讀；不包含名冊或學生作答）',
      inputSchema:toolSchemas[name].shape,
      annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true},
    }, async (args: Record<string, unknown>) => {
      try { return {content:[{type:'text' as const,text:JSON.stringify(await executeTool(name,args,call))}]}; }
      catch(e) { return {isError:true,content:[{type:'text' as const,text:e instanceof SafeError ? e.message : 'TOOL_FAILED: 輸入、連線或資料驗證失敗；未輸出原始內容。'}]}; }
    });
  }
  const writer=new WriteTools(call,write);
  for(const name of Object.keys(writeSchemas) as WriteTool[]) {
    server.registerTool(name,{
      description:name+'：先mode=preview。套用前必須把預覽內容給教師看，並取得同意；mode=apply需原始參數、confirmationCode與teacherApproved=true。確認碼一次有效、10分鐘到期。sync_sheet影響此教師所有對應Sheet課程，不限單一課程。',
      inputSchema:writeSchemas[name].shape,
      annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:true},
    },async(args:Record<string,unknown>)=>{
      try{return {content:[{type:'text' as const,text:JSON.stringify(await writer.execute(name,args))}]};}
      catch(e){return {isError:true,content:[{type:'text' as const,text:e instanceof SafeError ? e.message : 'WRITE_FAILED: 輸入或驗證失敗；未輸出原始內容，請重新讀取並預覽。'}]};}
    });
  }
  return server;
}
export async function serve(token: string) {
  const client = new CallableClient();
  // Startup token already verified; each actual call refreshes and verifies again.
  if (!token) throw new SafeError('TEACHER_SESSION_REQUIRED');
  await createServer(client.call.bind(client),client.write.bind(client)).connect(new StdioServerTransport());
}
