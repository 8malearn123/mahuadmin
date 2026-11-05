import type { Metadata } from 'next';
import { InboundScreen } from '@/features/inbound/InboundScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.inbound.title };

export default async function InboundPage() {
  await requireView('inbound');
  return <InboundScreen />;
}
