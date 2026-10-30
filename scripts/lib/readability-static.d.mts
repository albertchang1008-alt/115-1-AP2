export function auditReadabilityCss(
  root: string,
  allowlist?: any[],
): { files: string[]; issues: any[]; allowed: any[]; pass: boolean; warnings: string[] };
