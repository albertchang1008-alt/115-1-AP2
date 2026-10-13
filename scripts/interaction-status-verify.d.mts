export function verifyInteractionStatus(screenshots?: boolean): Promise<Array<{
  width: number;
  fontScale: number;
  allSlides: number;
  errors: string[];
  passed: boolean;
}>>;
