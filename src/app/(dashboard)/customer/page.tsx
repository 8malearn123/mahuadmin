import type { Metadata } from 'next';
import { CustomerScreen } from '@/features/customer/CustomerScreen';
import { requireView } from '@/lib/auth/dal';
import { PORTAL_CUSTOMER, SAMPLE_CUSTOMER_PHONE, portalFor } from '@/lib/data/portal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.customer.title };

export default async function CustomerPage() {
  const { user } = await requireView('customer');
  // Customers see their own account; staff opening this screen see the sample customer.
  const customer = user.role === 'customer' ? user : { name: PORTAL_CUSTOMER.name, phone: SAMPLE_CUSTOMER_PHONE };
  return <CustomerScreen portal={portalFor(customer)} />;
}
