import type { Metadata } from 'next';
import { OverviewScreen } from '@/features/overview/OverviewScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.overview.title };

export default function OverviewPage() {
  return <OverviewScreen />;
}
