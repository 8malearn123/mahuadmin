import { Shell } from '@/features/shell/Shell';
import { requireActive, toSessionUser } from '@/lib/auth/dal';
import { ROLES } from '@/lib/roles';
import { DashboardProvider } from '@/lib/store/DashboardProvider';
import { SessionProvider } from '@/lib/store/SessionProvider';

/**
 * Signed-in area. The dashboard store is keyed by account and data scope, so it starts
 * fresh for another account or when an admin changes this one's role or staff branch;
 * a customer's preferred branch is synced into it instead.
 */
export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireActive();
  const scope = ROLES[user.role].perBranch ? user.branch : '';
  return (
    <SessionProvider user={toSessionUser(user)}>
      <DashboardProvider key={`${user.id}:${user.role}:${scope}`} account={{ role: user.role, branch: user.branch }}>
        <Shell>{children}</Shell>
      </DashboardProvider>
    </SessionProvider>
  );
}
