export const READABILITY_CACHE_FILE: string;
export type ReadabilityPathState = string | null;
export type ReadabilityCache = {
  note?: string;
  common: string;
  commonReads?: Record<string, ReadabilityPathState>;
  materials: Record<string, { files: string; reads: Record<string, ReadabilityPathState> }>;
};
export type ReadabilityFingerprints = { common: string; materials: Record<string, string>; commonFiles?: number };
export function readabilityFingerprints(options: {
  root: string;
  slugs: string[];
  publishedVersion: (slug: string) => string;
  checkerEntry?: string;
  platformEntries?: string[];
}): Promise<ReadabilityFingerprints>;
export function pathState(root: string, rel: string): ReadabilityPathState;
export function traceReads(
  root: string,
  ignore?: (rel: string) => boolean,
): { scope(name: string): void; stop(): Record<string, string[]> };
export function readReadabilityCache(root: string): ReadabilityCache;
export function planReadability(
  cache: ReadabilityCache,
  fingerprints: ReadabilityFingerprints,
  slugs: string[],
  root: string,
): { skip: string[]; run: string[]; sameCommon: boolean };
export function nextReadabilityCache(
  cache: ReadabilityCache,
  fingerprints: ReadabilityFingerprints,
  checked: Record<string, string[]>,
  commonPaths: string[],
  root: string,
): ReadabilityCache & { commonReads: Record<string, ReadabilityPathState> };
export function writeReadabilityCache(root: string, data: ReadabilityCache): void;
