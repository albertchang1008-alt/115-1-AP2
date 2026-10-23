export const approvedUrinarySlugs: string[];
export interface ApprovedUrinaryDocument {
  html: string;
  ids: string[];
  assessmentIds: string[];
  nodes: string[];
  sha: string;
  version: string;
  label: string;
}
export function approvedUrinaryDocument(slug: string): ApprovedUrinaryDocument;
export function buildApprovedUrinary(slug: string, options?: {preview?: boolean}): Promise<void>;
