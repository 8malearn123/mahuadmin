import 'server-only';
import { ALL_BRANCHES } from '../roles';
import type { RoleId } from '../types';
import { DAY, HOUR, MINUTE, SESSION_TTL, UNVERIFIED_HOLD } from './config';
import { hashPassword, randomToken, sha256 } from './crypto';
import type { Identifier } from './validation';
import type { Channel, DemoMessage, NotificationPrefs, SignOutReason } from './types';

/*
 * In-memory user store, seeded with demo accounts. Like the rest of the dashboard it runs
 * on mock data: it lives in the server process and resets when the server restarts.
 * Swap these maps for database tables when a backend exists; every read and write goes
 * through the auth modules, so nothing else touches them.
 */

export interface UserRecord {
  id: string;
  name: string;
  /** "05XXXXXXXX". */
  phone: string;
  /** Lower-case, or null. */
  email: string | null;
  /** Null until an invited staff member sets a password. */
  passwordHash: string | null;
  role: RoleId;
  /** Assigned branch (single-branch staff), preferred branch (customers), or "الكل". */
  branch: string;
  status: 'active' | 'invited' | 'suspended';
  phoneVerifiedAt: number | null;
  emailVerifiedAt: number | null;
  onboardedAt: number | null;
  twoStep: boolean;
  prefs: NotificationPrefs;
  createdAt: number;
  passwordChangedAt: number | null;
  lastSignInAt: number | null;
  /** Wrong passwords since the last successful sign-in. */
  failedSignIns: number;
  /** Sign-in is paused for the account until this time. */
  lockedUntil: number | null;
  invitedBy: string | null;
}

export interface SessionRecord {
  id: string;
  userId: string;
  /** "two-step": password accepted, waiting for the code. */
  stage: 'two-step' | 'active';
  createdAt: number;
  expiresAt: number;
  /** Last time the user was active (page load, action or heartbeat from an active tab). */
  lastSeenAt: number;
  remember: boolean;
  device: string;
  /** Set when the screen locked (idle timeout or "قفل الآن"); cleared by unlocking. */
  lockedAt: number | null;
  failedUnlocks: number;
  /** Page to open once a two-step sign-in completes. */
  returnTo: string | null;
}

export type ChallengePurpose = 'verify-phone' | 'two-step' | 'reset-password' | 'change-phone' | 'change-email';

export interface ChallengeRecord {
  id: string;
  purpose: ChallengePurpose;
  /** Null for the decoy created when a reset is requested for an unknown account. */
  userId: string | null;
  /** The pending session a two-step code belongs to. */
  sessionId: string | null;
  channel: Channel;
  /** Number or address the code goes to (the new one when changing phone or email). */
  destination: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sends: number;
  sentAt: number;
  consumedAt: number | null;
  /** Demo mode: the last message sent, so the page can show it after a redirect. */
  demo: DemoMessage | null;
}

export interface InviteRecord {
  id: string;
  tokenHash: string;
  userId: string;
  invitedBy: string;
  createdAt: number;
  expiresAt: number;
}

export type ActivityKind = 'sign-in' | 'two-step' | 'failed' | 'locked-out' | 'unlocked' | 'password' | 'reset' | 'sign-out';

export interface ActivityRecord {
  id: string;
  userId: string;
  at: number;
  kind: ActivityKind;
  device: string;
}

export interface AuditRecord {
  id: string;
  at: number;
  /** Role name of whoever acted, as in the seeded audit log ("مدير النظام"), or "النظام". */
  actor: string;
  text: string;
}

export interface Db {
  users: Map<string, UserRecord>;
  sessions: Map<string, SessionRecord>;
  /** Ended sessions, kept until their cookie would have expired so the user can be told why. */
  ended: Map<string, { reason: SignOutReason; until: number }>;
  challenges: Map<string, ChallengeRecord>;
  invites: Map<string, InviteRecord>;
  /** Browsers that may skip the two-step code ("الوثوق بهذا الجهاز"), keyed by the cookie's random id. */
  trustedDevices: Map<string, { userId: string; expiresAt: number }>;
  activity: ActivityRecord[];
  audit: AuditRecord[];
  /** Fixed-window counters for rate limits. */
  counters: Map<string, { count: number; resetAt: number }>;
  sweptAt: number;
}

/** Password of every seeded account (shown on the sign-in page in demo mode). */
export const DEMO_PASSWORD = 'mahu2026';

export function defaultPrefs(role: RoleId): NotificationPrefs {
  const customer = role === 'customer';
  return {
    orderUpdates: customer,
    boxReminders: customer,
    offers: false,
    opsAlerts: !customer,
    dailyDigest: role === 'admin' || role === 'management',
    smsFallback: true,
  };
}

interface SeedUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: RoleId;
  branch: string;
  status?: UserRecord['status'];
  twoStep?: boolean;
  emailVerified?: boolean;
  /** How long ago they last signed in. */
  seen?: number;
  /** Another device that is still signed in. */
  device?: { label: string; seen: number; remember: boolean };
}

/** The five role accounts keep the names the design showed for each role. */
const SEED_USERS: SeedUser[] = [
  { id: 'u_noura', name: 'نورة الفيفي', phone: '0500117301', email: 'noura@mahu.sa', role: 'admin', branch: ALL_BRANCHES, twoStep: true, emailVerified: true, seen: 3 * HOUR, device: { label: 'Safari · iOS', seen: 3 * HOUR, remember: true } },
  { id: 'u_khalid', name: 'خالد الحازمي', phone: '0500117302', email: 'khalid@mahu.sa', role: 'management', branch: ALL_BRANCHES, emailVerified: true, seen: 20 * MINUTE, device: { label: 'Chrome · Windows', seen: 20 * MINUTE, remember: false } },
  { id: 'u_turki', name: 'تركي مدخلي', phone: '0500117303', email: 'turki@mahu.sa', role: 'branchManager', branch: 'جازان', emailVerified: true, seen: 5 * HOUR },
  { id: 'u_rayan', name: 'ريان الحكمي', phone: '0500117304', email: null, role: 'barista', branch: 'جازان', seen: HOUR, device: { label: 'Chrome · Android', seen: HOUR, remember: false } },
  { id: 'u_fahad', name: 'فهد الزهراني', phone: '0544130447', email: 'fahad.z@example.com', role: 'customer', branch: 'جازان', seen: 2 * DAY, device: { label: 'Safari · iOS', seen: 2 * DAY, remember: true } },
  { id: 'u_lama', name: 'لمى عسيري', phone: '0500117306', email: null, role: 'barista', branch: 'أبو عريش', seen: 26 * HOUR },
  { id: 'u_badr', name: 'بدر الشهري', phone: '0500117307', email: null, role: 'barista', branch: 'أبو عريش', status: 'suspended', seen: 9 * DAY },
  { id: 'u_muna', name: 'منى عطيف', phone: '0500117308', email: 'muna@mahu.sa', role: 'branchManager', branch: 'أبو عريش', status: 'invited' },
];

/** Demo accounts listed on the sign-in page, one per role. */
export const DEMO_ACCOUNT_IDS = ['u_noura', 'u_khalid', 'u_turki', 'u_rayan', 'u_fahad'];

async function seed(): Promise<Db> {
  const now = Date.now();
  const db: Db = {
    users: new Map(),
    sessions: new Map(),
    ended: new Map(),
    challenges: new Map(),
    invites: new Map(),
    trustedDevices: new Map(),
    activity: [],
    audit: [],
    counters: new Map(),
    sweptAt: now,
  };
  const hashes = await Promise.all(SEED_USERS.map((u) => (u.status === 'invited' ? null : hashPassword(DEMO_PASSWORD))));

  SEED_USERS.forEach((u, i) => {
    const invited = u.status === 'invited';
    const createdAt = now - (invited ? 1 : 120 + i * 9) * DAY;
    db.users.set(u.id, {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      passwordHash: hashes[i],
      role: u.role,
      branch: u.branch,
      status: u.status ?? 'active',
      phoneVerifiedAt: invited ? null : createdAt,
      emailVerifiedAt: u.emailVerified ? createdAt : null,
      onboardedAt: invited ? null : createdAt,
      twoStep: u.twoStep ?? false,
      prefs: defaultPrefs(u.role),
      createdAt,
      passwordChangedAt: invited ? null : now - (40 + i * 11) * DAY,
      lastSignInAt: u.seen === undefined ? null : now - u.seen,
      failedSignIns: 0,
      lockedUntil: null,
      invitedBy: u.role === 'customer' ? null : 'u_noura',
    });
    if (u.seen !== undefined) {
      db.activity.push({ id: 'a_' + u.id, userId: u.id, at: now - u.seen, kind: u.twoStep ? 'two-step' : 'sign-in', device: u.device?.label ?? 'Chrome · Windows' });
    }
    if (u.device) {
      const id = randomToken();
      db.sessions.set(id, {
        id,
        userId: u.id,
        stage: 'active',
        createdAt: now - u.device.seen - HOUR,
        expiresAt: now - u.device.seen + (u.device.remember ? SESSION_TTL.remembered : SESSION_TTL.standard),
        lastSeenAt: now - u.device.seen,
        remember: u.device.remember,
        device: u.device.label,
        lockedAt: null,
        failedUnlocks: 0,
        returnTo: null,
      });
    }
    if (invited) {
      // Nobody holds this token; "إعادة إرسال الدعوة" on the users screen issues a usable link.
      db.invites.set('i_' + u.id, { id: 'i_' + u.id, tokenHash: sha256(randomToken()), userId: u.id, invitedBy: 'u_noura', createdAt: now - DAY, expiresAt: now + 2 * DAY });
    }
  });
  return db;
}

// Kept on globalThis so the store survives hot reloads in development.
const holder = globalThis as typeof globalThis & { __mahuAuthDbV2?: Promise<Db> };

export async function getDb(): Promise<Db> {
  const db = await (holder.__mahuAuthDbV2 ??= seed());
  sweep(db, Date.now());
  return db;
}

/** Drops expired sessions, challenges, invitations and counters, at most once a minute. */
function sweep(db: Db, now: number) {
  if (now - db.sweptAt < MINUTE) return;
  db.sweptAt = now;
  for (const [id, s] of db.sessions) if (s.expiresAt <= now) db.sessions.delete(id);
  for (const [id, e] of db.ended) if (e.until <= now) db.ended.delete(id);
  for (const [id, c] of db.challenges) if (c.expiresAt <= now - HOUR) db.challenges.delete(id);
  for (const [id, t] of db.trustedDevices) if (t.expiresAt <= now) db.trustedDevices.delete(id);
  for (const [id, c] of db.counters) if (c.resetAt <= now) db.counters.delete(id);
  if (db.activity.length > 500) db.activity.splice(0, db.activity.length - 500);
  if (db.audit.length > 200) db.audit.splice(0, db.audit.length - 200);
}

export function findUserByPhone(db: Db, phone: string): UserRecord | undefined {
  for (const u of db.users.values()) if (u.phone === phone) return u;
}

export function findUserByEmail(db: Db, email: string): UserRecord | undefined {
  for (const u of db.users.values()) if (u.email === email) return u;
}

export function findUser(db: Db, id: Identifier): UserRecord | undefined {
  return id.kind === 'phone' ? findUserByPhone(db, id.value) : findUserByEmail(db, id.value);
}

/** Removes an account and everything tied to it; its open sessions are told `reason`. */
export function removeUser(db: Db, user: UserRecord, reason: SignOutReason) {
  for (const s of [...db.sessions.values()]) {
    if (s.userId !== user.id) continue;
    db.sessions.delete(s.id);
    db.ended.set(s.id, { reason, until: s.expiresAt });
  }
  for (const [id, c] of db.challenges) if (c.userId === user.id) db.challenges.delete(id);
  for (const [id, i] of db.invites) if (i.userId === user.id) db.invites.delete(id);
  for (const [id, t] of db.trustedDevices) if (t.userId === user.id) db.trustedDevices.delete(id);
  db.activity = db.activity.filter((a) => a.userId !== user.id);
  db.users.delete(user.id);
}

/**
 * The account holding a phone number. A customer who signed up but never verified it loses
 * the number after UNVERIFIED_HOLD (the unfinished account is removed), so a typo or a
 * stranger's sign-up can't lock the real owner out. Staff numbers are set by an admin.
 */
export function phoneHolder(db: Db, phone: string, now = Date.now()): UserRecord | undefined {
  const user = findUserByPhone(db, phone);
  if (user && user.role === 'customer' && user.phoneVerifiedAt === null && now - user.createdAt > UNVERIFIED_HOLD) {
    removeUser(db, user, 'expired');
    return undefined;
  }
  return user;
}

/** The account holding an email address: only verified addresses and staff addresses block others. */
export function emailHolder(db: Db, email: string): UserRecord | undefined {
  const user = findUserByEmail(db, email);
  return user && (user.emailVerifiedAt !== null || user.role !== 'customer') ? user : undefined;
}

/** Gives an email address to `userId`, taking it off any customer account that never verified it. */
export function claimEmail(db: Db, email: string, userId: string) {
  for (const u of db.users.values()) {
    if (u.email === email && u.id !== userId && u.emailVerifiedAt === null && u.role === 'customer') u.email = null;
  }
}

/** A pending, unexpired invitation by its link token, with the invited account and the time left. */
export function findInvite(db: Db, token: string, now = Date.now()): { invite: InviteRecord; user: UserRecord; expiresIn: number } | null {
  const hash = sha256(token);
  for (const invite of db.invites.values()) {
    if (invite.tokenHash !== hash) continue;
    const user = db.users.get(invite.userId);
    return user && user.status === 'invited' && invite.expiresAt > now ? { invite, user, expiresIn: invite.expiresAt - now } : null;
  }
  return null;
}

/** Signed-in sessions of a user (not pending two-step ones), newest activity first. */
export function activeSessionsOf(db: Db, userId: string, now = Date.now()): SessionRecord[] {
  return [...db.sessions.values()]
    .filter((s) => s.userId === userId && s.stage === 'active' && s.expiresAt > now)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}
