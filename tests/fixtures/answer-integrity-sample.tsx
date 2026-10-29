import React from 'react';
import { createRoot } from 'react-dom/client';
import AnswerIntegritySample from '../../src/AnswerIntegritySample';
fetch('/sample-data')
  .then((r) => {
    if (!r.ok) throw Error('樣張資料讀取失敗');
    return r.json();
  })
  .then((data) =>
    createRoot(document.getElementById('root')!).render(<AnswerIntegritySample data={data} />),
  )
  .catch((e) => {
    document.getElementById('root')!.textContent = e.message;
  });
