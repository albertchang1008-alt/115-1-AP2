import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyPreviewStatus} from '../scripts/preview-status-verify.mjs';
test('MCP-TEST教師前端：總覽、確認取消／更新、立即生效說明、班級記憶及模擬不寫入（1280×800、390×844）',{timeout:120000},async()=>{
 const reports=await verifyPreviewStatus();assert.equal(reports.length,2);
});
