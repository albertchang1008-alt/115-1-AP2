import { Course } from '../shared/model';
import { courseRevision, REVISION_CONFLICT } from '../shared/courseDraft';
export async function saveDraftWithRevision(api: {call<T>(name:string,data:unknown):Promise<T>}, course:Course):Promise<Course> {
  try {
    const result = await api.call<{revision:number}>('saveCourse',{course,expectedRevision:courseRevision(course)});
    return {...course,revision:result.revision};
  } catch(e) {
    const error = e as {message?:string;details?:{reason?:string}};
    if (error.details?.reason === 'REVISION_CONFLICT' || error.message?.includes(REVISION_CONFLICT)) throw Error(REVISION_CONFLICT);
    throw e;
  }
}
