import type { MaterialContent } from '../shared/materialKit';

export const physiologySlugs: readonly string[];
export function readBuiltMaterial(root: string, slug: string): { html: string; content: MaterialContent };
