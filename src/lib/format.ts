/** Saudi riyal amount with thousands separators, e.g. "7,420 ر.س". */
export function sar(value: number): string {
  return value.toLocaleString('en-US') + ' ر.س';
}

/** Keeps the first and last four digits of a phone number, e.g. "0544•••0447". */
export function maskPhone(phone: string): string {
  return phone.slice(0, 4) + '•••' + phone.slice(-4);
}

/** A local mobile number in international form, e.g. "0544130447" → "+966 54 413 0447". */
export function phoneIntl(phone: string): string {
  const n = phone.replace(/^0/, '');
  return '+966 ' + n.slice(0, 2) + ' ' + n.slice(2, 5) + ' ' + n.slice(5);
}

/** International form showing only the last four digits, e.g. "+966 5•• ••0447" (as on the customer portal). */
export function maskPhoneIntl(phone: string): string {
  return '+966 ' + phone.slice(1, 2) + '•• ••' + phone.slice(-4);
}

/** Keeps the first two characters of the mailbox, e.g. "fa•••@example.com". */
export function maskEmail(email: string): string {
  const [box, domain] = email.split('@');
  return box.slice(0, 2) + '•••@' + domain;
}

/** First letter of a name, for avatars. */
export function initialOf(name: string): string {
  return name.trim().slice(0, 1);
}

/** First word of a name, for greetings. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

const RIYADH = 'Asia/Riyadh';
const clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: RIYADH, hour: '2-digit', minute: '2-digit', hour12: false });
const dayFormat = new Intl.DateTimeFormat('en-GB', { timeZone: RIYADH, day: '2-digit', month: '2-digit' });
const longDateFormat = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { timeZone: RIYADH, day: 'numeric', month: 'long', year: 'numeric' });

/** Riyadh wall-clock time, e.g. "09:04" (the format of the audit log). */
export function clockTime(at: number): string {
  return clockFormat.format(at);
}

/** Day and month, e.g. "05/10" (the format of the order log). */
export function shortDate(at: number): string {
  return dayFormat.format(at);
}

/** e.g. "5 أكتوبر 2026". */
export function longDate(at: number): string {
  return longDateFormat.format(at);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Arabic relative time for past moments: "الآن", "قبل 5 دقائق", "قبل ساعتين", "أمس", then the date. */
export function timeAgo(at: number, now: number): string {
  const diff = Math.max(0, now - at);
  if (diff < MINUTE) return 'الآن';
  if (diff < HOUR) return ago(Math.floor(diff / MINUTE), 'دقيقة', 'دقيقتين', 'دقائق');
  if (diff < DAY) return ago(Math.floor(diff / HOUR), 'ساعة', 'ساعتين', 'ساعات');
  const days = Math.floor(diff / DAY);
  if (days === 1) return 'أمس';
  if (days < 7) return ago(days, 'يوم', 'يومين', 'أيام');
  return longDate(at);
}

function ago(n: number, one: string, two: string, few: string): string {
  return 'قبل ' + count(n, one, two, few);
}

/** Whole minutes or hours until a future moment, e.g. "15 دقيقة", "3 أيام". */
export function durationText(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (minutes < 60) return count(minutes, 'دقيقة', 'دقيقتين', 'دقائق');
  const hours = Math.round(minutes / 60);
  if (hours < 48) return count(hours, 'ساعة', 'ساعتين', 'ساعات');
  return count(Math.round(hours / 24), 'يوم', 'يومين', 'أيام', 'يومًا');
}

/** Arabic counted noun: 1 and 2 take the singular and dual, 3–10 the plural, 11+ the singular ("دقيقة", "دقيقتين", "5 دقائق", "11 دقيقة"). */
function count(n: number, one: string, two: string, few: string, many = one): string {
  if (n === 1) return one;
  if (n === 2) return two;
  return n + ' ' + (n <= 10 ? few : many);
}

/** Counted noun for UI text, e.g. countNoun(3, ['جهاز واحد', 'جهازان', 'أجهزة', 'جهازًا']) → "3 أجهزة". */
export function countNoun(n: number, [one, two, few, many]: [string, string, string, string?]): string {
  return count(n, one, two, few, many);
}
