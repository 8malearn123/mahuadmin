import type { Metadata } from 'next';
import { LogScreen } from '@/features/log/LogScreen';
import { requireView } from '@/lib/auth/dal';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.log.title };

export default async function LogPage() {
  await requireView('log');
  return <LogScreen />;
}
