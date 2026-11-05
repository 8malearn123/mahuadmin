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

/**
 * A gradient fill is stretched to the whole track and anchored at its start (the right, in RTL), so
 * the colour marks a position on the track: short bars stay orange and only full bars reach red.
 */
function gradientSpan(value: string) {
  const pct = parseFloat(value);
  if (!value.endsWith('%') || !(pct > 0)) return {};
  return { backgroundSize: `${10000 / pct}% 100%`, backgroundPosition: 'right center' };
}

/** Thin horizontal progress / share bar. */
export function Bar({ value, color, height = 6, track = 'inset', roundFill = true }: BarProps) {
  // Gradient values and the gradient tokens (var(--gradient-brand-inline)) are images; anything else is a colour.
  const fill = color.includes('gradient') ? { backgroundImage: color, ...gradientSpan(value) } : { backgroundColor: color };
  return (
    <div className={cx(styles.track, styles[track])} style={{ height }}>
      <div className={cx(styles.fill, roundFill && styles.round)} style={{ width: value, ...fill }} />
    </div>
  );
}
