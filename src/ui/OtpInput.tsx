'use client';

import { useId, useState } from 'react';
import { cleanCode } from '@/lib/auth/validation';
import styles from './OtpInput.module.css';

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once all six digits are in (typed, pasted or filled from an SMS). */
  onComplete?: (value: string) => void;
  label?: string;
  error?: string;
  name?: string;
  autoFocus?: boolean;
}

/**
 * Six-digit code entry. One real input sits over six boxes, so paste, backspace and the
 * phone's "fill code from messages" keep working. Arabic-Indic digits are accepted.
 */
export function OtpInput({ value, onChange, onComplete, label = 'رمز التحقق', error, name = 'code', autoFocus }: OtpInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, LENGTH - 1);

  return (
    <div className={styles.otp}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.cells} data-invalid={error ? '' : undefined}>
        {Array.from({ length: LENGTH }, (_, i) => (
          <span key={i} className={styles.cell} data-filled={value[i] ? '' : undefined} data-active={focused && i === active ? '' : undefined}>
            {value[i] ?? ''}
          </span>
        ))}
        <input
          id={id}
          name={name}
          className={styles.input}
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={LENGTH + 4}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? id + '-error' : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const next = cleanCode(e.target.value);
            onChange(next);
            if (next.length === LENGTH && next !== value) onComplete?.(next);
          }}
        />
      </div>
      {error && (
        <span id={id + '-error'} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
