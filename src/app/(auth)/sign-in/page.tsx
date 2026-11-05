import type { Metadata } from 'next';
import { SignInForm, type DemoAccount } from '@/features/auth/SignInForm';
import { redirectIfSignedIn } from '@/lib/auth/dal';
import { SIGN_OUT_NOTICES } from '@/lib/auth/labels';
import { DEMO_MODE } from '@/lib/auth/messages';
import { DEMO_ACCOUNT_IDS, DEMO_PASSWORD, getDb } from '@/lib/auth/store';
import type { SignOutReason } from '@/lib/auth/types';
import { safeNext } from '@/lib/auth/validation';
import { ROLES } from '@/lib/roles';
import { toneColor } from '@/lib/tones';

export const metadata: Metadata = { title: 'تسجيل الدخول' };

function isReason(value: unknown): value is SignOutReason {
  return typeof value === 'string' && Object.hasOwn(SIGN_OUT_NOTICES, value);
}

export default async function SignInPage(props: PageProps<'/sign-in'>) {
  await redirectIfSignedIn();
  const params = await props.searchParams;
  const db = await getDb();
  const demoAccounts: DemoAccount[] | null = DEMO_MODE
    ? DEMO_ACCOUNT_IDS.flatMap((id) => {
        const u = db.users.get(id);
        if (!u) return [];
        const role = ROLES[u.role];
        return [{ id: u.id, name: u.name, roleName: role.name, tone: toneColor(role.tone), identifier: u.phone, password: DEMO_PASSWORD, twoStep: u.twoStep }];
      })
    : null;

  return (
    <SignInForm
      next={safeNext(params.next)}
      notice={isReason(params.reason) ? SIGN_OUT_NOTICES[params.reason] : null}
      demoAccounts={demoAccounts}
    />
  );
}
