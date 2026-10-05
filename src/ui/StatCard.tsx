import { cx } from './cx';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  /** Colour of the value (CSS colour); defaults to the body ink. */
  valueColor?: string;
  /** Colour of the note; defaults to muted. */
  noteColor?: string;
  /** hero = the large monospace KPIs on the overview. */
  variant?: 'hero' | 'compact' | 'roomy';
  /** Upper bound of the fluid value size, in px. */
  max?: number;
}

export function StatCard({ label, value, note, valueColor, noteColor, variant = 'compact', max = 22 }: StatCardProps) {
  return (
    <div className={cx(styles.stat, variant !== 'compact' && styles[variant])} style={{ '--max': `${max}px` }}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {note !== undefined && (
        <span className={styles.note} style={noteColor ? { color: noteColor } : undefined}>
          {note}
        </span>
      )}
    </div>
  );
}
