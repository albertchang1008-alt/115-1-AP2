import type { LeaveMetrics } from '../shared/answerIntegrity';
/** A single episode remains open until both visibility and focus have returned. */
export function createLeaveTracker(
  doc: Document,
  win: Window,
  onReturn: (m: LeaveMetrics) => void,
  now: () => number = () => performance.now(),
) {
  let hidden = doc.hidden,
    blurred = false,
    started: number | null = null,
    totalMs = 0,
    count = 0,
    stopped = false;
  const metrics = (): LeaveMetrics => ({
    leaveCount: count,
    leaveSeconds: Math.ceil(
      (totalMs + (started === null ? 0 : Math.max(0, now() - started))) / 1000,
    ),
  });
  function reconcile() {
    if (stopped) return;
    if (hidden || blurred) {
      if (started === null) {
        started = now();
        count++;
      }
    } else if (started !== null) {
      totalMs += Math.max(0, now() - started);
      started = null;
      onReturn(metrics());
    }
  }
  const visibility = () => {
    const wasHidden = hidden;
    hidden = doc.hidden;
    // Mobile browsers may omit focus on return. Visible is authoritative after hidden.
    if (!hidden && (wasHidden || doc.hasFocus())) blurred = false;
    reconcile();
  };
  const blur = () => {
    blurred = true;
    reconcile();
  };
  const focus = () => {
    blurred = false;
    hidden = doc.hidden;
    reconcile();
  };
  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('blur', blur);
  win.addEventListener('focus', focus);
  reconcile();
  return {
    snapshot: metrics,
    stop() {
      if (!stopped) {
        stopped = true;
        doc.removeEventListener('visibilitychange', visibility);
        win.removeEventListener('blur', blur);
        win.removeEventListener('focus', focus);
        if (started !== null) {
          totalMs += Math.max(0, now() - started);
          started = null;
        }
      }
      return metrics();
    },
  };
}
