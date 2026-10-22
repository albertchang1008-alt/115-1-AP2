type Outcome = 'retry' | 'discard' | 'hold';
// discard：伺服器明確拒絕內容（格式錯誤、教材版本已更新、活動未開放）→ 丟棄並記住 ID，不重送。
// retry：暫時性錯誤 → 保留，定時重送。
// hold：其餘（登入失效、權限、未分類）→ 保留在本機，本頁不再重送；下次開啟頁面（重新登入後）再送。
function classify(error: unknown): Outcome {
  const value = error as { code?: unknown; message?: unknown } | null;
  const code = typeof value?.code === 'string' ? value.code.replace(/^functions\//, '') : '';
  if (['invalid-argument', 'failed-precondition'].includes(code)) return 'discard';
  if (['unavailable', 'deadline-exceeded', 'internal', 'network-request-failed', 'resource-exhausted', 'aborted'].includes(code)) return 'retry';
  if (!code && /network|offline|fetch|socket|connection|斷線|連線/i.test(String(value?.message || ''))) return 'retry';
  return 'hold';
}
// Persist first; acknowledge only IDs accepted by the server. Retries retain IDs.
export function eventBatcher<T extends { id: string }>(options: {
  key: string;
  valid: (event: T) => boolean;
  send: (events: T[]) => Promise<string[]>;
  pending?: () => void;
  saved?: (events: T[], remaining: number) => void;
  failed?: () => void;
  rejected?: (error: unknown) => void;
  held?: (error: unknown) => void;
  // 本機無法寫入：事件只在記憶體，關頁會遺失。
  volatile?: () => void;
}) {
  let queue: T[] = [], closed = false, held = false, flight: Promise<void> | null = null;
  const accepted = new Set<string>();
  const discarded = new Set<string>();
  const discardedKey = `${options.key}:discarded`;
  let rejectionShown = false;
  const readDiscarded = () => {
    const stored = JSON.parse(localStorage.getItem(discardedKey) || '[]');
    if (Array.isArray(stored)) for (const id of stored.slice(-2000)) if (typeof id === 'string') discarded.add(id);
  };
  try { readDiscarded(); } catch { options.failed?.(); }
  let waiters: { ids: string[]; resolve: (ids: string[]) => void }[] = [];
  const persist = () => {
    try {
      // An old view may finish saving after a new view opens the same queue.
      // Merge durable, unconfirmed IDs so its completion cannot erase newer events.
      readDiscarded();
      const stored = JSON.parse(localStorage.getItem(options.key) || '[]');
      const merged = new Map<string, T>();
      for (const event of [...(Array.isArray(stored) ? stored : []), ...queue]) {
        if (options.valid(event) && !accepted.has(event.id) && !discarded.has(event.id)) merged.set(event.id, event);
      }
      queue = [...merged.values()];
      localStorage.setItem(options.key, JSON.stringify(queue));
      return true;
    }
    catch { if (!closed) (options.volatile ?? options.failed)?.(); return false; }
  };
  try {
    const stored = JSON.parse(localStorage.getItem(options.key) || '[]');
    if (Array.isArray(stored)) {
      const seen = new Set<string>();
      queue = stored.filter((e: T) => options.valid(e) && !discarded.has(e.id) && !seen.has(e.id) && !!seen.add(e.id)).slice(0, 2000);
    }
  } catch { options.failed?.(); }
  function settle(failed = false) {
    const pending = [] as typeof waiters;
    for (const waiter of waiters) {
      if (failed || waiter.ids.every((id) => accepted.has(id) || discarded.has(id)))
        waiter.resolve(waiter.ids.filter((id) => accepted.has(id)));
      else pending.push(waiter);
    }
    waiters = pending;
  }
  function flush(): Promise<void> {
    if (flight) return flight;
    // 本頁已因登入／權限問題暫停：事件仍在本機，不再打雲端。
    if (held) { settle(true); return Promise.resolve(); }
    if (!queue.length) return Promise.resolve();
    flight = (async () => {
      try {
        while (queue.length) {
          const batch = queue.slice(0, 30);
          let ids: Set<string>;
          try { ids = new Set(await options.send(batch)); }
          catch (error) {
            const outcome = classify(error);
            if (outcome === 'retry') throw error;
            if (outcome === 'hold') {
              // 只有確實寫入本機，才能承諾「重開後送出」並停止本頁重送。
              // 寫不進本機時事件只在記憶體：維持重送（外層 catch 顯示暫時無法儲存），避免關頁後遺失。
              if (!persist()) throw error;
              held = true;
              if (!closed) options.held ? options.held(error) : options.failed?.();
              settle(true);
              return;
            }
            for (const event of batch) discarded.add(event.id);
            queue = queue.filter((e) => !discarded.has(e.id));
            try {
              readDiscarded();
              // Persist only IDs, never rejected payloads; bound the replay guard.
              localStorage.setItem(discardedKey, JSON.stringify([...discarded].slice(-2000)));
            } catch { if (!closed) options.failed?.(); }
            persist();
            settle();
            if (!closed && !rejectionShown) { rejectionShown = true; options.rejected?.(error); }
            continue;
          }
          const saved = batch.filter((e) => ids.has(e.id));
          if (!saved.length) throw Object.assign(Error('伺服器未確認事件'), { code: 'functions/internal' });
          for (const event of saved) accepted.add(event.id);
          queue = queue.filter((e) => !accepted.has(e.id));
          persist();
          if (!closed) options.saved?.(saved, queue.length);
          settle();
          if (saved.length !== batch.length) throw Object.assign(Error('事件尚未全部確認'), { code: 'functions/internal' });
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
      const fresh = events.filter((e, i) => !accepted.has(e.id) && !discarded.has(e.id) && !queue.some((q) => q.id === e.id) && events.findIndex((x) => x.id === e.id) === i);
      if (queue.length + fresh.length > 2000) { options.failed?.(); return Promise.resolve([]); }
      queue.push(...fresh);
      const durable = persist();
      const result = new Promise<string[]>((resolve) => waiters.push({ ids: events.map((e) => e.id), resolve }));
      settle(held);
      if (fresh.length && !held) options.pending?.();
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
