'use client';

import { usePathname } from 'next/navigation';
import styles from './auth.module.css';

const PITCHES = {
  platform: {
    headline: 'لوحات تشغيل مقاهي ماهو',
    lead: 'الطلبات والبوكسات والمنيو والولاء والفروع في منصة واحدة، وكل دور يرى ما يخصّه فقط.',
    points: ['صلاحيات لكل دور وفرع، وتحقق بخطوتين للإدارة', 'تحقق من الرقم برمز يصل عبر واتساب', 'استضافة داخل المملكة وفق نظام حماية البيانات الشخصية'],
  },
  customer: {
    headline: 'اطلب مسبقًا واجمع نقاطك',
    lead: 'حساب واحد للطلب الفوري وحجز البوكسات ومتابعة طلبك لحظة بلحظة، ونقاط بونات تُحتسب مع كل طلب.',
    points: ['تتبّع طلبك من التجهيز حتى الاستلام', 'احجز بوكسات المناسبات قبل 24 ساعة من التسليم', 'مشروب مجاني كلما وصل رصيدك إلى 500 نقطة'],
  },
  team: {
    headline: 'انضم إلى فريق ماهو',
    lead: 'أكمل حسابك لتصل إلى لوحات فرعك بصلاحيات دورك منذ أول وردية.',
    points: ['صلاحيات محددة لكل دور وفرع', 'تحقق من رقمك عبر واتساب قبل الدخول', 'كل عملية حساسة تُسجَّل في سجل التدقيق'],
  },
};

/** Brand panel copy: customers see the loyalty pitch on sign-up, invited staff the team pitch. */
export function BrandPitch() {
  const pathname = usePathname();
  const pitch = pathname.startsWith('/sign-up') ? PITCHES.customer : pathname.startsWith('/invite') ? PITCHES.team : PITCHES.platform;

  return (
    <div className={styles.pitch}>
      <h2 className={styles.headline}>{pitch.headline}</h2>
      <p className={styles.lead}>{pitch.lead}</p>
      <ul className={styles.points}>
        {pitch.points.map((p) => (
          <li key={p} className={styles.point}>
            <span className={styles.pointMark} aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
