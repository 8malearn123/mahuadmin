'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { activity, audit } from '@/lib/auth/audit';
import { checkCode, issueChallenge, openChallenge, resendChallenge } from '@/lib/auth/challenges';
import { CODE, MINUTE, SIGN_IN_LOCKOUT, SIGN_IN_MAX_FAILURES, UNLOCK_MAX_FAILURES } from '@/lib/auth/config';
import { hashPassword, randomId, verifyPassword } from '@/lib/auth/crypto';
import { callerAuth, homeFor } from '@/lib/auth/dal';
import { SIGN_OUT_NOTICES } from '@/lib/auth/labels';
import { hit } from '@/lib/auth/limits';
import { TEXT, send } from '@/lib/auth/messages';
import { isOperatingBranch, sanitizePrefs } from '@/lib/auth/prefs';
import {
  clearResetTicket,
  clearSessionCookie,
  endSession,
  endUserSessions,
  forgetTrustedDevices,
  isTrustedDevice,
  readResetTicket,
  requestInfo,
  setResetTicket,
  startSession,
  trustDevice,
} from '@/lib/auth/session';
import { claimEmail, defaultPrefs, emailHolder, findInvite, findUser, getDb, phoneHolder, type Db, type UserRecord } from '@/lib/auth/store';
import type { Channel, FormState, OnboardingInput, SessionPing } from '@/lib/auth/types';
import {
  MESSAGES,
  cleanCode,
  cleanName,
  nameError,
  normalizeEmail,
  normalizePhone,
  parseIdentifier,
  passwordError,
  safeNext,
} from '@/lib/auth/validation';
import { durationText } from '@/lib/format';
import { OPERATING_BRANCHES, ROLES, scopeRole } from '@/lib/roles';
import { landingHref } from '@/lib/views';

/*
 * Sign-in, sign-up and the steps between them. Each action re-reads the session from the
 * store; nothing here trusts what the page was showing.
 */

function field(fd: FormData, name: string): string {
  const value = fd.get(name);
  return typeof value === 'string' ? value : '';
}

function hasErrors(errors: Record<string, string | null | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Drops empty entries so the form only marks fields that have a message. */
function only<F extends string>(errors: Partial<Record<F, string | null | false>>): Partial<Record<F, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Partial<Record<F, string>>;
}

function lockedOutText(ms: number): string {
  return `أوقفنا الدخول إلى هذا الحساب مؤقتًا بعد عدة محاولات خاطئة. حاول بعد ${durationText(ms)} أو استعد كلمة المرور.`;
}

/** Pauses sign-in for the account after too many wrong passwords (once, however many guesses were in flight). */
function lockOut(db: Db, user: UserRecord, device: string): string {
  const now = Date.now();
  if (!user.lockedUntil || user.lockedUntil <= now) {
    user.lockedUntil = now + SIGN_IN_LOCKOUT;
    user.failedSignIns = 0;
    activity(db, user.id, 'locked-out', device);
    audit(db, 'النظام', `إيقاف الدخول مؤقتًا لحساب ${user.name} بعد ${SIGN_IN_MAX_FAILURES} محاولات خاطئة`);
  }
  return lockedOutText(user.lockedUntil - now);
}

/** Makes sure an unverified account has a verification code on its way. */
function ensurePhoneCode(db: Db, user: UserRecord) {
  if (!openChallenge(db, 'verify-phone', { userId: user.id })) {
    issueChallenge(db, { purpose: 'verify-phone', userId: user.id, channel: 'whatsapp', destination: user.phone });
  }
}

/** Where a user goes once signed in: verification and onboarding come before the dashboard. */
function afterSignIn(db: Db, user: UserRecord, next: string | null): string {
  if (!user.phoneVerifiedAt) {
    ensurePhoneCode(db, user);
    return '/verify';
  }
  if (!user.onboardedAt) return '/onboarding';
  return next ?? landingHref(user.role);
}

async function completeSignIn(db: Db, user: UserRecord, opts: { remember: boolean; device: string; twoStep: boolean }) {
  await startSession(db, user, { stage: 'active', remember: opts.remember, device: opts.device });
  user.lastSignInAt = Date.now();
  activity(db, user.id, opts.twoStep ? 'two-step' : 'sign-in', opts.device);
  if (user.role === 'admin') audit(db, ROLES.admin.name, `تسجيل دخول ${user.name}${opts.twoStep ? ' بالتحقق بخطوتين' : ''}`);
}

// ---------------------------------------------------------------- sign in

type SignInField = 'identifier' | 'password';

export async function signIn(_prev: FormState<SignInField>, fd: FormData): Promise<FormState<SignInField>> {
  const raw = field(fd, 'identifier');
  const password = field(fd, 'password');
  const remember = fd.get('remember') === 'on';
  const next = safeNext(field(fd, 'next'));
  const id = parseIdentifier(raw);
  const errors = only<SignInField>({
    identifier: !raw.trim() ? MESSAGES.identifierRequired : !id && MESSAGES.identifierInvalid,
    password: !password && MESSAGES.passwordRequired,
  });
  if (hasErrors(errors) || !id) return { errors };

  const db = await getDb();
  const { ip, device } = await requestInfo();
  const now = Date.now();
  if (!hit(db, 'sign-in:' + ip, 30, 15 * MINUTE).ok) {
    return { error: 'محاولات كثيرة من هذا الجهاز. انتظر بضع دقائق ثم حاول مجددًا.' };
  }

  const user = findUser(db, id);
  if (user?.passwordHash) {
    if (user.lockedUntil && user.lockedUntil > now) return { error: lockedOutText(user.lockedUntil - now) };
    if (user.failedSignIns >= SIGN_IN_MAX_FAILURES) return { error: lockOut(db, user, device) };
    // Counted before the (slow) hash check, so guesses sent in parallel can't get past the limit.
    user.failedSignIns += 1;
  }
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) {
    if (user?.passwordHash) {
      activity(db, user.id, 'failed', device);
      if (user.failedSignIns >= SIGN_IN_MAX_FAILURES) return { error: lockOut(db, user, device) };
    }
    return { error: 'بيانات الدخول غير صحيحة. تحقق من الرقم أو البريد وكلمة المرور.' };
  }
  user.failedSignIns = 0;
  // Only revealed after the right password, so it can't be used to probe accounts.
  if (user.status === 'suspended') return { error: SIGN_OUT_NOTICES.suspended.text };
  user.lockedUntil = null;

  const wantsCode = user.twoStep || ROLES[user.role].twoStep === 'required';
  if (wantsCode && user.phoneVerifiedAt && !(await isTrustedDevice(db, user.id))) {
    const pending = await startSession(db, user, { stage: 'two-step', remember, device, returnTo: next });
    issueChallenge(db, { purpose: 'two-step', userId: user.id, sessionId: pending.id, channel: 'whatsapp', destination: user.phone });
    redirect('/sign-in/two-step');
  }
  await completeSignIn(db, user, { remember, device, twoStep: false });
  redirect(afterSignIn(db, user, next));
}

// ---------------------------------------------------------------- two-step

/** The pending two-step sign-in, or a redirect to wherever the caller actually is. */
async function pendingTwoStep() {
  const { db, auth } = await callerAuth();
  if (auth.status !== 'two-step') redirect(homeFor(auth));
  return { db, auth };
}

export async function verifyTwoStep(_prev: FormState<'code'>, fd: FormData): Promise<FormState<'code'>> {
  const code = cleanCode(field(fd, 'code'));
  if (code.length !== CODE.length) return { errors: { code: MESSAGES.codeRequired } };
  const { db, auth } = await pendingTwoStep();
  // Each sign-in gets fresh attempts, so also cap guesses per account across sign-ins.
  if (!hit(db, 'two-step:' + auth.user.id, 10, 15 * MINUTE).ok) return { error: 'محاولات كثيرة. انتظر بضع دقائق ثم سجّل الدخول من جديد.' };
  const challenge = openChallenge(db, 'two-step', { sessionId: auth.session.id });
  if (!challenge) return { errors: { code: 'انتهت صلاحية الرمز — اطلب رمزًا جديدًا.' } };
  const result = checkCode(challenge, code);
  if (!result.ok) return { errors: { code: result.error }, at: Date.now() };

  const { device } = await requestInfo();
  const pending = auth.session;
  db.sessions.delete(pending.id);
  if (fd.get('trust') === 'on') await trustDevice(db, auth.user.id);
  await completeSignIn(db, auth.user, { remember: pending.remember, device, twoStep: true });
  redirect(afterSignIn(db, auth.user, pending.returnTo));
}

export async function resendTwoStepCode(channel: Channel): Promise<FormState> {
  const { db, auth } = await pendingTwoStep();
  const challenge = openChallenge(db, 'two-step', { sessionId: auth.session.id });
  if (!challenge) {
    issueChallenge(db, { purpose: 'two-step', userId: auth.user.id, sessionId: auth.session.id, channel, destination: auth.user.phone });
  } else {
    const result = resendChallenge(challenge, channel);
    if (!result.ok) return { error: result.error };
  }
  refresh();
  return { success: channel === 'sms' ? 'أرسلنا رمزًا جديدًا في رسالة SMS.' : 'أرسلنا رمزًا جديدًا عبر واتساب.' };
}

/** "استخدام حساب آخر": drops the half-finished sign-in. */
export async function cancelTwoStep(): Promise<void> {
  const { db, auth } = await callerAuth();
  if (auth.status === 'two-step') db.sessions.delete(auth.session.id);
  await clearSessionCookie();
  redirect('/sign-in');
}

// ---------------------------------------------------------------- sign up

type SignUpField = 'name' | 'phone' | 'email' | 'password' | 'terms';

export async function signUp(_prev: FormState<SignUpField>, fd: FormData): Promise<FormState<SignUpField>> {
  const name = cleanName(field(fd, 'name'));
  const phoneRaw = field(fd, 'phone');
  const phone = normalizePhone(phoneRaw);
  const emailRaw = field(fd, 'email').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  const password = field(fd, 'password');
  const errors = only<SignUpField>({
    name: nameError(name),
    phone: !phoneRaw.trim() ? MESSAGES.phoneRequired : !phone && MESSAGES.phoneInvalid,
    email: emailRaw && !email && MESSAGES.emailInvalid,
    password: passwordError(password, phone),
    terms: fd.get('terms') !== 'on' && MESSAGES.termsRequired,
  });
  if (hasErrors(errors) || !phone) return { errors };

  const db = await getDb();
  const { ip, device } = await requestInfo();
  if (!hit(db, 'sign-up:' + ip, 10, 60 * MINUTE).ok) return { error: 'طلبات تسجيل كثيرة من هذا الجهاز. حاول بعد قليل.' };
  const taken = only<SignUpField>({
    phone: phoneHolder(db, phone) && 'هذا الرقم مسجّل لدينا — سجّل الدخول أو استعد كلمة المرور.',
    email: email && emailHolder(db, email) && 'هذا البريد مستخدم في حساب آخر.',
  });
  if (hasErrors(taken)) return { errors: taken };

  const now = Date.now();
  const user: UserRecord = {
    id: randomId('u'),
    name,
    phone,
    email,
    passwordHash: await hashPassword(password),
    role: 'customer',
    branch: OPERATING_BRANCHES[0],
    status: 'active',
    phoneVerifiedAt: null,
    emailVerifiedAt: null,
    onboardedAt: null,
    twoStep: false,
    prefs: { ...defaultPrefs('customer'), offers: fd.get('offers') === 'on' },
    createdAt: now,
    passwordChangedAt: null,
    lastSignInAt: now,
    failedSignIns: 0,
    lockedUntil: null,
    invitedBy: null,
  };
  if (email) claimEmail(db, email, user.id);
  db.users.set(user.id, user);
  audit(db, ROLES.customer.name, `تسجيل عميل جديد من الموقع: ${user.name}`);
  await startSession(db, user, { stage: 'active', remember: true, device });
  activity(db, user.id, 'sign-in', device);
  issueChallenge(db, { purpose: 'verify-phone', userId: user.id, channel: 'whatsapp', destination: phone });
  redirect('/verify');
}

// ---------------------------------------------------------------- phone verification

async function unverifiedCaller() {
  const { db, auth } = await callerAuth();
  if (auth.status !== 'unverified') redirect(homeFor(auth));
  return { db, auth };
}

export async function verifyPhone(_prev: FormState<'code'>, fd: FormData): Promise<FormState<'code'>> {
  const code = cleanCode(field(fd, 'code'));
  if (code.length !== CODE.length) return { errors: { code: MESSAGES.codeRequired } };
  const { db, auth } = await unverifiedCaller();
  const challenge = openChallenge(db, 'verify-phone', { userId: auth.user.id });
  if (!challenge) return { errors: { code: 'انتهت صلاحية الرمز — اطلب رمزًا جديدًا.' } };
  const result = checkCode(challenge, code);
  if (!result.ok) return { errors: { code: result.error }, at: Date.now() };
  const now = Date.now();
  auth.user.phoneVerifiedAt = now;
  auth.session.lastSeenAt = now;
  redirect(auth.user.onboardedAt ? landingHref(auth.user.role) : '/onboarding');
}

export async function resendPhoneCode(channel: Channel): Promise<FormState> {
  const { db, auth } = await unverifiedCaller();
  const challenge = openChallenge(db, 'verify-phone', { userId: auth.user.id });
  if (!challenge) {
    issueChallenge(db, { purpose: 'verify-phone', userId: auth.user.id, channel, destination: auth.user.phone });
  } else {
    const result = resendChallenge(challenge, channel);
    if (!result.ok) return { error: result.error };
  }
  refresh();
  return { success: channel === 'sms' ? 'أرسلنا رمزًا جديدًا في رسالة SMS.' : 'أرسلنا رمزًا جديدًا عبر واتساب.' };
}

/**
 * Corrects a mistyped number before it is verified — customers only. A staff number was set
 * by the admin, and verifying it is what proves the invitation reached the right person.
 */
export async function changeUnverifiedPhone(_prev: FormState<'phone'>, fd: FormData): Promise<FormState<'phone'>> {
  const raw = field(fd, 'phone');
  const phone = normalizePhone(raw);
  if (!phone) return { errors: { phone: raw.trim() ? MESSAGES.phoneInvalid : MESSAGES.phoneRequired } };
  const { db, auth } = await unverifiedCaller();
  if (auth.user.role !== 'customer') return { error: 'رقم حسابك يحدده مدير النظام — اطلب منه تصحيحه وإعادة إرسال الدعوة.' };
  if (phone !== auth.user.phone && phoneHolder(db, phone)) {
    return { errors: { phone: 'هذا الرقم مرتبط بحساب آخر — سجّل الدخول به أو استخدم رقمًا مختلفًا.' } };
  }
  if (!hit(db, 'change-phone:' + auth.user.id, 5, 60 * MINUTE).ok) return { error: 'غيّرت الرقم عدة مرات. حاول بعد قليل.' };
  auth.user.phone = phone;
  issueChallenge(db, { purpose: 'verify-phone', userId: auth.user.id, channel: 'whatsapp', destination: phone });
  refresh();
  return { success: 'حدّثنا الرقم وأرسلنا إليه رمزًا جديدًا.', at: Date.now() };
}

// ---------------------------------------------------------------- password recovery

export async function requestPasswordReset(_prev: FormState<'identifier'>, fd: FormData): Promise<FormState<'identifier'>> {
  const raw = field(fd, 'identifier');
  const id = parseIdentifier(raw);
  if (!id) return { errors: { identifier: raw.trim() ? MESSAGES.identifierInvalid : MESSAGES.identifierRequired } };
  const db = await getDb();
  const { ip } = await requestInfo();
  if (!hit(db, 'reset:' + ip, 10, 60 * MINUTE).ok || !hit(db, 'reset:' + id.value, 5, 60 * MINUTE).ok) {
    return { error: 'طلبات استعادة كثيرة. انتظر قليلًا ثم حاول مجددًا.' };
  }
  const user = findUser(db, id);
  // Codes only go to verified contacts of active accounts. Anyone else gets the same screen and no code.
  const verified = id.kind === 'phone' ? user?.phoneVerifiedAt : user?.emailVerifiedAt;
  const eligible = user && user.status === 'active' && user.passwordHash && verified ? user : null;
  const challenge = issueChallenge(db, {
    purpose: 'reset-password',
    userId: eligible?.id ?? null,
    channel: id.kind === 'email' ? 'email' : 'whatsapp',
    destination: id.value,
  });
  await setResetTicket(challenge.id);
  redirect('/reset-password');
}

async function resetChallenge(db: Db) {
  const ticket = await readResetTicket();
  const challenge = ticket ? db.challenges.get(ticket) : undefined;
  return challenge?.purpose === 'reset-password' && challenge.consumedAt === null ? challenge : null;
}

type ResetField = 'code' | 'password' | 'confirm';

export async function resetPassword(_prev: FormState<ResetField>, fd: FormData): Promise<FormState<ResetField>> {
  const code = cleanCode(field(fd, 'code'));
  const password = field(fd, 'password');
  const confirm = field(fd, 'confirm');
  const db = await getDb();
  const challenge = await resetChallenge(db);
  if (!challenge) return { error: 'انتهت صلاحية طلب الاستعادة — ابدأ من جديد.' };
  const user = challenge.userId ? db.users.get(challenge.userId) : undefined;
  // No "don't use your number" rule here: before the code is proven it would reveal the account's number.
  const errors = only<ResetField>({
    code: code.length !== CODE.length && MESSAGES.codeRequired,
    password: passwordError(password),
    confirm: !passwordError(password) && confirm !== password && MESSAGES.passwordMismatch,
  });
  if (hasErrors(errors)) return { errors };
  const result = checkCode(challenge, code);
  if (!result.ok || !user) return { errors: { code: result.ok ? 'الرمز غير صحيح.' : result.error }, at: Date.now() };

  const { device } = await requestInfo();
  user.passwordHash = await hashPassword(password);
  user.passwordChangedAt = Date.now();
  user.failedSignIns = 0;
  user.lockedUntil = null;
  endUserSessions(db, user.id, 'password-reset');
  forgetTrustedDevices(db, user.id);
  activity(db, user.id, 'reset', device);
  send({ channel: 'whatsapp', to: user.phone, text: TEXT.passwordChanged() });
  await clearResetTicket();
  await clearSessionCookie();
  redirect('/sign-in?reason=password-reset');
}

export async function resendResetCode(channel: Channel): Promise<FormState> {
  const db = await getDb();
  const challenge = await resetChallenge(db);
  if (!challenge) return { error: 'انتهت صلاحية طلب الاستعادة — ابدأ من جديد.' };
  const result = resendChallenge(challenge, channel);
  if (!result.ok) return { error: result.error };
  refresh();
  return { success: challenge.channel === 'email' ? 'أرسلنا رمزًا جديدًا إلى بريدك.' : channel === 'sms' ? 'أرسلنا رمزًا جديدًا في رسالة SMS.' : 'أرسلنا رمزًا جديدًا عبر واتساب.' };
}

// ---------------------------------------------------------------- invitations

type InviteField = 'name' | 'password' | 'confirm' | 'terms';

export async function acceptInvite(token: string, _prev: FormState<InviteField>, fd: FormData): Promise<FormState<InviteField>> {
  const db = await getDb();
  const now = Date.now();
  const found = findInvite(db, token, now);
  if (!found) return { error: 'لم تعد هذه الدعوة صالحة — اطلب دعوة جديدة من مدير النظام.' };
  const { invite, user } = found;
  const name = cleanName(field(fd, 'name'));
  const password = field(fd, 'password');
  const errors = only<InviteField>({
    name: nameError(name),
    password: passwordError(password, user.phone),
    confirm: !passwordError(password, user.phone) && field(fd, 'confirm') !== password && MESSAGES.passwordMismatch,
    terms: fd.get('terms') !== 'on' && 'يلزم الموافقة على سياسة الاستخدام وحماية البيانات.',
  });
  if (hasErrors(errors)) return { errors };

  // Accepting signs out whoever was signed in on this browser.
  const { auth } = await callerAuth();
  if (auth.status !== 'signed-out') db.sessions.delete(auth.session.id);

  const { device } = await requestInfo();
  user.name = name;
  user.passwordHash = await hashPassword(password);
  user.status = 'active';
  user.lastSignInAt = now;
  db.invites.delete(invite.id);
  const role = scopeRole(ROLES[user.role], user.branch);
  audit(db, role.name, `قبول دعوة الانضمام: ${user.name} — ${role.name} (${role.scope})`);
  await startSession(db, user, { stage: 'active', remember: false, device });
  activity(db, user.id, 'sign-in', device);
  issueChallenge(db, { purpose: 'verify-phone', userId: user.id, channel: 'whatsapp', destination: user.phone });
  redirect('/verify');
}

// ---------------------------------------------------------------- onboarding

export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  const { auth } = await callerAuth();
  if (auth.status !== 'onboarding') redirect(homeFor(auth));
  const user = auth.user;
  if (user.role === 'customer' && isOperatingBranch(input?.branch)) user.branch = input.branch;
  user.prefs = sanitizePrefs(input?.prefs, user.prefs);
  if (user.role !== 'customer') user.twoStep = ROLES[user.role].twoStep === 'required' || input?.twoStep === true;
  const now = Date.now();
  user.onboardedAt = now;
  auth.session.lastSeenAt = now;
  redirect(landingHref(user.role));
}

// ---------------------------------------------------------------- lock, heartbeat, sign out

/** Locks the screen ("قفل الآن" or the idle timer). The page stays loaded behind the lock. */
export async function lockSession(): Promise<void> {
  const { auth } = await callerAuth();
  if (auth.status === 'active' || auth.status === 'locked') auth.session.lockedAt ??= Date.now();
}

export async function unlockSession(_prev: FormState<'password'>, fd: FormData): Promise<FormState<'password'>> {
  const password = field(fd, 'password');
  const next = safeNext(field(fd, 'next'));
  const page = fd.get('mode') === 'page';
  const { db, auth } = await callerAuth();
  if (auth.status === 'active') {
    // Already unlocked (e.g. from another tab).
    if (page) redirect(next ?? landingHref(auth.user.role));
    return { success: 'unlocked', at: Date.now() };
  }
  if (auth.status !== 'locked') redirect(homeFor(auth));
  if (!password) return { errors: { password: MESSAGES.passwordRequired } };
  // Counted before the hash check, so parallel guesses can't exceed the limit.
  auth.session.failedUnlocks += 1;
  if (!(await verifyPassword(password, auth.user.passwordHash))) {
    const left = UNLOCK_MAX_FAILURES - auth.session.failedUnlocks;
    if (left <= 0) {
      endSession(db, auth.session, 'unlock-failed');
      await clearSessionCookie();
      redirect('/sign-in?reason=unlock-failed');
    }
    const remaining = left === 1 ? 'تبقّت محاولة واحدة' : left === 2 ? 'تبقّت محاولتان' : `تبقّت ${left} محاولات`;
    return { errors: { password: `كلمة المرور غير صحيحة — ${remaining} قبل تسجيل الخروج.` } };
  }
  const { device } = await requestInfo();
  auth.session.lockedAt = null;
  auth.session.failedUnlocks = 0;
  auth.session.lastSeenAt = Date.now();
  activity(db, auth.user.id, 'unlocked', device);
  if (page) redirect(next ?? landingHref(auth.user.role));
  return { success: 'unlocked', at: Date.now() };
}

/**
 * Heartbeat from open dashboard tabs: records activity (so idle locking follows real use)
 * and reports whether the session was locked, ended elsewhere or changed by an admin.
 */
export async function pingSession(active: boolean): Promise<SessionPing> {
  const { auth } = await callerAuth();
  if (auth.status === 'signed-out') return { status: auth.status, reason: auth.reason };
  if (auth.status === 'active' && active) auth.session.lastSeenAt = Date.now();
  return { status: auth.status, role: auth.user.role, branch: auth.user.branch };
}

export async function signOut(): Promise<void> {
  const { db, auth } = await callerAuth();
  if (auth.status !== 'signed-out') {
    const { device } = await requestInfo();
    if (auth.status !== 'two-step') activity(db, auth.user.id, 'sign-out', device);
    endSession(db, auth.session, 'signed-out');
  }
  await clearSessionCookie();
  redirect('/sign-in?reason=signed-out');
}
