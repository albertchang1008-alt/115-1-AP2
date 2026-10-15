import { Course, safeId, safeCode, chaptersOf, youtubeId, materialUrl as validMaterialUrl } from './model';
import { featureNames } from './features';
import { validateReflectionConfig } from './reflection';
function fail(message: string): never { throw Error(message); }
function code(v: unknown) { if (typeof v !== 'string' || !safeCode(v)) fail('識別碼格式錯誤'); return v as string; }
function id(v: unknown) { if (typeof v !== 'string' || !safeId(v)) fail('識別碼格式錯誤'); return v as string; }
function visibility(v: unknown) { if (!['hidden','current','archived'].includes(String(v))) fail('區域設定無效'); }
function cleanLabel(v: unknown) { if (String(v ?? '').trim().length > 30) fail('標籤過長'); }
export function validateCourseDraft(course: Course) {
  if (!course || typeof course !== 'object') fail('課程格式無效');
  code(course.id);
  if (course.features && (Object.keys(course.features).some(k => !featureNames.includes(k as any)) || Object.values(course.features).some(v => typeof v !== 'boolean'))) fail('功能開關設定無效');
  if (course.assessmentSources && ['pretest', 'posttest'].some(k => { const ids = (course.assessmentSources as any)[k]; return !Array.isArray(ids) || ids.length > 100 || ids.some((id: unknown) => typeof id !== 'string' || !safeId(id)) || new Set(ids).size !== ids.length; })) fail('前後測來源設定無效');
  if (!course.title?.trim() || !course.term || !Array.isArray(course.classIds) || !Array.isArray(course.units) || course.units.length > 50 || course.classIds.length > 50)
    fail('請填寫課程與學期，最多 50 班、50 單元');
  if (new Set(course.classIds).size !== course.classIds.length) fail('班級代碼重複');
  course.classIds.forEach((cl) => code(cl));
  for (const [cl, units] of Object.entries(course.classUnits || {}))
    if (!course.classIds.includes(cl) || !Array.isArray(units) || new Set(units).size !== units.length || units.some((u) => !course.units.some((unit) => unit.id === u))) fail('班級適用單元設定無效');
  const unitIds = new Set();
  for (const u of course.units) {
    code(u.id);
    if (unitIds.has(u.id)) fail('單元 ID 重複');
    unitIds.add(u.id);
    if (
      !u.title ||
      u.threshold < 0 ||
      u.threshold > 100 ||
      !Number.isFinite(u.threshold) ||
      u.activities.length > 30
    )
      fail('單元設定無效');
    if (u.research && typeof u.research.enabled !== 'boolean') fail('研究資料設定無效');
    if (u.visibility !== undefined) visibility(u.visibility);
    if (u.archiveLabel !== undefined) cleanLabel(u.archiveLabel);
    if (u.visibility === 'archived' && u.archivedAt !== undefined && (!Number.isFinite(u.archivedAt) || u.archivedAt < 0)) fail('封存時間無效');
    if (u.review) {
      const r = u.review;
      if (!Array.isArray(r.sourceUnitIds) || !r.sourceUnitIds.length || !r.sourceUnitIds.every(safeCode) || new Set(r.sourceUnitIds).size !== r.sourceUnitIds.length || !Number.isInteger(r.drawCount) || r.drawCount < r.sourceUnitIds.length || !r.allocation || Object.values(r.allocation).some((n) => !Number.isInteger(n) || n < 1) || Object.values(r.allocation).reduce((sum, n) => sum + n, 0) !== r.drawCount || !Array.isArray(r.history)) fail('複習考設定無效');
    }
    const activityIds = new Set();
    for (const a of u.activities) {
      if (typeof a.title !== 'string' || !a.title.trim() || typeof a.description !== 'string' || typeof a.url !== 'string') fail('活動設定無效');
      id(a.id);
      if (activityIds.has(a.id)) fail('活動 ID 重複');
      activityIds.add(a.id);
      if (
        !['before', 'during', 'after'].includes(a.phase) ||
        !['html', 'youtube', 'link', 'quiz', 'reflection'].includes(a.type)
      )
        fail('活動類型錯誤');
      if (
        a.type === 'youtube' &&
        (!youtubeId(a.url) ||
          !Number.isFinite(a.start || 0) ||
          (a.start || 0) < 0 ||
          (a.end !== undefined && (!Number.isFinite(a.end) || a.end <= (a.start || 0))))
      )
        fail('YouTube 連結或片段時間無效');
      if (a.type === 'reflection') { try { a.reflection = validateReflectionConfig(a.reflection); delete a.tracking; } catch (e) { fail((e as Error).message); } }
      if (a.tracking && !['reading', 'interactive'].includes(a.tracking)) fail('教材紀錄方式無效');
      if (a.required !== undefined && typeof a.required !== 'boolean') fail('活動必做設定無效');
      if (a.materialVersion) id(a.materialVersion);
      for (const total of [a.nodeTotal, a.questionTotal]) if (total !== undefined && (!Number.isInteger(total) || total < 0 || total > 500)) fail('診斷節點與題目總數需為 0–500');
      if (a.type === 'html' && a.url && !validMaterialUrl(a.url))
        fail('教材網址需使用有效 HTTPS 網址');
      if (a.type === 'link' && !/^https:\/\//.test(a.url)) fail('教材連結需使用 HTTPS');
    }
  }
  if (course.chapters !== undefined && (!course.chapters || Array.isArray(course.chapters) || typeof course.chapters !== 'object')) fail('單元設定無效');
  const chapters = chaptersOf(course);
  for (const [name, chapter] of Object.entries(chapters)) {
    if (!name.trim() || !chapter.title?.trim() || !Number.isFinite(chapter.threshold) || chapter.threshold < 0 || chapter.threshold > 100 || !Array.isArray(chapter.activities) || chapter.activities.length > 30) fail('單元設定無效');
    if (chapter.research && typeof chapter.research.enabled !== 'boolean') fail('研究資料設定無效');
    if (typeof chapter.required !== 'boolean' || typeof chapter.description !== 'string' || typeof chapter.opensAt !== 'string' || typeof chapter.dueAt !== 'string') fail('單元設定無效');
    const activityIds = new Set<string>();
    for (const a of chapter.activities) {
      if (typeof a.title !== 'string' || !a.title.trim() || typeof a.description !== 'string' || typeof a.url !== 'string') fail('活動設定無效');
      id(a.id);
      if (activityIds.has(a.id)) fail('活動 ID 重複');
      activityIds.add(a.id);
      if (!a.title?.trim() || !['before', 'during', 'after'].includes(a.phase) || !['html', 'youtube', 'link', 'quiz', 'reflection'].includes(a.type)) fail('活動類型錯誤');
      if (a.type === 'youtube' && (!youtubeId(a.url) || !Number.isFinite(a.start || 0) || (a.start || 0) < 0 || (a.end !== undefined && (!Number.isFinite(a.end) || a.end <= (a.start || 0))))) fail('YouTube 連結或片段時間無效');
      if (a.type === 'reflection') { try { a.reflection = validateReflectionConfig(a.reflection); delete a.tracking; } catch (e) { fail((e as Error).message); } }
      if (a.tracking && !['reading', 'interactive'].includes(a.tracking)) fail('教材紀錄方式無效');
      if (a.required !== undefined && typeof a.required !== 'boolean') fail('活動必做設定無效');
      if (a.materialVersion) id(a.materialVersion);
      for (const total of [a.nodeTotal, a.questionTotal]) if (total !== undefined && (!Number.isInteger(total) || total < 0 || total > 500)) fail('診斷節點與題目總數需為 0–500');
      if (a.type === 'html' && a.url && !validMaterialUrl(a.url)) fail('教材網址需使用有效 HTTPS 網址');
      if (a.type === 'link' && !/^https:\/\//.test(a.url)) fail('教材連結需使用 HTTPS');
    }
  }
  if (course.chapterOrder !== undefined && (!Array.isArray(course.chapterOrder) || course.chapterOrder.some((name) => typeof name !== 'string' || !chapters[name]) || new Set(course.chapterOrder).size !== course.chapterOrder.length)) fail('單元順序設定無效');
  for (const [cl, overrides] of Object.entries(course.chapterOverrides || {})) {
    if (!course.classIds.includes(cl) || !overrides || Array.isArray(overrides) || typeof overrides !== 'object') fail('班級單元設定無效');
    for (const [name, settings] of Object.entries(overrides)) {
      if (!chapters[name] || !settings || Array.isArray(settings) || Object.keys(settings).some((k) => !['threshold', 'required', 'opensAt', 'dueAt'].includes(k))) fail('班級單元設定無效');
      if (settings.threshold !== undefined && (!Number.isFinite(settings.threshold) || settings.threshold < 0 || settings.threshold > 100)) fail('班級達標門檻無效');
      if (settings.required !== undefined && typeof settings.required !== 'boolean') fail('班級必做設定無效');
      if (settings.opensAt !== undefined && typeof settings.opensAt !== 'string') fail('班級開放時間無效');
      if (settings.dueAt !== undefined && typeof settings.dueAt !== 'string') fail('班級期限無效');
    }
  }
  for (const cl of Object.keys(course.classOverrides || {})) {
    if (!course.classIds.includes(cl)) fail('班級設定不屬於課程');
    for (const [unitId, settings] of Object.entries(course.classOverrides![cl])) {
      if (
        !course.units.some((u) => u.id === unitId) ||
        Object.keys(settings).some(
          (k) => !['threshold', 'required', 'opensAt', 'dueAt'].includes(k),
        )
      )
        fail('班級單元設定無效');
      if (
        settings.threshold !== undefined &&
        (!Number.isFinite(settings.threshold) || settings.threshold < 0 || settings.threshold > 100)
      )
        fail('班級達標門檻無效');
    }
  }
}
