import type { Metadata } from 'next';
import { MenuScreen } from '@/features/menu/MenuScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.menu.title };

export default function MenuPage() {
  return <MenuScreen />;
}
