import type { Metadata } from 'next';
import { SignUpForm } from '@/features/auth/SignUpForm';
import { redirectIfSignedIn } from '@/lib/auth/dal';

export const metadata: Metadata = { title: 'إنشاء حساب' };

export default async function SignUpPage() {
  await redirectIfSignedIn();
  return <SignUpForm />;
}
