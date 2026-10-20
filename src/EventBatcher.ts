// Persist first; acknowledge only IDs accepted by the server. Retries retain IDs.
export function eventBatcher<T extends { id: string }>(options: {
  key: string;
  valid: (event: T) => boolean;
  send: (events: T[]) => Promise<string[]>;
  pending?: () => void;
  saved?: (events: T[], remaining: number) => void;
  failed?: () => void;
}) {
  let queue: T[] = [], closed = false, flight: Promise<void> | null = null;
  const accepted = new Set<string>();
  let waiters: { ids: string[]; resolve: (ids: string[]) => void }[] = [];
  const persist = () => {
    try {
      // An old view may finish saving after a new view opens the same queue.
      // Merge durable, unconfirmed IDs so its completion cannot erase newer events.
      const stored = JSON.parse(localStorage.getItem(options.key) || '[]');
      const merged = new Map<string, T>();
      for (const event of [...(Array.isArray(stored) ? stored : []), ...queue]) {
        if (options.valid(event) && !accepted.has(event.id)) merged.set(event.id, event);
      }
      queue = [...merged.values()];
      localStorage.setItem(options.key, JSON.stringify(queue));
      return true;
    }
    catch { if (!closed) options.failed?.(); return false; }
  };
  try {
    const stored = JSON.parse(localStorage.getItem(options.key) || '[]');
    if (Array.isArray(stored)) {
      const seen = new Set<string>();
      queue = stored.filter((e: T) => options.valid(e) && !seen.has(e.id) && !!seen.add(e.id)).slice(0, 2000);
    }
  } catch { options.failed?.(); }
  function settle(failed = false) {
    const pending = [] as typeof waiters;
    for (const waiter of waiters) {
      if (failed || waiter.ids.every((id) => accepted.has(id)))
        waiter.resolve(waiter.ids.filter((id) => accepted.has(id)));
      else pending.push(waiter);
    }
    waiters = pending;
  }
  function flush(): Promise<void> {
    if (flight) return flight;
    if (!queue.length) return Promise.resolve();
    flight = (async () => {
      try {
        while (queue.length) {
          const batch = queue.slice(0, 30);
          const ids = new Set(await options.send(batch));
          const saved = batch.filter((e) => ids.has(e.id));
          if (!saved.length) throw Error('伺服器未確認事件');
          for (const event of saved) accepted.add(event.id);
          queue = queue.filter((e) => !accepted.has(e.id));
          persist();
          if (!closed) options.saved?.(saved, queue.length);
          settle();
          if (saved.length !== batch.length) throw Error('事件尚未全部確認');
        }
      } catch {
        if (!closed) options.failed?.();
        settle(true);
      } finally {
        if (!waiters.length && accepted.size > 2000) accepted.clear();
      }
    })().finally(() => { flight = null; });
    return flight;
  }
  const onHidden = () => { if (document.visibilityState === 'hidden') void flush(); };
  const timer = setInterval(() => { void flush(); }, 30000);
  const onOnline = () => { void flush(); };
  window.addEventListener('online', onOnline);
  window.addEventListener('pagehide', onOnline);
  document.addEventListener('visibilitychange', onHidden);
  if (queue.length) void flush();
  return {
    enqueue(events: T[], urgent = false): Promise<string[]> {
      if (closed || !events.length || events.length > 30 || events.some((e) => !options.valid(e)))
        return Promise.resolve([]);
      const fresh = events.filter((e, i) => !accepted.has(e.id) && !queue.some((q) => q.id === e.id) && events.findIndex((x) => x.id === e.id) === i);
      if (queue.length + fresh.length > 2000) { options.failed?.(); return Promise.resolve([]); }
      queue.push(...fresh);
      const durable = persist();
      const result = new Promise<string[]>((resolve) => waiters.push({ ids: events.map((e) => e.id), resolve }));
      settle();
      if (fresh.length) options.pending?.();
      if (urgent || queue.length >= 30 || !durable) void flush();
      return result;
    },
    flush,
    close() {
      closed = true;
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pagehide', onOnline);
      document.removeEventListener('visibilitychange', onHidden);
      // Best effort on navigation; failed events remain durable for a later visit.
      void flush();
    },
  };
}
