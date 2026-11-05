import { redirect } from 'next/navigation';
import { getAuth, homeFor } from '@/lib/auth/dal';

/** "/" opens the account's first screen, or whichever sign-in step it is on. */
export default async function Home() {
  redirect(homeFor(await getAuth()));
}
