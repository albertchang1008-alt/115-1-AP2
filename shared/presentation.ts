/** Course-specific wording lives in private classroomConfig data, never in shared runtime. */
export type SlideTransform = { replaceText?: [string, string][]; firstTableHTML?: string };
export function applySlideTransform(html: string, transform?: SlideTransform) {
  for (const [before, after] of transform?.replaceText || []) html = html.split(before).join(after);
  if (transform?.firstTableHTML) html = html.replace(/<table\b[\s\S]*?<\/table>/i, () => transform.firstTableHTML!);
  return html;
}
export function classroomDeckSlides(slides: any[], config: any) {
  return slides.map(s => ({ ...s, html: applySlideTransform(s.html, config?.slideTransforms?.[s.id]), notes: (config?.interactionNotesPrefix && config?.interactions?.some((q: any) => q.slideId === s.id) ? config.interactionNotesPrefix : '') + (s.notes || '') }));
}
