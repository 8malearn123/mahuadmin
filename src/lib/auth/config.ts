/*
 * Auth policy in one place. Imported by proxy.ts too, so keep this file free of
 * server-only modules.
 */

/** httpOnly cookies set by the auth system. */
export const SESSION_COOKIE = 'mahu_session';
/** Lets a browser skip the two-step code for 30 days after the user ticks "trust this device". */
export const TRUSTED_DEVICE_COOKIE = 'mahu_trusted';
/** Points at the password-reset challenge between /forgot-password and /reset-password. */
export const RESET_COOKIE = 'mahu_reset';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const SESSION_TTL = {
  /** "تذكرني" ticked: a persistent cookie. */
  remembered: 30 * DAY,
  /** Not ticked: a browser-session cookie, and the server ends it after a working shift. */
  standard: 12 * HOUR,
  /** Password accepted, waiting for the two-step code. */
  twoStep: 10 * MINUTE,
};

export const TRUSTED_DEVICE_TTL = 30 * DAY;
/** A customer who signs up but never verifies the number stops holding it after this long. */
export const UNVERIFIED_HOLD = 30 * MINUTE;
export const RESET_TTL = 15 * MINUTE;
export const INVITE_TTL = 72 * HOUR;

/** One-time codes sent by WhatsApp, SMS or email. */
export const CODE = {
  length: 6,
  ttl: 10 * MINUTE,
  maxAttempts: 5,
  /** Seconds before "إعادة الإرسال" is available again. */
  resendSeconds: 45,
  /** Sends per challenge, including the first. */
  maxSends: 5,
};

/** Wrong passwords in a row before sign-in pauses for the account. */
export const SIGN_IN_MAX_FAILURES = 5;
export const SIGN_IN_LOCKOUT = 15 * MINUTE;
/** Wrong passwords on the lock screen before the session is signed out. */
export const UNLOCK_MAX_FAILURES = 5;

/** How often an active tab tells the server it is still in use (keeps idle tracking honest). */
export const HEARTBEAT_INTERVAL = MINUTE;

/** Paths reachable without a session. Everything else needs at least a pending session cookie. */
export const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/invite'];

/** Steps between password and dashboard; they need a session cookie but not a completed sign-in. */
export const FLOW_PATHS = ['/sign-in/two-step', '/verify', '/onboarding', '/unlock'];

export function isPublicPath(pathname: string): boolean {
  if (FLOW_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return false;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
