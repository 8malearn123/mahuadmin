import { Shell } from '@/features/shell/Shell';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Shell>{children}</Shell>;
}
