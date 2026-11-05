import 'server-only';
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { CODE } from './config';

/** Random URL-safe id with a readable prefix, e.g. "u_Xk2…". */
export function randomId(prefix: string): string {
  return prefix + '_' + randomBytes(12).toString('base64url');
}

/** Unguessable token for sessions, invitations and reset tickets (256 bits). */
export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Constant-time comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A six-digit one-time code (leading zeros allowed). */
export function generateCode(): string {
  return String(randomInt(0, 10 ** CODE.length)).padStart(CODE.length, '0');
}

// scrypt with Node's default cost (N=16384, r=8, p=1); stored as "scrypt$N$r$p$salt$hash".
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };

function derive(password: string, salt: Buffer, options: ScryptOptions, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = SCRYPT;
  const key = await derive(password, salt, { N, r, p }, keylen);
  return ['scrypt', N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$');
}

// Verifying against this when the account doesn't exist keeps response times alike.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const target = stored ?? (await (dummyHash ??= hashPassword('not-a-real-password-0')));
  const [scheme, N, r, p, salt, hash] = target.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64url');
  const key = await derive(password, Buffer.from(salt, 'base64url'), { N: +N, r: +r, p: +p }, expected.length);
  return timingSafeEqual(key, expected) && stored !== null;
}
