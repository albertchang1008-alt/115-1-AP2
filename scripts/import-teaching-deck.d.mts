export function validateTeachingDeckPayload(deck: unknown): {
  title: string;
  slides: Array<{
    id: string;
    title: string;
    html: string;
    notes: string;
    answerPage: boolean;
  }>;
  bytes: number;
  sha256: string;
};
export function diffTeachingDeck(existing: unknown, next: unknown): {
  existingExists: boolean;
  existingTitle: string | null;
  existingSlideCount: number;
  existingBytes: number;
  newTitle: string;
  newSlideCount: number;
  newBytes: number;
  newSha256: string;
  addedSlideIds: string[];
  removedSlideIds: string[];
  changedSlideIds: string[];
  unchangedSlideIds: string[];
};
