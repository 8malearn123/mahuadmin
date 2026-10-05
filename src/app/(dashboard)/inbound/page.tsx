import type { Metadata } from 'next';
import { InboundScreen } from '@/features/inbound/InboundScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.inbound.title };

export default function InboundPage() {
  return <InboundScreen />;
}
