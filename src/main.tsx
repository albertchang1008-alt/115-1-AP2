import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ThemePicker from './ThemePicker';
import './style.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemePicker /><App />
  </React.StrictMode>,
);
