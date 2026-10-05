import type { Metadata } from 'next';
import { ProfileScreen } from '@/features/account/ProfileScreen';
import { resendWait } from '@/lib/auth/challenges';
import { requireView } from '@/lib/auth/dal';
import { accountView, pendingContactChange } from '@/lib/auth/dto';
import { DEMO_MODE, maskDestination } from '@/lib/auth/messages';
import { getDb } from '@/lib/auth/store';
import { OPERATING_BRANCHES } from '@/lib/roles';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.account.title };

export default async function AccountPage() {
  const { user } = await requireView('account');
  const change = pendingContactChange(await getDb(), user.id);

  return (
    <ProfileScreen
      account={accountView(user)}
      branches={OPERATING_BRANCHES}
      pending={
        change && {
          kind: change.purpose === 'change-phone' ? 'phone' : 'email',
          destination: maskDestination(change.challenge.channel, change.challenge.destination),
          channel: change.challenge.channel,
          sentAt: change.challenge.sentAt,
          wait: resendWait(change.challenge),
          demo: DEMO_MODE ? change.challenge.demo : undefined,
        }
      }
    />
  );
}
