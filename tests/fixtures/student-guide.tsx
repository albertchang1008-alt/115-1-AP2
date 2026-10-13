import React from 'react';
import { createRoot } from 'react-dom/client';
import App, { CourseEditor } from '../../src/App';
import Student, { FirstUseTips } from '../../src/Student';
import { ReflectionPage } from '../../src/ReflectionPage';
import { sampleCourse, sampleQuestions, memoryApi, sampleProgress } from '../../src/service';
import { reflectionTemplate } from '../../shared/reflection';
import { StudentInteraction } from '../../src/ClassroomInteraction';
const course = sampleCourse();
course.id = 'guide-test'; course.title = '測試班｜課序使用練習'; course.term = '測試學期'; course.studentName = '測試學生';
course.features = { assessments: true, teachingConsole: true, classroomInteraction: true };
for (const chapter of Object.values(course.chapters || {})) chapter.dueAt = '';
const base = memoryApi(course, sampleQuestions);
const api = { preview: false, async call(name: string, data: any) {
  if (name === 'getProgress') { const p = sampleProgress(course, 'partial'); p.units['heart-structure'].best = 60; return p; }
  if (name === 'getAssessments') return { assessments: [] };
  if (name === 'getReflection') return { response: null };
  if (name === 'getClassroomInteraction') return { round: null, serverNow: Date.now() };
  return base.call(name,data);
} } as any;
const root = createRoot(document.getElementById('root')!);
const notices: string[] = []; const notify = (s: string) => { notices.push(s); };
let instance = 0;
function render(view = 'home') {
  instance++;
  location.hash = ['unit','practice','material'].includes(view) ? `#/course/${course.id}/unit/${course.units[0].id}?tab=${view === 'practice' ? 'practice' : 'pre'}` : `#/course/${course.id}`;
  root.render(view === 'teacher' ? <CourseEditor course={course} api={api} save={async next => { (window as any).guideTest.saved = next; }} preview={()=>{}} notify={notify} newCourse={()=>{}} deleteCourse={async()=>{}} deleting={false} onDirty={()=>{}} onPublished={()=>{}} copyCourse={()=>{}} archiveCourse={async()=>{}} /> : view.startsWith('tips-') ? <FirstUseTips key={view} courseId={view} uid="other-test-student" /> : view === 'login' ? <App /> : view === 'reflection' ? <ReflectionPage dueAt="" course={course} chapterId="心臟基礎" activity={{url:'',id:'guide-reflect',type:'reflection',title:'測試班反思',phase:'after',description:'請用自己的話說明。',required:true,reflection:reflectionTemplate()}} api={api} uid="guide-test-student" onProgress={()=>{}} onBack={()=>render()} /> : view === 'interaction' ? <StudentInteraction api={api} course={course} /> : <Student key={instance} course={course} api={api} uid="guide-test-student" classLabel="測試班" notify={notify} initialUnit={['unit','practice','material'].includes(view) ? course.units[0].id : undefined} initialActivity={view === 'material' ? 'heart-map' : undefined} />);
}
(window as any).guideTest = { render, course, notices }; render();
