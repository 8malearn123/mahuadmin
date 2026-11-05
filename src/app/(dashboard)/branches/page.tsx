import type { Metadata } from 'next';
import { BranchesScreen } from '@/features/branches/BranchesScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.branches.title };

export default async function BranchesPage() {
  await requireView('branches');
  return <BranchesScreen />;
}
