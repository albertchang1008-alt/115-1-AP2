export function readabilityMetrics(options?: { scale?: number }): {
  issues: { type: string; selector: string; text: string; actual: any; minimum: any }[];
  texts: any[];
  controls: any[];
  minPx: number | null;
  scale: number;
  width: number;
  height: number;
  rasterImages: any[];
};
