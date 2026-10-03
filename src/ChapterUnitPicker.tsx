import { useEffect, useState } from 'react';
import { Course, orderedChapters } from '../shared/model';

export interface ChapterUnitSelection {
  chapterName: string;
  unitId: string;
}

// 空的單元名稱表示「全部」，不與教師自訂的單元代碼衝突。
export function resolveChapterUnit(course: Course, value: ChapterUnitSelection, allowAll = false): ChapterUnitSelection {
  if (allowAll && !value.chapterName) return { chapterName: '', unitId: 'all' };
  const rows = orderedChapters(course);
  const row = rows.find((r) => r.name === value.chapterName) || rows[0];
  return {
    chapterName: row?.name || '',
    unitId: row?.units.find((u) => u.id === value.unitId)?.id || row?.units[0]?.id || '',
  };
}

export function useChapterUnitSelection(course: Course, allowAll = false) {
  const [value, setValue] = useState(() => resolveChapterUnit(course, { chapterName: '', unitId: '' }, allowAll));
  const selected = resolveChapterUnit(course, value, allowAll);
  useEffect(() => {
    if (value.chapterName !== selected.chapterName || value.unitId !== selected.unitId) setValue(selected);
  }, [value.chapterName, value.unitId, selected.chapterName, selected.unitId]);
  return [selected, setValue] as const;
}

export default function ChapterUnitPicker({ course, value, onChange, allowAll = false, disabled = false }: {
  course: Course;
  value: ChapterUnitSelection;
  onChange: (value: ChapterUnitSelection) => void;
  allowAll?: boolean;
  disabled?: boolean;
}) {
  const rows = orderedChapters(course);
  const selected = resolveChapterUnit(course, value, allowAll);
  const units = rows.find((r) => r.name === selected.chapterName)?.units || [];
  return <>
    <label className="field"><span>單元</span><select aria-label="單元" value={selected.chapterName} disabled={disabled || !rows.length}
      onChange={(e) => onChange(resolveChapterUnit(course, { chapterName: e.target.value, unitId: '' }, allowAll))}>
      {allowAll && <option value="">全部</option>}
      {!allowAll && !rows.length && <option value="">尚無單元</option>}
      {rows.map((row) => <option key={row.name} value={row.name}>{row.chapter.title}</option>)}
    </select></label>
    <label className="field"><span>次單元</span><select aria-label="次單元" value={selected.unitId} disabled={disabled || !units.length || (allowAll && !selected.chapterName)}
      onChange={(e) => onChange({ ...selected, unitId: e.target.value })}>
      {allowAll && !selected.chapterName ? <option value="all">全部已載入次單元</option> : !units.length && <option value="">尚無次單元</option>}
      {units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
    </select></label>
  </>;
}
