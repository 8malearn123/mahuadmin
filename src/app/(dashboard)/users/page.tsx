import type { Metadata } from 'next';
import { UsersScreen } from '@/features/users/UsersScreen';
import { requireView } from '@/lib/auth/dal';
import { userRows } from '@/lib/auth/dto';
import { getDb } from '@/lib/auth/store';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.users.title };

export default async function UsersPage() {
  const { user } = await requireView('users');
  return <UsersScreen users={userRows(await getDb(), user)} />;
}
