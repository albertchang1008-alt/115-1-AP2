import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import ZuvioExams from '../../src/ZuvioExams';
import { ZuvioMoodOverlay, type ActiveMoodPrompt } from '../../src/ZuvioMoodCard';
import { sampleZuvioApi, type ZuvioApi, type Sitting } from '../../src/zuvioApi';
import { SAMPLE_POOL } from '../../shared/zuvioSamplePool';
import type { MoodCode } from '../../shared/zuvioExt';
import '../../src/style.css';
import '../../src/zuvio-exams.css';
import '../../src/zuvio-ext-sample.css';

const q = new URLSearchParams(window.location.search);
const viewMode = q.get('view') || 'teacher';
const fontScale = q.get('scale') || '1';
document.documentElement.style.setProperty('--font-scale', fontScale);

function WrappedZuvioExams() {
  const [toast, setToast] = useState('');
  const [cleanupsCount, setCleanupsCount] = useState(0);

  // Wrapped API that tracks cleanupOnly and simulates pendingCleanup
  const api = useMemo<ZuvioApi>(() => {
    const base = sampleZuvioApi(SAMPLE_POOL);
    return {
      ...base,
      async deleteResults(id, sittingId, cleanupOnly) {
        if (cleanupOnly) {
          (window as any).__lastCleanupOnly = true;
          (window as any).__cleanupsCount = ((window as any).__cleanupsCount || 0) + 1;
        } else {
          (window as any).__lastDeleteWithoutCleanup = true;
        }
        await base.deleteResults(id, sittingId, cleanupOnly);
        // If this was an actual delete (not cleanupOnly), set pendingCleanup so user can test cleanup button
        const exam = await base.getExam(id);
        const s = exam.summary.sittings.find((x: Sitting) => x.id === sittingId);
        if (!cleanupOnly && s) {
          s.pendingCleanup = true;
        }
      },
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      {toast && <div id="test-toast" className="toast" style={{ pointerEvents: 'none', position: 'fixed', top: 10, right: 10, background: '#1a5fb4', color: '#fff', padding: '8px 16px', borderRadius: 8, zIndex: 9999 }}>{toast}</div>}
      <ZuvioExams api={api} notify={(m) => setToast(m)} moodEnabled={true} />
    </div>
  );
}

function StudentMoodFixture() {
  const [submitted, setSubmitted] = useState(false);
  const prompt: ActiveMoodPrompt = {
    active: true,
    examId: 'demo-exam',
    sittingId: 's1',
    sittingLabel: '甲班 第1次',
    closesAt: Date.now() + 600000,
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f5f7fa' }}>
      <ZuvioMoodOverlay
        prompt={prompt}
        onSubmit={async (sittingId, mood: MoodCode) => {
          (window as any).__submittedMood = mood;
          setSubmitted(true);
          return {
            mood,
            feedback: '很棒的節奏！帶著平穩清晰的思緒，專注在當下的每道題目上。',
          };
        }}
        onDismissAfterSubmit={() => {
          (window as any).__dismissed = true;
        }}
      />
    </div>
  );
}

function Root() {
  if (viewMode === 'student-mood') {
    return <StudentMoodFixture />;
  }
  return <WrappedZuvioExams />;
}

createRoot(document.getElementById('root')!).render(<Root />);
