import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertReadonly, CallableClient, READONLY_CALLABLES } from '../src/callable.js';
import { requireTeacher } from '../src/auth.js';
import { safeOutput, privacyFindings } from '../src/privacy.js';
import { diffSummary } from '../src/course.js';
import { executeTool, toolSchemas } from '../src/tools.js';
import { createServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
const course = {id:'115-1-AP2',title:'解剖生理2',term:'115-1',description:'',classIds:['test'],units:[],sheetsUrl:'https://example.org',chapters:{},teacherIds:['private-uid'],roster:[{name:'禁止輸出'}]};
test('whitelist blocks writes and deceptive reads before token/network access', async () => {
  let touched = false;
  const client = new CallableClient(async () => {touched = true;return '';});
  for (const name of ['saveCourse','publishCourse','syncSheet','syncRoster','bootstrap','getReflections','getAssessments','assessmentReport','mergeChapter','deleteCourse','getRoster','constructor','getPublished/../saveCourse']) {
    assert.throws(() => assertReadonly(name),/CALLABLE_NOT_ALLOWLISTED/);
    await assert.rejects(client.call(name,{}),/CALLABLE_NOT_ALLOWLISTED/);
  }
  assert.equal(touched,false);
  assert.deepEqual(READONLY_CALLABLES,['getPublished','getSyncStatus','getCompletion']);
});
test('privacy filter removes nested identities, dynamic identifier keys and secret content', () => {
  const out = safeOutput({email:'student@example.org',姓名:'王同學',學號:'11151001',uid:'secret',nested:[{name:'王同學',student_id:'11151001',title:'test student@example.org 11151001',refreshToken:'never'}],byUid:{secret:{name:'王'}},'11151001':{best:100},roster:[{value:'王'}],counts:{total:3}});
  const text = JSON.stringify(out);
  for (const forbidden of ['student@example.org','11151001','王同學','secret','never','byUid','roster']) assert.ok(!text.includes(forbidden));
  assert.equal(privacyFindings(out),0);
  assert.deepEqual((out as any).counts,{total:3});
  assert.throws(() => safeOutput({unsafeNumeric:11151001}),/PRIVACY_SCAN_FAILED/);
  const activityId = 'e2ec185c-21e6-4700-86fe-a123456789fb';
  assert.deepEqual(safeOutput({id:activityId}),{id:activityId});
  assert.equal(privacyFindings({id:activityId}),0);
});
test('requires boolean teacher custom claim', () => {
  for (const claims of [{},{teacher:false},{teacher:'true'},{teacher:1}]) assert.throws(() => requireTeacher(claims),/TEACHER_CLAIM_REQUIRED/);
  assert.doesNotThrow(() => requireTeacher({teacher:true}));
});
test('diff handles stable object order, additions, removals, arrays and escaped paths', () => {
  assert.equal(diffSummary({a:1,b:2},{b:2,a:1}).changed,false);
  assert.deepEqual(diffSummary({a:[1],b:2,'c/d':true},{a:[2],c:3}),{changed:true,changedPathCount:4,paths:['/a','/b','/c~1d','/c']});
});
test('draft/list/diff fail closed without any backend call', async () => {
  for (const name of ['list_courses','get_course_draft','diff_draft_published'] as const) {
    const result: any = await executeTool(name,name === 'list_courses' ? {} : {courseId:'115-1-AP2'},async () => {throw Error('must not call');});
    assert.equal(result.available,false);
  }
});
test('published projection has course configuration and no roster or teacher IDs', async () => {
  const result: any = await executeTool('get_published',{courseId:course.id},async () => course);
  assert.equal(result.course.id,course.id);
  assert.equal(result.course.roster,undefined);
  assert.equal(result.course.teacherIds,undefined);
  assert.equal(result.course.sheetsUrl,undefined);
});
test('material usage explicitly covers published only, both chapter and legacy activities', async () => {
  const raw = {...course,chapters:{呼吸:{activities:[{id:'a',url:'https://albertchang1008-alt.github.io/115-1-AP2/materials/airway-structure-v1/index.html'}]}}};
  const result: any = await executeTool('list_materials',{courseId:course.id},async () => raw);
  assert.equal(result.usageScope,'published-only');
  assert.equal(result.materials.find((x: any) => x.slug === 'airway-structure-v1').usedInPublished,true);
  assert.equal(result.materials.length,38);
});
test('completion aggregates all pages in memory with canonical v3 and class overrides', async () => {
  const raw = {...course,units:[{id:'cat',title:'題庫',group:'呼吸',bankVersion:'v1',threshold:80,activities:[],required:true}],chapters:{呼吸:{title:'呼吸',required:true,threshold:80,activities:[{id:'a',type:'youtube',required:true}]}},chapterOverrides:{test:{呼吸:{threshold:95}}}};
  let n = 0;
  const result: any = await executeTool('get_completion_summary',{courseId:course.id,classId:'test'},async (name,args) => {
    assert.equal(name,'getCompletion');
    if (++n === 1) {assert.equal(args.after,undefined);return {course:raw,rows:[{email:'a@example.org',name:'王同學',studentId:'11151001',uid:'private',enabled:true,progress:{units:{cat:{best:99}},activities:{'chapter:呼吸_a':{completed:true}}}}],next:'11151001'};}
    assert.equal(args.after,'11151001');
    return {course:raw,rows:[{enabled:true,progress:{units:{cat:{best:90}},activities:{'chapter:呼吸_a':{completed:true}}}},{enabled:false,progress:{units:{},activities:{}}}],next:null};
  });
  assert.deepEqual(result,{students:3,enabledStudents:2,completedStudents:1,completedRequiredChapters:1,requiredChapterOpportunities:2,pages:2});
  assert.equal(privacyFindings(result),0);
});
test('completion detects repeating cursors rather than returning partial counts', async () => {
  await assert.rejects(executeTool('get_completion_summary',{courseId:course.id,classId:'test'},async () => ({course,rows:[],next:'11151001'})),/INVALID_COMPLETION_CURSOR/);
});
test('sync errors do not expose free-form names, emails, sheet IDs or roster details', async () => {
  const result: any = await executeTool('get_sync_status',{},async () => ({sheetId:'private-sheet',status:{lastError:'王同學 student@example.org 11151001',lastResult:{banks:[{courseId:'115-1-AP2',error:'王同學',staleUnits:['old']}]},lastRosterResult:{count:5,results:[{email:'private@example.org'}]}}}));
  assert.equal(result.hasError,true); assert.equal(result.bankResults[0].hasError,true);
  assert.equal(privacyFindings(result),0);
  assert.ok(!JSON.stringify(result).includes('王同學'));
  assert.ok(!JSON.stringify(result).includes('private-sheet'));
});
test('callable uses only fixed AP2 endpoint and correct callable envelope', async () => {
  const client = new CallableClient(async () => 'not-a-real-token',async (url,init) => {
    assert.equal(url,'https://asia-east1-ap2-7ed91.cloudfunctions.net/getPublished');
    assert.equal(init?.method,'POST');
    assert.deepEqual(JSON.parse(init?.body as string),{data:{courseId:'115-1-AP2'}});
    return new Response(JSON.stringify({result:course}),{status:200});
  });
  assert.deepEqual(await client.call('getPublished',{courseId:course.id}),course);
});
test('App Check/auth failure latches connection off and never exposes raw response', async () => {
  let calls = 0;
  const client = new CallableClient(async () => 'not-a-real-token',async () => {calls++;return new Response(JSON.stringify({error:{message:'App Check required private@example.org'}}),{status:401});});
  await assert.rejects(client.call('getPublished',{}),/APP_CHECK_OR_AUTH_BLOCKED/);
  await assert.rejects(client.call('getPublished',{}),/APP_CHECK_BLOCKED/);
  assert.equal(calls,1);
});
test('input schemas reject arbitrary callable/project and unknown fields', () => {
  assert.equal(toolSchemas.get_published.safeParse({courseId:course.id,projectId:'mi-bd885'}).success,false);
  assert.equal(toolSchemas.get_published.safeParse({courseId:'../../anything'}).success,false);
});
test('official SDK protocol exposes seven read-only tools and sanitizes tool results', async () => {
  const [clientTransport,serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer(async () => course);
  const client = new Client({name:'test',version:'1.0.0'});
  await server.connect(serverTransport); await client.connect(clientTransport);
  try {
    const listed = await client.listTools();
    assert.equal(listed.tools.length,7);
    assert.ok(listed.tools.every(t => t.annotations?.readOnlyHint === true));
    const result = await client.callTool({name:'get_published',arguments:{courseId:course.id}});
    assert.ok(!JSON.stringify(result).includes('private-uid'));
    const blocked = await client.callTool({name:'get_course_draft',arguments:{courseId:course.id}});
    assert.ok(JSON.stringify(blocked).includes('READONLY_BACKEND_GAP'));
  } finally { await client.close(); await server.close(); }
});
