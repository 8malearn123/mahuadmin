'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROLES } from '@/lib/roles';
import { useDashboard } from '@/lib/store/DashboardProvider';
import { VIEWS, viewFromPathname } from '@/lib/views';
import { Header } from './Header';
import { RoleBanner } from './RoleBanner';
import { Sidebar } from './Sidebar';
import styles from './shell.module.css';

/**
 * Dashboard frame: sidebar, header, role banner and the current screen.
 * Screens the current role may not open are never rendered; the user is sent
 * to the role's landing screen instead (e.g. after Back following a role switch).
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useDashboard();
  const role = ROLES[state.role];
  const view = viewFromPathname(pathname);
  const allowed = view !== null && role.views.includes(view);
  const landing = VIEWS[role.views[0]].href;

  useEffect(() => {
    if (!allowed) router.replace(landing);
  }, [allowed, landing, router]);

  return (
    <div className={styles.app}>
      <Sidebar view={view} />
      <main className={styles.main}>
        <Header view={view ?? role.views[0]} />
        <RoleBanner />
        <div className={styles.content}>{allowed ? children : null}</div>
      </main>
    </div>
  );
}
