import UpdateBanner from './UpdateBanner';
import './update-banner.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './answer-integrity.css';
import { applySavedTheme } from './ThemePicker';
applySavedTheme();
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UpdateBanner />
    <App />
  </React.StrictMode>,
);
