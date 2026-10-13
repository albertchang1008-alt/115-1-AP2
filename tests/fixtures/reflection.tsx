import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { CourseEditor, ReportsPage } from '../../src/App';
import Student from '../../src/Student';
import type { API } from '../../src/service';
import type { Course } from '../../shared/model';
const root = createRoot(document.getElementById('root')!);
let instance = 0;
let course: Course = (window as any).reflectionSeed,
  preview = false,
  fail = false,
  calls: any[] = [],
  progress: any = null,
  notices: string[] = [];
const api: API = {
  get preview() {
    return preview;
  },
  async call(name, data) {
    calls.push({ name, data });
    if (name === 'setPreviewProgress') return { ok: true } as any;
    if (name === 'saveReflection' && fail) throw Error('測試網路中斷');
    const r = await fetch('/api/' + name, {
      method: 'POST',
      body: JSON.stringify({
        data,
        role: ['saveCourse', 'publishCourse', 'getReflections', 'getSnapshots'].includes(name)
          ? 'teacher'
          : 'student',
      }),
    });
    const json = await r.json();
    if (!r.ok) throw Error(json.error);
    if (name === 'saveReflection') progress = json.progress;
    return json;
  },
};
function Editor() {
  const [current, setCurrent] = useState(course);
  return (
    <CourseEditor
      course={current}
      api={api}
      save={async (next) => {
        await api.call('saveCourse', { course: next });
        course = next;
        setCurrent(next);
      }}
      preview={() => {}}
      notify={(n) => notices.push(n)}
      newCourse={() => {}}
      deleteCourse={async () => {}}
      deleting={false}
      onDirty={() => {}}
      onPublished={(next) => {
        course = next;
        setCurrent(next);
      }}
      copyCourse={() => {}}
      archiveCourse={async () => {}}
    />
  );
}
(window as any).reflectionTest = {
  calls,
  notices,
  get course() {
    return course;
  },
  get progress() {
    return progress;
  },
  showCsv(rows: string[][]) {
    root.render(
      <div style={{ padding: 16, minWidth: 0 }}>
        <h1>具名 CSV 開啟檢視</h1>
        <div className="tablewrap" style={{ maxWidth: '100%' }}>
          <table>
            {rows.map((r, i) =>
              i === 0 ? (
                <thead key={i}>
                  <tr>
                    {r.map((v, j) => (
                      <th key={j}>{v}</th>
                    ))}
                  </tr>
                </thead>
              ) : (
                <tbody key={i}>
                  <tr>
                    {r.map((v, j) => (
                      <td key={j}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              ),
            )}
          </table>
        </div>
      </div>,
    );
  },
  setFail(v: boolean) {
    fail = v;
  },
  setPreview(v: boolean) {
    preview = v;
  },
  mount(view: string, next?: Course) {
    if (next) course = next;
    if (!['editor', 'results'].includes(view))
      history.replaceState(
        null,
        '',
        view === 'home'
          ? `#/course/${course.id}`
          : `#/course/${course.id}/unit/heart/activity/${course.chapters!['心臟基礎'].activities.find((a) => a.type === 'reflection')!.id}`,
      );
    instance++;
    root.render(
      <div key={instance} data-reflection-instance={instance} style={{ padding: 16, minWidth: 0 }}>
        {view === 'editor' ? (
          <Editor />
        ) : view === 'results' ? (
          <ReportsPage course={course} api={api} notify={(n) => notices.push(n)} />
        ) : (
          <Student
            course={course}
            api={api}
            uid="student-uid"
            initialUnit={view === 'home' ? undefined : 'heart'}
            initialActivity={
              view === 'home'
                ? undefined
                : course.chapters!['心臟基礎'].activities.find((a) => a.type === 'reflection')!.id
            }
            preview={preview}
            notify={(n) => notices.push(n)}
          />
        )}
      </div>,
    );
    return instance;
  },
};
(window as any).reflectionTest.mount('editor');
