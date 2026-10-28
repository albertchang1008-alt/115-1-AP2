import {
  AnswerKeys,
  Interaction,
  SlideAnswerKeys,
  validateAnswerKeys,
  validateInteractions,
} from './classroom';

export const TRUE_FALSE_OPTIONS = ['○ 對', '✕ 錯'] as const;

export type TeachingDeckSlide = {
  id: string;
  title: string;
  html: string;
  notes: string;
  answerPage: boolean;
  pageNumber?: number;
  imageStoragePath?: string;
  imageUrl?: string;
  imageSha256?: string;
};

export type TeachingDeckSummary = {
  id: string;
  title: string;
  slideCount: number;
  interactionCount: number;
  pdfStoragePath?: string;
  updatedAt: number;
  legacy?: boolean;
};

export type TeachingDeckDoc = {
  id: string;
  title: string;
  slides: TeachingDeckSlide[];
  pdfStoragePath?: string;
  pdfSha256?: string;
  updatedAt: number;
  updatedBy?: string;
  legacy?: boolean;
};

export type RawQuestionRow = {
  rowNumber: number;
  page?: unknown;
  kind?: unknown;
  stem?: unknown;
  options?: unknown[];
  answer?: unknown;
  explanation?: unknown;
};

export type ParsedQuestionItem = {
  rowNumber: number;
  page: number;
  slideId: string;
  rawKind: '單選' | '排序' | '是非' | string;
  kind: 'choice' | 'order';
  isTrueFalse: boolean;
  stem: string;
  options: string[];
  rawAnswer: string;
  answer: string | string[];
  explanation: string;
  errors: string[];
  warnings: string[];
};

export type QuestionSheetParseResult = {
  items: ParsedQuestionItem[];
  interactions: Interaction[];
  answerKeys: AnswerKeys;
  errors: string[];
  warnings: string[];
  canImport: boolean;
};

export type DeckImportDiff = {
  isUpdate: boolean;
  slides: {
    added: string[];
    changed: string[];
    removed: string[];
    unchanged: string[];
  };
  questions: {
    added: string[];
    changed: string[];
    removed: string[];
    unchanged: string[];
  };
};

/** Generate deterministic, collision-free deckId from deck title or explicit code. */
export function normalizeDeckId(titleOrId: string): string {
  const trimmed = String(titleOrId || '').trim();
  if (!trimmed) throw Error('請輸入簡報名稱');
  if (/^[a-zA-Z0-9_-]{1,50}$/.test(trimmed)) return trimmed;
  // Convert Chinese/general title into deterministic ASCII slug + FNV-1a hash suffix
  let hash = 2166136261;
  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const ascii = trimmed
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 24);
  return ascii ? `deck-${ascii}-${hex}` : `deck-${hex}`;
}

/** Generate collision-free slideId from deckId and 1-based page number. */
export function buildDeckSlideId(deckId: string, pageNumber: number): string {
  const safeDeck = normalizeDeckId(deckId).replace(/[^a-zA-Z0-9_-]/g, '-');
  const pageStr = String(Math.max(1, Math.floor(pageNumber))).padStart(2, '0');
  return `${safeDeck}-P${pageStr}`;
}

/** Parse and validate question table rows against total PDF page count and deckId. */
export function parseQuestionTableRows(
  rows: RawQuestionRow[],
  pageCount: number,
  deckId: string,
  slideTitles?: Record<number, string>,
): QuestionSheetParseResult {
  const items: ParsedQuestionItem[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const seenPages = new Map<number, number>();

  for (const r of rows) {
    const rowNum = r.rowNumber;
    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];

    const rawPageStr = String(r.page ?? '').trim();
    const rawKindStr = String(r.kind ?? '').trim();
    const stem = String(r.stem ?? '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .trim();
    const rawAnswerStr = String(r.answer ?? '').trim();
    const explanation = String(r.explanation ?? '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .trim();
    const rawOpts = Array.isArray(r.options) ? r.options : [];

    // Skip completely empty rows
    if (
      !rawPageStr &&
      !rawKindStr &&
      !stem &&
      !rawAnswerStr &&
      !explanation &&
      rawOpts.every((o) => !String(o ?? '').trim())
    ) {
      continue;
    }

    const page = Number(rawPageStr);
    if (!rawPageStr || !Number.isInteger(page) || page < 1) {
      rowErrors.push(`第 ${rowNum} 列：頁碼「${rawPageStr || '空'}」無效，請填正整數`);
    } else if (page > pageCount) {
      rowErrors.push(`第 ${rowNum} 列（頁碼 ${page}）：頁碼超出簡報總頁數（共 ${pageCount} 頁）`);
    } else {
      const prevRow = seenPages.get(page);
      if (prevRow !== undefined) {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁）：同一頁重複出題（與第 ${prevRow} 列重複）`,
        );
      } else {
        seenPages.set(page, rowNum);
      }
    }

    if (!stem) {
      rowErrors.push(`第 ${rowNum} 列：題幹不可為空`);
    }

    const isTrueFalse =
      rawKindStr === '是非' || rawKindStr === '是非題' || rawKindStr.toLowerCase() === 'tf';
    const isChoice =
      rawKindStr === '單選' || rawKindStr === '單選題' || rawKindStr.toLowerCase() === 'choice';
    const isOrder =
      rawKindStr === '排序' || rawKindStr === '排序題' || rawKindStr.toLowerCase() === 'order';

    if (!isTrueFalse && !isChoice && !isOrder) {
      rowErrors.push(
        `第 ${rowNum} 列：題型「${rawKindStr || '空'}」無效，請填「單選」、「排序」或「是非」`,
      );
    }

    const nonEmptyOpts = rawOpts
      .map((o) => String(o ?? '').trim())
      .filter((s) => s.length > 0);

    let options: string[] = [];
    if (isTrueFalse) {
      if (nonEmptyOpts.length > 0) {
        rowWarnings.push(
          `第 ${rowNum} 列（第 ${page} 頁｜是非）：是非題選項欄建議留空，已自動忽略填寫內容並產生「○ 對／✕ 錯」`,
        );
      }
      options = [...TRUE_FALSE_OPTIONS];
    } else {
      if (nonEmptyOpts.length < 2) {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁）：選項少於 2 個（目前 ${nonEmptyOpts.length} 個）`,
        );
      } else if (nonEmptyOpts.length > 6) {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁）：選項多於 6 個（目前 ${nonEmptyOpts.length} 個）`,
        );
      }
      if (new Set(nonEmptyOpts).size !== nonEmptyOpts.length) {
        rowErrors.push(`第 ${rowNum} 列（第 ${page} 頁）：選項內容不可重複`);
      }
      options = nonEmptyOpts.slice(0, 6);
    }

    let resolvedAnswer: string | string[] = '';
    if (isTrueFalse) {
      const normAns = rawAnswerStr.toUpperCase();
      if (['對', 'O', '○', 'TRUE', 'T', '是'].includes(normAns)) {
        resolvedAnswer = TRUE_FALSE_OPTIONS[0];
      } else if (['錯', 'X', '✕', '×', 'FALSE', 'F', '否'].includes(normAns)) {
        resolvedAnswer = TRUE_FALSE_OPTIONS[1];
      } else {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁｜是非）：是非題答案「${rawAnswerStr || '空'}」無效，請填「對」或「錯」（或 O / X）`,
        );
      }
    } else if (isChoice) {
      const code = rawAnswerStr.toUpperCase();
      const idx = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(code);
      if (idx === -1) {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁｜單選）：單選答案「${rawAnswerStr || '空'}」無效，請填字母 A–F`,
        );
      } else if (idx >= options.length) {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁｜單選）：答案「${code}」超出已填選項範圍（僅有 ${options.length} 個選項）`,
        );
      } else {
        resolvedAnswer = options[idx];
      }
    } else if (isOrder) {
      const tokens = rawAnswerStr
        .toUpperCase()
        .split(/[\s,、→>-]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const validLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, options.length);
      if (
        tokens.length !== options.length ||
        new Set(tokens).size !== options.length ||
        tokens.some((t) => !validLetters.includes(t))
      ) {
        rowErrors.push(
          `第 ${rowNum} 列（第 ${page} 頁｜排序）：排序答案「${rawAnswerStr || '空'}」不完整或超出範圍，須包含 ${validLetters.join(' ')} 的完整排列`,
        );
      } else {
        resolvedAnswer = tokens.map((t) => options[validLetters.indexOf(t)]);
      }
    }

    if (explanation.length > 300) {
      rowErrors.push(
        `第 ${rowNum} 列（第 ${page} 頁）：解析長度 ${explanation.length} 字，超過 300 字上限`,
      );
    }

    const slideId = Number.isInteger(page) && page >= 1 ? buildDeckSlideId(deckId, page) : `INVALID-ROW-${rowNum}`;
    const item: ParsedQuestionItem = {
      rowNumber: rowNum,
      page: Number.isInteger(page) ? page : 0,
      slideId,
      rawKind: isTrueFalse ? '是非' : isOrder ? '排序' : isChoice ? '單選' : rawKindStr,
      kind: isOrder ? 'order' : 'choice',
      isTrueFalse,
      stem,
      options,
      rawAnswer: rawAnswerStr,
      answer: resolvedAnswer,
      explanation,
      errors: rowErrors,
      warnings: rowWarnings,
    };
    items.push(item);
    allErrors.push(...rowErrors);
    allWarnings.push(...rowWarnings);
  }

  const interactions: Interaction[] = [];
  const answerKeys: AnswerKeys = {};

  if (allErrors.length === 0) {
    for (const it of items) {
      const pageTitle = slideTitles?.[it.page] || `第 ${it.page} 頁互動（${it.rawKind}）`;
      interactions.push({
        slideId: it.slideId,
        title: pageTitle.slice(0, 200),
        fields: [
          {
            id: 'f1',
            label: it.stem,
            kind: it.kind,
            options: it.options,
          },
        ],
      });
      answerKeys[it.slideId] = {
        f1: {
          answer: it.answer,
          ...(it.explanation ? { explanation: it.explanation } : {}),
        },
      };
    }
  }

  return {
    items,
    interactions,
    answerKeys,
    errors: allErrors,
    warnings: allWarnings,
    canImport: allErrors.length === 0,
  };
}

/**
 * Merge a deck's interactions & answerKeys into course-wide classroomConfig.
 * - Preserves all interactions and answerKeys from other decks or legacy slideIds.
 * - Replaces/updates interactions belonging to `previousDeckSlideIds` or matching `deckId` prefix.
 */
export function mergeDeckClassroomConfig(params: {
  existingInteractions: Interaction[];
  existingAnswerKeys: AnswerKeys;
  deckId: string;
  previousDeckSlideIds?: string[];
  newDeckInteractions: Interaction[];
  newDeckAnswerKeys: AnswerKeys;
}): {
  interactions: Interaction[];
  answerKeys: AnswerKeys;
  removedSlideIds: string[];
} {
  const prefix = `${normalizeDeckId(params.deckId)}-P`;
  const ownedOldIds = new Set<string>(params.previousDeckSlideIds || []);
  for (const d of params.existingInteractions) {
    if (d.slideId.startsWith(prefix)) ownedOldIds.add(d.slideId);
  }
  const newBySlide = new Map(params.newDeckInteractions.map((d) => [d.slideId, d]));
  const removedSlideIds = [...ownedOldIds].filter((id) => !newBySlide.has(id));

  // Keep non-owned interactions in their original order, then append/update this deck's interactions
  const keptInteractions = params.existingInteractions.filter((d) => !ownedOldIds.has(d.slideId) && !newBySlide.has(d.slideId));
  const mergedInteractions = validateInteractions([
    ...keptInteractions,
    ...params.newDeckInteractions,
  ]);

  const rawMergedKeys: Record<string, SlideAnswerKeys> = {};
  for (const [sid, key] of Object.entries(params.existingAnswerKeys || {})) {
    if (!ownedOldIds.has(sid) && !newBySlide.has(sid)) {
      rawMergedKeys[sid] = structuredClone(key);
    }
  }
  for (const [sid, key] of Object.entries(params.newDeckAnswerKeys || {})) {
    rawMergedKeys[sid] = structuredClone(key);
  }
  const mergedAnswerKeys = validateAnswerKeys(mergedInteractions, rawMergedKeys);

  return {
    interactions: mergedInteractions,
    answerKeys: mergedAnswerKeys,
    removedSlideIds,
  };
}

/** Compute diff when re-importing the same presentation deck (added, changed, removed slides & questions). */
export function computeDeckReimportDiff(params: {
  existingDeck?: Pick<TeachingDeckDoc, 'slides'> | null;
  newSlides: TeachingDeckSlide[];
  existingInteractions?: Interaction[];
  existingAnswerKeys?: AnswerKeys;
  newInteractions: Interaction[];
  newAnswerKeys: AnswerKeys;
  deckId: string;
}): DeckImportDiff {
  const oldSlides = params.existingDeck?.slides || [];
  const isUpdate = oldSlides.length > 0;
  const oldSlideMap = new Map(oldSlides.map((s) => [s.id, s]));
  const newSlideMap = new Map(params.newSlides.map((s) => [s.id, s]));

  const slidesAdded: string[] = [];
  const slidesChanged: string[] = [];
  const slidesRemoved: string[] = [];
  const slidesUnchanged: string[] = [];

  for (const s of params.newSlides) {
    const prev = oldSlideMap.get(s.id);
    if (!prev) {
      slidesAdded.push(s.id);
    } else if (
      prev.title !== s.title ||
      prev.notes !== s.notes ||
      prev.answerPage !== s.answerPage ||
      (prev.imageSha256 && s.imageSha256 ? prev.imageSha256 !== s.imageSha256 : prev.html !== s.html)
    ) {
      slidesChanged.push(s.id);
    } else {
      slidesUnchanged.push(s.id);
    }
  }
  for (const s of oldSlides) {
    if (!newSlideMap.has(s.id)) slidesRemoved.push(s.id);
  }

  const prefix = `${normalizeDeckId(params.deckId)}-P`;
  const oldSlideIdSet = new Set(oldSlides.map((s) => s.id));
  const oldQs = (params.existingInteractions || []).filter(
    (d) => d.slideId.startsWith(prefix) || oldSlideIdSet.has(d.slideId),
  );
  const oldQMap = new Map(oldQs.map((q) => [q.slideId, q]));
  const newQMap = new Map(params.newInteractions.map((q) => [q.slideId, q]));

  const qAdded: string[] = [];
  const qChanged: string[] = [];
  const qRemoved: string[] = [];
  const qUnchanged: string[] = [];

  for (const q of params.newInteractions) {
    const prevQ = oldQMap.get(q.slideId);
    const prevKey = params.existingAnswerKeys?.[q.slideId];
    const nextKey = params.newAnswerKeys?.[q.slideId];
    if (!prevQ) {
      qAdded.push(q.slideId);
    } else if (
      JSON.stringify(prevQ.fields) !== JSON.stringify(q.fields) ||
      JSON.stringify(prevKey || {}) !== JSON.stringify(nextKey || {})
    ) {
      qChanged.push(q.slideId);
    } else {
      qUnchanged.push(q.slideId);
    }
  }
  for (const q of oldQs) {
    if (!newQMap.has(q.slideId)) qRemoved.push(q.slideId);
  }

  return {
    isUpdate,
    slides: {
      added: slidesAdded,
      changed: slidesChanged,
      removed: slidesRemoved,
      unchanged: slidesUnchanged,
    },
    questions: {
      added: qAdded,
      changed: qChanged,
      removed: qRemoved,
      unchanged: qUnchanged,
    },
  };
}

/** Split the legacy 28-page combined presentation into two separate decks: 呼吸複習 (R-REV-*) and 泌尿＋體液複習 (U-REV-*). */
export function splitLegacyCombinedDeck(legacyAsset: {
  title?: string;
  slides?: TeachingDeckSlide[];
}): {
  respiratoryDeck: TeachingDeckDoc;
  urinaryDeck: TeachingDeckDoc;
} {
  const slides = Array.isArray(legacyAsset?.slides) ? legacyAsset.slides : [];
  const respSlides = slides.filter((s) => String(s.id || '').startsWith('R-REV-'));
  const urinarySlides = slides.filter((s) => String(s.id || '').startsWith('U-REV-'));
  const now = Date.now();
  return {
    respiratoryDeck: {
      id: 'respiratory-review',
      title: '呼吸複習',
      slides: respSlides.length ? structuredClone(respSlides) : structuredClone(slides.slice(0, 14)),
      updatedAt: now,
    },
    urinaryDeck: {
      id: 'urinary-fluid-review',
      title: '泌尿＋體液複習',
      slides: urinarySlides.length
        ? structuredClone(urinarySlides)
        : structuredClone(slides.slice(14, 28)),
      updatedAt: now,
    },
  };
}

/** Build slide HTML wrapping a projected slide image URL. */
export function buildImageSlideHtml(slideId: string, title: string, imageSrc: string): string {
  const safeTitle = String(title || '').replace(/[<>&"]/g, '');
  const safeId = String(slideId || '').replace(/[<>&"]/g, '');
  const safeSrc = String(imageSrc || '').replace(/"/g, '&quot;');
  return `<section data-slide-id="${safeId}" style="width:1920px;height:1080px;margin:0;padding:0;background:#1e2933;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${safeSrc}" alt="${safeTitle}" style="width:1920px;height:1080px;object-fit:contain;display:block"></section>`;
}
