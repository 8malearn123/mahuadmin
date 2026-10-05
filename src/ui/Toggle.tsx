import { toneColor } from '@/lib/tones';
import styles from './Toggle.module.css';

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  /** Text after the switch, e.g. "متوفر" / "غير متوفر". */
  label: string;
  /** What the switch controls, when the visible label only states on/off. */
  name?: string;
}

/** Availability switch: teal with the knob to the left when on, dark ink when off. */
export function Toggle({ on, onToggle, label, name }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={name}
      className={styles.toggle}
      style={{ '--tone': toneColor(on ? 'ok' : 'muted') }}
      onClick={onToggle}
    >
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      {label}
    </button>
  );
}
