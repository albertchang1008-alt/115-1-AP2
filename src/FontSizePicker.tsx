import { useEffect, useState } from 'react';
// 比照 ThemePicker：用 CSS 變數 --font-scale 讓全站文字（教師後台與學生端共用）可以整體縮放。
// style.css 裡所有 font-size 都寫成 calc(Npx * var(--font-scale, 1))，這裡只要改變數就好。
const scales: Record<string, number> = { small: 0.875, default: 1, large: 1.15, xlarge: 1.3 };
export default function FontSizePicker() {
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem('course-font-scale');
      return saved && saved in scales ? saved : 'default';
    } catch {
      return 'default';
    }
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(scales[size] ?? 1));
    try {
      localStorage.setItem('course-font-scale', size);
    } catch {}
  }, [size]);
  return (
    <label className="fontsize-picker">
      字級
      <select aria-label="文字大小" value={size} onChange={(e) => setSize(e.target.value)}>
        <option value="small">小</option>
        <option value="default">預設</option>
        <option value="large">大</option>
        <option value="xlarge">特大</option>
      </select>
    </label>
  );
}
