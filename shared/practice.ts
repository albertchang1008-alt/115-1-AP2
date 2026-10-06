import {
  Progress,
  Unit,
  Question,
  wrongEntries,
  wrongGroups,
  shuffle,
  isReviewUnit,
  unitVisibility,
} from './model';
export type PracticeMode = 'flashcard' | 'quiz' | 'review';
export interface PracticeRow {
  q: Question;
  unit: Unit;
}
/** 與 1.6.5 MixedPractice 相同候選篩選，保留 current 的選看與已達標分類。 */
export function mixedCandidates(units: Unit[]): Unit[] {
  return units.filter(
    (u) => !isReviewUnit(u) && unitVisibility(u) === 'current' && !!u.bankVersion,
  );
}
export function mixedScope(
  units: Unit[],
  progress: Progress,
  excluded: readonly string[],
  now = Date.now(),
) {
  const candidates = mixedCandidates(units),
    validIds = new Set(candidates.map((u) => u.id));
  const excludedIds = new Set(excluded.filter((id) => validIds.has(id)));
  const rows = candidates.map((unit) => {
    const groups = wrongGroups(wrongEntries(progress, unit.id, unit.bankVersion, unit), now);
    const due = Object.keys(groups.due).length,
      today = Object.keys(groups.today).length;
    const total = unit.questionCount || 0;
    return {
      unit,
      selected: !excludedIds.has(unit.id),
      total,
      due,
      today,
      wrong: due + today,
      unseen: Math.max(0, total - Object.keys(progress.attempted?.[unit.id] || {}).length),
    };
  });
  const groups = [...new Set(rows.map((r) => r.unit.group || '未分類'))].map((name) => {
    const children = rows.filter((r) => (r.unit.group || '未分類') === name),
      selected = children.filter((r) => r.selected).length;
    return {
      name,
      rows: children,
      selected,
      total: children.length,
      checked: selected === children.length,
      partial: selected > 0 && selected < children.length,
    };
  });
  const selected = rows.filter((r) => r.selected);
  return {
    rows,
    groups,
    excluded: [...excludedIds],
    selected: selected.map((r) => r.unit),
    count: selected.length,
    ...selected.reduce(
      (s, r) => ({
        total: s.total + r.total,
        due: s.due + r.due,
        today: s.today + r.today,
        unseen: s.unseen + r.unseen,
      }),
      { total: 0, due: 0, today: 0, unseen: 0 },
    ),
  };
}
/** 所有分群在洗牌前互斥；今天剛錯一律不進抽題未作答優先群。 */
export function selectPracticeRows(
  rows: PracticeRow[],
  progress: Progress,
  mode: PracticeMode,
  count: number,
  now = Date.now(),
): PracticeRow[] {
  const groups = new Map<string, ReturnType<typeof wrongGroups>>();
  for (const { unit } of rows)
    if (!groups.has(unit.id))
      groups.set(
        unit.id,
        wrongGroups(wrongEntries(progress, unit.id, unit.bankVersion, unit), now),
      );
  const today = rows.filter(({ q, unit }) => groups.get(unit.id)!.today[q.id]);
  const due = rows.filter(({ q, unit }) => groups.get(unit.id)!.due[q.id]);
  if (mode === 'review')
    return shuffle(
      [...due]
        .sort((a, b) => {
          const ea = groups.get(a.unit.id)!.due[a.q.id],
            eb = groups.get(b.unit.id)!.due[b.q.id];
          return (
            eb.n - ea.n ||
            ea.at - eb.at ||
            a.unit.id.localeCompare(b.unit.id) ||
            a.q.id.localeCompare(b.q.id)
          );
        })
        .slice(0, count),
    );
  const unseen = rows.filter(
    ({ q, unit }) =>
      !groups.get(unit.id)!.today[q.id] &&
      !groups.get(unit.id)!.due[q.id] &&
      !progress.attempted?.[unit.id]?.[q.id],
  );
  const other = rows.filter(
    ({ q, unit }) =>
      !groups.get(unit.id)!.due[q.id] &&
      (groups.get(unit.id)!.today[q.id] || progress.attempted?.[unit.id]?.[q.id]),
  );
  return (
    mode === 'flashcard'
      ? [
          ...shuffle(today),
          ...shuffle(due),
          ...shuffle(unseen),
          ...shuffle(other.filter((r) => !groups.get(r.unit.id)!.today[r.q.id])),
        ]
      : [...shuffle(due), ...shuffle(unseen), ...shuffle(other)]
  ).slice(0, count);
}
