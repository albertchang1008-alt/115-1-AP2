import {createRoot} from 'react-dom/client';
import App from '../../src/App';
import {Course,Unit,Chapter} from '../../shared/model';
import {API,memoryApi,sampleQuestions} from '../../src/service';
const chapter=(title:string):Chapter=>({title,description:'本機MCP-TEST合成教材',required:true,threshold:80,opensAt:'',dueAt:'',activities:[]});
const unit=(id:string,title:string,visibility:Unit['visibility']):Unit=>({...chapter(title),id,group:title,visibility,bankVersion:'fixture-'+id,questionCount:3});
const published:Course={id:'MCP-TEST',title:'MCP-TEST 預覽與狀態驗收',term:'115-1 本機測試',description:'合成資料，不連接正式課程',sheetsUrl:'',publishedAt:1,
 classIds:['test-a','test-b','test-c'],classNames:{'test-a':'測試甲班','test-b':'測試乙班','test-c':'測試丙班'},
 units:[unit('current','心臟基礎','current'),unit('hidden','呼吸調節','hidden'),unit('modified','腎臟構造','current'),unit('unassigned','未勾選範例','current'),unit('archived','考完可回看','archived')],
 classUnits:{'test-a':['current'],'test-b':['current','hidden','modified','archived'],'test-c':[]}};
published.units.push(...[1,2,3,4].map(i=>({...unit('mixed-'+i,'混合分類 '+i,i===4?'hidden':'current'),group:'混合範例'})));
published.classUnits!['test-b'].push(...[1,2,3,4].map(i=>'mixed-'+i));
published.chapters=Object.fromEntries(published.units.map(u=>[u.group!,chapter(u.group!)]));published.chapterOrder=published.units.map(u=>u.group!);
published.chapters['腎臟構造'].activities=[{id:'material',title:'原教材',url:'https://example.test/material',type:'link',phase:'before',description:''}];
const draft=structuredClone(published);draft.units.push(unit('new','新教材單元','hidden'));draft.chapters!['新教材單元']=chapter('新教材單元');draft.chapterOrder!.push('新教材單元');draft.classUnits!['test-b'].push('new');
draft.chapters!['腎臟構造'].activities[0].title='修訂教材';
const memory=memoryApi(published,sampleQuestions),calls:{name:string;data:any}[]=[],messages:string[]=[];
let fail=false;
const api:API={preview:true,async call<T>(name:string,data:any={}){
 if((data.courseId&&data.courseId!=='MCP-TEST')||(data.course&&data.course.id!=='MCP-TEST'))throw Error('拒絕非MCP-TEST資料');
 calls.push({name,data:structuredClone(data)});
 if(name==='getPublished'&&fail)throw Error('測試讀取失敗');
 return memory.call<T>(name,data);
}};
await api.call('saveCourse',{course:draft,expectedRevision:0});calls.length=0;
(window as any).previewStatusTest={calls,messages,failPublished:(v:boolean)=>{fail=v;},draft:()=>memory.call('bootstrap'),published:()=>memory.call('getPublished',{courseId:'MCP-TEST'})};
createRoot(document.getElementById('root')!).render(<App initialApi={api}/>);
