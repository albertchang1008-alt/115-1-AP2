import { useEffect, useRef, useState } from 'react';
import { loadPdfDocument, renderPdfPageVectorZoom } from './pdfVectorRenderer';

export type PointerToolMode = 'none' | 'magnifier' | 'spotlight' | 'laser' | 'zoombox';

export interface BoxRegion {
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
}

export function shouldYieldPointerShortcut(e: {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  key?: string;
  target?: EventTarget | null;
}): boolean {
  if (e.altKey || e.ctrlKey || e.metaKey) return true;
  const el = e.target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;
  if (el.closest('input, textarea, select, [contenteditable="true"], .ppt-import-modal')) {
    return true;
  }
  if (el.closest('button') && !el.closest('.pointer-toolbar') && e.key !== 'Escape') {
    return true;
  }
  return false;
}

export function nextPointerToolOnKey(
  currentTool: PointerToolMode,
  activeBox: BoxRegion | null,
  key: string,
): { tool: PointerToolMode; clearBox: boolean; handled: boolean } {
  if (key === 'Escape') {
    if (activeBox) {
      return { tool: currentTool, clearBox: true, handled: true };
    }
    if (currentTool !== 'none') {
      return { tool: 'none', clearBox: true, handled: true };
    }
    return { tool: 'none', clearBox: false, handled: false };
  }
  const lower = key.toLowerCase();
  const map: Record<string, PointerToolMode> = {
    m: 'magnifier',
    s: 'spotlight',
    l: 'laser',
    z: 'zoombox',
  };
  const target = map[lower];
  if (!target) return { tool: currentTool, clearBox: false, handled: false };
  if (currentTool === target) {
    return { tool: 'none', clearBox: true, handled: true };
  }
  return { tool: target, clearBox: true, handled: true };
}

export function SlidePointerOverlay({
  tool,
  onToolChange,
  pdfUrl,
  pageNumber,
  slideHtmlSrcDoc,
  canvasWidth,
}: {
  tool: PointerToolMode;
  onToolChange: (next: PointerToolMode) => void;
  pdfUrl?: string;
  pageNumber: number;
  slideHtmlSrcDoc: string;
  canvasWidth: number;
}) {
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [magnifierZoom, setMagnifierZoom] = useState<number>(2.5); // 2.0x - 3.0x
  const [spotlightRadius, setSpotlightRadius] = useState<number>(180); // px in 1920x1080 space
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [zoomedBox, setZoomedBox] = useState<BoxRegion | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [vectorDataUrl, setVectorDataUrl] = useState<string>('');
  const [vectorZoomedBoxUrl, setVectorZoomedBoxUrl] = useState<string>('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const highResCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number; y: number } | null>(null);

  // Reset zoomed box when slide page or tool changes
  useEffect(() => {
    setZoomedBox(null);
    setDragStart(null);
    setDragCurrent(null);
    dragStartRef.current = null;
    dragCurrentRef.current = null;
  }, [pageNumber, tool]);

  // Load PDF document when pdfUrl is provided
  useEffect(() => {
    let cancelled = false;
    if (!pdfUrl) {
      setPdfDoc(null);
      return;
    }
    loadPdfDocument(pdfUrl)
      .then((doc) => {
        if (!cancelled) setPdfDoc(doc);
      })
      .catch(() => {
        if (!cancelled) setPdfDoc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Vector re-render for Magnifier (M) when PDF is available
  useEffect(() => {
    let cancelled = false;
    if (tool !== 'magnifier' || !pdfDoc) {
      setVectorDataUrl('');
      return;
    }
    const c = highResCanvasRef.current || document.createElement('canvas');
    highResCanvasRef.current = c;
    renderPdfPageVectorZoom({
      pdfDoc,
      pageNumber,
      canvas: c,
      zoomScale: magnifierZoom,
    })
      .then(() => {
        if (!cancelled) {
          setVectorDataUrl(c.toDataURL('image/png'));
        }
      })
      .catch(() => {
        if (!cancelled) setVectorDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [tool, pdfDoc, pageNumber, magnifierZoom]);

  // Vector re-render for Box Zoom (Z) when PDF and zoomedBox are available
  useEffect(() => {
    let cancelled = false;
    if (tool !== 'zoombox' || !zoomedBox || !pdfDoc) {
      setVectorZoomedBoxUrl('');
      return;
    }
    const c = highResCanvasRef.current || document.createElement('canvas');
    highResCanvasRef.current = c;
    renderPdfPageVectorZoom({
      pdfDoc,
      pageNumber,
      canvas: c,
      zoomScale: 3.0,
      region: zoomedBox,
    })
      .then(() => {
        if (!cancelled) {
          setVectorZoomedBoxUrl(c.toDataURL('image/png'));
        }
      })
      .catch(() => {
        if (!cancelled) setVectorZoomedBoxUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [tool, zoomedBox, pdfDoc, pageNumber]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldYieldPointerShortcut(e)) return;
      const res = nextPointerToolOnKey(tool, zoomedBox, e.key);
      if (!res.handled) return;
      e.preventDefault();
      if (res.clearBox) setZoomedBox(null);
      if (res.tool !== tool) onToolChange(res.tool);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tool, zoomedBox, onToolChange]);

  if (tool === 'none') return null;

  const scale = Math.max(0.1, canvasWidth / 1920);

  const getRelativeCoords = (clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 0.5, y: 0.5 };
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const pos = getRelativeCoords(clientX, clientY);
    setCursor(pos);
    if (tool === 'zoombox' && dragStartRef.current) {
      dragCurrentRef.current = pos;
      setDragCurrent(pos);
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    const pos = getRelativeCoords(clientX, clientY);
    setCursor(pos);
    if (tool === 'zoombox' && !zoomedBox) {
      dragStartRef.current = pos;
      dragCurrentRef.current = pos;
      setDragStart(pos);
      setDragCurrent(pos);
    }
  };

  const handlePointerUp = () => {
    const start = dragStartRef.current;
    const current = dragCurrentRef.current;
    if (tool === 'zoombox' && start && current) {
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      setDragStart(null);
      setDragCurrent(null);
      if (w >= 0.04 && h >= 0.04) {
        setZoomedBox({ x, y, w, h });
      } else {
        // Single tap/click fallback for touch/tablet: zoom a 40% x 40% box centered on tap
        const half = 0.2;
        const bx = Math.max(0, Math.min(1 - half * 2, current.x - half));
        const by = Math.max(0, Math.min(1 - half * 2, current.y - half));
        setZoomedBox({ x: bx, y: by, w: half * 2, h: half * 2 });
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (tool === 'magnifier') {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setMagnifierZoom((z) => Math.max(2.0, Math.min(3.0, Number((z + delta).toFixed(2)))));
    } else if (tool === 'spotlight') {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 20 : -20;
      setSpotlightRadius((r) => Math.max(80, Math.min(360, r + delta)));
    }
  };

  const lensSizePx = Math.round(280 * scale);
  const cursorPxX = cursor.x * canvasWidth;
  const cursorPxY = cursor.y * ((canvasWidth * 9) / 16);
  const spotRadiusPx = Math.round(spotlightRadius * scale);

  return (
    <div
      ref={overlayRef}
      className={`slide-pointer-overlay tool-${tool}`}
      data-testid="slide-pointer-overlay"
      data-active-tool={tool}
      data-magnifier-zoom={magnifierZoom}
      data-spotlight-radius={spotlightRadius}
      data-vector-mode={pdfDoc ? 'pdf-vector' : 'dom-vector'}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onTouchStart={(e) => {
        if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* 1. 放大鏡 (Magnifier) */}
      {tool === 'magnifier' && (
        <div
          className="pointer-magnifier-lens"
          data-testid="pointer-magnifier-lens"
          style={{
            width: lensSizePx,
            height: lensSizePx,
            left: cursorPxX - lensSizePx / 2,
            top: cursorPxY - lensSizePx / 2,
          }}
        >
          {vectorDataUrl ? (
            <img
              src={vectorDataUrl}
              alt="PDF 向量重繪放大鏡"
              draggable={false}
              style={{
                position: 'absolute',
                width: canvasWidth * magnifierZoom,
                height: ((canvasWidth * 9) / 16) * magnifierZoom,
                left: lensSizePx / 2 - cursorPxX * magnifierZoom,
                top: lensSizePx / 2 - cursorPxY * magnifierZoom,
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <iframe
              title="向量放大鏡預覽"
              sandbox=""
              srcDoc={slideHtmlSrcDoc}
              style={{
                position: 'absolute',
                width: 1920,
                height: 1080,
                transformOrigin: '0 0',
                transform: `scale(${scale * magnifierZoom})`,
                left: lensSizePx / 2 - cursorPxX * magnifierZoom,
                top: lensSizePx / 2 - cursorPxY * magnifierZoom,
                border: 0,
                pointerEvents: 'none',
              }}
            />
          )}
          <span className="pointer-lens-badge">{magnifierZoom.toFixed(1)}× 向量</span>
        </div>
      )}

      {/* 2. 聚光燈 (Spotlight) */}
      {tool === 'spotlight' && (
        <div
          className="pointer-spotlight-mask"
          data-testid="pointer-spotlight-mask"
          style={{
            background: `radial-gradient(circle ${spotRadiusPx}px at ${cursorPxX}px ${cursorPxY}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 78%, rgba(8,15,26,0.78) 100%)`,
          }}
        />
      )}

      {/* 3. 雷射筆 (Laser Pointer) */}
      {tool === 'laser' && (
        <div
          className="pointer-laser-dot"
          data-testid="pointer-laser-dot"
          style={{
            left: cursorPxX,
            top: cursorPxY,
          }}
        />
      )}

      {/* 4. 框選放大 (Box Zoom) */}
      {tool === 'zoombox' && !zoomedBox && dragStart && dragCurrent && (
        <div
          className="pointer-zoombox-selection"
          data-testid="pointer-zoombox-selection"
          style={{
            left: `${Math.min(dragStart.x, dragCurrent.x) * 100}%`,
            top: `${Math.min(dragStart.y, dragCurrent.y) * 100}%`,
            width: `${Math.abs(dragCurrent.x - dragStart.x) * 100}%`,
            height: `${Math.abs(dragCurrent.y - dragStart.y) * 100}%`,
          }}
        />
      )}

      {tool === 'zoombox' && zoomedBox && (
        <div className="pointer-zoombox-Stage" data-testid="pointer-zoombox-stage">
          {vectorZoomedBoxUrl ? (
            <img
              src={vectorZoomedBoxUrl}
              alt="PDF 框選向量放大"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {(() => {
                const boxScale = Math.min(1 / zoomedBox.w, 1 / zoomedBox.h);
                const cx = (zoomedBox.x + zoomedBox.w / 2) * canvasWidth * boxScale;
                const cy = (zoomedBox.y + zoomedBox.h / 2) * ((canvasWidth * 9) / 16) * boxScale;
                const ox = canvasWidth / 2 - cx;
                const oy = (canvasWidth * 9) / 16 / 2 - cy;
                return (
                  <iframe
                    title="框選向量放大"
                    sandbox=""
                    srcDoc={slideHtmlSrcDoc}
                    style={{
                      position: 'absolute',
                      width: 1920,
                      height: 1080,
                      transformOrigin: '0 0',
                      transform: `translate(${ox}px, ${oy}px) scale(${scale * boxScale})`,
                      border: 0,
                      pointerEvents: 'none',
                    }}
                  />
                );
              })()}
            </div>
          )}
          <button
            type="button"
            className="pointer-zoombox-reset"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedBox(null);
            }}
          >
            返回原頁 (Esc)
          </button>
        </div>
      )}

      <div className="pointer-status-pill" aria-live="polite">
        {tool === 'magnifier' && `🔍 放大鏡 ${magnifierZoom.toFixed(1)}×（滾輪調整 2–3 倍｜按 M 或 Esc 關閉）`}
        {tool === 'spotlight' && `🔦 聚光燈（滾輪調光圈大小｜按 S 或 Esc 關閉）`}
        {tool === 'laser' && `🔴 雷射筆（移動滑鼠或觸控｜按 L 或 Esc 關閉）`}
        {tool === 'zoombox' &&
          (zoomedBox
            ? '⬚ 框選放大中（向量重繪｜按 Esc 返回原頁，再按 Z 關閉）'
            : '⬚ 請在投影片拖曳拉出矩形框放大（按 Z 或 Esc 關閉）')}
      </div>
    </div>
  );
}

export function SlidePointerToolbar({
  tool,
  onToolChange,
}: {
  tool: PointerToolMode;
  onToolChange: (next: PointerToolMode) => void;
}) {
  const toggle = (target: PointerToolMode) => {
    onToolChange(tool === target ? 'none' : target);
  };
  return (
    <div className="pointer-toolbar" role="group" aria-label="簡報指示工具">
      <button
        type="button"
        className={tool === 'magnifier' ? 'primary' : ''}
        aria-pressed={tool === 'magnifier'}
        onClick={() => toggle('magnifier')}
      >
        放大鏡 (M)
      </button>
      <button
        type="button"
        className={tool === 'spotlight' ? 'primary' : ''}
        aria-pressed={tool === 'spotlight'}
        onClick={() => toggle('spotlight')}
      >
        聚光燈 (S)
      </button>
      <button
        type="button"
        className={tool === 'laser' ? 'primary' : ''}
        aria-pressed={tool === 'laser'}
        onClick={() => toggle('laser')}
      >
        雷射筆 (L)
      </button>
      <button
        type="button"
        className={tool === 'zoombox' ? 'primary' : ''}
        aria-pressed={tool === 'zoombox'}
        onClick={() => toggle('zoombox')}
      >
        框選放大 (Z)
      </button>
      {tool !== 'none' && (
        <button type="button" onClick={() => onToolChange('none')}>
          關閉工具 (Esc)
        </button>
      )}
    </div>
  );
}
