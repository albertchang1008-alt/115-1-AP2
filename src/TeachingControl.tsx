import QuestionManagerPanel from './QuestionManagerPanel';
import {
  TeacherInteraction,
  interactiveSlideHTML,
  interactiveSlideNotes,
} from './ClassroomInteraction';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { API } from './service';
import { featureEnabled } from '../shared/features';
import { Course } from '../shared/model';
import { TeacherAssessments } from './Assessments';
import ProgressBoard from './ProgressBoard';
import PptImportModal from './PptImportModal';
import {
  PointerToolMode,
  SlidePointerOverlay,
  SlidePointerToolbar,
} from './SlidePointerTools';

interface Slide {
  id: string;
  title: string;
  html: string;
  notes: string;
  answerPage: boolean;
  pageNumber?: number;
  imageUrl?: string;
}

interface DeckSummary {
  id: string;
  title: string;
  slideCount: number;
  updatedAt?: number;
  hasPdf?: boolean;
}

interface Deck {
  title: string;
  slides: Slide[];
  deckId?: string;
  decks?: DeckSummary[];
  canSplitLegacy28?: boolean;
  pdfUrl?: string;
}

export function slideDocument(html: string) {
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https://albertchang1008-alt.github.io https://storage.googleapis.com https://firebasestorage.googleapis.com; font-src 'none';"><style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:#1E2933}p,h1,h2,h3{margin:0}section{width:1920px;height:1080px;position:relative;overflow:hidden}aside{display:none}</style><body>${html}</body></html>`;
}

function isCombined28Slides(slides: Slide[]): boolean {
  const hasR = slides.some((s) => s.id.startsWith('R-REV-'));
  const hasU = slides.some((s) => s.id.startsWith('U-REV-'));
  return hasR && hasU;
}

export default function TeachingControl({
  api,
  course,
  notify,
  changed,
  progress,
}: {
  api: API;
  course: Course;
  notify: (s: string) => void;
  changed: () => Promise<void>;
  progress: ReactNode;
}) {
  const [deck, setDeck] = useState<Deck | null>(null),
    [rawCombinedSlides, setRawCombinedSlides] = useState<Slide[] | null>(null),
    [activeDeckId, setActiveDeckId] = useState(''),
    [index, setIndex] = useState(0),
    [panel, setPanel] = useState('slides'),
    [full, setFull] = useState(false),
    [black, setBlack] = useState(false),
    [notes, setNotes] = useState(false),
    [width, setWidth] = useState(0),
    [failure, setFailure] = useState(''),
    [loading, setLoading] = useState(false),
    [showImport, setShowImport] = useState(false),
    [pointerTool, setPointerTool] = useState<PointerToolMode>('none'),
    [migrating, setMigrating] = useState(false);

  const screen = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLDivElement>(null);

  async function load(requestedDeckId?: string) {
    setLoading(true);
    setFailure('');
    try {
      const payload: Record<string, unknown> = { courseId: course.id };
      if (requestedDeckId) payload.deckId = requestedDeckId;
      const d = await api.call<Deck>('getTeachingDeck', payload);
      if (isCombined28Slides(d.slides)) {
        setRawCombinedSlides(d.slides);
      }
      // If mock/legacy backend returned all 28 slides when a virtual split deck was selected, filter client-side
      if (
        requestedDeckId === 'respiratory-review' &&
        isCombined28Slides(d.slides)
      ) {
        const respSlides = d.slides.filter((s) => s.id.startsWith('R-REV-'));
        setDeck({ ...d, title: '呼吸複習', deckId: 'respiratory-review', slides: respSlides });
        setActiveDeckId('respiratory-review');
      } else if (
        requestedDeckId === 'urinary-fluid-review' &&
        isCombined28Slides(d.slides)
      ) {
        const uriSlides = d.slides.filter((s) => s.id.startsWith('U-REV-'));
        setDeck({
          ...d,
          title: '泌尿＋體液複習',
          deckId: 'urinary-fluid-review',
          slides: uriSlides,
        });
        setActiveDeckId('urinary-fluid-review');
      } else {
        setDeck(d.slides.length ? d : null);
        setActiveDeckId(d.deckId || requestedDeckId || (d.decks?.[0]?.id ?? ''));
      }
      setIndex(0);
      setBlack(false);
      if (!d.slides.length && !requestedDeckId) setPanel('flow');
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!api.preview) void load();
  }, [api, course.id]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const r = new ResizeObserver(() => setWidth(el.clientWidth));
    r.observe(el);
    return () => r.disconnect();
  }, [panel, deck, full]);

  useEffect(() => {
    const fn = () => {
      setFull(document.fullscreenElement === screen.current);
      setBlack(false);
    };
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  const move = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min((deck?.slides.length || 1) - 1, i + delta)));
    setBlack(false);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (panel !== 'slides' || !deck || showImport || e.altKey || e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement)?.closest('input,textarea,select,button')) return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        move(1);
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        move(-1);
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setBlack((v) => !v);
      } else if (e.key === 'Escape' && black) {
        setBlack(false);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [panel, deck, showImport, black]);

  async function fullscreen() {
    try {
      if (!screen.current?.requestFullscreen) throw Error('此瀏覽器不支援全螢幕，請使用Chrome。');
      await screen.current.requestFullscreen();
      screen.current.focus();
    } catch (e) {
      notify((e as Error).message);
    }
  }

  async function handleMigrateLegacy28() {
    setMigrating(true);
    try {
      await api.call('saveTeachingDeck', {
        courseId: course.id,
        action: 'migrateLegacy28',
      });
      notify('已將 28 頁簡報拆分為「呼吸複習」與「泌尿＋體液複習」兩份獨立簡報');
      await load('respiratory-review');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setMigrating(false);
    }
  }

  const deckOptions: DeckSummary[] = (() => {
    const list: DeckSummary[] = [...(deck?.decks || [])];
    const hasLegacy28 =
      deck?.canSplitLegacy28 ||
      (deck && isCombined28Slides(deck.slides)) ||
      (rawCombinedSlides && rawCombinedSlides.length >= 28);
    if (hasLegacy28) {
      if (!list.some((d) => d.id === 'legacy-combined')) {
        list.unshift({
          id: 'legacy-combined',
          title: `${deck?.title || '期中複習合併版'}（28 頁）`,
          slideCount: 28,
        });
      }
      if (!list.some((d) => d.id === 'respiratory-review')) {
        list.push({ id: 'respiratory-review', title: '呼吸複習', slideCount: 14 });
      }
      if (!list.some((d) => d.id === 'urinary-fluid-review')) {
        list.push({ id: 'urinary-fluid-review', title: '泌尿＋體液複習', slideCount: 14 });
      }
    } else if (deck && list.length === 0) {
      list.push({
        id: deck.deckId || 'current',
        title: deck.title || '教師授課簡報',
        slideCount: deck.slides.length,
      });
    }
    return list;
  })();

  const slide = deck?.slides[index];
  const currentSlideSrcDoc = slide
    ? slideDocument(interactiveSlideHTML(slide.html, slide.id))
    : '';

  return (
    <div className="teaching-control">
      <header className="pageheading">
        <div>
          <span className="eyebrow">{course.title}</span>
          <h1>授課控制台</h1>
          <p>播放簡報、控制學習單元、開放前後測，都在這裡操作。</p>
        </div>
      </header>
      <div className="toolbar" role="group" aria-label="授課控制">
        {(deck || !api.preview) && (
          <button
            className={panel === 'slides' ? 'primary' : ''}
            onClick={() => setPanel('slides')}
          >
            簡報播放
          </button>
        )}
        {!api.preview && <button className={panel === 'questions' ? 'primary' : ''} onClick={() => setPanel('questions')}>題目管理</button>}
        <button className={panel === 'flow' ? 'primary' : ''} onClick={() => setPanel('flow')}>
          學生學習進度
        </button>
        {featureEnabled(course, 'assessments') && (
          <button className={panel === 'exams' ? 'primary' : ''} onClick={() => setPanel('exams')}>
            前測／後測
          </button>
        )}
        <button
          className={panel === 'completion' ? 'primary' : ''}
          onClick={() => setPanel('completion')}
        >
          學生完成度
        </button>
      </div>
      {panel === 'slides' && (
        <section className="panel">
          <div className="teaching-deck-topbar">
            <div>
              <h2>{deck?.title || '教師授課簡報'}</h2>
              <p>
                單螢幕：全螢幕播放，按 Esc
                回控制台。方向鍵／PageUp／PageDown換頁，B鍵暫時黑屏。指示工具：M 放大鏡、S 聚光燈、L 雷射筆、Z 框選放大。
              </p>
            </div>
            {!api.preview && (
              <div className="teaching-deck-actions">
                <button
                  type="button"
                  onClick={() => setShowImport(true)}
                >
                  ＋ 匯入投影片＋題目表
                </button>
                {(deck?.canSplitLegacy28 || (deck && isCombined28Slides(deck.slides))) &&
                  !(deck?.decks && deck.decks.some((d) => d.id === 'respiratory-review')) && (
                    <button
                      type="button"
                      disabled={migrating}
                      onClick={() => void handleMigrateLegacy28()}
                    >
                      {migrating ? '拆分遷移中…' : '拆分為「呼吸複習」「泌尿＋體液複習」'}
                    </button>
                  )}
              </div>
            )}
          </div>

          {api.preview ? (
            <p>簡報需授權教師登入本站才能讀取。</p>
          ) : failure ? (
            <p role="alert">
              {failure} <button onClick={() => void load(activeDeckId)}>重試讀取簡報</button>
            </p>
          ) : loading ? (
            <p role="status">正在讀取教師簡報…</p>
          ) : !slide ? (
            <div className="empty-deck-prompt">
              <p>目前尚無簡報，請點選右上角「＋ 匯入投影片＋題目表」上傳 PDF 與 Excel 題目表。</p>
            </div>
          ) : (
            <>
              <div className="teaching-selectors-row">
                {deckOptions.length > 0 && (
                  <label className="field">
                    選擇簡報
                    <select
                      aria-label="選擇簡報"
                      value={activeDeckId || deckOptions[0]?.id || ''}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setActiveDeckId(nextId);
                        void load(nextId);
                      }}
                    >
                      {deckOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}（{d.slideCount} 頁）
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="field">
                  選擇投影片
                  <select
                    aria-label="選擇投影片"
                    value={index}
                    onChange={(e) => {
                      setIndex(Number(e.target.value));
                      setBlack(false);
                    }}
                  >
                    {deck!.slides.map((s, i) => (
                      <option key={s.id} value={i}>
                        {i + 1}. {s.title}
                        {s.answerPage ? '（答案頁）' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="teaching-screen" ref={screen} tabIndex={-1}>
                <div
                  className="teaching-canvas"
                  ref={canvas}
                  style={{ height: (width * 9) / 16 }}
                >
                  <iframe
                    key={slide.id}
                    title={`投影片 ${index + 1}：${slide.title}`}
                    sandbox=""
                    srcDoc={currentSlideSrcDoc}
                    style={{ width: 1920, height: 1080, transform: `scale(${width / 1920})` }}
                  />
                  <SlidePointerOverlay
                    tool={pointerTool}
                    onToolChange={setPointerTool}
                    pdfUrl={deck?.pdfUrl}
                    pageNumber={slide.pageNumber || index + 1}
                    slideHtmlSrcDoc={currentSlideSrcDoc}
                    canvasWidth={width || 960}
                  />
                  {black && <div className="teaching-blackout" aria-label="暫時黑屏" />}
                </div>
                <TeacherInteraction
                  api={api}
                  course={course}
                  slideId={slide.id}
                  black={black}
                  privateRecords={!full}
                />
                <div className="teaching-playback">
                  <button disabled={index === 0} onClick={() => move(-1)}>
                    上一頁
                  </button>
                  <span>
                    {index + 1}／{deck!.slides.length}
                    {slide.answerPage ? ' · 答案頁' : ''}
                  </span>
                  <button disabled={index === deck!.slides.length - 1} onClick={() => move(1)}>
                    下一頁
                  </button>
                  <button onClick={() => setBlack((v) => !v)}>
                    {black ? '恢復投影片' : '暫時黑屏'}
                  </button>
                  {full ? (
                    <button onClick={() => void document.exitFullscreen()}>回控制台</button>
                  ) : (
                    <button onClick={() => void fullscreen()}>全螢幕簡報</button>
                  )}
                </div>
                <SlidePointerToolbar tool={pointerTool} onToolChange={setPointerTool} />
              </div>
              {!full && (
                <>
                  <button aria-expanded={notes} onClick={() => setNotes((v) => !v)}>
                    {notes ? '隱藏' : '查看'}講者備註
                  </button>
                  {notes && (
                    <p className="teaching-notes">
                      {interactiveSlideNotes(slide.notes || '本頁無備註。', slide.id)}
                    </p>
                  )}
                </>
              )}
            </>
          )}
          {showImport && (
            <PptImportModal
              api={api}
              courseId={course.id}
              initialTitle={
                activeDeckId && activeDeckId !== 'legacy-combined' ? deck?.title || '' : ''
              }
              initialDeckId={
                activeDeckId && activeDeckId !== 'legacy-combined' ? activeDeckId : ''
              }
              onClose={() => setShowImport(false)}
              onImported={async (newDeckId) => {
                setActiveDeckId(newDeckId);
                await load(newDeckId);
              }}
              notify={notify}
            />
          )}
        </section>
      )}
      {panel === 'questions' && <section className="panel"><QuestionManagerPanel api={api} courseId={course.id} /></section>}
      {panel === 'flow' && (
        <>
          <p className="notice">
            單元控制會套用到本課程各班，保留學生原有紀錄。學生在線時約15秒更新；不控制已開啟的外部教材頁面。
          </p>
          <ProgressBoard course={course} api={api} notify={notify} changed={changed} />
        </>
      )}
      {panel === 'exams' && <TeacherAssessments api={api} course={course} notify={notify} />}
      {panel === 'completion' && progress}
    </div>
  );
}
