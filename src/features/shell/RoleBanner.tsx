'use client';

import { useDashboard } from '@/lib/store/DashboardProvider';
import { activeRole } from '@/lib/store/reducer';
import { toneColor } from '@/lib/tones';
import { Spacer } from '@/ui/Spacer';
import styles from './shell.module.css';

/** States what the current role is allowed to see, and offers to end an admin's role preview. */
export function RoleBanner() {
  const { state, dispatch } = useDashboard();
  const role = activeRole(state);
  const previewing = state.role !== state.account.role;
  return (
    <div className={styles.bannerWrap}>
      <div className={styles.banner} style={{ '--role': toneColor(role.tone) }}>
        <span className={styles.bannerText}>
          {previewing && <strong className={styles.previewTag}>معاينة · </strong>}
          صلاحيات {role.name} — {role.note}
        </span>
        {previewing && (
          <>
            <Spacer />
            <button type="button" className={styles.bannerAction} onClick={() => dispatch({ type: 'switchRole', role: state.account.role })}>
              إنهاء المعاينة
            </button>
          </>
        )}
      </div>
    </div>
  );
}
