'use client';

import { useState } from 'react';
import { CHANNEL_LABELS } from '@/lib/auth/labels';
import type { DemoMessage } from '@/lib/auth/types';
import { cx } from '@/ui/cx';
import styles from './auth.module.css';

interface DemoInboxProps {
  message: DemoMessage | null;
  /** Offers "تعبئة الرمز" when the message carries a code. */
  onFill?: (code: string) => void;
  /** Text when nothing was sent (e.g. password reset for an unknown number). */
  empty?: string;
  wide?: boolean;
}

/** Message text with the code set apart, so it's easy to spot. */
function MessageText({ message }: { message: DemoMessage }) {
  const { text, code, link } = message;
  const mark = code ?? link;
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const [before, after] = text.split(mark);
  return (
    <>
      {before}
      <bdi className={code ? styles.messageCode : undefined}>{mark}</bdi>
      {after}
    </>
  );
}

/**
 * Demo build only: shows the WhatsApp, SMS or email message the server would have sent,
 * so verification and invitation flows can be completed without a messaging provider.
 */
export function DemoInbox({ message, onFill, empty = 'لم تُرسل أي رسالة.', wide }: DemoInboxProps) {
  const [copied, setCopied] = useState(false);

  return (
    <aside className={cx(styles.demo, wide && styles.demoWide)} aria-label="صندوق الرسائل التجريبي">
      <div className={styles.demoHead}>
        <span className={styles.demoDot} style={{ background: 'var(--mango)' }} aria-hidden="true" />
        صندوق الرسائل التجريبي
        {message && (
          <span className={styles.demoMeta}>
            {CHANNEL_LABELS[message.channel]} إلى <bdi>{message.to}</bdi> · <bdi>{message.time}</bdi>
          </span>
        )}
      </div>
      {message ? (
        <>
          <div className={styles.message}>
            <MessageText message={message} />
          </div>
          <div className={styles.row}>
            {message.code && onFill && (
              <button type="button" className={styles.textButton} onClick={() => onFill(message.code!)}>
                تعبئة الرمز
              </button>
            )}
            {message.link && (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  void navigator.clipboard?.writeText(message.link!).then(() => setCopied(true));
                }}
              >
                {copied ? 'نُسخ الرابط ✓' : 'نسخ رابط الدعوة'}
              </button>
            )}
          </div>
        </>
      ) : (
        <span className={styles.demoNote}>{empty}</span>
      )}
      <span className={styles.demoNote}>
        يظهر هذا الصندوق في النسخة التجريبية فقط؛ في التشغيل الفعلي تصل الرسالة عبر واتساب أعمال أو SMS أو البريد الإلكتروني.
      </span>
    </aside>
  );
}
