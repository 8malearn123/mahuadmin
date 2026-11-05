import 'server-only';
import { cookies, headers } from 'next/headers';
import { RESET_COOKIE, RESET_TTL, SESSION_COOKIE, SESSION_TTL, TRUSTED_DEVICE_COOKIE, TRUSTED_DEVICE_TTL } from './config';
import { randomToken } from './crypto';
import { describeDevice } from './device';
import type { Db, SessionRecord, UserRecord } from './store';
import { readToken, signToken } from './token';
import type { SignOutReason } from './types';

/*
 * Database sessions: the store holds the session, the browser holds its id in a signed,
 * httpOnly cookie. Cookies can only be written from Server Actions and Route Handlers.
 */

const secure = process.env.NODE_ENV === 'production';
const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };

/** Caller's IP (for rate limits), a device label (for the sessions list) and the site origin (for links). */
export async function requestInfo(): Promise<{ ip: string; device: string; origin: string }> {
  const h = await headers();
  // The left of x-forwarded-for is whatever the client sent; the right end was added by the nearest proxy.
  const ip = h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'local';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const local = /^(localhost|127\.|\[::1\])/.test(host);
  const proto = h.get('x-forwarded-proto') ?? (local ? 'http' : 'https');
  return { ip, device: describeDevice(h.get('user-agent') ?? ''), origin: proto + '://' + host };
}

interface NewSession {
  stage: SessionRecord['stage'];
  remember: boolean;
  device: string;
  returnTo?: string | null;
}

/** Creates a session and sets its cookie. Always a fresh id, so a sign-in never reuses an old one. */
export async function startSession(db: Db, user: UserRecord, opts: NewSession, now = Date.now()): Promise<SessionRecord> {
  const ttl = opts.stage === 'two-step' ? SESSION_TTL.twoStep : opts.remember ? SESSION_TTL.remembered : SESSION_TTL.standard;
  const session: SessionRecord = {
    id: randomToken(),
    userId: user.id,
    stage: opts.stage,
    createdAt: now,
    expiresAt: now + ttl,
    lastSeenAt: now,
    remember: opts.remember,
    device: opts.device,
    lockedAt: null,
    failedUnlocks: 0,
    returnTo: opts.returnTo ?? null,
  };
  db.sessions.set(session.id, session);
  // Without "تذكرني" the cookie lasts for the browser session (and the server ends it after 12 hours).
  const persistent = opts.remember || opts.stage === 'two-step';
  (await cookies()).set(SESSION_COOKIE, signToken(session.id, session.expiresAt), {
    ...base,
    ...(persistent ? { expires: new Date(session.expiresAt) } : {}),
  });
  return session;
}

/** The session id from the cookie; `invalid` when a cookie exists but is forged or expired. */
export async function readSessionCookie(): Promise<{ id: string } | { invalid: true } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const read = readToken(token);
  return read ? { id: read.payload } : { invalid: true };
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Ends one session and remembers why, so that device is told on its next request. */
export function endSession(db: Db, session: SessionRecord, reason: SignOutReason) {
  db.sessions.delete(session.id);
  db.ended.set(session.id, { reason, until: session.expiresAt });
}

/** Ends every session of a user (optionally except the current one). Returns how many ended. */
export function endUserSessions(db: Db, userId: string, reason: SignOutReason, exceptId?: string): number {
  let ended = 0;
  for (const s of [...db.sessions.values()]) {
    if (s.userId !== userId || s.id === exceptId) continue;
    endSession(db, s, reason);
    if (s.stage === 'active') ended += 1;
  }
  return ended;
}

/** "Trust this device": skip the two-step code on this browser for 30 days. */
export async function trustDevice(db: Db, userId: string, now = Date.now()) {
  const id = randomToken();
  const expiresAt = now + TRUSTED_DEVICE_TTL;
  db.trustedDevices.set(id, { userId, expiresAt });
  (await cookies()).set(TRUSTED_DEVICE_COOKIE, signToken(id, expiresAt), { ...base, expires: new Date(expiresAt) });
}

export async function isTrustedDevice(db: Db, userId: string, now = Date.now()): Promise<boolean> {
  const id = readToken((await cookies()).get(TRUSTED_DEVICE_COOKIE)?.value)?.payload;
  const device = id ? db.trustedDevices.get(id) : undefined;
  return !!device && device.userId === userId && device.expiresAt > now;
}

/** Every trusted browser of a user asks for the code again (password change, two-step off, suspension). */
export function forgetTrustedDevices(db: Db, userId: string) {
  for (const [id, device] of db.trustedDevices) if (device.userId === userId) db.trustedDevices.delete(id);
}

/** Links /forgot-password to /reset-password without putting the account in the URL. */
export async function setResetTicket(challengeId: string, now = Date.now()) {
  const expiresAt = now + RESET_TTL;
  (await cookies()).set(RESET_COOKIE, signToken(challengeId, expiresAt), { ...base, expires: new Date(expiresAt) });
}

export async function readResetTicket(): Promise<string | null> {
  return readToken((await cookies()).get(RESET_COOKIE)?.value)?.payload ?? null;
}

export async function clearResetTicket() {
  (await cookies()).delete(RESET_COOKIE);
}
