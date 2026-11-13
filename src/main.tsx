import UpdateBanner from './UpdateBanner';
import './update-banner.css';
import './question-manager-sample.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './answer-integrity.css';
import './zuvio-exams.css';
import './zuvio-ext-sample.css';
import ZuvioExtSample from './ZuvioExtSample';
import { applySavedTheme } from './ThemePicker';
applySavedTheme();
const extSampleShot = new URLSearchParams(window.location.search).get('zuvio-ext-sample');
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {extSampleShot ? (
      <ZuvioExtSample shot={extSampleShot} />
    ) : (
      <>
        <UpdateBanner />
        <App />
      </>
    )}
  </React.StrictMode>,
);
