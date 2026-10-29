import { classroomDeckSlides } from '../../shared/presentation';
import {
  buildDeckSlideId,
  buildImageSlideHtml,
  computeDeckReimportDiff,
  mergeDeckClassroomConfig,
  normalizeDeckId,
  parseQuestionTableRows,
  splitLegacyCombinedDeck,
  TeachingDeckDoc,
  TeachingDeckSlide,
} from '../../shared/pptImport';
import { validateAnswerKeys, validateInteractions, Interaction, AnswerKeys } from '../../shared/classroom';
import { featureAccess } from './features';
import { featureEnabled } from '../../shared/features';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { forClass } from '../../shared/model';
import { Firestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';

export interface StorageLike {
  bucket?: () => {
    file: (path: string) => {
      save: (data: Buffer, options?: Record<string, unknown>) => Promise<void>;
      getSignedUrl: (config: { action: 'read'; expires: number }) => Promise<[string]>;
    };
  };
}

function parseDataUrlBuffer(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const m = /^data:([^;,]+);base64,(.+)$/i.exec(String(dataUrl ?? '').trim());
  if (!m) return null;
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
}

export function isValidCourseDeckStoragePath(
  courseId: string,
  storagePath: string | undefined,
  expectedDeckId?: string,
): boolean {
  if (typeof storagePath !== 'string' || !courseId) return false;
  const trimmed = storagePath.trim();
  if (!trimmed || trimmed !== storagePath) return false;
  if (
    trimmed.includes('\\') ||
    trimmed.includes('//') ||
    trimmed.includes('?') ||
    trimmed.includes('#') ||
    trimmed.includes('%')
  ) {
    return false;
  }
  const parts = trimmed.split('/');
  if (parts.length < 5) return false;
  if (parts.some((seg) => !seg || seg === '.' || seg === '..')) return false;
  if (parts[0] !== 'courses' || parts[1] !== courseId || parts[2] !== 'teachingDecks') {
    return false;
  }
  if (expectedDeckId && parts[3] !== expectedDeckId) {
    return false;
  }
  return true;
}

function assertCourseDeckStoragePath(
  courseId: string,
  deckId: string,
  storagePath: string,
): string {
  if (!isValidCourseDeckStoragePath(courseId, storagePath, deckId)) {
    throw new HttpsError('permission-denied', 'Storage 路徑不屬於本課程簡報範圍');
  }
  return storagePath;
}

function sanitizeSlideHtml(
  slideId: string,
  html: string,
  title: string,
  imageDataUrl?: string,
): string {
  if (imageDataUrl && (!html || !html.includes('<section'))) {
    return buildImageSlideHtml(slideId, title, imageDataUrl);
  }
  const cleaned = String(html ?? '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  return cleaned || `<section><h1>${title}</h1></section>`;
}

function hasLegacyCombined28(asset: any): boolean {
  if (!asset || !Array.isArray(asset.slides)) return false;
  const hasR = asset.slides.some((s: any) => String(s?.id || '').startsWith('R-REV-'));
  const hasU = asset.slides.some((s: any) => String(s?.id || '').startsWith('U-REV-'));
  return hasR && hasU;
}

async function resolveShortLivedUrl(
  storage: StorageLike | undefined,
  courseId: string,
  storagePath: string | undefined,
  fallbackUrl: string | undefined,
  expiresAt: number,
): Promise<string | undefined> {
  if (
    storagePath &&
    isValidCourseDeckStoragePath(courseId, storagePath) &&
    storage &&
    typeof storage.bucket === 'function'
  ) {
    try {
      const [signedUrl] = await storage
        .bucket()
        .file(storagePath)
        .getSignedUrl({ action: 'read', expires: expiresAt });
      if (signedUrl) return signedUrl;
    } catch {
      // Emulator or local test environment without GCS signing key falls back to signed token / data URL
    }
  }
  if (fallbackUrl) {
    if (fallbackUrl.startsWith('data:')) return fallbackUrl;
    const sep = fallbackUrl.includes('?') ? '&' : '?';
    return `${fallbackUrl}${sep}tokenExp=${expiresAt}`;
  }
  return undefined;
}

async function setDocCompat(docRef: any, data: Record<string, unknown>, merge = false) {
  if (typeof docRef.set === 'function') {
    await docRef.set(data, merge ? { merge: true } : undefined);
  }
}

export function createTeachingHandlers(
  db: Firestore,
  access: (req: any, id: string, teacher?: boolean) => Promise<any>,
  options: any,
  storage?: StorageLike,
  now: () => number = Date.now,
) {
  const teachingAccess = featureAccess(access, 'teachingConsole');

  return {
    getTeachingDeck: onCall(options, async (req) => {
      const { c } = await teachingAccess(req, req.data.courseId, true);
      const courseId = String(req.data.courseId ?? '');
      const requestedDeckId = typeof req.data?.deckId === 'string' ? req.data.deckId.trim() : '';

      const assetSnap = await db.doc(`courses/${courseId}/teacherAssets/presentation`).get();
      const asset = assetSnap?.data?.();

      let deckDocs: Array<{ id: string; data: any }> = [];
      if (typeof (db as any).collection === 'function') {
        try {
          const snap = await (db as any).collection(`courses/${courseId}/teachingDecks`).get();
          if (snap && Array.isArray(snap.docs)) {
            deckDocs = snap.docs.map((d: any) => ({ id: d.id, data: d.data() }));
          }
        } catch {
          deckDocs = [];
        }
      }

      if (!asset && deckDocs.length === 0) {
        return { title: '', slides: [] };
      }

      const config =
        featureEnabled(c, 'classroomInteraction') || deckDocs.length > 0
          ? (await db.doc(`courses/${courseId}/classroomConfig/interactions`).get())?.data?.()
          : undefined;

      const isCombined28 = hasLegacyCombined28(asset);
      const legacySplitObj = isCombined28 ? splitLegacyCombinedDeck(asset as any) : null;
      const legacySplitList: TeachingDeckDoc[] = legacySplitObj
        ? [legacySplitObj.respiratoryDeck, legacySplitObj.urinaryDeck]
        : [];
      const expiresAt = now() + 2 * 60 * 60 * 1000; // 2 hours short-lived URL

      const deckSummaries = deckDocs
        .filter((d) => d.data && Array.isArray(d.data.slides))
        .sort(
          (a, b) =>
            (a.data.order ?? 999) - (b.data.order ?? 999) ||
            String(a.id).localeCompare(String(b.id)),
        )
        .map((d) => ({
          id: d.id,
          title: String(d.data.title || d.id),
          slideCount: d.data.slides.length,
          updatedAt: d.data.updatedAt || 0,
          hasPdf: Boolean(
            d.data.pdfStoragePath || d.data.pdfDataUrl || Number(d.data.pdfBlobChunks) > 0,
          ),
        }));

      let selectedDeck: any = null;
      let selectedDeckId = '';

      if (requestedDeckId) {
        const found = deckDocs.find((d) => d.id === requestedDeckId);
        if (found) {
          selectedDeck = found.data;
          selectedDeckId = found.id;
        } else if (legacySplitList.length > 0) {
          const splitFound = legacySplitList.find((d) => d.id === requestedDeckId);
          if (splitFound) {
            selectedDeck = splitFound;
            selectedDeckId = splitFound.id;
          }
        }
        if (!selectedDeck && requestedDeckId === 'legacy-combined' && asset) {
          selectedDeck = asset;
          selectedDeckId = 'legacy-combined';
        }
      }

      if (!selectedDeck) {
        if (asset && Array.isArray(asset.slides) && asset.slides.length > 0 && !requestedDeckId) {
          selectedDeck = asset;
          selectedDeckId = asset.deckId || (deckDocs[0]?.id ?? '');
        } else if (deckDocs.length > 0) {
          selectedDeck = deckDocs[0].data;
          selectedDeckId = deckDocs[0].id;
        } else if (asset) {
          selectedDeck = asset;
        }
      }

      const rawSlides = Array.isArray(selectedDeck?.slides) ? selectedDeck.slides : [];
      const hydratedSlides = await Promise.all(
        rawSlides.map(async (s: any) => {
          let fallbackImg = s.imageDataUrl || s.imageUrl;
          if (
            !fallbackImg &&
            (Number(s.imageBlobChunks) > 0 || s.hasImageBlob) &&
            selectedDeckId &&
            s.pageNumber
          ) {
            const chunkCount = Number(s.imageBlobChunks) || 0;
            if (chunkCount > 0) {
              const chunkSnaps = await Promise.all(
                Array.from({ length: chunkCount }, (_, idx) =>
                  db
                    .doc(
                      `courses/${courseId}/teachingDeckBlobs/${selectedDeckId}__slide__${s.pageNumber}__${idx}`,
                    )
                    .get(),
                ),
              );
              const joined = chunkSnaps
                .map((snap) => String(snap?.data?.()?.chunk || ''))
                .join('');
              if (joined) fallbackImg = joined;
            } else {
              const blobSnap = await db
                .doc(
                  `courses/${courseId}/teachingDeckBlobs/${selectedDeckId}__slide__${s.pageNumber}`,
                )
                .get();
              fallbackImg = blobSnap?.data?.()?.imageDataUrl;
            }
          }
          const imageUrl = await resolveShortLivedUrl(
            storage,
            courseId,
            s.imageStoragePath,
            fallbackImg,
            expiresAt,
          );
          const hasCustomHtml =
            s.html &&
            String(s.html).includes('<section') &&
            !s.imageStoragePath &&
            !s.hasImageBlob &&
            !(Number(s.imageBlobChunks) > 0) &&
            !s.imageDataUrl;
          const html = hasCustomHtml
            ? s.html
            : imageUrl
              ? buildImageSlideHtml(s.id, s.title || s.id, imageUrl)
              : s.html && String(s.html).includes('<section')
                ? s.html
                : `<section><h1>${s.title || s.id}</h1></section>`;
          return {
            id: s.id,
            title: s.title,
            html,
            notes: s.notes || '',
            answerPage: Boolean(s.answerPage),
            ...(s.pageNumber ? { pageNumber: s.pageNumber } : {}),
            ...(imageUrl ? { imageUrl } : {}),
          };
        }),
      );

      const transformedSlides = classroomDeckSlides(hydratedSlides, config);
      let fallbackPdf = selectedDeck?.pdfDataUrl || selectedDeck?.pdfUrl;
      if (!fallbackPdf && Number(selectedDeck?.pdfBlobChunks) > 0 && selectedDeckId) {
        const count = Number(selectedDeck.pdfBlobChunks);
        const chunkSnaps = await Promise.all(
          Array.from({ length: count }, (_, idx) =>
            db.doc(`courses/${courseId}/teachingDeckBlobs/${selectedDeckId}__pdf__${idx}`).get(),
          ),
        );
        const joined = chunkSnaps.map((snap) => String(snap?.data?.()?.chunk || '')).join('');
        if (joined) fallbackPdf = joined;
      }
      const pdfUrl = await resolveShortLivedUrl(
        storage,
        courseId,
        selectedDeck?.pdfStoragePath,
        fallbackPdf,
        expiresAt,
      );

      const response: Record<string, unknown> = {
        title: selectedDeck?.title || '',
        slides: transformedSlides,
      };
      if (selectedDeckId) response.deckId = selectedDeckId;
      if (deckSummaries.length > 0) response.decks = deckSummaries;
      if (isCombined28) response.canSplitLegacy28 = true;
      if (pdfUrl) {
        response.pdfUrl = pdfUrl;
        response.urlExpiresAt = expiresAt;
      }
      return response;
    }),

    saveTeachingDeck: onCall(options, async (req) => {
      const { p } = await teachingAccess(req, req.data.courseId, true);
      const courseId = String(req.data.courseId ?? '').trim();
      if (!courseId) throw new HttpsError('invalid-argument', '請指定課程代碼');

      if (req.data?.action === 'migrateLegacy28') {
        const assetSnap = await db.doc(`courses/${courseId}/teacherAssets/presentation`).get();
        const asset = assetSnap?.data?.();
        if (!hasLegacyCombined28(asset)) {
          throw new HttpsError(
            'failed-precondition',
            '目前簡報並非 28 頁合併版（呼吸＋泌尿），無需拆分',
          );
        }
        const splitObj = splitLegacyCombinedDeck(asset as any);
        const splitList = [splitObj.respiratoryDeck, splitObj.urinaryDeck];
        const timestamp = now();
        for (let i = 0; i < splitList.length; i++) {
          const item = splitList[i];
          await setDocCompat(
            db.doc(`courses/${courseId}/teachingDecks/${item.id}`),
            {
              deckId: item.id,
              title: item.title,
              slides: item.slides,
              order: i + 1,
              updatedAt: timestamp,
              updatedBy: p.uid || 'teacher',
            },
            false,
          );
        }
        return {
          ok: true,
          migratedDecks: splitList.map((d) => ({
            id: d.id,
            title: d.title,
            slideCount: d.slides.length,
          })),
        };
      }

      const title = String(req.data?.title ?? '').trim();
      if (!title || title.length > 120) {
        throw new HttpsError('invalid-argument', '請輸入簡報名稱（1～120 字）');
      }
      const deckId = normalizeDeckId(String(req.data?.deckId || title));
      const inputSlides = req.data?.slides;
      if (!Array.isArray(inputSlides) || inputSlides.length === 0 || inputSlides.length > 120) {
        throw new HttpsError('invalid-argument', '投影片頁數須為 1～120 頁');
      }

      const totalPages = inputSlides.length;

      let newInteractions: Interaction[] = [];
      let newAnswerKeys: AnswerKeys = {};
      let warnings: string[] = [];

      if (Array.isArray(req.data?.questionRows)) {
        const parsed = parseQuestionTableRows(req.data.questionRows, totalPages, deckId);
        if (!parsed.canImport) {
          throw new HttpsError(
            'invalid-argument',
            `題目表有誤，無法匯入：${parsed.errors.join('；')}`,
          );
        }
        newInteractions = validateInteractions(parsed.interactions);
        newAnswerKeys = validateAnswerKeys(newInteractions, parsed.answerKeys);
        warnings = parsed.warnings;
      } else if (req.data?.interactions !== undefined) {
        try {
          newInteractions = validateInteractions(req.data.interactions);
          newAnswerKeys =
            req.data.answerKeys !== undefined
              ? validateAnswerKeys(newInteractions, req.data.answerKeys)
              : {};
        } catch (e) {
          throw new HttpsError('invalid-argument', (e as Error).message);
        }
      }

      const timestamp = now();
      const isDryRun = req.data?.dryRun === true;
      const rawPdfDataUrl =
        typeof req.data?.pdfDataUrl === 'string' && req.data.pdfDataUrl.trim()
          ? req.data.pdfDataUrl.trim()
          : undefined;
      let pdfStoragePath: string | undefined;
      if (typeof req.data?.pdfStoragePath === 'string' && req.data.pdfStoragePath.trim()) {
        pdfStoragePath = assertCourseDeckStoragePath(
          courseId,
          deckId,
          req.data.pdfStoragePath.trim(),
        );
      } else if (rawPdfDataUrl) {
        pdfStoragePath = `courses/${courseId}/teachingDecks/${deckId}/source.pdf`;
      }

      let pdfSavedToStorage = false;
      if (!isDryRun && rawPdfDataUrl && storage && typeof storage.bucket === 'function' && pdfStoragePath) {
        const parsedPdf = parseDataUrlBuffer(rawPdfDataUrl);
        if (parsedPdf) {
          try {
            await storage.bucket().file(pdfStoragePath).save(parsedPdf.buffer, {
              contentType: parsedPdf.mime || 'application/pdf',
            });
            pdfSavedToStorage = true;
          } catch {
            pdfSavedToStorage = false;
          }
        }
      }

      const preparedSlides: Array<
        TeachingDeckSlide & {
          imageDataUrl?: string;
          hasImageBlob?: boolean;
          imageBlobChunks?: number;
        }
      > = await Promise.all(
        inputSlides.map(async (raw: any, idx: number) => {
          const pageNumber = Number(raw?.pageNumber) || idx + 1;
          const slideId =
            typeof raw?.id === 'string' && raw.id.trim()
              ? raw.id.trim()
              : buildDeckSlideId(deckId, pageNumber);
          const slideTitle =
            String(raw?.title ?? `第 ${pageNumber} 頁`).trim() || `第 ${pageNumber} 頁`;
          const notes = String(raw?.notes ?? '').trim();
          const answerPage = Boolean(raw?.answerPage);
          const imageDataUrl =
            typeof raw?.imageDataUrl === 'string' && raw.imageDataUrl.trim()
              ? raw.imageDataUrl.trim()
              : undefined;
          const imageSha256 = imageDataUrl
            ? createHash('sha256').update(imageDataUrl).digest('hex')
            : typeof raw?.imageSha256 === 'string' && raw.imageSha256
              ? raw.imageSha256
              : undefined;
          const imageStoragePath =
            typeof raw?.imageStoragePath === 'string' && raw.imageStoragePath.trim()
              ? assertCourseDeckStoragePath(courseId, deckId, raw.imageStoragePath.trim())
              : imageDataUrl
                ? `courses/${courseId}/teachingDecks/${deckId}/slides/page-${String(pageNumber).padStart(2, '0')}.webp`
                : undefined;

          let imageSavedToStorage = false;
          if (
            !isDryRun &&
            imageDataUrl &&
            storage &&
            typeof storage.bucket === 'function' &&
            imageStoragePath
          ) {
            const parsedImg = parseDataUrlBuffer(imageDataUrl);
            if (parsedImg) {
              try {
                await storage.bucket().file(imageStoragePath).save(parsedImg.buffer, {
                  contentType: parsedImg.mime || 'image/webp',
                });
                imageSavedToStorage = true;
              } catch {
                imageSavedToStorage = false;
              }
            }
          }

          let hasImageBlob = false;
          let imageBlobChunks = 0;
          let inlineImageDataUrl: string | undefined;
          if (imageDataUrl && !imageSavedToStorage) {
            if (!isDryRun && Buffer.byteLength(imageDataUrl) > 25_000) {
              const chunkSize = 400_000;
              const imgChunks: string[] = [];
              for (let i = 0; i < imageDataUrl.length; i += chunkSize) {
                imgChunks.push(imageDataUrl.slice(i, i + chunkSize));
              }
              await Promise.all(
                imgChunks.map((chunk, chunkIdx) =>
                  setDocCompat(
                    db.doc(
                      `courses/${courseId}/teachingDeckBlobs/${deckId}__slide__${pageNumber}__${chunkIdx}`,
                    ),
                    { chunk, updatedAt: timestamp },
                    false,
                  ),
                ),
              );
              hasImageBlob = true;
              imageBlobChunks = imgChunks.length;
            } else if (!isDryRun) {
              inlineImageDataUrl = imageDataUrl;
            }
          }

          const rawHtml = typeof raw?.html === 'string' ? raw.html : '';
          const shouldStripDataUrlHtml =
            Boolean(imageDataUrl || imageStoragePath || hasImageBlob) &&
            (!rawHtml || rawHtml.includes('data:image/'));
          const html = shouldStripDataUrlHtml
            ? buildImageSlideHtml(slideId, slideTitle, imageStoragePath || '')
            : sanitizeSlideHtml(slideId, rawHtml, slideTitle, inlineImageDataUrl);

          return {
            id: slideId,
            pageNumber,
            title: slideTitle,
            html,
            notes,
            answerPage,
            ...(imageSha256 ? { imageSha256 } : {}),
            ...(imageStoragePath ? { imageStoragePath } : {}),
            ...(inlineImageDataUrl ? { imageDataUrl: inlineImageDataUrl } : {}),
            ...(hasImageBlob ? { hasImageBlob: true } : {}),
            ...(imageBlobChunks > 0 ? { imageBlobChunks } : {}),
          };
        }),
      );

      const deckRef = db.doc(`courses/${courseId}/teachingDecks/${deckId}`);
      const interactionsRef = db.doc(`courses/${courseId}/classroomConfig/interactions`);
      const answerKeysRef = db.doc(`courses/${courseId}/classroomConfig/answerKeys`);

      const [oldDeckSnap, oldInterSnap, oldKeysSnap] = await Promise.all([
        deckRef.get(),
        interactionsRef.get(),
        answerKeysRef.get(),
      ]);

      const oldDeckData = oldDeckSnap?.data?.();
      const oldSlides: TeachingDeckSlide[] = Array.isArray(oldDeckData?.slides)
        ? oldDeckData.slides
        : [];
      const existingInteractions: Interaction[] = Array.isArray(oldInterSnap?.data?.()?.interactions)
        ? oldInterSnap.data()!.interactions
        : [];
      const rawOldKeys = oldKeysSnap?.data?.();
      const existingAnswerKeys: AnswerKeys =
        rawOldKeys?.answerKeys && typeof rawOldKeys.answerKeys === 'object'
          ? rawOldKeys.answerKeys
          : rawOldKeys && typeof rawOldKeys === 'object'
            ? (Object.fromEntries(
                Object.entries(rawOldKeys).filter(([k]) => k !== 'updatedAt' && k !== 'updatedBy'),
              ) as AnswerKeys)
            : {};

      const diff = computeDeckReimportDiff({
        deckId,
        existingDeck: oldSlides.length ? { slides: oldSlides } : null,
        newSlides: preparedSlides,
        existingInteractions,
        existingAnswerKeys,
        newInteractions,
        newAnswerKeys,
      });

      if (isDryRun) {
        return {
          ok: true,
          dryRun: true,
          deckId,
          title,
          slideCount: preparedSlides.length,
          questionCount: newInteractions.length,
          warnings,
          diff,
        };
      }

      const merged = mergeDeckClassroomConfig({
        deckId,
        previousDeckSlideIds: oldSlides.map((s) => String(s.id)),
        existingInteractions,
        existingAnswerKeys,
        newDeckInteractions: newInteractions,
        newDeckAnswerKeys: newAnswerKeys,
      });

      let inlinePdfDataUrl: string | undefined;
      let pdfBlobChunks = 0;
      if (rawPdfDataUrl && !pdfSavedToStorage) {
        if (Buffer.byteLength(rawPdfDataUrl) <= 200_000) {
          inlinePdfDataUrl = rawPdfDataUrl;
        } else {
          const chunkSize = 400_000;
          const chunks: string[] = [];
          for (let i = 0; i < rawPdfDataUrl.length; i += chunkSize) {
            chunks.push(rawPdfDataUrl.slice(i, i + chunkSize));
          }
          await Promise.all(
            chunks.map((chunk, idx) =>
              setDocCompat(
                db.doc(`courses/${courseId}/teachingDeckBlobs/${deckId}__pdf__${idx}`),
                { chunk, updatedAt: timestamp },
                false,
              ),
            ),
          );
          pdfBlobChunks = chunks.length;
        }
      }

      const effectivePdfStoragePath =
        pdfStoragePath ||
        (oldDeckData?.pdfStoragePath &&
        isValidCourseDeckStoragePath(courseId, oldDeckData.pdfStoragePath, deckId)
          ? oldDeckData.pdfStoragePath
          : undefined);

      const deckPayload: Record<string, unknown> = {
        deckId,
        title,
        slides: preparedSlides,
        updatedAt: timestamp,
        updatedBy: p.uid || 'teacher',
        ...(effectivePdfStoragePath ? { pdfStoragePath: effectivePdfStoragePath } : {}),
        ...(inlinePdfDataUrl ? { pdfDataUrl: inlinePdfDataUrl } : {}),
        ...(pdfBlobChunks > 0 ? { pdfBlobChunks } : {}),
      };

      await setDocCompat(deckRef, deckPayload, false);
      await setDocCompat(interactionsRef, { interactions: merged.interactions }, true);
      await setDocCompat(answerKeysRef, { answerKeys: merged.answerKeys }, false);

      const assetRef = db.doc(`courses/${courseId}/teacherAssets/presentation`);
      const assetSnap = await assetRef.get();
      if (!assetSnap?.data?.()) {
        await setDocCompat(
          assetRef,
          {
            deckId,
            title,
            slides: preparedSlides.map(({ imageDataUrl: _img, ...rest }) => rest),
            updatedAt: timestamp,
          },
          false,
        );
      }

      return {
        ok: true,
        deckId,
        title,
        slideCount: preparedSlides.length,
        questionCount: newInteractions.length,
        warnings,
        diff,
        interactions: merged.interactions,
        answerKeys: merged.answerKeys,
      };
    }),

    getClassroomCourse: onCall(options, async (req) => {
      const { p, c } = await access(req, req.data.courseId);
      if (!featureEnabled(c, 'teachingConsole') && !featureEnabled(c, 'classroomInteraction'))
        throw new HttpsError('permission-denied', '此課程尚未開放此功能');
      if (p.teacher) throw new HttpsError('permission-denied', '此入口供學生更新課堂進度');
      return {
        ...forClass(c.published, p.classId),
        features: c.features || {},
        id: req.data.courseId,
        enrollmentClassId: p.classId,
        studentName: p.name || '',
      };
    }),
  };
}
