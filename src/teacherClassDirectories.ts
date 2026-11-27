import type { API } from './service';

export type ClassDirectoryEntry = { classId: string; name: string; test: boolean };
export type AttendanceClassCards = {
  classes: ClassDirectoryEntry[];
  active: { kind: 'roll' | 'trial' | null; classIds: string[]; endsAt: number | null } | null;
  now: number;
};

function directoryEntry({ classId, name, test }: ClassDirectoryEntry): ClassDirectoryEntry {
  return { classId, name, test };
}

function isDirectoryEntry(value: unknown): value is ClassDirectoryEntry {
  if (!value || typeof value !== 'object') return false;
  const { classId, name, test } = value as Partial<ClassDirectoryEntry>;
  return typeof classId === 'string' && !!classId && typeof name === 'string' && typeof test === 'boolean';
}

function readCache(key?: string): ClassDirectoryEntry[] | undefined {
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    const rows: unknown = raw === null ? undefined : JSON.parse(raw);
    if (Array.isArray(rows) && rows.every(isDirectoryEntry)) return rows.map(directoryEntry);
  } catch {
    // Missing or inaccessible storage falls back to the callable.
  }
}

function createDirectory<T extends { classes: ClassDirectoryEntry[] }>(load: () => Promise<T>, key?: string) {
  let classes = readCache(key);
  let pending: Promise<T> | undefined;
  function refresh({ afterPending = false } = {}): Promise<T> {
    // A refresh after an attendance mutation must read beyond any older request.
    if (pending) return afterPending ? pending.then(() => refresh(), () => refresh()) : pending;
    pending = load().then((result) => {
      const previous = classes;
      const next = result.classes.map(directoryEntry);
      if (previous?.length === next.length && next.every((row, i) =>
        row.classId === previous[i].classId && row.name === previous[i].name && row.test === previous[i].test
      )) {
        return { ...result, classes: previous };
      }
      classes = next;
      if (key) {
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep the in-memory copy. */ }
      }
      return { ...result, classes: next };
    }).finally(() => { pending = undefined; });
    return pending;
  }
  return { snapshot: () => classes, refresh };
}

function cacheKey(api: API, directory: string, courseId: string, teacherUid?: string) {
  if (api.preview || !teacherUid) return;
  return ['teacher-class-directory-v1', directory, teacherUid, courseId].map(encodeURIComponent).join(':');
}

export function attendanceClassDirectory(api: API, courseId: string, teacherUid?: string) {
  return createDirectory(
    () => api.call<AttendanceClassCards>('attendanceClassCards', { courseId }),
    cacheKey(api, 'attendance', courseId, teacherUid),
  );
}

export function quizClassDirectory(api: API, courseId: string, teacherUid?: string) {
  return createDirectory(
    async () => ({ classes: await api.call<ClassDirectoryEntry[]>('zuvioClassDirectory', { courseId }) }),
    cacheKey(api, 'quiz', courseId, teacherUid),
  );
}

export function onTeacherIdle(prefetch: () => void) {
  if (typeof window.requestIdleCallback === 'function' && typeof window.cancelIdleCallback === 'function') {
    const id = window.requestIdleCallback(prefetch, { timeout: 1000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(prefetch, 200);
  return () => window.clearTimeout(id);
}
