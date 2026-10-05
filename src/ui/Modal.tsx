import type { ReactNode } from 'react';
import { cx } from './cx';
import { Spacer } from './Spacer';
import styles from './Modal.module.css';

interface ModalProps {
  /** Small caption naming the module, e.g. "وحدة 11 · حجز البوكسات المجدول". */
  eyebrow: string;
  title: string;
  onClose: () => void;
  /** Colour of the dot before the eyebrow. */
  dotColor?: string;
  width?: number;
  /** Darkens the × on hover (menu form only, as designed). */
  closeHover?: boolean;
  children: ReactNode;
}

/** Centred form dialog over a dimmed backdrop. */
export function Modal({ eyebrow, title, onClose, dotColor = 'var(--mango)', width = 720, closeHover, children }: ModalProps) {
  return (
    <div className={styles.scrim}>
      <section className={styles.panel} style={{ width: `min(${width}px, 100%)` }} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          <span className={styles.dot} style={{ background: dotColor }} />
          <span className={styles.eyebrow}>{eyebrow}</span>
          <Spacer />
          <button type="button" className={cx(styles.close, closeHover && styles.closeHover)} onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>
        <h2 className={styles.title}>{title}</h2>
        {children}
      </section>
    </div>
  );
}

/** Save / cancel row at the bottom of a modal, with an optional hint. */
export function ModalActions({ children, wrap = true }: { children: ReactNode; wrap?: boolean }) {
  return <div className={cx(styles.actions, wrap && styles.wrap)}>{children}</div>;
}

export function ModalHint({ children }: { children: ReactNode }) {
  return <span className={styles.hint}>{children}</span>;
}
