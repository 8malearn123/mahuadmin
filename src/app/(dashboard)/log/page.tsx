import type { Metadata } from 'next';
import { LogScreen } from '@/features/log/LogScreen';
import { VIEWS } from '@/lib/views';

export const metadata: Metadata = { title: VIEWS.log.title };

export default function LogPage() {
  return <LogScreen />;
}
