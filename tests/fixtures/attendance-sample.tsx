import React from 'react';
import { createRoot } from 'react-dom/client';
import AttendanceSample from '../../src/AttendanceSample';
import '../../src/style.css';
import '../../src/attendance-sample.css';
fetch('/sample-data')
  .then((r) => {
    if (!r.ok) throw Error('樣張資料讀取失敗');
    return r.json();
  })
  .then((data) => createRoot(document.getElementById('root')!).render(<AttendanceSample data={data} />))
  .catch((e) => {
    document.getElementById('root')!.textContent = e.message;
  });
