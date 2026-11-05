import type { Metadata } from 'next';
import { SecurityScreen } from '@/features/account/SecurityScreen';
import { requireView } from '@/lib/auth/dal';
import { accountView, activityViews, sessionViews } from '@/lib/auth/dto';
import { getDb } from '@/lib/auth/store';

export const metadata: Metadata = { title: 'الأمان والأجهزة' };

export default async function AccountSecurityPage() {
  const { user, session } = await requireView('account');
  const db = await getDb();
  return <SecurityScreen account={accountView(user)} sessions={sessionViews(db, user, session)} activity={activityViews(db, user.id)} />;
}
