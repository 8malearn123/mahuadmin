'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/features/auth/actions';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { initialOf } from '@/lib/format';
import { ROLE_IDS, ROLES, scopeRole } from '@/lib/roles';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { activeRole } from '@/lib/store/reducer';
import { useSessionUser } from '@/lib/store/SessionProvider';
import { toneColor } from '@/lib/tones';
import type { RoleId, ViewId } from '@/lib/types';
import { NAV_GROUPS, PINNED_VIEW, VIEWS } from '@/lib/views';
import { cx } from '@/ui/cx';
import { useSessionControls } from './SessionGuard';
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
  const user = useSessionUser();
  const { lock, announceSignOut } = useSessionControls();
  const { state, dispatch } = useDashboard();
  const role = activeRole(state);
  const own = scopeRole(ROLES[user.role], user.branch);
  const groups = NAV_GROUPS.map((g) => ({ ...g, views: g.views.filter((v) => role.views.includes(v)) })).filter(
    (g) => g.views.length > 0,
  );

  // Admins can preview what another role sees; it opens that role's first screen, as the role switcher did.
  function preview(id: RoleId) {
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
        <Link href="/account" className={styles.me} aria-current={view === 'account' ? 'page' : undefined} title="حسابي">
          <span className={styles.avatar}>{initialOf(user.name)}</span>
          <span className={styles.meText}>
            <span className={styles.meName}>{user.name}</span>
            <span className={styles.meRole}>
              {own.name} · {own.perBranch ? user.branch : own.scope}
            </span>
          </span>
          <span className={styles.meGo} aria-hidden="true">
            ‹
          </span>
        </Link>
        {user.role === 'admin' && (
          <select className={styles.roleSelect} value={state.role} onChange={(e) => preview(e.target.value as RoleId)} aria-label="معاينة الدور">
            {ROLE_IDS.map((id) => (
              <option key={id} value={id}>
                {id === user.role ? ROLES[id].name + ' — دورك' : 'معاينة: ' + ROLES[id].name}
              </option>
            ))}
          </select>
        )}
        <div className={styles.accountMeta}>
          {user.idleMinutes !== null && (
            <button type="button" className={styles.metaButton} onClick={lock}>
              قفل الشاشة
            </button>
          )}
          <form action={signOut} onSubmit={announceSignOut}>
            <button type="submit" className={styles.metaButton}>
              تسجيل الخروج
            </button>
          </form>
          <span className={styles.flex} />
          <a href={PUBLIC_SITE_URL} className={styles.siteLink}>
            الموقع العام ↗
          </a>
        </div>
      </div>
    </aside>
  );
}
