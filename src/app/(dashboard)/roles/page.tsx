import type { Metadata } from 'next';
import { RolesScreen } from '@/features/roles/RolesScreen';
import { requireView } from '@/lib/auth/dal';
import { getDb } from '@/lib/auth/store';
import { clockTime } from '@/lib/format';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.roles.title };

export default async function RolesPage() {
  await requireView('roles');
  const { audit } = await getDb();
  // Newest first: what happened in this session, above the log seeded from the design.
  const events = audit
    .slice(-12)
    .reverse()
    .map((e) => ({ key: e.id, time: clockTime(e.at), text: e.text, actor: e.actor }));
  return <RolesScreen events={events} />;
}
