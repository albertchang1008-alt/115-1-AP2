export const VERSION_CHECK = { throttleMs: 60_000, intervalMs: 30 * 60_000, timeoutMs: 10_000 };
export function deploymentVersion(value: unknown): string | null {
  const version = (value as { version?: unknown })?.version;
  return typeof version === 'string' && /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(version)
    ? version
    : null;
}
/** Different valid deployments include rollbacks; this never initiates a reload. */
export function createVersionChecker({
  current,
  baseUrl,
  fetcher = fetch,
  now = Date.now,
  onVersion,
}: {
  current: string;
  baseUrl: string;
  fetcher?: typeof fetch;
  now?: () => number;
  onVersion: (version: string | null) => void;
}) {
  let last = -Infinity,
    inflight = false,
    disposed = false;
  let controller: AbortController | null = null;
  return {
    async check() {
      const at = now();
      if (disposed || inflight || at - last < VERSION_CHECK.throttleMs) return;
      last = at;
      inflight = true;
      controller = new AbortController();
      const timer = setTimeout(() => controller?.abort(), VERSION_CHECK.timeoutMs);
      try {
        const url = new URL('version.json', baseUrl);
        url.searchParams.set('_', String(at));
        const response = await fetcher(url.href, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const version = deploymentVersion(await response.json());
        if (!disposed && version) onVersion(version === current ? null : version);
      } catch {
        /* Offline, invalid JSON and request timeouts stay silent. */
      } finally {
        clearTimeout(timer);
        inflight = false;
        controller = null;
      }
    },
    dispose() {
      disposed = true;
      controller?.abort();
    },
  };
}
