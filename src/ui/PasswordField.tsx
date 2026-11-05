'use client';

import { useState } from 'react';
import { PASSWORD_RULES, passwordStrength } from '@/lib/auth/validation';
import { Bar } from './Bar';
import { TextField, type TextFieldProps } from './TextField';
import styles from './PasswordField.module.css';

const METER_COLORS = ['var(--line)', 'var(--fill-bad)', 'var(--mango)', 'var(--fill-ok)'];
const LABEL_COLORS = ['var(--mut)', 'var(--bad)', 'var(--warn)', 'var(--ok)'];

interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'end' | 'ltr'> {
  /** Show the strength meter and the rules (new passwords). */
  meter?: boolean;
}

/** Password input with a show/hide button, a Caps Lock warning and an optional strength meter. */
export function PasswordField({ meter, hint, onKeyDown, onKeyUp, ...props }: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const value = typeof props.value === 'string' ? props.value : '';
  const strength = passwordStrength(value);

  return (
    <div className={styles.stack}>
      <TextField
        {...props}
        type={shown ? 'text' : 'password'}
        ltr
        spellCheck={false}
        autoCapitalize="none"
        hint={capsLock ? 'زر Caps Lock مفعّل' : hint}
        onKeyDown={(e) => {
          setCapsLock(e.getModifierState('CapsLock'));
          onKeyDown?.(e);
        }}
        onKeyUp={(e) => {
          setCapsLock(e.getModifierState('CapsLock'));
          onKeyUp?.(e);
        }}
        end={
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            aria-label={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {shown ? 'إخفاء' : 'إظهار'}
          </button>
        }
      />
      {meter && (
        <div className={styles.meter}>
          <div className={styles.meterHead}>
            <span>قوة كلمة المرور</span>
            <span className={styles.meterLabel} style={{ color: LABEL_COLORS[strength.score] }}>
              {strength.label || '—'}
            </span>
          </div>
          <Bar value={(strength.score / 3) * 100 + '%'} color={METER_COLORS[strength.score]} height={5} track="line" />
          <ul className={styles.rules} aria-label="شروط كلمة المرور">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(value);
              return (
                <li key={rule.id} className={styles.rule} data-met={met ? '' : undefined}>
                  <span className={styles.ruleMark} aria-hidden="true">
                    {met ? '✓' : '•'}
                  </span>
                  {rule.label}
                  <span className={styles.srOnly}>{met ? ' — متحقق' : ' — غير متحقق'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
