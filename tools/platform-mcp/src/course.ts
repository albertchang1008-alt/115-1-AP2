import { SafeError } from './config.js';
const fields = ['id','title','description','term','classIds','classUnits','units','chapters','chapterOrder','classOverrides','chapterOverrides','publishedAt','features','staleUnits','studentNotice'];
export function courseProjection(raw: any) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.units)) throw new SafeError('INVALID_COURSE_RESPONSE');
  return Object.fromEntries(fields.filter(k => raw[k] !== undefined).map(k => [k,raw[k]]));
}
export function diffSummary(draft: unknown, published: unknown) {
  const paths: string[] = [];
  const stable = (v: any): string => JSON.stringify(v, (_k, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(k => [k,value[k]])) : value);
  function visit(a: any, b: any, path: string) {
    if (stable(a) === stable(b)) return;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const k of new Set([...Object.keys(a),...Object.keys(b)])) visit(a[k],b[k],path + '/' + k.replace(/~/g,'~0').replace(/\//g,'~1'));
    } else paths.push(path || '/');
  }
  visit(draft,published,'');
  return { changed:paths.length > 0, changedPathCount:paths.length, paths };
}
