import type { Metadata } from 'next';
import { LookupScreen } from '@/features/lookup/LookupScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.lookup.title };

export default function LookupPage() {
  return <LookupScreen />;
}
