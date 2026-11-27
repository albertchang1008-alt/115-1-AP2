import type { API } from './service';

const lastWarm = new Map<string, number>();
const interval = 5 * 60_000;

export function warmCallables(api: Pick<API, 'call'>, page: string, names: readonly string[]) {
  const now = Date.now();
  const last = lastWarm.get(page);
  if (last !== undefined && now - last < interval) return;
  lastWarm.set(page, now);
  for (const name of names) void api.call(name, { warm: true }).catch(() => {});
}
