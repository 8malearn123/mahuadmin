import type { Metadata } from 'next';
import { OverviewScreen } from '@/features/overview/OverviewScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.overview.title };

export default async function OverviewPage() {
  await requireView('overview');
  return <OverviewScreen />;
}
