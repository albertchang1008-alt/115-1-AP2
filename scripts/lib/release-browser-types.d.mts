export interface ReleaseCheckOptions {
 html: string;
 out: string;
 sizes: number[][];
 shots: boolean;
 file?: string;
}
export interface ReleaseCheckSummary {cases:number;pass:number;fail:number;skipped:number}
export interface ReleaseCheckResult {
 summary: ReleaseCheckSummary;
 diff?: {pass: boolean};
}
