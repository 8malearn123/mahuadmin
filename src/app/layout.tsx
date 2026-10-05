import type { Metadata } from 'next';
import { DashboardProvider } from '@/lib/store/DashboardProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'منصة ماهو الرقمية — لوحات التشغيل',
    template: '%s — منصة ماهو الرقمية',
  },
  description: 'لوحات تشغيل مقاهي ماهو: الطلبات والبوكسات والمنيو والولاء والفروع والصلاحيات.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
