import { Course } from '../shared/model';
import { defaultPreviewClass } from '../shared/courseStatus';
const key = (course: Course, teacher: string) => `student-preview-class:${teacher}:${course.id}`;
export function previewClassPreference(course: Course, teacher: string): string {
  try { return defaultPreviewClass(course, localStorage.getItem(key(course, teacher))); }
  catch { return defaultPreviewClass(course); }
}
export function rememberPreviewClass(course: Course, teacher: string, classId: string) {
  if (!course.classIds.includes(classId)) return;
  try { localStorage.setItem(key(course, teacher), classId); } catch { /* Storage may be disabled; preview still works. */ }
}
