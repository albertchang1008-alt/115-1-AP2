export function createSyntheticPdfBuffer(slideTexts: string[]): Buffer;
export function createSyntheticPptxNotesBuffer(notes: Record<number, string>): Promise<Buffer>;
export function verifyPptImport1120(options?: { outDir?: string }): Promise<{
  passed: boolean;
  screenshots: string[];
}>;
