declare const __SITE_ID__: string | undefined;
export type SiteId = 'ap2' | 'mi';
export function siteId(value = typeof __SITE_ID__ !== 'undefined' ? __SITE_ID__ : typeof process !== 'undefined' ? process.env.VITE_SITE_ID || 'ap2' : 'ap2'): SiteId {
  if (value !== 'ap2' && value !== 'mi') throw Error('VITE_SITE_ID 必須為 ap2 或 mi');
  return value;
}
export const sites = {
  ap2: { title: '115-1 AP2 課序', url: 'https://albertchang1008-alt.github.io/115-1-AP2/', materials: 'https://albertchang1008-alt.github.io/115-1-AP2/materials/', legacyCHP: false },
  mi: { title: '115-MI 課序', url: 'https://albertchang1008-alt.github.io/115-MI/', materials: 'https://albertchang1008-alt.github.io/115-MI/materials/', legacyCHP: true },
};
export const SITE = sites[siteId()];
export const miMaterialSlugs = ['micro-bacteria-review-v1', 'immuno-concepts-review-v1'];
