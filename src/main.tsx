import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ThemePicker from './ThemePicker';
import FontSizePicker from './FontSizePicker';
import './style.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="prefs-bar"><ThemePicker /><FontSizePicker /></div><App />
  </React.StrictMode>,
);
