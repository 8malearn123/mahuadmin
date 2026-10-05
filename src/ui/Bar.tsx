import { cx } from './cx';
import styles from './Bar.module.css';

interface BarProps {
  /** Filled share as a CSS length, e.g. "78%". */
  value: string;
  color: string;
  /** Track height in px. */
  height?: 5 | 6 | 7;
  /** inset = cream track, line = hairline track, paper = light cream (on cream cards). */
  track?: 'inset' | 'line' | 'paper';
  /** Round the end of the fill as well as the track. */
  roundFill?: boolean;
}

/** Thin horizontal progress / share bar. */
export function Bar({ value, color, height = 6, track = 'inset', roundFill = true }: BarProps) {
  return (
    <div className={cx(styles.track, styles[track])} style={{ height }}>
      <div className={cx(styles.fill, roundFill && styles.round)} style={{ width: value, background: color }} />
    </div>
  );
}
