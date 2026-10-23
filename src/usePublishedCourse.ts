import { useEffect, useState } from 'react';
import { Course } from '../shared/model';
import { studentUpdateCopy } from '../shared/courseStatus';
import { API } from './service';
export async function readPublishedCourse(api: API, courseId: string): Promise<Course | undefined> {
  try { return await api.call<Course>('getPublished', { courseId }); }
  catch (e) {
    if ((e as Error).message.includes('尚未發布課程')) return undefined;
    throw e;
  }
}
export function usePublishedCourse(api: API, course: Course) {
  const [state, setState] = useState<{ id: string; published?: Course; error?: string }>({ id: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ id: '' });
    readPublishedCourse(api, course.id).then(published => { if (active) setState({ id: course.id, published }); })
      .catch(e => { if (active) setState({ id: course.id, error: studentUpdateCopy((e as Error).message) }); });
    return () => { active = false; };
  }, [api, course, retry]);
  return { published: state.id === course.id ? state.published : undefined, loading: state.id !== course.id, error: state.error,
    reload: () => setRetry(n => n + 1) };
}
