import type { Metadata } from 'next';
import { VerifyPhoneForm } from '@/features/auth/VerifyPhoneForm';
import { openChallenge, resendWait } from '@/lib/auth/challenges';
import { requireStage } from '@/lib/auth/dal';
import { DEMO_MODE } from '@/lib/auth/messages';
import { getDb } from '@/lib/auth/store';
import { maskPhoneIntl } from '@/lib/format';

export const metadata: Metadata = { title: 'تحقق من رقم جوالك' };

export default async function VerifyPage() {
  const { user } = await requireStage('unverified');
  const challenge = openChallenge(await getDb(), 'verify-phone', { userId: user.id });

  return (
    <VerifyPhoneForm
      destination={maskPhoneIntl(user.phone)}
      channel={challenge?.channel ?? 'whatsapp'}
      sentAt={challenge?.sentAt ?? 0}
      wait={challenge ? resendWait(challenge) : 0}
      demo={DEMO_MODE ? (challenge?.demo ?? null) : undefined}
      staff={user.role !== 'customer'}
    />
  );
}
