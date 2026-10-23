export interface MaterialAudit {
  slug: string;
  error?: string;
  hasScript?: boolean;
  hasComplete?: boolean;
  nodeTotal?: number | null;
  nodeConfidence?: string;
  nodeNote?: string;
  questionTotal?: number | null;
  questionIds?: string[];
}
export const ROOT: string;
export const MATERIALS_DIR: string;
export const CATALOG_PATH: string;
export const README_PATH: string;
export function auditOne(slug: string): MaterialAudit;
export function audit(): MaterialAudit[];
export function listMaterialSlugs(): string[];
export function pathToFileUrl(path: string): URL;
export function loadCatalog(): Promise<Record<string, import('../shared/materials').MaterialCatalogEntry>>;
export function renderReadmeTable(catalog: Record<string, import('../shared/materials').MaterialCatalogEntry>): string;
export function syncCatalog(): Promise<void>;
export function upsertCatalogEntry(slug: string, entry: import('../shared/materials').MaterialCatalogEntry): void;
export function removeCatalogEntry(slug: string): boolean;
