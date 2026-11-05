import { initialOf } from '@/lib/format';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  /** Diameter in px. */
  size?: 32 | 34 | 42 | 56;
  /** Ring colour (CSS colour), e.g. the role tone. */
  ring?: string;
}

/** Palm-teal circle with the name's first letter, as on the customer and lookup profiles. */
export function Avatar({ name, size = 34, ring }: AvatarProps) {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), boxShadow: ring ? `0 0 0 2px var(--pnl), 0 0 0 3.5px ${ring}` : undefined }}
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  );
}
