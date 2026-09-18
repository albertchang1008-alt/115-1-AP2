export type StudentRoute =
  | { kind: 'home' }
  | { kind: 'unit'; unitId: string; tab: 'pre' | 'class' | 'post' | 'practice' }
  | { kind: 'activity'; unitId: string; activityId: string }
  | { kind: 'quiz'; unitId: string; mode: 'full' | 'draw'; count?: number }
  | { kind: 'flashcard'; unitId: string }
  | { kind: 'mixed'; count: number }
  | { kind: 'wrongcards'; unitId: string; range: '24h' | '7d' | 'all' };

export function parseStudentRoute(hash: string, courseId: string): StudentRoute | null {
  const path = hash.replace(/^#/, '');
  const [pathname, rawQuery = ''] = path.split('?');
  const base = `/course/${encodeURIComponent(courseId)}`;
  if (pathname === base) return { kind: 'home' };
  if (!pathname.startsWith(base + '/')) return null;
  const rest = pathname.slice(base.length);
  const q = new URLSearchParams(rawQuery);
  if (rest === '/mixed') { const n = Number(q.get('n')); return Number.isInteger(n) && [10, 20, 30, 50].includes(n) ? { kind: 'mixed', count: n } : null; }
  const unit = rest.match(/^\/unit\/([^/]+)$/);
  if (unit) {
    const tab = q.get('tab');
    return { kind: 'unit', unitId: decodeURIComponent(unit[1]), tab: ['pre', 'class', 'post', 'practice'].includes(tab || '') ? tab as 'pre' | 'class' | 'post' | 'practice' : 'pre' };
  }
  const activity = rest.match(/^\/unit\/([^/]+)\/activity\/([^/]+)$/);
  if (activity) return { kind: 'activity', unitId: decodeURIComponent(activity[1]), activityId: decodeURIComponent(activity[2]) };
  const quiz = rest.match(/^\/unit\/([^/]+)\/quiz$/);
  if (quiz) { const n = Number(q.get('n')); return { kind: 'quiz', unitId: decodeURIComponent(quiz[1]), mode: q.get('mode') === 'draw' ? 'draw' : 'full', ...(Number.isInteger(n) && n > 0 ? { count: n } : {}) }; }
  const flashcard = rest.match(/^\/unit\/([^/]+)\/flashcard$/);
  if (flashcard) return { kind: 'flashcard', unitId: decodeURIComponent(flashcard[1]) };
  const wrongcards = rest.match(/^\/unit\/([^/]+)\/wrongcards$/);
  if (wrongcards) return { kind: 'wrongcards', unitId: decodeURIComponent(wrongcards[1]), range: ['24h', '7d', 'all'].includes(q.get('range') || '') ? q.get('range') as '24h' | '7d' | 'all' : '7d' };
  return null;
}
