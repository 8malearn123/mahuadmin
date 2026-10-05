import type { Metadata } from 'next';
import { BranchesScreen } from '@/features/branches/BranchesScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.branches.title };

export default function BranchesPage() {
  return <BranchesScreen />;
}
