import 'server-only';
import { clockTime, maskEmail, maskPhoneIntl } from '../format';
import type { Channel, DemoMessage } from './types';

/**
 * Demo mode shows codes and invitation links on screen (the "صندوق الرسائل التجريبي")
 * because this build has no WhatsApp, SMS or email provider. It is on in development and
 * off in production builds unless MAHU_DEMO=1, so a deployment never shows codes by
 * accident. Wire a provider into `send` before turning it off for real use.
 */
export const DEMO_MODE = process.env.MAHU_DEMO === '1' || (process.env.MAHU_DEMO !== '0' && process.env.NODE_ENV !== 'production');

export function maskDestination(channel: Channel, to: string): string {
  return channel === 'email' ? maskEmail(to) : maskPhoneIntl(to);
}

export const TEXT = {
  verifyPhone: (code: string) => `ماهو: رمز التحقق ${code}. صالح لمدة 10 دقائق — لا تشاركه مع أحد.`,
  twoStep: (code: string) => `ماهو: رمز الدخول ${code}. إن لم تحاول تسجيل الدخول فتجاهل الرسالة وغيّر كلمة المرور.`,
  reset: (code: string) => `ماهو: رمز استعادة كلمة المرور ${code}. صالح لمدة 10 دقائق.`,
  changePhone: (code: string) => `ماهو: رمز تأكيد رقمك الجديد ${code}. صالح لمدة 10 دقائق.`,
  changeEmail: (code: string) => `رمز تأكيد بريدك في منصة ماهو: ${code}. صالح لمدة 10 دقائق.`,
  invite: (inviter: string, role: string, scope: string, link: string) =>
    `وصلتك دعوة من ${inviter} للانضمام إلى فريق ماهو بدور ${role} (${scope}). أكمل التسجيل خلال 72 ساعة: ${link}`,
  passwordChanged: () => 'ماهو: تم تغيير كلمة مرور حسابك. إن لم تكن أنت فاستعد كلمة المرور فورًا.',
  phoneChanged: (to: string) => `ماهو: نُقل حسابك إلى الرقم ${to}. إن لم تكن أنت فتواصل مع فريق ماهو.`,
};

interface Outgoing {
  channel: Channel;
  /** Raw phone number or email address. */
  to: string;
  text: string;
  code?: string;
  link?: string;
}

/**
 * Sends a WhatsApp, SMS or email message. With no provider configured the message only
 * reaches the server log and, in demo mode, the page that asked for it.
 */
export function send(message: Outgoing): DemoMessage | null {
  if (!DEMO_MODE) return null;
  const to = maskDestination(message.channel, message.to);
  console.info(`[auth] ${message.channel} → ${to}: ${message.text}`);
  return { channel: message.channel, to, text: message.text, code: message.code, link: message.link, time: clockTime(Date.now()) };
}
