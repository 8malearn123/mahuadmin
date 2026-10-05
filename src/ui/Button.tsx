import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * accent = sandy-brown call to action ("+ حجز جديد"),
   * primary = teal save button (greys out while the form is incomplete),
   * ghost = hairline outline (cancel, clear).
   */
  variant?: 'accent' | 'primary' | 'ghost';
  /** Horizontal padding in px. */
  pad?: 18 | 20 | 22;
  /**
   * Shows the save button as unavailable. It stays clickable, like the original;
   * the click handler is responsible for ignoring it.
   */
  inactive?: boolean;
}

export function Button({ variant = 'ghost', pad, inactive, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      aria-disabled={inactive || undefined}
      className={cx(styles.button, styles[variant], pad === 20 && styles.pad20, pad === 22 && styles.pad22, className)}
      {...rest}
    />
  );
}
