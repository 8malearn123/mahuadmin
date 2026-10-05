import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

/** Checkbox with a drawn box (the reset layer strips native form controls). */
export function Checkbox({ label, error, ...input }: CheckboxProps) {
  const id = useId();
  return (
    <div className={styles.wrap}>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? id : undefined}
          {...input}
        />
        <span className={styles.box} aria-hidden="true" />
        <span className={styles.text}>{label}</span>
      </label>
      {error && (
        <span id={id} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
