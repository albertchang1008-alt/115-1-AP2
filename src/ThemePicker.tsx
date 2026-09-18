import { useEffect, useState } from 'react';
// 預設色系：晴空粉（2026-09-19 教師指定）。使用者自己選過的色系仍以 localStorage 為準。
export const DEFAULT_THEME = 'blossom';
export function savedTheme() { try { return localStorage.getItem('course-theme') || DEFAULT_THEME; } catch { return DEFAULT_THEME; } }
// 開頁就套用，不必等設定面板打開（學生端的色系選單在「顯示設定」面板裡，平常沒有掛載）。
export function applySavedTheme() { document.documentElement.dataset.theme = savedTheme(); }
export default function ThemePicker() {
  const [theme, setTheme] = useState(savedTheme);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('course-theme', theme); } catch {} }, [theme]);
  return <label className="theme-picker">色系<select aria-label="系統色系" value={theme} onChange={(e) => setTheme(e.target.value)}><option value="ocean">海洋藍</option><option value="forest">森林綠</option><option value="violet">紫羅蘭</option><option value="blossom">晴空粉</option><option value="night">夜間</option></select></label>;
}
