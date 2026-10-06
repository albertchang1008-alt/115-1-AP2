import { createRoot } from 'react-dom/client';
import { Flashcards, UnitWrongPractice } from '../../src/PracticeModes';
import { applyAttempt, effectiveWrong, updateWrong, Course, Progress, Question, Attempt } from '../../shared/model';
import { API } from '../../src/service';
const q = (id:string):Question => ({id,text:`練習題 ${id}`,options:[{id:'a',text:'正確選項'},{id:'b',text:'另一選項'}],answer:'a',explanation:'解說',socratic:{keyword:'關鍵字',trace:'學生不應看到的教師內容'}});
const unit = {id:'u',title:'血液分類',group:'血液',description:'',required:true,threshold:80,opensAt:'',dueAt:'',bankVersion:'v',questionCount:37,activities:[]};
const course:Course={id:'practice-test',title:'測試課程',description:'',term:'115-1',classIds:[],sheetsUrl:'',units:[unit]};
const qs=Array.from({length:37},(_,i)=>q('q'+i)), calls:any[]=[];
let progress:Progress;
const api:API={preview:true,async call(name,data:any){
  calls.push({name,data});
  if(name==='getBank') return {questions:qs} as any;
  if(name==='submitAttempt') {
    const a:Attempt={...data.attempt,receivedAt:Date.now(),answers:data.attempt.answers.map((r:any)=>({...r,correct:r.selected==='a'}))};
    const wrongSummary=updateWrong(effectiveWrong(progress.units[a.unitId],unit,a.version),a.answers,a.receivedAt!).summary;
    progress=applyAttempt(progress,a,unit); return {progress,attempt:a,wrongSummary} as any;
  }
  throw Error(name);
}};
const root=createRoot(document.getElementById('root')!);
let key=0;
(window as any).practiceTest={calls,course,qs,
  mount(kind:string){calls.length=0;
    const at=kind==='today'?Date.now():Date.now()-86400000;
    progress={units:{u:{best:80,attempts:1,updatedAt:at,wrong:{v:Object.fromEntries(qs.map((q,i)=>[q.id,{n:37-i,at}]))}}},activities:{}};
    const back=()=>root.render(<p>已返回</p>);
    root.render(kind==='flash'?<Flashcards key={++key} rows={qs.slice(0,2).map(q=>({q,unit}))} onBack={back} onPractice={back} />:<UnitWrongPractice key={++key} api={api} course={course} unit={kind==='exam'?{...unit,review:{sourceUnitIds:[],sourceVersions:{},drawCount:1,allocation:{},builtAt:1,history:[]}}:unit} progress={progress} onBack={back} onProgress={p=>{progress=p;}}/>);
  }
};
