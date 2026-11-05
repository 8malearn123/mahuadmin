import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'منصة ماهو الرقمية — لوحات التشغيل',
    template: '%s — منصة ماهو الرقمية',
  },
  description: 'لوحات تشغيل مقاهي ماهو: الطلبات والبوكسات والمنيو والولاء والفروع والصلاحيات.',
};

/** Browser chrome in the brand's cream paper (--cream-100). */
export const viewport: Viewport = {
  themeColor: '#FFF3E1',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
