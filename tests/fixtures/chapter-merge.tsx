import {useState} from 'react';import {createRoot} from 'react-dom/client';import {CourseEditor} from '../../src/App';import {Course} from '../../shared/model';import {memoryApi} from '../../src/service';
const chapter=(title:string)=>({title,description:'',required:true,threshold:80,opensAt:'',dueAt:'',activities:[]});
const course:Course={id:'merge-test',title:'測試課程',description:'',term:'115-1',classIds:['A'],sheetsUrl:'',units:[{...chapter('分類'),id:'u',group:'心臟II',bankVersion:'v1'},{...chapter('其他分類'),id:'u2',group:'淋巴系統',bankVersion:'v2'}],chapters:{舊單元:{...chapter('舊單元'),activities:[{id:'a',title:'血管教材',type:'html',tracking:'interactive',phase:'before',url:'https://example.com/',description:''}]},心臟II:chapter('心臟II'),淋巴系統:chapter('淋巴系統')},chapterOrder:['舊單元','心臟II','淋巴系統']};
const original=memoryApi({...course,units:[...course.units,{...chapter('舊分類'),id:'old',group:'舊單元',bankVersion:'old-version'}]}),calls:any[]=[],messages:string[]=[];
const api={preview:true,async call(name:string,data?:any){calls.push({name,data});return original.call(name,data);}};
function App(){const[c,setCourse]=useState(course);return <CourseEditor course={c} api={api} save={async d=>{await api.call('saveCourse',{course:d});setCourse(d);}} onPublished={setCourse} onDirty={()=>{}} notify={m=>messages.push(m)} preview={()=>{}} newCourse={()=>{}} copyCourse={()=>{}} archiveCourse={async()=>{}} deleteCourse={async()=>{}} deleting={false}/>;}
(window as any).mergeTest={calls,messages,publish:()=>api.call('publishCourse',{courseId:course.id})};
await api.call('saveCourse',{course});
await api.call('setPreviewProgress',{progress:{units:{},activities:{'chapter:舊單元_a':{completed:true,position:1,updatedAt:1}}}});
createRoot(document.getElementById('root')!).render(<App/>);
