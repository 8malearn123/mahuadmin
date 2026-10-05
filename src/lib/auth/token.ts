import { createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Signed cookie values: "<payload>.<expiry, base36 ms>.<HMAC-SHA256>".
 * The signature lets proxy.ts reject forged or expired cookies without the user store.
 * Every payload is also a random id looked up on the server (session, trusted device,
 * reset ticket), so even a leaked secret can't mint a usable cookie.
 */

const DEV_SECRET = 'mahu-dev-secret--set-SESSION_SECRET-before-deploying';
const SECRET = process.env.SESSION_SECRET || DEV_SECRET;
let warned = false;

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url');
}

/** `payload` must not contain dots (use base64url or ids). */
export function signToken(payload: string, expiresAt: number): string {
  if (SECRET === DEV_SECRET && process.env.NODE_ENV === 'production' && !warned) {
    warned = true;
    console.warn('[auth] SESSION_SECRET is not set; using the development secret. Set it before deploying.');
  }
  const data = payload + '.' + expiresAt.toString(36);
  return data + '.' + sign(data);
}

/** Returns the payload when the signature matches and the expiry hasn't passed. */
export function readToken(token: string | undefined, now = Date.now()): { payload: string; expiresAt: number } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [payload, exp, signature] = parts;
  const expected = Buffer.from(sign(payload + '.' + exp));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const expiresAt = parseInt(exp, 36);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  return { payload, expiresAt };
}
