import { cx } from './cx';
import styles from './SearchBox.module.css';

interface SearchBoxProps {
  /** Caption inside the box, before the input ("بحث", "استعلام"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Slightly larger box (customer lookup). */
  roomy?: boolean;
}

/** Inline search field that grows to fill its row. */
export function SearchBox({ label, value, onChange, placeholder, roomy }: SearchBoxProps) {
  return (
    <label className={cx(styles.box, roomy && styles.roomy)}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
