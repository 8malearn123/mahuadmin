import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ROLES, canOpenView } from '../roles';
import type { ViewId } from '../types';
import { landingHref } from '../views';
import { MINUTE } from './config';
import { readSessionCookie } from './session';
import { getDb, type Db, type SessionRecord, type UserRecord } from './store';
import type { SessionUser, SignOutReason } from './types';
import { safeNext } from './validation';

/*
 * Data access layer: every page and Server Action decides access here, from the session
 * in the store. proxy.ts only pre-checks the cookie signature.
 *
 * A session moves through these states:
 *   two-step   → password accepted, code pending           (/sign-in/two-step)
 *   unverified → mobile number not yet verified            (/verify)
 *   onboarding → verified, first-run setup not finished    (/onboarding)
 *   locked     → idle too long or locked by hand            (/unlock)
 *   active     → the dashboard
 */

type Signed = { user: UserRecord; session: SessionRecord };

export type ActiveAuth = Signed & { status: 'active' };

export type AuthState =
  | { status: 'signed-out'; reason: SignOutReason | null }
  | (Signed & { status: 'two-step' })
  | (Signed & { status: 'unverified' })
  | (Signed & { status: 'onboarding' })
  | (Signed & { status: 'locked' })
  | ActiveAuth;

/** How long the account's role may sit idle before the screen locks; null = never. */
export function idleLimit(user: UserRecord): number | null {
  const minutes = ROLES[user.role].idleMinutes;
  return minutes === null ? null : minutes * MINUTE;
}

export function isLocked(session: SessionRecord, user: UserRecord, now = Date.now()): boolean {
  if (session.lockedAt !== null) return true;
  const limit = idleLimit(user);
  return limit !== null && now - session.lastSeenAt > limit;
}

/** Works out the auth state from the session cookie and the store (no side effects). */
export function resolveAuth(db: Db, cookie: Awaited<ReturnType<typeof readSessionCookie>>, now = Date.now()): AuthState {
  if (cookie === null) return { status: 'signed-out', reason: null };
  if ('invalid' in cookie) return { status: 'signed-out', reason: 'expired' };
  const session = db.sessions.get(cookie.id);
  if (!session || session.expiresAt <= now) return { status: 'signed-out', reason: db.ended.get(cookie.id)?.reason ?? 'expired' };
  const user = db.users.get(session.userId);
  if (!user) return { status: 'signed-out', reason: 'revoked' };
  if (user.status === 'suspended') return { status: 'signed-out', reason: 'suspended' };
  if (session.stage === 'two-step') return { status: 'two-step', user, session };
  if (!user.phoneVerifiedAt) return { status: 'unverified', user, session };
  if (!user.onboardedAt) return { status: 'onboarding', user, session };
  if (isLocked(session, user, now)) return { status: 'locked', user, session };
  return { status: 'active', user, session };
}

/** The auth state for this request, read once per render. */
export const getAuth = cache(async (): Promise<AuthState> => resolveAuth(await getDb(), await readSessionCookie()));

function withQuery(path: string, query: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? path + '?' + qs : path;
}

/** The page a user in this state belongs on. */
export function homeFor(auth: AuthState, next?: string | null): string {
  switch (auth.status) {
    case 'signed-out':
      return withQuery('/sign-in', { reason: auth.reason, next });
    case 'two-step':
      return '/sign-in/two-step';
    case 'unverified':
      return '/verify';
    case 'onboarding':
      return '/onboarding';
    case 'locked':
      return withQuery('/unlock', { next });
    case 'active':
      return next ?? landingHref(auth.user.role);
  }
}

/** The path being requested, as recorded by proxy.ts, for returning to it after signing in. */
async function requestedPath(): Promise<string | null> {
  return safeNext((await headers()).get('x-mahu-path'));
}

/** For dashboard pages: the signed-in, unlocked user — or a redirect to the step they're on. */
export async function requireActive(): Promise<ActiveAuth> {
  const auth = await getAuth();
  if (auth.status === 'active') return auth;
  redirect(homeFor(auth, await requestedPath()));
}

/** requireActive, plus the account's role must be allowed to open the screen. */
export async function requireView(view: ViewId): Promise<ActiveAuth> {
  const auth = await requireActive();
  if (!canOpenView(ROLES[auth.user.role], view)) redirect(landingHref(auth.user.role));
  return auth;
}

/** For the in-between pages (/sign-in/two-step, /verify, /onboarding, /unlock). */
export async function requireStage<S extends 'two-step' | 'unverified' | 'onboarding' | 'locked'>(
  status: S,
): Promise<Extract<AuthState, { status: S }>> {
  const auth = await getAuth();
  if (auth.status !== status) redirect(homeFor(auth));
  return auth as Extract<AuthState, { status: S }>;
}

/** For sign-in, sign-up and password recovery: anyone with a session goes to their step instead. */
export async function redirectIfSignedIn(): Promise<void> {
  const auth = await getAuth();
  if (auth.status !== 'signed-out') redirect(homeFor(auth));
}

/** The current auth state with the store, for Server Actions (which run outside the render cache). */
export async function callerAuth(): Promise<{ db: Db; auth: AuthState }> {
  const db = await getDb();
  return { db, auth: resolveAuth(db, await readSessionCookie()) };
}

/**
 * For Server Actions that need a fully signed-in, unlocked user; anyone else is sent to
 * the step they're on. Counts as activity for idle tracking.
 */
export async function requireCaller(): Promise<ActiveAuth & { db: Db }> {
  const { db, auth } = await callerAuth();
  if (auth.status !== 'active') redirect(homeFor(auth));
  auth.session.lastSeenAt = Date.now();
  return { ...auth, db };
}

export function toSessionUser(user: UserRecord): SessionUser {
  return { id: user.id, name: user.name, role: user.role, branch: user.branch, phone: user.phone, idleMinutes: ROLES[user.role].idleMinutes };
}
