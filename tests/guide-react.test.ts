import { test } from 'node:test';
import { verifyGuide } from '../scripts/guide-verify.mjs';
test('學生說明入口與首次三張提示可略過、帳號課程隔離、畫面無溢位', {timeout:120000}, async()=>{await verifyGuide();});
