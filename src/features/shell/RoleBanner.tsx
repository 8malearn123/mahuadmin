'use client';

import { ROLES } from '@/lib/roles';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import styles from './shell.module.css';

/** States what the current role is allowed to see. */
export function RoleBanner() {
  const { state } = useDashboard();
  const role = ROLES[state.role];
  return (
    <div className={styles.bannerWrap}>
      <div className={styles.banner} style={{ '--role': toneColor(role.tone) }}>
        <span className={styles.bannerText}>
          صلاحيات {role.name} — {role.note}
        </span>
      </div>
    </div>
  );
}
