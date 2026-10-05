import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './Field.module.css';

/** Muted caption above a form control; the label wraps the control. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      {label}
      {children}
    </label>
  );
}

interface ControlOptions {
  /** Zain digits, for prices, quantities and phone numbers. */
  numeric?: boolean;
  /** White background, for controls placed on a cream panel. */
  onCard?: boolean;
}

export function Input({
  numeric,
  onCard,
  ltr,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & ControlOptions & { ltr?: boolean }) {
  return (
    <input
      className={cx(styles.control, numeric && styles.numeric, ltr && styles.ltr, onCard && styles.onCard, className)}
      {...props}
    />
  );
}

export function Select({ onCard, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & ControlOptions) {
  return <select className={cx(styles.control, styles.select, onCard && styles.onCard, className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(styles.control, styles.textarea, (rest.rows ?? 2) >= 3 && styles.tall, className)}
      {...rest}
    />
  );
}
