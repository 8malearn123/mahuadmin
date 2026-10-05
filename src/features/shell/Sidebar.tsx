'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { ROLE_IDS, ROLES } from '@/lib/roles';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { toneColor } from '@/lib/tones';
import type { RoleId, ViewId } from '@/lib/types';
import { NAV_GROUPS, PINNED_VIEW, VIEWS } from '@/lib/views';
import { cx } from '@/ui/cx';
import styles from './shell.module.css';

function NavItem({ view, active, pinned }: { view: ViewId; active: boolean; pinned?: boolean }) {
  return (
    <Link href={VIEWS[view].href} className={cx(styles.navItem, pinned && styles.pinned)} aria-current={active ? 'page' : undefined}>
      <span className={styles.navMark} />
      <span>{VIEWS[view].label}</span>
    </Link>
  );
}

export function Sidebar({ view }: { view: ViewId | null }) {
  const router = useRouter();
  const { state, dispatch } = useDashboard();
  const role = ROLES[state.role];
  const groups = NAV_GROUPS.map((g) => ({ ...g, views: g.views.filter((v) => role.views.includes(v)) })).filter(
    (g) => g.views.length > 0,
  );

  function switchRole(id: RoleId) {
    dispatch({ type: 'switchRole', role: id });
    router.replace(VIEWS[ROLES[id].views[0]].href);
  }

  return (
    <aside className={styles.sidebar} style={{ '--role': toneColor(role.tone) }}>
      <div className={styles.brand}>
        <span className={styles.logo}>ماهو</span>
        <div className={styles.brandText}>
          <span className={styles.brandName}>منصة ماهو</span>
          <span className={styles.brandMeta}>KUD-2061 · الإصدار 1.0</span>
        </div>
      </div>
      <nav className={styles.nav} aria-label="الوحدات">
        {role.views.includes(PINNED_VIEW) && <NavItem view={PINNED_VIEW} active={view === PINNED_VIEW} pinned />}
        {groups.map((g) => (
          <div key={g.title} className={styles.navGroup}>
            <span className={styles.navGroupTitle}>{g.title}</span>
            {g.views.map((v) => (
              <NavItem key={v} view={v} active={view === v} />
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.account}>
        <div className={styles.accountRow}>
          <span className={styles.avatar}>{role.user.slice(0, 1)}</span>
          <select
            className={styles.roleSelect}
            value={state.role}
            onChange={(e) => switchRole(e.target.value as RoleId)}
            aria-label="الدور"
          >
            {ROLE_IDS.map((id) => (
              <option key={id} value={id}>
                {ROLES[id].name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.accountMeta}>
          <span className={styles.who}>
            {role.user} · {role.scope}
          </span>
          <span className={styles.flex} />
          <a href={PUBLIC_SITE_URL} className={styles.siteLink}>
            الموقع العام ↗
          </a>
        </div>
      </div>
    </aside>
  );
}
