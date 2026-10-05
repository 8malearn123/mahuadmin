import type { Metadata } from 'next';
import { OrdersScreen } from '@/features/orders/OrdersScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.orders.title };

export default async function OrdersPage() {
  await requireView('orders');
  return <OrdersScreen />;
}
