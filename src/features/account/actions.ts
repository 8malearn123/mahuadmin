'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { activity, audit } from '@/lib/auth/audit';
import { checkCode, issueChallenge, openChallenge, resendChallenge } from '@/lib/auth/challenges';
import { CODE, MINUTE } from '@/lib/auth/config';
import { hashPassword, verifyPassword } from '@/lib/auth/crypto';
import { requireCaller } from '@/lib/auth/dal';
import { sessionKey } from '@/lib/auth/dto';
import { hit } from '@/lib/auth/limits';
import { TEXT, maskDestination, send } from '@/lib/auth/messages';
import { isOperatingBranch, sanitizePrefs } from '@/lib/auth/prefs';
import { clearSessionCookie, endSession, endUserSessions, forgetTrustedDevices, requestInfo } from '@/lib/auth/session';
import { activeSessionsOf, claimEmail, emailHolder, phoneHolder, removeUser, type Db, type UserRecord } from '@/lib/auth/store';
import type { Channel, FormState, NotificationPrefs } from '@/lib/auth/types';
import { MESSAGES, cleanCode, cleanName, nameError, normalizeEmail, normalizePhone, passwordError } from '@/lib/auth/validation';
import { countNoun } from '@/lib/format';
import { ROLES } from '@/lib/roles';

/*
 * The signed-in user's own account. Every action re-checks the session (requireCaller),
 * and changes that could take over an account ask for the current password again.
 */

function field(fd: FormData, name: string): string {
  const value = fd.get(name);
  return typeof value === 'string' ? value : '';
}

const WRONG_PASSWORD = 'كلمة المرور الحالية غير صحيحة.';

/**
 * Re-checks the current password before a sensitive change. Five tries per 15 minutes per
 * account, counted before the check so parallel requests share the limit. Returns the
 * message to show, or null when the password is right.
 */
async function confirmPassword(db: Db, user: UserRecord, password: string): Promise<string | null> {
  if (!password) return MESSAGES.passwordRequired;
  if (!hit(db, 'reauth:' + user.id, 5, 15 * MINUTE).ok) return 'محاولات كثيرة لكلمة المرور. انتظر بضع دقائق ثم حاول مجددًا.';
  return (await verifyPassword(password, user.passwordHash)) ? null : WRONG_PASSWORD;
}

// ---------------------------------------------------------------- profile

export async function updateName(_prev: FormState<'name'>, fd: FormData): Promise<FormState<'name'>> {
  const name = cleanName(field(fd, 'name'));
  const error = nameError(name);
  if (error) return { errors: { name: error } };
  const { user } = await requireCaller();
  user.name = name;
  refresh();
  return { success: 'حُفظ الاسم.', at: Date.now() };
}

export async function updatePreferences(input: { branch?: string; prefs?: Partial<NotificationPrefs> }): Promise<FormState> {
  const { user } = await requireCaller();
  // Staff branches are assigned by the admin; customers choose their preferred branch.
  if (user.role === 'customer' && isOperatingBranch(input?.branch)) user.branch = input.branch;
  user.prefs = sanitizePrefs(input?.prefs, user.prefs);
  refresh();
  return { success: 'حُفظت التفضيلات.', at: Date.now() };
}

// ---------------------------------------------------------------- phone and email

type ContactField = 'value' | 'password';

/**
 * Starts changing the phone number or email (or confirming the current email). The code
 * goes to the new contact; nothing changes until it is entered.
 */
export async function startContactChange(kind: 'phone' | 'email', _prev: FormState<ContactField>, fd: FormData): Promise<FormState<ContactField>> {
  const { db, user } = await requireCaller();
  const confirmCurrent = kind === 'email' && fd.get('confirmCurrent') === 'on';
  const raw = confirmCurrent ? (user.email ?? '') : field(fd, 'value');
  const value = kind === 'phone' ? normalizePhone(raw) : normalizeEmail(raw);
  if (!value) {
    const invalid = kind === 'phone' ? MESSAGES.phoneInvalid : MESSAGES.emailInvalid;
    return { errors: { value: raw.trim() ? invalid : kind === 'phone' ? MESSAGES.phoneRequired : 'أدخل البريد الإلكتروني.' } };
  }
  if (!confirmCurrent) {
    const wrong = await confirmPassword(db, user, field(fd, 'password'));
    if (wrong) return { errors: { password: wrong } };
    if (value === (kind === 'phone' ? user.phone : user.email)) {
      return { errors: { value: kind === 'phone' ? 'هذا هو رقمك الحالي.' : 'هذا هو بريدك الحالي.' } };
    }
    const holder = kind === 'phone' ? phoneHolder(db, value) : emailHolder(db, value);
    if (holder) return { errors: { value: kind === 'phone' ? 'هذا الرقم مرتبط بحساب آخر.' : 'هذا البريد مستخدم في حساب آخر.' } };
  }
  if (!hit(db, 'contact:' + user.id, 6, 60 * MINUTE).ok) return { error: 'طلبات تغيير كثيرة. حاول بعد قليل.' };

  issueChallenge(db, {
    purpose: kind === 'phone' ? 'change-phone' : 'change-email',
    userId: user.id,
    channel: kind === 'phone' ? 'whatsapp' : 'email',
    destination: value,
  });
  refresh();
  return { success: 'أرسلنا رمز التأكيد.', at: Date.now() };
}

export async function confirmContactChange(kind: 'phone' | 'email', _prev: FormState<'code'>, fd: FormData): Promise<FormState<'code'>> {
  const code = cleanCode(field(fd, 'code'));
  if (code.length !== CODE.length) return { errors: { code: MESSAGES.codeRequired } };
  const { db, user } = await requireCaller();
  const challenge = openChallenge(db, kind === 'phone' ? 'change-phone' : 'change-email', { userId: user.id });
  if (!challenge) return { error: 'انتهى طلب التغيير — ابدأ من جديد.' };
  const result = checkCode(challenge, code);
  if (!result.ok) return { errors: { code: result.error }, at: Date.now() };

  const now = Date.now();
  if (kind === 'phone') {
    const holder = phoneHolder(db, challenge.destination);
    if (holder && holder.id !== user.id) return { error: 'أصبح هذا الرقم مرتبطًا بحساب آخر.' };
    const previous = user.phone;
    user.phone = challenge.destination;
    user.phoneVerifiedAt = now;
    send({ channel: 'whatsapp', to: previous, text: TEXT.phoneChanged(maskDestination('whatsapp', user.phone)) });
    audit(db, ROLES[user.role].name, `تغيير رقم الجوال لحساب ${user.name}`);
  } else {
    const holder = emailHolder(db, challenge.destination);
    if (holder && holder.id !== user.id) return { error: 'أصبح هذا البريد مستخدمًا في حساب آخر.' };
    claimEmail(db, challenge.destination, user.id);
    user.email = challenge.destination;
    user.emailVerifiedAt = now;
  }
  refresh();
  return { success: kind === 'phone' ? 'تم تحديث رقم الجوال وتوثيقه.' : 'تم توثيق البريد الإلكتروني.', at: now };
}

export async function resendContactCode(kind: 'phone' | 'email', channel: Channel): Promise<FormState> {
  const { db, user } = await requireCaller();
  const challenge = openChallenge(db, kind === 'phone' ? 'change-phone' : 'change-email', { userId: user.id });
  if (!challenge) return { error: 'انتهى طلب التغيير — ابدأ من جديد.' };
  const result = resendChallenge(challenge, channel);
  if (!result.ok) return { error: result.error };
  refresh();
  return { success: 'أرسلنا رمزًا جديدًا.' };
}

export async function cancelContactChange(kind: 'phone' | 'email'): Promise<void> {
  const { db, user } = await requireCaller();
  const challenge = openChallenge(db, kind === 'phone' ? 'change-phone' : 'change-email', { userId: user.id });
  if (challenge) challenge.consumedAt = Date.now();
  refresh();
}

// ---------------------------------------------------------------- password and two-step

type PasswordField = 'current' | 'password' | 'confirm';

export async function changePassword(_prev: FormState<PasswordField>, fd: FormData): Promise<FormState<PasswordField>> {
  const current = field(fd, 'current');
  const password = field(fd, 'password');
  const confirm = field(fd, 'confirm');
  const { db, user, session } = await requireCaller();
  const policy = passwordError(password, user.phone);
  const errors: FormState<PasswordField>['errors'] = {};
  if (!current) errors.current = MESSAGES.passwordRequired;
  if (policy) errors.password = policy;
  else if (confirm !== password) errors.confirm = MESSAGES.passwordMismatch;
  if (Object.keys(errors).length) return { errors };
  const wrong = await confirmPassword(db, user, current);
  if (wrong) return { errors: { current: wrong } };
  if (password === current) return { errors: { password: 'اختر كلمة مرور مختلفة عن الحالية.' } };

  const { device } = await requestInfo();
  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = Date.now();
  forgetTrustedDevices(db, user.id);
  activity(db, user.id, 'password', device);
  send({ channel: 'whatsapp', to: user.phone, text: TEXT.passwordChanged() });
  const ended = fd.get('signOutOthers') === 'on' ? endUserSessions(db, user.id, 'password-changed', session.id) : 0;
  refresh();
  return {
    success: ended > 0 ? `تم تغيير كلمة المرور وتسجيل الخروج من ${countNoun(ended, ['جهاز آخر', 'جهازين آخرين', 'أجهزة أخرى', 'جهازًا آخر'])}.` : 'تم تغيير كلمة المرور.',
    at: Date.now(),
  };
}

export async function setTwoStep(enabled: boolean, _prev: FormState<'password'>, fd: FormData): Promise<FormState<'password'>> {
  const { db, user } = await requireCaller();
  if (!enabled && ROLES[user.role].twoStep === 'required') return { error: 'التحقق بخطوتين إلزامي لدور ' + ROLES[user.role].name + '.' };
  if (enabled && !user.phoneVerifiedAt) return { error: 'وثّق رقم جوالك أولًا.' };
  // Turning it off weakens the account, so it needs the password.
  if (!enabled) {
    const wrong = await confirmPassword(db, user, field(fd, 'password'));
    if (wrong) return { errors: { password: wrong } };
  }
  user.twoStep = enabled;
  if (!enabled) forgetTrustedDevices(db, user.id);
  audit(db, ROLES[user.role].name, `${enabled ? 'تفعيل' : 'إيقاف'} التحقق بخطوتين لحساب ${user.name}`);
  refresh();
  return { success: enabled ? 'فُعّل التحقق بخطوتين.' : 'أُوقف التحقق بخطوتين.', at: Date.now() };
}

// ---------------------------------------------------------------- sessions

/** Ends one of the caller's other sessions, identified by the key shown on the sessions list. */
export async function endOtherSession(key: string): Promise<void> {
  const { db, user, session } = await requireCaller();
  // Only the caller's own sessions; the current one ends through "تسجيل الخروج".
  const target = activeSessionsOf(db, user.id).find((s) => sessionKey(s) === key && s.id !== session.id);
  if (target) endSession(db, target, 'revoked');
  refresh();
}

export async function endOtherSessions(): Promise<FormState> {
  const { db, user, session } = await requireCaller();
  const ended = endUserSessions(db, user.id, 'revoked', session.id);
  refresh();
  return { success: ended ? 'سُجّل الخروج من الأجهزة الأخرى.' : 'لا توجد أجهزة أخرى.', at: Date.now() };
}

// ---------------------------------------------------------------- delete account

type DeleteField = 'password' | 'confirm';

/** Customers can erase their account (PDPL). Staff accounts are removed by the admin. */
export async function deleteAccount(_prev: FormState<DeleteField>, fd: FormData): Promise<FormState<DeleteField>> {
  const { db, user } = await requireCaller();
  if (user.role !== 'customer') return { error: 'حسابات الفريق يحذفها مدير النظام.' };
  if (field(fd, 'confirm').trim() !== 'حذف') return { errors: { confirm: 'اكتب كلمة «حذف» للتأكيد.' } };
  const wrong = await confirmPassword(db, user, field(fd, 'password'));
  if (wrong) return { errors: { password: wrong } };
  removeUser(db, user, 'deleted');
  audit(db, ROLES.customer.name, `حذف حساب عميل بطلبه وفق نظام حماية البيانات الشخصية: ${user.name}`);
  await clearSessionCookie();
  redirect('/sign-in?reason=deleted');
}
