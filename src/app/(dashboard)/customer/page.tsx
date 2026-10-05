import type { Metadata } from 'next';
import { CustomerScreen } from '@/features/customer/CustomerScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.customer.title };

export default function CustomerPage() {
  return <CustomerScreen />;
}
