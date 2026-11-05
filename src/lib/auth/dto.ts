import 'server-only';
import { durationText, longDate, timeAgo } from '../format';
import { ROLES, scopeRole } from '../roles';
import type { Tone } from '../types';
import { openChallenge } from './challenges';
import { sha256 } from './crypto';
import { activeSessionsOf, type ActivityKind, type Db, type SessionRecord, type UserRecord } from './store';
import type { AccountView, ActivityView, SessionView, UserRow, UserStatus } from './types';

/*
 * Data transfer objects: only the fields each screen shows, formatted on the server
 * (relative times are computed per request, so they never disagree with the browser).
 */

export function accountView(user: UserRecord, now = Date.now()): AccountView {
  const role = scopeRole(ROLES[user.role], user.branch);
  return {
    name: user.name,
    role: user.role,
    roleName: role.name,
    scope: role.scope,
    isCustomer: user.role === 'customer',
    phone: user.phone,
    phoneVerified: user.phoneVerifiedAt !== null,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    twoStep: user.twoStep,
    twoStepRequired: role.twoStep === 'required',
    branch: user.branch,
    prefs: user.prefs,
    memberSince: longDate(user.createdAt),
    passwordChanged: user.passwordChangedAt === null ? null : timeAgo(user.passwordChangedAt, now),
    idleMinutes: role.idleMinutes,
  };
}

/** Stand-in for a session id on the page; the real id never leaves the server. */
export function sessionKey(session: SessionRecord): string {
  return sha256('session:' + session.id).slice(0, 24);
}

export function sessionViews(db: Db, user: UserRecord, current: SessionRecord, now = Date.now()): SessionView[] {
  return activeSessionsOf(db, user.id, now)
    .sort((a, b) => Number(b.id === current.id) - Number(a.id === current.id) || b.lastSeenAt - a.lastSeenAt)
    .map((s) => ({
      id: sessionKey(s),
      device: s.device,
      current: s.id === current.id,
      started: timeAgo(s.createdAt, now),
      lastSeen: s.id === current.id ? 'الآن' : timeAgo(s.lastSeenAt, now),
      remembered: s.remember,
      locked: s.lockedAt !== null,
    }));
}

const ACTIVITY_TEXT: Record<ActivityKind, { text: string; tone: Tone }> = {
  'sign-in': { text: 'تسجيل دخول', tone: 'ok' },
  'two-step': { text: 'تسجيل دخول بالتحقق بخطوتين', tone: 'ok' },
  failed: { text: 'محاولة دخول بكلمة مرور خاطئة', tone: 'bad' },
  'locked-out': { text: 'إيقاف الدخول مؤقتًا بعد محاولات خاطئة', tone: 'bad' },
  unlocked: { text: 'فتح الشاشة بعد القفل', tone: 'muted' },
  password: { text: 'تغيير كلمة المرور', tone: 'muted' },
  reset: { text: 'استعادة كلمة المرور برمز التحقق', tone: 'muted' },
  'sign-out': { text: 'تسجيل خروج', tone: 'muted' },
};

export function activityViews(db: Db, userId: string, now = Date.now(), limit = 6): ActivityView[] {
  return db.activity
    .filter((a) => a.userId === userId)
    .slice(-limit)
    .reverse()
    .map((a) => ({ id: a.id, ...ACTIVITY_TEXT[a.kind], device: a.device, when: timeAgo(a.at, now) }));
}

export function userStatus(user: UserRecord): UserStatus {
  if (user.status !== 'active') return user.status;
  return user.phoneVerifiedAt === null ? 'unverified' : 'active';
}

export function userRows(db: Db, viewer: UserRecord, now = Date.now()): UserRow[] {
  const order: Record<UserStatus, number> = { active: 0, unverified: 1, invited: 2, suspended: 3 };
  return [...db.users.values()]
    .map((u): UserRow => {
      const invite = [...db.invites.values()].find((i) => i.userId === u.id);
      const status = userStatus(u);
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        branch: u.branch,
        scope: scopeRole(ROLES[u.role], u.branch).scope,
        status,
        twoStep: u.twoStep,
        lastSignIn: u.lastSignInAt === null ? 'لم يسجّل الدخول بعد' : timeAgo(u.lastSignInAt, now),
        activeSessions: activeSessionsOf(db, u.id, now).length,
        inviteNote:
          status !== 'invited' || !invite
            ? null
            : invite.expiresAt > now
              ? 'تنتهي الدعوة خلال ' + durationText(invite.expiresAt - now)
              : 'انتهت صلاحية الدعوة',
        awaitingSetup: u.status === 'invited' || (u.role !== 'customer' && status === 'unverified'),
        isSelf: u.id === viewer.id,
      };
    })
    .sort((a, b) => Number(b.isSelf) - Number(a.isSelf) || order[a.status] - order[b.status]);
}

/** Pending phone or email change waiting for its code, for the profile page. */
export function pendingContactChange(db: Db, userId: string, now = Date.now()) {
  for (const purpose of ['change-phone', 'change-email'] as const) {
    const c = openChallenge(db, purpose, { userId });
    if (c && c.expiresAt > now) return { purpose, challenge: c };
  }
  return null;
}
