import type { Tone } from '../types';
import type { Channel, NotificationPrefs, SignOutReason, UserStatus } from './types';

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: 'واتساب',
  sms: 'رسالة SMS',
  email: 'البريد الإلكتروني',
};

/** Notice on the sign-in page after a session ends (`/sign-in?reason=…`). */
export const SIGN_OUT_NOTICES: Record<SignOutReason, { tone: 'ok' | 'warn' | 'bad'; text: string }> = {
  'signed-out': { tone: 'ok', text: 'تم تسجيل خروجك. نراك قريبًا.' },
  expired: { tone: 'warn', text: 'انتهت جلستك — سجّل الدخول مجددًا للمتابعة.' },
  revoked: { tone: 'warn', text: 'أُنهيت جلستك على هذا الجهاز من جهاز آخر أو من مدير النظام.' },
  'password-changed': { tone: 'warn', text: 'تغيّرت كلمة المرور فأُنهيت الجلسات الأخرى — سجّل الدخول بكلمة المرور الجديدة.' },
  'password-reset': { tone: 'ok', text: 'تم تعيين كلمة المرور الجديدة وإنهاء جلساتك السابقة — سجّل الدخول بها.' },
  suspended: { tone: 'bad', text: 'أوقف مدير النظام هذا الحساب. تواصل معه لإعادة التفعيل.' },
  deleted: { tone: 'ok', text: 'حُذف حسابك وبياناتك نهائيًا. شكرًا لأنك كنت معنا.' },
  'unlock-failed': { tone: 'warn', text: 'سُجّل خروجك بعد عدة محاولات خاطئة لفتح القفل.' },
};

export const USER_STATUS: Record<UserStatus, { label: string; tone: Tone }> = {
  active: { label: 'نشط', tone: 'ok' },
  unverified: { label: 'بانتظار التحقق', tone: 'muted' },
  invited: { label: 'دعوة معلّقة', tone: 'muted' },
  suspended: { label: 'موقوف', tone: 'bad' },
};

/** Notification switches shown in onboarding and on the account page, per kind of account. */
export const PREF_OPTIONS: Record<'customer' | 'staff', { key: keyof NotificationPrefs; title: string; desc: string }[]> = {
  customer: [
    { key: 'orderUpdates', title: 'تحديثات حالة الطلب', desc: 'رسالة واتساب عند تجهيز طلبك وجاهزيته للاستلام.' },
    { key: 'boxReminders', title: 'تذكير بمواعيد البوكسات', desc: 'قبل موعد تسليم البوكس بيوم.' },
    { key: 'offers', title: 'العروض والأصناف الجديدة', desc: 'رسائل تسويقية، ويمكنك إيقافها في أي وقت.' },
    { key: 'smsFallback', title: 'رسائل SMS عند تعذّر واتساب', desc: 'للرموز وتحديثات الطلب فقط.' },
  ],
  staff: [
    { key: 'opsAlerts', title: 'تنبيهات التشغيل', desc: 'المخزون وتأخر التحضير وحجوزات الغد — عبر واتساب.' },
    { key: 'dailyDigest', title: 'الملخص اليومي', desc: 'مبيعات وطلبات اليوم بالبريد الإلكتروني نهاية كل يوم.' },
    { key: 'smsFallback', title: 'رسائل SMS عند تعذّر واتساب', desc: 'لرموز الدخول والتنبيهات العاجلة فقط.' },
  ],
};
