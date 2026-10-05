import type { Metadata } from 'next';
import { RolesScreen } from '@/features/roles/RolesScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.roles.title };

export default function RolesPage() {
  return <RolesScreen />;
}
