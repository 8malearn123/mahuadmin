import type { ReactNode } from 'react';
import styles from './Notice.module.css';

interface NoticeProps {
  /** info = brand teal, ok = success, warn = attention (sandy brown), bad = error (fire opal). */
  tone?: 'info' | 'ok' | 'warn' | 'bad';
  children: ReactNode;
}

/** Tinted message bar with the role banner's coloured edge; errors are announced to screen readers. */
export function Notice({ tone = 'info', children }: NoticeProps) {
  return (
    <div className={styles.notice} data-tone={tone} role={tone === 'bad' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
