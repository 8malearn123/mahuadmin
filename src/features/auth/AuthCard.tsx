import type { ReactNode } from 'react';
import { cx } from '@/ui/cx';
import styles from './auth.module.css';

interface AuthCardProps {
  /** Small caption with a dot, like the modal heads ("تسجيل الدخول · منصة ماهو"). */
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  /** Links under a divider at the bottom ("ليس لديك حساب؟ …"). */
  footer?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}

export function AuthCard({ eyebrow, title, subtitle, footer, wide, children }: AuthCardProps) {
  return (
    <section className={cx(styles.card, wide && styles.wide)} aria-labelledby="auth-title">
      <div className={styles.cardHead}>
        <span className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          {eyebrow}
        </span>
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children}
      {footer && <div className={styles.cardFoot}>{footer}</div>}
    </section>
  );
}

/** A phone number or email inside Arabic text, kept in its own reading order. */
export function Destination({ children }: { children: ReactNode }) {
  return <bdi className={styles.phone}>{children}</bdi>;
}
