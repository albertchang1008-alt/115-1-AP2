import { completionRef, completionStamp } from './statsAggregation';
import { Firestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import { applyDraftOps, operationSummary, courseRevision, projectCourse, type DraftOp } from '../../shared/courseDraft';
import { Course, forClass, completion, orderedChapters, chapterCompletion } from '../../shared/model';
const fingerprint = (v: unknown) => createHash('sha256').update(JSON.stringify(v,(_key,x)=>x && typeof x==='object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])) : x)).digest('hex');
export function createPlatformHandlers(
  db: Firestore, identity: (req:any)=>Promise<any>, access:(req:any,id:string,teacher?:boolean)=>Promise<any>,
  rosterQuery:(id:string,c:any)=>any, validate:(course:Course)=>void,
  checkRevision:(current:number,expected:unknown,optional?:boolean)=>void, options:any,
) {
  return {
    listManagedCourses:onCall(options,async req => {
      const p = await identity(req);
      if (!p.teacher) throw new HttpsError('permission-denied','需要教師權限');
      const list = await db.collection('courses').where('teacherIds','array-contains',p.uid).limit(501).get();
      if (list.size > 500) throw new HttpsError('resource-exhausted','課程過多，未回傳不完整清單');
      return {courses:list.docs.map(d => {
        const c = d.data();
        return {courseId:d.id,title:c.draft?.title || c.published?.title || '',term:c.draft?.term || c.published?.term || '',hasDraft:!!c.draft,hasPublished:!!c.published,revision:courseRevision(c)};
      })};
    }),
    getCourseDraft:onCall(options,async req => {
      const {c} = await access(req,req.data.courseId,true);
      if (!c.draft) throw new HttpsError('not-found','草稿不存在');
      return {course:projectCourse({...c.draft,features:c.features || c.draft.features || {}}),revision:courseRevision(c)};
    }),
    getCompletionSummary:onCall(options,async req => {
      const {c} = await access(req,req.data.courseId,true);
      const classId = req.data.classId;
      if (!c.published || typeof classId !== 'string' || !c.published.classIds.includes(classId)) throw new HttpsError('failed-precondition','班級不存在或課程未發布');
      const cached=(await completionRef(db,req.data.courseId,classId).get()).data();
      if(cached?.schema===1&&cached.stamp===completionStamp(c))return {...cached.summary,updatedAt:cached.updatedAt,source:'completionDaily',stale:Date.now()-cached.updatedAt>86400000};
      const roster = await rosterQuery(req.data.courseId,c).where('classId','==',classId).limit(5001).get();
      if (roster.size > 5000) throw new HttpsError('resource-exhausted','班級過大，未回傳不完整統計');
      const course = forClass(c.published,classId);
      const enabled = roster.docs.map((d:any) => d.data()).filter((r:any) => r.enabled === true);
      const byEmail = new Map<string,string>();
      for (let i=0;i<enabled.length;i+=30) {
        const profiles = await db.collection('profiles').where('email','in',enabled.slice(i,i+30).map((r:any)=>r.email)).get();
        profiles.docs.forEach(d => byEmail.set(d.data().email,d.id));
      }
      const chapters = orderedChapters(course).map(({name})=>({chapterId:name,completed:0,opportunities:0}));
      let completedStudents=0,completedRequiredChapters=0,requiredChapterOpportunities=0;
      for (const row of enabled) {
        const uid = byEmail.get(row.email);
        const progress = uid ? (await db.doc(`courses/${req.data.courseId}/progress/${uid}`).get()).data() || {units:{},activities:{}} : {units:{},activities:{}};
        const count = completion(course,progress as any);
        completedRequiredChapters += count.done; requiredChapterOpportunities += count.total;
        if (count.total > 0 && count.done === count.total) completedStudents++;
        for (const chapter of chapters) {
          const state = chapterCompletion(course,chapter.chapterId,progress as any);
          if (state.eligible) {chapter.opportunities++;if (state.done) chapter.completed++;}
        }
      }
      return {students:roster.size,enabledStudents:enabled.length,completedStudents,completedRequiredChapters,requiredChapterOpportunities,chapters};
    }),
    patchCourseDraft:onCall(options,async req => {
      const p = await identity(req);
      if (!p.teacher) throw new HttpsError('permission-denied','需要教師權限');
      const {courseId,expectedRevision,ops,requestId} = req.data || {};
      if (typeof courseId !== 'string' || !/^[-a-zA-Z0-9_\u3400-\u4dbf\u4e00-\u9fff]{1,50}$/.test(courseId) ||
          typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
          Buffer.byteLength(JSON.stringify(req.data)) > 300000) throw new HttpsError('invalid-argument','課程／requestId／資料大小無效');
      const root = db.doc(`courses/${courseId}`), replay = root.collection('patchRequests').doc(fingerprint(requestId));
      const audit = root.collection('auditLog').doc();
      const payloadHash = fingerprint({courseId,expectedRevision,ops});
      return db.runTransaction(async tx => {
        const [current,prior] = await Promise.all([tx.get(root),tx.get(replay)]);
        const c = current.data();
        if (!c?.teacherIds?.includes(p.uid)) throw new HttpsError('permission-denied','未獲授權管理此課程');
        if (prior.exists) {
          const previous = prior.data()!;
          if (previous.actorUid !== p.uid || previous.payloadHash !== payloadHash) throw new HttpsError('failed-precondition','requestId已用於其他請求');
          return {...previous.result,duplicate:true};
        }
        const before = courseRevision(c);
        checkRevision(before,expectedRevision);
        let draft: Course;
        try { draft = applyDraftOps(c.draft,ops); validate(draft); }
        catch (e) { if (e instanceof HttpsError) throw e; throw new HttpsError('invalid-argument',(e as Error).message); }
        const revision = before+1;
        const summary = operationSummary(ops as DraftOp[]);
        const result = {ok:true,revision,duplicate:false,summary};
        tx.update(root,{draft,revision,updatedAt:Date.now()});
        tx.create(audit,{at:Date.now(),actorUid:p.uid,source:'platform-mcp',requestId,fromRevision:before,toRevision:revision,summary,diff:{beforeHash:fingerprint(c.draft),afterHash:fingerprint(draft),operations:summary.length}});
        tx.create(replay,{actorUid:p.uid,payloadHash,result});
        return result;
      });
    }),
  };
}
