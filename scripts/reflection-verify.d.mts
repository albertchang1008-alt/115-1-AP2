export function verifyReflection(screenshots?: boolean): Promise<Array<{
  width: number;
  passed: boolean;
  callables: string[];
  screenshots: number;
}>>;
