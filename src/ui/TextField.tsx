import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';
import fieldStyles from './Field.module.css';
import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  /** Helper text under the field; replaced by the error when there is one. */
  hint?: ReactNode;
  error?: string;
  /** Zain digits, for phone numbers and codes. */
  numeric?: boolean;
  /** Left-to-right characters, kept right-aligned (phone numbers, emails, passwords). */
  ltr?: boolean;
  /** White background, for fields on a cream panel. */
  onCard?: boolean;
  /** lg = the roomier fields of the sign-in pages (16px text on phones, so iOS doesn't zoom). */
  size?: 'md' | 'lg';
  /** Something next to the label, at the far end (e.g. "نسيت كلمة المرور؟"). */
  labelEnd?: ReactNode;
  /** A control inside the field at its left edge (e.g. the show-password button). */
  end?: ReactNode;
}

/** Labelled text input with hint and error text wired to it for screen readers. */
export function TextField({ label, hint, error, numeric, ltr, onCard, size = 'md', labelEnd, end, id, className, ...input }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = inputId + '-note';
  const note = error ?? hint;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {labelEnd}
      </div>
      <div className={styles.wrap}>
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          className={cx(
            fieldStyles.control,
            numeric && fieldStyles.numeric,
            ltr && fieldStyles.ltr,
            onCard && fieldStyles.onCard,
            size === 'lg' && styles.lg,
            end !== undefined && styles.withEnd,
            className,
          )}
          {...input}
        />
        {end}
      </div>
      {note && (
        <span id={noteId} className={error ? styles.error : styles.hint}>
          {note}
        </span>
      )}
    </div>
  );
}
