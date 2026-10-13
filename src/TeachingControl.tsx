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
interface Slide {
  id: string;
  title: string;
  html: string;
  notes: string;
  answerPage: boolean;
}
interface Deck {
  title: string;
  slides: Slide[];
}
export function slideDocument(html: string) {
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none';"><style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:#1E2933}p,h1,h2,h3{margin:0}section{width:1920px;height:1080px;position:relative;overflow:hidden}aside{display:none}</style><body>${html}</body></html>`;
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
    [index, setIndex] = useState(0),
    [panel, setPanel] = useState('slides'),
    [full, setFull] = useState(false),
    [black, setBlack] = useState(false),
    [notes, setNotes] = useState(false),
    [width, setWidth] = useState(0),
    [failure, setFailure] = useState(''),
    [loading, setLoading] = useState(false);
  const screen = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLDivElement>(null);
  async function load() {
    setLoading(true);
    setFailure('');
    try {
      const d = await api.call<Deck>('getTeachingDeck', { courseId: course.id });
      setDeck(d.slides.length ? d : null);
      if (!d.slides.length) setPanel('flow');
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
      if (panel !== 'slides' || !deck || e.altKey || e.ctrlKey || e.metaKey) return;
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
      } else if (e.key === 'Escape') {
        setBlack(false);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [panel, deck]);
  async function fullscreen() {
    try {
      if (!screen.current?.requestFullscreen) throw Error('此瀏覽器不支援全螢幕，請使用Chrome。');
      await screen.current.requestFullscreen();
      screen.current.focus();
    } catch (e) {
      notify((e as Error).message);
    }
  }
  const slide = deck?.slides[index];
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
        {deck && <button className={panel === 'slides' ? 'primary' : ''} onClick={() => setPanel('slides')}>
          簡報播放
        </button>}
        <button className={panel === 'flow' ? 'primary' : ''} onClick={() => setPanel('flow')}>
          學生學習進度
        </button>
        {featureEnabled(course, 'assessments') && <button className={panel === 'exams' ? 'primary' : ''} onClick={() => setPanel('exams')}>
          前測／後測
        </button>}
        <button
          className={panel === 'completion' ? 'primary' : ''}
          onClick={() => setPanel('completion')}
        >
          學生完成度
        </button>
      </div>
      {panel === 'slides' && (
        <section className="panel">
          <h2>{deck?.title || '教師授課簡報'}</h2>
          <p>
            單螢幕：全螢幕播放，按 Esc
            回控制台。方向鍵／PageUp／PageDown換頁，B鍵暫時黑屏。換頁不會改變學生進度或開考。
          </p>
          {api.preview ? (
            <p>簡報需授權教師登入本站才能讀取。</p>
          ) : failure ? (
            <p role="alert">
              {failure} <button onClick={() => void load()}>重試讀取簡報</button>
            </p>
          ) : loading ? (
            <p role="status">正在讀取教師簡報…</p>
          ) : (
            slide && (
              <>
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
                      srcDoc={slideDocument(interactiveSlideHTML(slide.html, slide.id))}
                      style={{ width: 1920, height: 1080, transform: `scale(${width / 1920})` }}
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
            )
          )}
        </section>
      )}
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
