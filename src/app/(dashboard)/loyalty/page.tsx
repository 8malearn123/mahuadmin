import type { Metadata } from 'next';
import { LoyaltyScreen } from '@/features/loyalty/LoyaltyScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.loyalty.title };

export default async function LoyaltyPage() {
  await requireView('loyalty');
  return <LoyaltyScreen />;
}
