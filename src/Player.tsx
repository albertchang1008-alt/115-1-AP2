import { API } from './service';
import { learningBridge } from './LearningBridge';
import { useEffect, useRef, useState } from 'react';
import { Activity, youtubeId, materialUrl } from '../shared/model';
let ytReady: Promise<void> | null = null;
function loadYoutube() {
  if ((window as any).YT?.Player) return Promise.resolve();
  if (!ytReady)
    ytReady = new Promise((resolve, reject) => {
      (window as any).onYouTubeIframeAPIReady = () => resolve();
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => {
        ytReady = null;
        reject(Error('無法載入播放器'));
      };
      document.head.append(script);
    });
  return ytReady;
}
export function Youtube({
  activity,
  position,
  onSave,
}: {
  activity: Activity;
  position: number;
  onSave: (position: number, completed: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    save = useRef(onSave);
  save.current = onSave;
  const [error, setError] = useState('');
  useEffect(() => {
    let player: any,
      cancelled = false;
    let completed = false;
    let last = -1;
    const flush = () => {
      if (!player?.getCurrentTime) return;
      const p = Math.max(0, player.getCurrentTime() || 0);
      if (Math.abs(p - last) < 2 && !completed) return;
      last = p;
      save.current(p, completed);
    };
    loadYoutube()
      .then(() => {
        if (cancelled || !host.current) return;
        const el = document.createElement('div');
        host.current.replaceChildren(el);
        player = new (window as any).YT.Player(el, {
          videoId: youtubeId(activity.url),
          width: '100%',
          height: '100%',
          playerVars: {
            start: Math.floor(Math.max(position, activity.start || 0)),
            ...(activity.end ? { end: activity.end } : {}),
            rel: 0,
          },
          events: {
            onStateChange: (e: any) => {
              if (e.data === 0) {
                completed = true;
                flush();
              }
              if (e.data === 2) flush();
            },
            onError: () => setError('這部影片無法嵌入或已無法觀看。'),
          },
        });
      })
      .catch((e) => setError(e.message));
    const hide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancelled = true;
      flush();
      player?.destroy();
      document.removeEventListener('visibilitychange', hide);
    };
  }, [activity.id, activity.url, activity.start, activity.end]);
  return (
    <>
      <div className="video" ref={host} />
      {error && <p className="error">{error}</p>}
      <a className="textlink" href={activity.url} target="_blank" rel="noreferrer">
        前往 YouTube ↗
      </a>
      <p className="muted">選看補充影片，不影響完成度或成績。暫停時保存播放位置，方便下次接續。</p>
    </>
  );
}
export function HtmlMaterial({
  activity,
  onSave,
  api, courseId, unitId, chapterName, uid,
}: {
  api: API; courseId: string; unitId: string; chapterName?: string; uid: string;
  activity: Activity;
  onSave: (position: number, completed: boolean) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const session = useRef(crypto.randomUUID());
  const [status, setStatus] = useState('');
  const interactive = activity.tracking === 'interactive';
  const init = () => frame.current?.contentWindow?.postMessage({ type: 'init', protocolVersion: 1, activityId: activity.id, materialVersion: activity.materialVersion || 'v1', sessionId: session.current }, '*');
  useEffect(() => {
    if (!interactive) return;
    const bridge = learningBridge(api, { courseId, unitId, ...(chapterName ? { chapterName } : {}), activityId: activity.id, materialVersion: activity.materialVersion || 'v1', uid }, setStatus, () => onSave(1, true));
    const handler = async (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data) return;
      const d = event.data;
      if (d.type === 'ready') { init(); return; }
      if (d.protocolVersion !== 1 || d.sessionId !== session.current || d.activityId !== activity.id || d.materialVersion !== (activity.materialVersion || 'v1')) return;
      if (d.type !== 'learning-events') return;
      try {
        const accepted = await bridge.receive(d.events);
        frame.current?.contentWindow?.postMessage({ type: 'learning-ack', sessionId: session.current, accepted }, '*');
      } catch (e) { setStatus((e as Error).message); }
    };
    window.addEventListener('message', handler);
    return () => { bridge.close(); window.removeEventListener('message', handler); };
  }, [api, courseId, unitId, chapterName, activity.id, activity.url, activity.materialVersion, interactive, uid]);
  const url = materialUrl(activity.url);
  const error = url ? '' : '教師尚未提供有效的 HTTPS 教材網址';
  const save = useRef(onSave);
  save.current = onSave;
  useEffect(() => {
    let last = 0;
    const fn = (event: MessageEvent) => {
      if (interactive) return;
      if (
        event.source !== frame.current?.contentWindow ||
        !event.data ||
        event.data.activityId !== activity.id
      )
        return;
      const d = event.data;
      if (!['ready', 'progress', 'completed'].includes(d.type)) return;
      if (d.type === 'ready') {
        frame.current?.contentWindow?.postMessage({ type: 'init', activityId: activity.id }, '*');
        return;
      }
      if (d.type === 'progress' && Date.now() - last < 15000) return;
      if (d.position !== undefined && (!Number.isFinite(d.position) || d.position < 0)) return;
      last = Date.now();
      save.current(d.position || 0, d.type === 'completed');
    };
    window.addEventListener('message', fn);
    return () => window.removeEventListener('message', fn);
  }, [activity.id, interactive]);
  return (
    <>
      {error ? (
        <p className="error">{error}</p>
      ) : url ? (
        <iframe
          key={url}
          className="material"
          ref={frame}
          src={url}
          title={activity.title}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          onLoad={init}
        />
      ) : (
        <p>正在取得教材…</p>
      )}
      {!interactive && <button disabled={!url} onClick={() => onSave(0, true)}>確認已閱讀</button>}
      {interactive && <p>此活動會保存探索與作答歷程，供教師調整教學；通關成就與診斷分開記錄。</p>}
      {status && <p role="status">{status}</p>}
      <p className="muted">此紀錄表示參與教材，不影響單元達標分數。</p>
    </>
  );
}
