import { redirect } from 'next/navigation';
import { ROLES, DEFAULT_ROLE } from '@/lib/roles';
import { VIEWS } from '@/lib/views';

export default function Home() {
  redirect(VIEWS[ROLES[DEFAULT_ROLE].views[0]].href);
}
