import { cx } from './cx';
import styles from './Segmented.module.css';

interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  /** card = white track (header), inset = cream track (inside cards). */
  surface?: 'card' | 'inset';
  /** md = 12.5px text, sm = 12px. */
  size?: 'md' | 'sm';
  /** 14px instead of 13px horizontal padding. */
  wide?: boolean;
}

/** Row of mutually exclusive filter buttons on a shared track. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  surface = 'card',
  size = 'sm',
  wide = false,
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx(styles.track, surface === 'inset' && styles.inset)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          className={cx(styles.option, size === 'md' && styles.md, wide && styles.wide)}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
