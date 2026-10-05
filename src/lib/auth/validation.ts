/*
 * Input rules shared by the forms (live hints) and the Server Actions (the actual check).
 * Messages are the ones shown under the fields.
 */

/** Arabic-Indic (٠–٩) and Persian (۰–۹) digits → ASCII, so numbers typed on an Arabic keyboard work. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));
}

/** A Saudi mobile number in any common form (+966…, 00966…, 5…, 05…) → "05XXXXXXXX", or null. */
export function normalizePhone(input: string): string | null {
  let d = toLatinDigits(input).replace(/[\s\-().]/g, '');
  if (d.startsWith('+966')) d = '0' + d.slice(4);
  else if (d.startsWith('00966')) d = '0' + d.slice(5);
  else if (d.startsWith('966') && d.length === 12) d = '0' + d.slice(3);
  else if (d.startsWith('5') && d.length === 9) d = '0' + d;
  return /^05\d{8}$/.test(d) ? d : null;
}

export function normalizeEmail(input: string): string | null {
  const e = input.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e) ? e : null;
}

export type Identifier = { kind: 'phone' | 'email'; value: string };

/** Sign-in and password recovery accept either a mobile number or an email address. */
export function parseIdentifier(input: string): Identifier | null {
  if (input.includes('@')) {
    const email = normalizeEmail(input);
    return email ? { kind: 'email', value: email } : null;
  }
  const phone = normalizePhone(input);
  return phone ? { kind: 'phone', value: phone } : null;
}

/** Trims and collapses inner whitespace. */
export function cleanName(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/** Digits only, at most six — what a verification code field keeps of its input. */
export function cleanCode(input: string): string {
  return toLatinDigits(input).replace(/\D/g, '').slice(0, 6);
}

export const MESSAGES = {
  nameRequired: 'اكتب الاسم الكامل كما يظهر على الطلب.',
  nameShort: 'الاسم قصير جدًا — حرفان على الأقل.',
  nameLong: 'الاسم طويل — 60 حرفًا كحد أقصى.',
  phoneRequired: 'أدخل رقم الجوال.',
  phoneInvalid: 'أدخل رقم جوال سعودي صحيحًا يبدأ بـ 05 ويتكوّن من 10 أرقام.',
  emailInvalid: 'تحقق من البريد الإلكتروني — مثال: name@example.com',
  identifierRequired: 'أدخل رقم الجوال أو البريد الإلكتروني.',
  identifierInvalid: 'أدخل رقم جوال سعودي (05XXXXXXXX) أو بريدًا إلكترونيًا صحيحًا.',
  passwordRequired: 'أدخل كلمة المرور.',
  passwordWeak: 'كلمة المرور لا تستوفي الشروط أدناه.',
  passwordCommon: 'كلمة المرور شائعة ويسهل تخمينها — اختر غيرها.',
  passwordIsPhone: 'لا تستخدم رقم جوالك كلمةً للمرور.',
  passwordMismatch: 'كلمتا المرور غير متطابقتين.',
  codeRequired: 'أدخل الرمز المكوّن من 6 أرقام.',
  termsRequired: 'يلزم الموافقة على الشروط وسياسة الخصوصية لإنشاء الحساب.',
} as const;

export function nameError(name: string): string | null {
  if (!name) return MESSAGES.nameRequired;
  if ((name.match(/\p{L}/gu) ?? []).length < 2) return MESSAGES.nameShort;
  if (name.length > 60) return MESSAGES.nameLong;
  return null;
}

export const PASSWORD_RULES: { id: string; label: string; test: (pw: string) => boolean }[] = [
  { id: 'length', label: '8 أحرف على الأقل', test: (pw) => pw.length >= 8 },
  { id: 'letter', label: 'حرف واحد على الأقل', test: (pw) => /\p{L}/u.test(pw) },
  { id: 'digit', label: 'رقم واحد على الأقل', test: (pw) => /\d/.test(toLatinDigits(pw)) },
];

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', 'password', 'password1',
  'password123', 'qwerty123', 'qwertyuiop', '1q2w3e4r', 'abcd1234', 'abc12345', 'asdf1234', 'iloveyou1',
  'mahu1234', 'mahu12345', 'admin123', 'welcome1',
]);

export function passwordError(pw: string, phone?: string | null): string | null {
  if (!pw) return MESSAGES.passwordRequired;
  if (!PASSWORD_RULES.every((r) => r.test(pw))) return MESSAGES.passwordWeak;
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) return MESSAGES.passwordCommon;
  if (phone && toLatinDigits(pw).includes(phone.slice(1))) return MESSAGES.passwordIsPhone;
  return null;
}

/** Meter shown under new-password fields: 0 = empty, 1 = weak, 2 = fair, 3 = strong. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { score: 0, label: '' };
  const meetsRules = PASSWORD_RULES.every((r) => r.test(pw)) && !COMMON_PASSWORDS.has(pw.toLowerCase());
  if (!meetsRules) return { score: 1, label: 'ضعيفة' };
  const symbol = /[^\p{L}\d]/u.test(pw);
  const mixedCase = /\p{Lu}/u.test(pw) && /\p{Ll}/u.test(pw);
  if (pw.length >= 12 || (pw.length >= 10 && (symbol || mixedCase))) return { score: 3, label: 'قوية' };
  return { score: 2, label: 'متوسطة' };
}

/**
 * Where to send the user after signing in: only same-site paths, never protocol-relative
 * ("//evil.example") or auth pages (which would loop).
 */
export function safeNext(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  // Browsers drop tabs and newlines from URLs and read "\" as "/", so "/<tab>/evil.com" would become "//evil.com".
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  // Resolve dot segments ("/..//evil.com", "/%2e%2e//evil.com") the way the browser will.
  let url: URL;
  try {
    url = new URL(value, 'http://n');
  } catch {
    return null;
  }
  if (url.origin !== 'http://n' || url.pathname.startsWith('//')) return null;
  const path = url.pathname;
  const authPaths = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/verify', '/onboarding', '/unlock', '/invite'];
  if (path === '/' || authPaths.some((p) => path === p || path.startsWith(p + '/'))) return null;
  return path + url.search + url.hash;
}
