export function verifyUpdateBanner(
  out?: string,
): Promise<{
  pass: boolean;
  current: string;
  next: string;
  checks: string[];
  errors: string[];
  versionRequests: number;
  documents: number;
  autoReload: boolean;
}>;
