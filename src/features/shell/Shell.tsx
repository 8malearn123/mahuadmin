'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { canOpenView } from '@/lib/roles';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { activeRole } from '@/lib/store/reducer';
import { VIEWS, viewFromPathname } from '@/lib/views';
import { Header } from './Header';
import { RoleBanner } from './RoleBanner';
import { SessionGuard } from './SessionGuard';
import { Sidebar } from './Sidebar';
import styles from './shell.module.css';

/**
 * Dashboard frame: sidebar, header, role banner and the current screen.
 * The server already checked that the account may open the screen; this also keeps
 * an admin previewing another role to that role's screens (e.g. after Back).
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useDashboard();
  const role = activeRole(state);
  const view = viewFromPathname(pathname);
  const allowed = view !== null && canOpenView(role, view);
  const landing = VIEWS[role.views[0]].href;

  useEffect(() => {
    if (!allowed) router.replace(landing);
  }, [allowed, landing, router]);

  return (
    <SessionGuard>
      <div className={styles.app}>
        <Sidebar view={view} />
        <main className={styles.main}>
          <Header view={view ?? role.views[0]} />
          <RoleBanner />
          <div className={styles.content}>{allowed ? children : null}</div>
        </main>
      </div>
    </SessionGuard>
  );
}
