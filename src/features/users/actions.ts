'use server';

import { refresh } from 'next/cache';
import { audit } from '@/lib/auth/audit';
import { INVITE_TTL } from '@/lib/auth/config';
import { randomId, randomToken, sha256 } from '@/lib/auth/crypto';
import { requireCaller } from '@/lib/auth/dal';
import { TEXT, send } from '@/lib/auth/messages';
import { endUserSessions, forgetTrustedDevices, requestInfo } from '@/lib/auth/session';
import { claimEmail, defaultPrefs, emailHolder, phoneHolder, removeUser, type Db, type UserRecord } from '@/lib/auth/store';
import type { FormState } from '@/lib/auth/types';
import { MESSAGES, cleanName, nameError, normalizeEmail, normalizePhone } from '@/lib/auth/validation';
import { ALL_BRANCHES, OPERATING_BRANCHES, ROLES, STAFF_ROLE_IDS, isMultiBranch, scopeRole } from '@/lib/roles';
import { countNoun } from '@/lib/format';
import type { RoleId } from '@/lib/types';

/*
 * User management on the users screen. Only system admins may call these; each action
 * checks that itself rather than trusting that the screen was only shown to admins.
 */

const FORBIDDEN = 'لا تملك صلاحية إدارة المستخدمين.';

function field(fd: FormData, name: string): string {
  const value = fd.get(name);
  return typeof value === 'string' ? value : '';
}

async function requireAdmin() {
  const caller = await requireCaller();
  return caller.user.role === 'admin' ? caller : null;
}

/** Branch-scoped roles get one operating branch; the others see every branch. */
function branchFor(role: RoleId, branch: string): string | null {
  if (isMultiBranch(ROLES[role])) return ALL_BRANCHES;
  return OPERATING_BRANCHES.includes(branch) ? branch : null;
}

function describe(user: Pick<UserRecord, 'role' | 'branch'>): string {
  const role = scopeRole(ROLES[user.role], user.branch);
  return role.name + ' (' + role.scope + ')';
}

/**
 * Invited staff who haven't verified their number yet: the admin can send a new link (the
 * old password is cleared) or withdraw the invitation, e.g. when the number was wrong.
 */
function awaitingSetup(user: UserRecord): boolean {
  return user.status === 'invited' || (user.role !== 'customer' && user.status === 'active' && user.phoneVerifiedAt === null);
}

/** Admins left who can still sign in, so the last one can't be demoted or suspended. */
function activeAdmins(db: Db): number {
  return [...db.users.values()].filter((u) => u.role === 'admin' && u.status === 'active').length;
}

/** Creates (or replaces) the invitation link and sends it by WhatsApp, and by email when there is one. */
async function sendInvite(db: Db, user: UserRecord, inviter: UserRecord) {
  for (const [id, invite] of db.invites) if (invite.userId === user.id) db.invites.delete(id);
  const token = randomToken();
  const id = randomId('i');
  const now = Date.now();
  db.invites.set(id, { id, tokenHash: sha256(token), userId: user.id, invitedBy: inviter.id, createdAt: now, expiresAt: now + INVITE_TTL });
  const { origin } = await requestInfo();
  const link = origin + '/invite/' + token;
  const role = scopeRole(ROLES[user.role], user.branch);
  const text = TEXT.invite(inviter.name, role.name, role.scope, link);
  const demo = send({ channel: 'whatsapp', to: user.phone, text, link });
  if (user.email) send({ channel: 'email', to: user.email, text, link });
  return demo;
}

type InviteField = 'name' | 'phone' | 'email' | 'role' | 'branch';

export async function inviteUser(_prev: FormState<InviteField>, fd: FormData): Promise<FormState<InviteField>> {
  const caller = await requireAdmin();
  if (!caller) return { error: FORBIDDEN };
  const { db, user: admin } = caller;
  const name = cleanName(field(fd, 'name'));
  const phoneRaw = field(fd, 'phone');
  const phone = normalizePhone(phoneRaw);
  const emailRaw = field(fd, 'email').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  const role = field(fd, 'role') as RoleId;
  const validRole = STAFF_ROLE_IDS.includes(role);
  const branch = validRole ? branchFor(role, field(fd, 'branch')) : null;

  const errors: FormState<InviteField>['errors'] = {};
  const nameProblem = nameError(name);
  if (nameProblem) errors.name = nameProblem;
  if (!phone) errors.phone = phoneRaw.trim() ? MESSAGES.phoneInvalid : MESSAGES.phoneRequired;
  else if (phoneHolder(db, phone)) errors.phone = 'هذا الرقم مرتبط بحساب موجود.';
  if (emailRaw && !email) errors.email = MESSAGES.emailInvalid;
  else if (email && emailHolder(db, email)) errors.email = 'هذا البريد مستخدم في حساب موجود.';
  if (!validRole) errors.role = 'اختر دورًا للفريق.';
  else if (!branch) errors.branch = 'اختر الفرع.';
  if (Object.keys(errors).length || !phone || !branch) return { errors };

  const now = Date.now();
  const user: UserRecord = {
    id: randomId('u'),
    name,
    phone,
    email,
    passwordHash: null,
    role,
    branch,
    status: 'invited',
    phoneVerifiedAt: null,
    emailVerifiedAt: null,
    onboardedAt: null,
    twoStep: ROLES[role].twoStep === 'required',
    prefs: defaultPrefs(role),
    createdAt: now,
    passwordChangedAt: null,
    lastSignInAt: null,
    failedSignIns: 0,
    lockedUntil: null,
    invitedBy: admin.id,
  };
  if (email) claimEmail(db, email, user.id);
  db.users.set(user.id, user);
  const demo = await sendInvite(db, user, admin);
  audit(db, ROLES.admin.name, `دعوة ${name} بدور ${describe(user)}`);
  refresh();
  return { success: `أُرسلت الدعوة إلى ${name}${email ? ' عبر واتساب والبريد' : ' عبر واتساب'}.`, demo, at: now };
}

export async function resendInvite(userId: string): Promise<FormState> {
  const caller = await requireAdmin();
  if (!caller) return { error: FORBIDDEN };
  const user = caller.db.users.get(userId);
  if (!user || !awaitingSetup(user)) return { error: 'لم يعد لهذا المستخدم دعوة معلّقة.' };
  if (user.status === 'active') {
    // Accepted but never verified: start over, so only the person with the right number can finish.
    user.status = 'invited';
    user.passwordHash = null;
    endUserSessions(caller.db, user.id, 'revoked');
  }
  const demo = await sendInvite(caller.db, user, caller.user);
  audit(caller.db, ROLES.admin.name, `إعادة إرسال دعوة ${user.name}`);
  refresh();
  return { success: `أُعيد إرسال الدعوة إلى ${user.name}، وبطل الرابط السابق.`, demo, at: Date.now() };
}

export async function revokeInvite(userId: string): Promise<FormState> {
  const caller = await requireAdmin();
  if (!caller) return { error: FORBIDDEN };
  const { db } = caller;
  const user = db.users.get(userId);
  if (!user || !awaitingSetup(user)) return { error: 'لم يعد لهذا المستخدم دعوة معلّقة.' };
  removeUser(db, user, 'revoked');
  audit(db, ROLES.admin.name, `إلغاء دعوة ${user.name}`);
  refresh();
  return { success: `أُلغيت دعوة ${user.name}.`, at: Date.now() };
}

type AccessField = 'role' | 'branch';

export async function updateAccess(userId: string, _prev: FormState<AccessField>, fd: FormData): Promise<FormState<AccessField>> {
  const caller = await requireAdmin();
  if (!caller) return { error: FORBIDDEN };
  const { db, user: admin } = caller;
  const user = db.users.get(userId);
  if (!user) return { error: 'المستخدم غير موجود.' };
  if (user.id === admin.id) return { error: 'لا يمكنك تغيير دورك بنفسك — اطلب ذلك من مدير نظام آخر.' };
  // Customers sign up themselves; staff roles are assigned here.
  const role = (user.role === 'customer' ? 'customer' : field(fd, 'role')) as RoleId;
  if (user.role !== 'customer' && !STAFF_ROLE_IDS.includes(role)) return { errors: { role: 'اختر دورًا للفريق.' } };
  const branch = user.role === 'customer' ? user.branch : branchFor(role, field(fd, 'branch'));
  if (!branch) return { errors: { branch: 'اختر الفرع.' } };
  if (user.role === 'admin' && role !== 'admin' && user.status === 'active' && activeAdmins(db) <= 1) {
    return { error: 'هذا آخر مدير نظام نشط — أسند الدور لشخص آخر أولًا.' };
  }
  if (role === user.role && branch === user.branch) return { success: 'لا تغييرات.', at: Date.now() };

  const before = describe(user);
  user.role = role;
  user.branch = branch;
  if (ROLES[role].twoStep === 'required') user.twoStep = true;
  audit(db, ROLES.admin.name, `تغيير صلاحية ${user.name}: ${before} ← ${describe(user)}`);
  refresh();
  return { success: `أصبح ${user.name} ${describe(user)}.`, at: Date.now() };
}

export async function setSuspended(userId: string, suspended: boolean): Promise<FormState> {
  const caller = await requireAdmin();
  if (!caller) return { error: FORBIDDEN };
  const { db, user: admin } = caller;
  const user = db.users.get(userId);
  if (!user || user.status === 'invited') return { error: 'المستخدم غير موجود.' };
  if (user.id === admin.id) return { error: 'لا يمكنك إيقاف حسابك.' };
  if (suspended && user.role === 'admin' && activeAdmins(db) <= 1) return { error: 'هذا آخر مدير نظام نشط.' };
  user.status = suspended ? 'suspended' : 'active';
  const ended = suspended ? endUserSessions(db, user.id, 'suspended') : 0;
  if (suspended) forgetTrustedDevices(db, user.id);
  audit(db, ROLES.admin.name, `${suspended ? 'إيقاف' : 'إعادة تفعيل'} حساب ${user.name}${ended ? ' وإنهاء ' + countNoun(ended, ['جلسة واحدة', 'جلستين', 'جلسات']) : ''}`);
  refresh();
  return { success: suspended ? `أُوقف حساب ${user.name} وسُجّل خروجه من كل الأجهزة.` : `أُعيد تفعيل حساب ${user.name}.`, at: Date.now() };
}

export async function endSessionsOf(userId: string): Promise<FormState> {
  const caller = await requireAdmin();
  if (!caller) return { error: FORBIDDEN };
  const { db, user: admin, session } = caller;
  const user = db.users.get(userId);
  if (!user) return { error: 'المستخدم غير موجود.' };
  const ended = endUserSessions(db, user.id, 'revoked', user.id === admin.id ? session.id : undefined);
  const devices = countNoun(ended, ['جهاز واحد', 'جهازين', 'أجهزة', 'جهازًا']);
  if (ended) audit(db, ROLES.admin.name, `تسجيل خروج ${user.name} من ${devices}`);
  refresh();
  return { success: ended ? `سُجّل خروج ${user.name} من ${devices}.` : 'لا توجد جلسات نشطة.', at: Date.now() };
}
