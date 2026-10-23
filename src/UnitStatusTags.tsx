import { Course, Unit } from '../shared/model';
import { openingStatusTags, attentionStatusTags } from '../shared/courseStatus';
export default function UnitStatusTags({ draft, published, units, loading, error }: {
  draft: Course; published?: Course; units: Unit[]; loading: boolean; error?: string;
}) {
  return <span className="unit-status-tags">
    {openingStatusTags(units).map(tag => <span className={'badge visibility-' + tag.visibility} key={tag.visibility}>{tag.label}</span>)}
    {error ? <span className="badge update-attention">學生端狀態讀取失敗</span>
      : loading ? <span className="status-loading">正在讀取學生端狀態…</span>
      : attentionStatusTags(draft, published, units).map(tag => <span className="badge update-attention" key={tag}>{tag}</span>)}
  </span>;
}
