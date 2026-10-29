import { parseCourseTime, type Unit } from './model';
export interface UsageRecord {
  uid: string;
  at: number;
  unitId?: string;
  kind: 'attempt' | 'learning' | 'progress';
}
export interface UsageStats {
  daily: { date: string; users: number; records: number }[];
  weekly: { monday: string; users: number }[];
  heat: number[][];
  recent: { uid: string; name: string; studentId: string; at: number }[];
  deadlines: {
    unitId: string;
    title: string;
    within: number;
    total: number;
    ratio: number | null;
  }[];
  generatedAt: number;
  reads?: Record<string, number>;
}
const DAY = 86400000,
  OFFSET = 8 * 3600000;
export function taipeiDay(at: number) {
  return new Date(at + OFFSET).toISOString().slice(0, 10);
}
export function computeUsageStats(
  records: UsageRecord[],
  students: { uid: string; name: string; studentId: string }[],
  units: Unit[],
  now: number,
): UsageStats {
  const end = Date.parse(taipeiDay(now) + 'T00:00:00+08:00') + DAY,
    start = end - 28 * DAY;
  const daily = Array.from({ length: 28 }, (_, i) => ({
    date: taipeiDay(start + i * DAY),
    users: 0,
    records: 0,
  }));
  const byDay = new Map(daily.map((d) => [d.date, new Set<string>()])),
    weeks = new Map<string, Set<string>>();
  for (const d of daily) {
    const dt = new Date(d.date + 'T00:00:00Z');
    dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
    weeks.set(dt.toISOString().slice(0, 10), new Set());
  }
  const members = new Map(students.map((s) => [s.uid, s])),
    heat = Array.from({ length: 7 }, () => Array<number>(12).fill(0)),
    recent = new Map<string, number>();
  const deadlines = units
    .filter((u) => !u.review && parseCourseTime(u.dueAt) > 0)
    .map((u) => ({
      unitId: u.id,
      title: u.title,
      within: 0,
      total: 0,
      ratio: null as number | null,
    }));
  for (const r of records) {
    if (!members.has(r.uid) || !Number.isFinite(r.at) || r.at < start || r.at > now) continue;
    const date = taipeiDay(r.at),
      d = daily.find((x) => x.date === date)!;
    d.records++;
    byDay.get(date)!.add(r.uid);
    const dt = new Date(r.at + OFFSET),
      weekday = (dt.getUTCDay() + 6) % 7;
    heat[weekday][Math.floor(dt.getUTCHours() / 2)]++;
    const monday = new Date(date + 'T00:00:00Z');
    monday.setUTCDate(monday.getUTCDate() - weekday);
    weeks.get(monday.toISOString().slice(0, 10))!.add(r.uid);
    if (r.at >= now - 600000) recent.set(r.uid, Math.max(recent.get(r.uid) || 0, r.at));
    if (r.kind === 'attempt') {
      const entry = deadlines.find((x) => x.unitId === r.unitId);
      if (entry) {
        entry.total++;
        const due = parseCourseTime(units.find((u) => u.id === r.unitId)!.dueAt);
        if (r.at >= due - DAY && r.at <= due) entry.within++;
      }
    }
  }
  for (const d of daily) d.users = byDay.get(d.date)!.size;
  for (const d of deadlines) d.ratio = d.total ? d.within / d.total : null;
  return {
    daily,
    weekly: [...weeks].map(([monday, s]) => ({ monday, users: s.size })),
    heat,
    recent: [...recent]
      .sort((a, b) => b[1] - a[1])
      .map(([uid, at]) => ({ ...members.get(uid)!, at })),
    deadlines,
    generatedAt: now,
  };
}
