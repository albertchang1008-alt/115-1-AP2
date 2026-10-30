import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VERSION } from '../shared/version';
import { createVersionChecker, VERSION_CHECK } from './updateVersion';
import { reloadIfIdle, useUpdateActivity } from './updateActivity';
export default function UpdateBanner() {
  const active = useUpdateActivity(),
    [version, setVersion] = useState<string | null>(null),
    [dismissed, setDismissed] = useState(false),
    panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const checker = createVersionChecker({
      current: VERSION,
      baseUrl: document.baseURI,
      onVersion: setVersion,
    });
    const visible = () => {
      if (document.hidden) return;
      setDismissed(false);
      void checker.check();
    };
    const online = () => {
      void checker.check();
    };
    const timer = setInterval(() => {
      if (!document.hidden) void checker.check();
    }, VERSION_CHECK.intervalMs);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', online);
    void checker.check();
    return () => {
      checker.dispose();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', online);
    };
  }, []);
  const show = !!version && !dismissed;
  useLayoutEffect(() => {
    if (!show || !panel.current) return;
    const root = document.documentElement,
      element = panel.current;
    const size = () =>
      root.style.setProperty(
        '--platform-update-height',
        `${element.getBoundingClientRect().height}px`,
      );
    root.dataset.platformUpdate = 'true';
    size();
    const observer = new ResizeObserver(size);
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete root.dataset.platformUpdate;
      root.style.removeProperty('--platform-update-height');
    };
  }, [show]);
  if (!show) return null;
  return (
    <aside ref={panel} className="platform-update-banner" aria-label="平台新版提示">
      <div role="status" aria-live="polite" aria-atomic="true">
        <button
          className="platform-update-action"
          disabled={active}
          onClick={() => {
            reloadIfIdle(() => window.location.reload());
          }}
        >
          {active ? '平台已更新，交卷後再載入新版' : '平台已更新，點這裡載入新版'}
        </button>
      </div>
      <button
        className="platform-update-close"
        aria-label="暫時關閉新版提示"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </aside>
  );
}
