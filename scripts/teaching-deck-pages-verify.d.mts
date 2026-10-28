export function verifyTeachingDeckPages(options?: {
  deckPath?: string;
  interactionsPath?: string;
  answerKeysPath?: string;
  outDir?: string;
  checkAll28SlidesImages?: boolean;
}): Promise<{
  passed: boolean;
  slideCount: number;
  verifiedSlideCount: number;
  totalVerifiedImages: number;
  cspCheck: {
    allowed: { loaded: boolean; width: number };
    blocked: { loaded: boolean; width: number };
    evilNetworkRequested: boolean;
    cspConsoleLogged: boolean;
  };
  errors: string[];
}>;
