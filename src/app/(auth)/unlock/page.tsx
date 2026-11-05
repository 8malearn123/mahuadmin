import type { Metadata } from 'next';
import { UnlockForm } from '@/features/auth/UnlockForm';
import { requireStage } from '@/lib/auth/dal';
import { safeNext } from '@/lib/auth/validation';

export const metadata: Metadata = { title: 'الجلسة مقفلة' };

export default async function UnlockPage(props: PageProps<'/unlock'>) {
  const { user } = await requireStage('locked');
  const params = await props.searchParams;

  return (
    <UnlockForm
      mode="page"
      name={user.name}
      next={safeNext(params.next)}
      note="أُقفلت الجلسة لحمايتك بعد فترة من عدم النشاط. أدخل كلمة المرور للمتابعة من حيث توقفت."
    />
  );
}
