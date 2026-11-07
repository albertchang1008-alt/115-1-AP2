// 互動教材的「開啟／走完」紀錄（2026-11-07 教師要求）。
// diagnostics 文件存 sessions（最近 50 次）與 history（真實 sessionId 的累計）、backfill（上線前推估）；
// progress.activityHistory[活動鍵] 存兩者合計，看板摘要不必另外讀取。
import type { LearningEvent } from './learning';

export const SESSION_LIMIT = 50;
export const SESSION_GAP_MS = 30 * 60 * 1000;
/** 17 份 Antigravity 教材上線日 2026-11-04 00:00（台北）。 */
export const BACKFILL_FROM = Date.UTC(2026, 10, 3, 16, 0, 0);
export const validSessionId = (sid: unknown): sid is string => typeof sid === 'string' && /^[\w-]{1,100}$/.test(sid);

export interface ActivitySession { startedAt: number; lastAt: number; completedAt?: number; maxLevel?: number; estimated?: true }
export interface ActivityCounters { opens: number; completions: number; firstCompletedAt?: number; lastAt?: number }
export interface ActivityBackfill extends ActivityCounters { backfilledAt: number }
export interface ActivityHistoryEntry extends ActivityCounters { estimated?: true }

export function levelOf(nodeId: string | undefined): number | undefined {
  const m = nodeId ? /-L(\d+)-/.exec(nodeId) : null;
  return m ? Number(m[1]) : undefined;
}
function capSessions(sessions: Record<string, ActivitySession>) {
  const keys = Object.keys(sessions);
  if (keys.length <= SESSION_LIMIT) return sessions;
  const keep = keys.sort((a, b) => sessions[b].startedAt - sessions[a].startedAt || a.localeCompare(b)).slice(0, SESSION_LIMIT);
  return Object.fromEntries(keep.sort((a, b) => sessions[a].startedAt - sessions[b].startedAt || a.localeCompare(b)).map((k) => [k, sessions[k]]));
}
const firstOf = (...values: (number | undefined)[]) => {
  const v = values.filter((x): x is number => Number.isFinite(x));
  return v.length ? Math.min(...v) : undefined;
};
const lastOf = (...values: (number | undefined)[]) => {
  const v = values.filter((x): x is number => Number.isFinite(x));
  return v.length ? Math.max(...v) : undefined;
};
function clean<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/** 本批新事件（已去重）套用到 sessions／history。沒帶 sid 的事件只影響 firstCompletedAt。 */
export function applySessionEvents(
  state: { sessions?: Record<string, ActivitySession>; history?: ActivityCounters } | undefined,
  fresh: (LearningEvent & { sid?: string })[],
  at: number,
) {
  const sessions: Record<string, ActivitySession> = { ...(state?.sessions || {}) };
  const history: ActivityCounters = { opens: 0, completions: 0, ...(state?.history || {}) };
  let newSession = false, completed = false;
  const bySid = new Map<string, (LearningEvent & { sid?: string })[]>();
  for (const e of fresh) {
    if (e.type === 'completed') completed = true;
    if (validSessionId(e.sid)) (bySid.get(e.sid) || (bySid.set(e.sid, []), bySid.get(e.sid)!)).push(e);
  }
  for (const [sid, events] of bySid) {
    const old = sessions[sid];
    const s: ActivitySession = old ? { ...old, lastAt: at } : { startedAt: at, lastAt: at };
    if (!old) { newSession = true; history.opens++; history.lastAt = at; }
    const level = lastOf(s.maxLevel, ...events.map((e) => (e.type === 'explore' ? levelOf(e.nodeId) : undefined)));
    if (level !== undefined) s.maxLevel = level;
    if (events.some((e) => e.type === 'completed') && !s.completedAt) { s.completedAt = at; history.completions++; }
    sessions[sid] = s;
  }
  if (completed && !history.firstCompletedAt) history.firstCompletedAt = at;
  return { sessions: capSessions(sessions), history: clean(history), newSession, completed };
}

/** progress.activityHistory 的值：真實紀錄加上推估補登。 */
export function combinedHistory(history: ActivityCounters | undefined, backfill: ActivityBackfill | undefined): ActivityHistoryEntry {
  return clean({
    opens: (history?.opens || 0) + (backfill?.opens || 0),
    completions: (history?.completions || 0) + (backfill?.completions || 0),
    firstCompletedAt: firstOf(history?.firstCompletedAt, backfill?.firstCompletedAt),
    lastAt: lastOf(history?.lastAt, backfill?.lastAt),
    estimated: backfill && (backfill.opens || backfill.completions) ? true as const : undefined,
  });
}

/** 補登：沒有 sessionId 的舊事件依收到時間排序，相鄰間隔超過 30 分鐘視為不同次。 */
export function estimateSessions(items: { at: number; events: { type: string; nodeId?: string }[] }[], from = BACKFILL_FROM) {
  const sorted = items.filter((x) => Number.isFinite(x.at) && x.at >= from).sort((a, b) => a.at - b.at);
  const sessions: Record<string, ActivitySession> = {};
  let current: ActivitySession | undefined, firstCompletedAt: number | undefined;
  for (const item of sorted) {
    if (!current || item.at - current.lastAt > SESSION_GAP_MS) {
      current = { startedAt: item.at, lastAt: item.at, estimated: true };
      sessions[`est-${item.at}`] = current;
    }
    current.lastAt = item.at;
    const level = lastOf(current.maxLevel, ...item.events.map((e) => (e.type === 'explore' ? levelOf(e.nodeId) : undefined)));
    if (level !== undefined) current.maxLevel = level;
    if (item.events.some((e) => e.type === 'completed')) {
      current.completedAt ??= item.at;
      firstCompletedAt ??= item.at;
    }
  }
  const list = Object.values(sessions);
  return {
    sessions,
    counters: clean({
      opens: list.length,
      completions: list.filter((s) => s.completedAt).length,
      firstCompletedAt,
      lastAt: list.length ? list.at(-1)!.startedAt : undefined,
    }) as ActivityCounters,
  };
}

/** 補登寫入：保留真實 session，以新推估取代舊推估，再套 50 筆上限。 */
export function mergeEstimatedSessions(real: Record<string, ActivitySession> | undefined, estimated: Record<string, ActivitySession>) {
  const kept = Object.fromEntries(Object.entries(real || {}).filter(([k, s]) => !k.startsWith('est-') && !s.estimated));
  return capSessions({ ...estimated, ...kept });
}
