import type { Metadata } from 'next';
import { LookupScreen } from '@/features/lookup/LookupScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.lookup.title };

export default async function LookupPage() {
  await requireView('lookup');
  return <LookupScreen />;
}
