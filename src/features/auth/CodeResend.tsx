'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import type { Channel, FormState } from '@/lib/auth/types';
import styles from './auth.module.css';

function clock(seconds: number): string {
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

/** Counts down from `seconds`; remount it (via `key`) to start over. */
function Countdown({ seconds, children }: { seconds: number; children: (left: number) => ReactNode }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return children(left);
}

interface CodeResendProps {
  /** When the current code was sent; a new value restarts the countdown. */
  sentAt: number;
  /** Seconds until a new code may be requested, as of the page render. */
  wait: number;
  channel: Channel;
  onResend: (channel: Channel) => Promise<FormState>;
}

/** "لم يصلك الرمز؟" — countdown, then resend (and switch between WhatsApp and SMS). */
export function CodeResend({ sentAt, wait, channel, onResend }: CodeResendProps) {
  const [note, setNote] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function resend(via: Channel) {
    if (pending) return;
    startTransition(async () => {
      const result = await onResend(via);
      setNote(result.error ? { tone: 'bad', text: result.error } : { tone: 'ok', text: result.success ?? '' });
    });
  }

  return (
    <div className={styles.resend}>
      <span>لم يصلك الرمز؟</span>
      <Countdown key={sentAt} seconds={wait}>
        {(left) =>
          left > 0 ? (
            <span>
              إعادة الإرسال بعد <bdi className={styles.countdown}>{clock(left)}</bdi>
            </span>
          ) : (
            <>
              <button type="button" className={styles.textButton} aria-disabled={pending || undefined} onClick={() => resend(channel)}>
                {pending ? 'جارٍ الإرسال…' : 'إعادة الإرسال'}
              </button>
              {channel !== 'email' && (
                <button
                  type="button"
                  className={styles.textButton}
                  aria-disabled={pending || undefined}
                  onClick={() => resend(channel === 'sms' ? 'whatsapp' : 'sms')}
                >
                  {channel === 'sms' ? 'الإرسال عبر واتساب' : 'الإرسال برسالة SMS'}
                </button>
              )}
            </>
          )
        }
      </Countdown>
      {note && note.text && (
        <span className={styles.resendNote} data-tone={note.tone} role="status">
          {note.text}
        </span>
      )}
    </div>
  );
}
