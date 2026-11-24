import { useState } from 'react';
import {
  MOOD_QUESTION,
  MOOD_STUDENT_STATES,
  MOOD_SUBNOTE,
  type MoodCode,
} from '../shared/zuvioExt';

export function MoodLineIcon({ code, color }: { code: MoodCode; color: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (code === 'red_volcano') {
    return (
      <svg {...common}>
        <path d="M5 20L9.5 10h5L19 20H5z" />
        <path d="M12 10V5M9 7L7 4M15 7l2-3" />
      </svg>
    );
  }
  if (code === 'yellow_rubberband') {
    return (
      <svg {...common}>
        <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" />
      </svg>
    );
  }
  if (code === 'blue_caterpillar') {
    return (
      <svg {...common}>
        <path d="M6 14a4 4 0 0 1 .8-7.9A5 5 0 0 1 16.5 7a3.5 3.5 0 0 1 .5 7H6z" />
        <path d="M8 17v3M12 17v3M16 17v3" />
      </svg>
    );
  }
  if (code === 'green_flow') {
    return (
      <svg {...common}>
        <path d="M4 10h11a2.5 2.5 0 1 0-2.5-2.5" />
        <path d="M4 15h14a2.5 2.5 0 1 1-2.5 2.5" />
        <path d="M4 20h7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 9h16M3 13h18M5 17h14" />
    </svg>
  );
}

export interface ActiveMoodPrompt {
  active: boolean;
  sittingId?: string;
  sittingLabel?: string;
  closesAt?: number;
  submitted?: boolean;
  myMood?: MoodCode;
  feedback?: string;
}

export function ZuvioMoodOverlay({
  prompt,
  onSubmit,
  onDismissAfterSubmit,
}: {
  prompt: ActiveMoodPrompt;
  onSubmit: (sittingId: string, mood: MoodCode) => Promise<{ mood: MoodCode; feedback: string }>;
  onDismissAfterSubmit: () => void;
}) {
  const [selected, setSelected] = useState<MoodCode | null>(prompt.myMood || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ mood: MoodCode; feedback: string } | null>(
    prompt.submitted && prompt.myMood
      ? { mood: prompt.myMood, feedback: prompt.feedback || '' }
      : null,
  );

  if (!prompt.active || !prompt.sittingId) return null;

  const submit = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await onSubmit(prompt.sittingId!, selected);
      setDone(res);
    } catch (e: any) {
      setErr(e?.message || '送出失敗，請重試');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const meta = MOOD_STUDENT_STATES.find((s) => s.code === done.mood);
    return (
      <div className="zext-overlay" role="dialog" aria-modal="true" aria-label="課前狀態簽到完成">
        <div className="zext-student-card">
          <div className="zext-badge-row">
            <span className="zext-pill">課前簽到完成{prompt.sittingLabel ? ` · ${prompt.sittingLabel}` : ''}</span>
          </div>
          <h1 className="zext-q">{meta?.label}</h1>
          <div className="zext-feedback-box" style={{ borderLeftColor: meta?.color || '#3D9970' }}>
            <p className="zext-feedback-text">{done.feedback || meta?.feedback}</p>
          </div>
          <p className="zext-subnote">已送出（不可更改）。祝你接下來作答順利！</p>
          <button type="button" className="zext-submit" onClick={onDismissAfterSubmit}>
            回到課程畫面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="zext-overlay" role="dialog" aria-modal="true" aria-label="課前狀態簽到">
      <div className="zext-student-card">
        <div className="zext-badge-row">
          <span className="zext-pill">課前簽到{prompt.sittingLabel ? ` · ${prompt.sittingLabel}` : ''}</span>
        </div>
        <h1 className="zext-q">{MOOD_QUESTION}</h1>
        <p className="zext-subnote">{MOOD_SUBNOTE}</p>
        <div className="zext-mood-list" role="radiogroup" aria-label={MOOD_QUESTION}>
          {MOOD_STUDENT_STATES.map((s) => {
            const active = selected === s.code;
            return (
              <button
                key={s.code}
                type="button"
                role="radio"
                aria-checked={active}
                className={`zext-mood-btn ${active ? 'is-selected' : ''}`}
                style={{ '--mood-color': s.color } as React.CSSProperties}
                onClick={() => setSelected(s.code)}
              >
                <span className="zext-mood-icon">
                  <MoodLineIcon code={s.code} color={s.color} />
                </span>
                <span className="zext-mood-label">{s.label}</span>
              </button>
            );
          })}
        </div>
        {err && <p className="zext-err">{err}</p>}
        <button
          type="button"
          className="zext-submit"
          disabled={!selected || busy}
          onClick={() => void submit()}
        >
          {busy ? '送出中…' : '送出（送出後不可更改）'}
        </button>
      </div>
    </div>
  );
}
