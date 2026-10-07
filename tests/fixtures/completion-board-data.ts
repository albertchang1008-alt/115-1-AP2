import type { Chapter, Course, Progress, Unit } from '../../shared/model';
import type { CompletionStudent } from '../../shared/completionBoard';
export const fixtureNow = Date.now();
const day = 86400000,
  due = new Date(fixtureNow - day).toISOString(),
  future = new Date(fixtureNow + 7 * day).toISOString();
const chapter = (title: string, extra: Partial<Chapter> = {}): Chapter => ({
  title,
  description: '',
  required: true,
  threshold: 80,
  opensAt: '',
  dueAt: future,
  activities: [],
  ...extra,
});
const activity = {
  id: 'read',
  title: '互動教材',
  type: 'html' as const,
  phase: 'before' as const,
  url: '',
  description: '',
  tracking: 'interactive' as const,
};
const chapters = {
  血液: chapter('血液', { dueAt: due, activities: [activity] }),
  心臟: chapter('心臟'),
  呼吸系統: chapter('呼吸系統', { opensAt: future }),
  補充: chapter('補充', { required: false, dueAt: '' }),
};
const unit = (id: string, group: keyof typeof chapters, title: string): Unit => ({
  ...chapters[group],
  id,
  group,
  title,
  activities: [],
  bankVersion: 'v1',
});
export const fixtureCourse: Course = {
  id: 'completion-test',
  title: '完成度看板測試',
  description: '',
  term: '115-1',
  sheetsUrl: '',
  classIds: ['護二甲', '護二乙'],
  chapterOrder: ['血液', '心臟', '呼吸系統', '補充'],
  chapters,
  units: [
    unit('blood1', '血液', '血液成分'),
    unit('blood2', '血液', '紅血球'),
    unit('heart', '心臟', '心臟構造'),
    unit('resp', '呼吸系統', '呼吸道構造'),
    unit('opt', '補充', '延伸閱讀'),
  ],
  classUnits: {
    護二甲: ['blood1', 'blood2', 'heart', 'resp', 'opt'],
    護二乙: ['blood1', 'heart', 'opt'],
  },
  chapterOverrides: {
    護二乙: { 血液: { dueAt: future }, 心臟: { dueAt: due }, 補充: { required: false } },
  },
};
export const fixtureRows: Record<string, CompletionStudent[]> = {};
for (const [classId, count] of [
  ['護二甲', 8],
  ['護二乙', 10],
] as const) {
  fixtureRows[classId] = Array.from({ length: count }, (_, i) => {
    const p: Progress = { units: {}, activities: {} };
    const score = (id: string, best: number, passedAt?: number) => {
      p.units[id] = { best, attempts: 2, updatedAt: fixtureNow, ...(passedAt ? { passedAt } : {}) };
    };
    if (i === 0 || i === 1) {
      score('blood1', 95, i === 1 ? fixtureNow : fixtureNow - 2 * day);
      score('blood2', 90, fixtureNow - 2 * day);
      p.activities['chapter:血液_read'] = { position: 1, completed: true, updatedAt: fixtureNow };
    }
    if (i === 0) {
      score('heart', 90, fixtureNow - 2 * day);
      score('resp', 90, fixtureNow - 2 * day);
      score('opt', 85);
    }
    if (i === 1) score('heart', 60);
    if (i === 2) score('blood1', 50);
    if (i === 3)
      p.activities['chapter:血液_read'] = { position: 1, completed: true, updatedAt: fixtureNow };
    if (i === 4) {
      score('blood1', 90);
      score('blood2', 90);
    }
    if (classId === '護二乙' && i < 4)
      score('heart', 90, i === 2 ? fixtureNow : fixtureNow - 2 * day);
    return {
      name: i === 0 ? '陳盈宥' : `${classId === '護二甲' ? '林' : '謝'}同學${i + 1}`,
      studentId: `${classId === '護二甲' ? '110510' : '110520'}${String(i + 1).padStart(3, '0')}`,
      email: `${classId}-${i}@example.test`,
      classId,
      enabled: i !== 6,
      uid: i === 5 ? null : `uid-${classId}-${i}`,
      progress: p,
    };
  });
}
