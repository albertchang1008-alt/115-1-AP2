import { useEffect, useRef, useState } from 'react';
import { leaveNotice, type LeaveMetrics } from '../shared/answerIntegrity';
import { createLeaveTracker } from './leaveTracker';
export function useLeaveTracking(active: boolean) {
  const tracker = useRef<ReturnType<typeof createLeaveTracker> | null>(null);
  const [notice, setNotice] = useState<LeaveMetrics | null>(null);
  useEffect(() => {
    if (!active) return;
    const current = createLeaveTracker(document, window, setNotice);
    tracker.current = current;
    return () => {
      current.stop();
    };
  }, [active]);
  return {
    notice,
    dismiss: () => setNotice(null),
    stop: () => tracker.current?.stop() || { leaveCount: 0, leaveSeconds: 0 },
  };
}
export function LeaveTrackingNotice({
  notice,
  dismiss,
  applies,
}: {
  notice: LeaveMetrics | null;
  dismiss: () => void;
  applies: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!notice) return;
    const origin = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => origin?.focus();
  }, [notice]);
  if (!notice) return null;
  return (
    <div className="modalshade leave-tracking-shade">
      <section
        ref={panel}
        className="modal leave-tracking-notice"
        role="dialog"
        aria-modal="true"
        aria-label="離開作答畫面提示"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            dismiss();
          }
          if (e.key === 'Tab') {
            e.preventDefault();
            panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
          }
        }}
      >
        <h2>返回作答畫面</h2>
        <p role="status">{leaveNotice(notice, applies)}</p>
        <button className="primary" onClick={dismiss}>
          繼續作答
        </button>
      </section>
    </div>
  );
}
