import type { Metadata } from 'next';
import { BoxesScreen } from '@/features/boxes/BoxesScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.boxes.title };

export default async function BoxesPage() {
  await requireView('boxes');
  return <BoxesScreen />;
}
