export function verifyCompletionBoard(
  screenshots?: boolean,
): Promise<
  Array<{
    width: number;
    rows: number;
    weightedRate: string;
    classRateConsistent: boolean;
    studentTotalsConsistent: boolean;
    cache: boolean;
    filteredCsv: boolean;
    studentDetail: boolean;
    overdueFilter: number;
    errors: string[];
  }>
>;
