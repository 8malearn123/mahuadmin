import type { Metadata } from 'next';
import { BoxesScreen } from '@/features/boxes/BoxesScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.boxes.title };

export default function BoxesPage() {
  return <BoxesScreen />;
}
