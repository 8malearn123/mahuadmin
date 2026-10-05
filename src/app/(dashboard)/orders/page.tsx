import type { Metadata } from 'next';
import { OrdersScreen } from '@/features/orders/OrdersScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.orders.title };

export default function OrdersPage() {
  return <OrdersScreen />;
}
