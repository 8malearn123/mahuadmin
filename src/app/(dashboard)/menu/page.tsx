import type { Metadata } from 'next';
import { MenuScreen } from '@/features/menu/MenuScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.menu.title };

export default async function MenuPage() {
  await requireView('menu');
  return <MenuScreen />;
}
