export const readabilitySlugs: string[];
export function checkReadability(options?: {
  out?: string;
  slugs?: string[];
  scales?: number[];
  sizes?: [number, number][];
  onCapture?: (page: unknown, meta: Record<string, unknown>) => unknown;
  staticCheck?: boolean;
  overlay?: boolean;
  cache?: boolean;
  record?: boolean;
}): Promise<{
  pass: boolean;
  summary: {
    materials: number;
    pass: number;
    fail: number;
    skipped: number;
    screens: number;
    issues: number;
    staticIssues: number;
    errors: number;
  };
  materials: Array<{ slug: string; skipped?: boolean; pass?: boolean; screens: number }>;
  [key: string]: unknown;
}>;
