import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm';
import { redirectIfSignedIn } from '@/lib/auth/dal';

export const metadata: Metadata = { title: 'استعادة كلمة المرور' };

export default async function ForgotPasswordPage() {
  await redirectIfSignedIn();
  return <ForgotPasswordForm />;
}
