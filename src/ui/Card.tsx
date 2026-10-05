import type { HTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div';
  /** lg = 18px 20px, md = 14px 16px, sm = 14px; none lets the caller set padding. */
  pad?: 'lg' | 'md' | 'sm' | 'none';
}

/** White panel with hairline border and soft shadow, the dashboard's basic surface. */
export function Card({ as: Tag = 'section', pad = 'lg', className, ...rest }: CardProps) {
  return <Tag className={cx(styles.card, pad !== 'none' && styles[pad], className)} {...rest} />;
}
