import type { Metadata } from 'next';
import { TwoStepForm } from '@/features/auth/TwoStepForm';
import { openChallenge, resendWait } from '@/lib/auth/challenges';
import { requireStage } from '@/lib/auth/dal';
import { DEMO_MODE } from '@/lib/auth/messages';
import { getDb } from '@/lib/auth/store';
import { maskPhoneIntl } from '@/lib/format';

export const metadata: Metadata = { title: 'التحقق بخطوتين' };

export default async function TwoStepPage() {
  const { user, session } = await requireStage('two-step');
  const challenge = openChallenge(await getDb(), 'two-step', { sessionId: session.id });

  return (
    <TwoStepForm
      destination={maskPhoneIntl(user.phone)}
      channel={challenge?.channel ?? 'whatsapp'}
      sentAt={challenge?.sentAt ?? 0}
      wait={challenge ? resendWait(challenge) : 0}
      demo={DEMO_MODE ? (challenge?.demo ?? null) : undefined}
    />
  );
}
