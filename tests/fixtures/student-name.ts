import { Course, emptyProgress, orderedChapters, summarizeUnit } from '../../shared/model';

export type NameScenario = 'done' | 'late' | 'inProgress' | 'todo' | 'overdue' | 'locked';
export function studentNameFixture(state: NameScenario, required = true, studentName = '王小明') {
  const dueAt = state === 'late' || state === 'overdue' ? '2026-01-01T12:00' : '';
  const opensAt = state === 'locked' ? '2099-01-01T12:00' : '';
  const chapter = { title: state === 'late' ? '循環生理複習考' : '循環生理', description: '題目分類達標後完成本單元。', required, threshold: 80, opensAt, dueAt, activities: [] };
  const course: Course = {
    id: 'student-name-fixture', title: '解剖生理學', description: '學習進度', term: '115-1', classIds: ['A'], sheetsUrl: '', studentName,
    chapters: { '循環生理': chapter }, chapterOrder: ['循環生理'],
    units: [{ id: 'circulation', group: '循環生理', title: '循環生理題目分類', description: '', required, threshold: 80, opensAt, dueAt, bankVersion: 'fixture-bank', questionCount: 10, activities: [],
      ...(state === 'late' ? { review: { sourceUnitIds: ['source'], sourceVersions: { source: 'v1' }, drawCount: 10, allocation: { source: 10 }, builtAt: 1, history: [] } } : {}) }],
  };
  const progress = emptyProgress();
  if (state === 'done' || state === 'late' || state === 'inProgress') {
    progress.units.circulation = { best: state === 'inProgress' ? 50 : 90, attempts: 1, fullAttempts: 1, updatedAt: 2,
      ...(state === 'inProgress' ? {} : { passedAt: Date.parse('2026-01-02T12:00:00+08:00') }) };
  }
  const { name, units } = orderedChapters(course)[0];
  const summary = summarizeUnit({ ...chapter, id: name, bankVersion: '', categories: units, activityOwnerKey: `chapter:${name}` }, progress);
  return { course, progress, row: { name, chapter, units, summary } };
}
