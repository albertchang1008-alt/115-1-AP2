// Exercise the actual bootstrap callable with an isolated in-memory Firestore.
const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: 'demo-course-platform' });
const { bootstrap } = require('../lib/functions/src/index.js');
const { getFirestore } = require('firebase-admin/firestore');

function memoryDb() {
  const db = getFirestore(), originals = { doc: db.doc, collection: db.collection };
  const data = new Map(), reads = [];
  const snapshot = (path) => ({ id: path.split('/').at(-1), exists: data.has(path), data: () => data.get(path) });
  db.doc = (path) => ({ get: async () => { reads.push(path); return snapshot(path); }, set: async (value) => data.set(path, value) });
  db.collection = (collection) => {
    const filters = []; let max = Infinity;
    const query = {
      where(field, operator, value) { filters.push([field,operator,value]); return query; },
      limit(value) { max=value; return query; },
      async get() {
        reads.push({ collection, filters });
        const docs=[...data].filter(([path,row])=>path.startsWith(collection+'/') && path.split('/').length===2 && filters.every(([field,op,value])=>op==='array-contains' ? row[field]?.includes(value) : row[field]===value)).slice(0,max).map(([path])=>snapshot(path));
        return { docs };
      },
    };
    return query;
  };
  return { data, reads, restore: () => Object.assign(db, originals) };
}
const email='student@example.edu';
function course(id, rosterVersion=2) {
  return { rosterVersion, classIds:['A'], teacherIds:['teacher'], published:{ id, title:id, description:'', term:'115-1', classIds:['A'], units:[], sheetsUrl:'' }, draft:{ id, title:id, classIds:['A'], units:[] } };
}
const auth = (name='Google 姓名') => ({ uid:'student-uid', token:{ email, name, email_verified:true, firebase:{ sign_in_provider:'google.com' } } });

test('bootstrap 每門課只回本人名冊姓名，不會混用其他課程、停用或其他學生姓名', async () => {
  const ctx=memoryDb();
  try {
    for(const id of ['course-a','course-b','fallback','disabled']) ctx.data.set(`courses/${id}`,course(id));
    for(const [id,name,enabled] of [['course-a',' 王小明 ',true],['course-b','王同學',true],['fallback','  ',true],['disabled','停用姓名',false]]) {
      ctx.data.set(`enrollments/${id}__${email}`,{ email, courseId:id, name, enabled, classId:'A' });
    }
    ctx.data.set('enrollments/course-a__other@example.edu',{email:'other@example.edu',courseId:'course-a',name:'其他學生秘密姓名',enabled:true,classId:'A'});
    // Request data cannot select another identity or override the name.
    const result=await bootstrap.run({ auth:auth(), data:{email:'other@example.edu',studentName:'偽造姓名'} });
    assert.deepEqual(result.courses.map(c=>[c.id,c.studentName]),[['course-a','王小明'],['course-b','王同學'],['fallback','Google 姓名']]);
    assert.equal(result.profile.name,'Google 姓名');
    assert.doesNotMatch(JSON.stringify(result),/其他學生秘密姓名|停用姓名|偽造姓名|other@example/);
    assert(!ctx.reads.some(x=>typeof x==='string' && x.includes('other@example')));
    assert(ctx.reads.filter(x=>x.collection==='enrollments').every(x=>x.filters.some(f=>f[0]==='email'&&f[2]===email)));
  } finally {ctx.restore();}
});
test('bootstrap 舊 roster 姓名、Google 備援與空字串均符合規則，v2 不借用舊名冊姓名', async () => {
  const ctx=memoryDb();
  try {
    ctx.data.set('courses/legacy',course('legacy',1));
    ctx.data.set('courses/new',course('new',2));
    ctx.data.set(`roster/${email}`,{email,name:'舊名冊學生',classId:'A',enabled:true});
    ctx.data.set(`enrollments/new__${email}`,{email,courseId:'new',classId:'A',enabled:true});
    const named=await bootstrap.run({auth:auth(),data:{}});
    assert.equal(named.courses.find(c=>c.id==='legacy').studentName,'舊名冊學生');
    assert.equal(named.courses.find(c=>c.id==='new').studentName,'Google 姓名');
    ctx.data.get(`roster/${email}`).name='';
    const fallback=await bootstrap.run({auth:auth(),data:{}});
    assert(fallback.courses.every(c=>c.studentName==='Google 姓名'));
    const empty=await bootstrap.run({auth:auth(''),data:{}});
    assert(empty.courses.every(c=>c.studentName===''));
  } finally {ctx.restore();}
});
