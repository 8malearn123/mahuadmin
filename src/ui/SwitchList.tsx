import { Toggle } from './Toggle';
import styles from './SwitchList.module.css';

export interface SwitchItem {
  key: string;
  title: string;
  desc?: string;
  on: boolean;
  /** Shown instead of the switch when the setting can't be changed (e.g. "إلزامي لدورك"). */
  locked?: string;
}

/** Bordered list of settings, each with a description and an on/off switch. */
export function SwitchList({ items, onToggle }: { items: SwitchItem[]; onToggle: (key: string) => void }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <div key={item.key} className={styles.row}>
          <div className={styles.text}>
            <span className={styles.title}>{item.title}</span>
            {item.desc && <span className={styles.desc}>{item.desc}</span>}
          </div>
          {item.locked ? (
            <span className={styles.locked}>{item.locked}</span>
          ) : (
            <Toggle on={item.on} onToggle={() => onToggle(item.key)} label={item.on ? 'مفعّل' : 'متوقف'} name={item.title} />
          )}
        </div>
      ))}
    </div>
  );
}
