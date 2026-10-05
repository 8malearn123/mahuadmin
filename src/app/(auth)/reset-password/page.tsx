import type { Metadata } from 'next';
import { ResetExpired, ResetPasswordForm } from '@/features/auth/ResetPasswordForm';
import { resendWait } from '@/lib/auth/challenges';
import { redirectIfSignedIn } from '@/lib/auth/dal';
import { DEMO_MODE, maskDestination } from '@/lib/auth/messages';
import { readResetTicket } from '@/lib/auth/session';
import { getDb } from '@/lib/auth/store';

export const metadata: Metadata = { title: 'تعيين كلمة مرور جديدة' };

export default async function ResetPasswordPage() {
  await redirectIfSignedIn();
  const ticket = await readResetTicket();
  const challenge = ticket ? (await getDb()).challenges.get(ticket) : undefined;
  if (!challenge || challenge.purpose !== 'reset-password' || challenge.consumedAt !== null) return <ResetExpired />;

  return (
    <ResetPasswordForm
      destination={maskDestination(challenge.channel, challenge.destination)}
      channel={challenge.channel}
      sentAt={challenge.sentAt}
      wait={resendWait(challenge)}
      demo={DEMO_MODE ? challenge.demo : undefined}
    />
  );
}
