import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

if (typeof globalThis !== 'undefined' && !(globalThis as any).pdfjsWorker) {
  (globalThis as any).pdfjsWorker = pdfjsWorker;
}

export interface RenderedPdfPage {
  pageNumber: number;
  width: number;
  height: number;
  imageDataUrl: string;
  extractedTitle: string;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const m = /^data:[^;,]+;base64,(.+)$/i.exec(dataUrl.trim());
  const base64 = m ? m[1] : dataUrl;
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function arrayBufferToBase64DataUrl(buffer: ArrayBuffer, mime = 'application/pdf'): string {
  const bytes = new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
  }
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export async function loadPdfDocument(source: ArrayBuffer | Uint8Array | string): Promise<any> {
  let data: Uint8Array;
  if (source instanceof Uint8Array) {
    data = new Uint8Array(source);
  } else if (source instanceof ArrayBuffer) {
    data = new Uint8Array(source.slice(0));
  } else if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      data = dataUrlToUint8Array(source);
    } else {
      const resp = await fetch(source);
      if (!resp.ok) throw new Error(`無法載入 PDF（HTTP ${resp.status}）`);
      data = new Uint8Array(await resp.arrayBuffer());
    }
  } else {
    throw new Error('不支援的 PDF 來源格式');
  }

  const loadingTask = (pdfjs as any).getDocument({
    data,
    disableFontFace: false,
    isEvalSupported: false,
  });
  return await loadingTask.promise;
}

/**
 * Render every page of a PDF file to 1920-px wide images in the browser,
 * while extracting first-line text as a fallback slide title.
 */
export async function renderPdfPagesTo1920Images(
  pdfBuffer: ArrayBuffer | Uint8Array,
  onProgress?: (current: number, total: number) => void,
): Promise<RenderedPdfPage[]> {
  const pdfDoc = await loadPdfDocument(pdfBuffer);
  const numPages = Number(pdfDoc.numPages) || 0;
  if (numPages < 1) throw new Error('PDF 檔案沒有任何頁面');

  const pages: RenderedPdfPage[] = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages);
    const page = await pdfDoc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = 1920 / Math.max(1, baseViewport.width);
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('瀏覽器不支援 Canvas 2D 繪圖');

    ctx.fillStyle = '#1E2933';
    ctx.fillRect(0, 0, 1920, 1080);

    // Center vertically if aspect ratio differs from 16:9
    const offsetY = Math.round((1080 - scaledViewport.height) / 2);
    ctx.save();
    ctx.translate(0, offsetY);
    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;
    ctx.restore();

    let extractedTitle = '';
    try {
      const textContent = await page.getTextContent();
      const firstText = (textContent?.items || [])
        .map((it: any) => String(it?.str ?? '').trim())
        .filter((s: string) => s.length >= 2)[0];
      if (firstText) extractedTitle = firstText.slice(0, 60);
    } catch {
      // Ignore text extraction errors
    }

    let imageDataUrl = canvas.toDataURL('image/webp', 0.88);
    if (!imageDataUrl.startsWith('data:image/webp')) {
      imageDataUrl = canvas.toDataURL('image/png');
    }

    pages.push({
      pageNumber: pageNum,
      width: 1920,
      height: 1080,
      imageDataUrl,
      extractedTitle: extractedTitle || `第 ${pageNum} 頁`,
    });
  }
  return pages;
}

/**
 * Vector re-render of a specific PDF page (or sub-region) at high magnification (2x–4x)
 * directly from PDF vector instructions onto the target canvas.
 */
export async function renderPdfPageVectorZoom(params: {
  pdfDoc: any;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  zoomScale: number; // e.g., 2.0 to 3.5
  region?: { x: number; y: number; w: number; h: number }; // Normalized 0..1 coordinates for Box Zoom
}): Promise<{ width: number; height: number; vectorRendered: boolean }> {
  const { pdfDoc, pageNumber, canvas, zoomScale, region } = params;
  const pageCount = Number(pdfDoc?.numPages) || 0;
  const safePage = Math.max(1, Math.min(pageCount || 1, pageNumber));
  const page = await pdfDoc.getPage(safePage);
  const baseViewport = page.getViewport({ scale: 1 });

  const clampedZoom = Math.max(1.5, Math.min(4.0, zoomScale));
  if (region && region.w > 0.02 && region.h > 0.02) {
    // Render the selected box region directly at full 1920x1080 high-DPI vector resolution
    const outW = 1920;
    const outH = 1080;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');

    ctx.fillStyle = '#1E2933';
    ctx.fillRect(0, 0, outW, outH);

    const scaleX = 1 / region.w;
    const scaleY = 1 / region.h;
    const boxZoom = Math.min(scaleX, scaleY);
    const pdfScale = (1920 / Math.max(1, baseViewport.width)) * boxZoom;
    const viewport = page.getViewport({ scale: pdfScale });

    const centerX = (region.x + region.w / 2) * 1920 * boxZoom;
    const centerY = (region.y + region.h / 2) * 1080 * boxZoom;
    const offsetX = Math.round(outW / 2 - centerX);
    const offsetY = Math.round(outH / 2 - centerY);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    await page.render({ canvasContext: ctx, viewport }).promise;
    ctx.restore();
    return { width: outW, height: outH, vectorRendered: true };
  }

  // Full page high-resolution vector render for the Magnifier lens (e.g., 3840x2160 or 5760x3240)
  const outW = Math.round(1920 * clampedZoom);
  const outH = Math.round(1080 * clampedZoom);
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.fillStyle = '#1E2933';
  ctx.fillRect(0, 0, outW, outH);

  const pdfScale = (1920 / Math.max(1, baseViewport.width)) * clampedZoom;
  const viewport = page.getViewport({ scale: pdfScale });
  const offsetY = Math.round((outH - viewport.height) / 2);

  ctx.save();
  ctx.translate(0, offsetY);
  await page.render({ canvasContext: ctx, viewport }).promise;
  ctx.restore();

  return { width: outW, height: outH, vectorRendered: true };
}
