import { AuthFrame } from '@/features/auth/AuthFrame';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthFrame>{children}</AuthFrame>;
}
