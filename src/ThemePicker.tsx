import { useEffect, useState } from 'react';
export default function ThemePicker() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('course-theme') || 'ocean'; } catch { return 'ocean'; } });
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('course-theme', theme); } catch {} }, [theme]);
  return <label className="theme-picker">色系<select aria-label="系統色系" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="ocean">海洋藍</option><option value="forest">森林綠</option><option value="violet">紫羅蘭</option><option value="blossom">晴空粉</option><option value="night">夜間</option></select></label>;
}
