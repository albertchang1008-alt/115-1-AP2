// One request at a time. Hidden/offline pages resume immediately when usable again.
export function visiblePoll(task: (alive: () => boolean) => Promise<void>, delay: number) {
  let stopped = false, running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const usable = () => !stopped && document.visibilityState !== 'hidden' && navigator.onLine !== false;
  const run = async () => {
    if (!usable() || running) return;
    running = true;
    try { await task(() => !stopped); }
    catch { /* The caller owns the connection status; polling must still recover. */ }
    finally {
      running = false;
      if (usable()) timer = setTimeout(() => { void run(); }, delay);
    }
  };
  const resume = () => {
    clearTimeout(timer);
    if (usable()) void run();
  };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('online', resume);
  window.addEventListener('offline', resume);
  void run();
  return () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('online', resume);
    window.removeEventListener('offline', resume);
  };
}
