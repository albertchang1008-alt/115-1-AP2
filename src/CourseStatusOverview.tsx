import { Course } from '../shared/model';
import { courseStatusRows } from '../shared/courseStatus';
export default function CourseStatusOverview({ draft, published, loading, error, reload }: {
  draft: Course; published?: Course; loading: boolean; error?: string; reload: () => void;
}) {
  const names = (ids: string[], source = draft) => ids.map(id => source.classNames?.[id] || id).join('、');
  return <section className="panel course-status" aria-label="開放狀態總覽"><div className="sectionhead"><h2>開放狀態總覽</h2><button onClick={reload}>重新讀取學生端</button></div>
    <p className="muted">開放班級是目前草稿的勾選；「學生現在看得到」依學生端版本與開放狀態計算。</p>
    {loading ? <p role="status">正在讀取學生端狀態…</p> : error ? <p role="alert" className="error">無法讀取學生端狀態：{error}。請重新讀取後再更新。</p> : <table className="course-status-table"><caption className="sr-only">章節與單元開放狀態</caption><thead><tr>{['章節／單元','開放狀態','開放班級','學生端狀態','學生現在看得到'].map(s => <th key={s} scope="col">{s}</th>)}</tr></thead><tbody>
      {courseStatusRows(draft, published).map(row => <tr key={row.unit.id} data-status-unit={row.unit.id}>
        <td data-label="章節／單元"><strong>{row.chapter}</strong><span className="status-unit-title">{row.unit.title}</span>{row.removed && <small>草稿已移除，更新後將從學生端移除</small>}</td>
        <td data-label="開放狀態"><span className={'badge visibility-' + (row.unit.visibility || 'current')}>{row.visibility}</span></td>
        <td data-label="開放班級">{row.removed ? '草稿已移除' : names(row.classes) || '沒有勾選班級'}</td>
        <td data-label="學生端狀態">{row.status}</td>
        <td data-label="學生現在看得到">{row.visibleClasses.length ? names(row.visibleClasses, published || draft) : row.reasons.join('；')}{row.visibleClasses.length > 0 && row.status === '有修改未更新' && <small>目前看到的是上次更新的內容與班級設定</small>}</td>
      </tr>)}
    </tbody></table>}
    {!loading && !error && !draft.units.length && <p className="muted">尚無單元。</p>}
  </section>;
}
