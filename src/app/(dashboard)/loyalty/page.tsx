import type { Metadata } from 'next';
import { LoyaltyScreen } from '@/features/loyalty/LoyaltyScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.loyalty.title };

export default function LoyaltyPage() {
  return <LoyaltyScreen />;
}
