import 'server-only';
import { CODE } from './config';
import { generateCode, randomId, safeEqual, sha256 } from './crypto';
import { TEXT, send } from './messages';
import type { ChallengePurpose, ChallengeRecord, Db } from './store';
import type { Channel } from './types';

/*
 * One-time codes for phone verification, two-step sign-in, password reset and contact
 * changes. Codes are stored hashed, expire after 10 minutes, allow 5 attempts and can be
 * re-sent after 45 seconds, up to 5 sends.
 */

const TEXT_FOR: Record<ChallengePurpose, (code: string) => string> = {
  'verify-phone': TEXT.verifyPhone,
  'two-step': TEXT.twoStep,
  'reset-password': TEXT.reset,
  'change-phone': TEXT.changePhone,
  'change-email': TEXT.changeEmail,
};

function hashCode(challengeId: string, code: string): string {
  return sha256(challengeId + ':' + code);
}

interface NewChallenge {
  purpose: ChallengePurpose;
  /** Null makes a decoy: nothing is sent and no code matches (unknown account on password reset). */
  userId: string | null;
  sessionId?: string | null;
  channel: Channel;
  destination: string;
}

/** Creates a challenge, retires earlier open ones for the same purpose, and sends the first code. */
export function issueChallenge(db: Db, opts: NewChallenge, now = Date.now()): ChallengeRecord {
  if (opts.userId) {
    for (const c of db.challenges.values()) {
      if (c.purpose === opts.purpose && c.userId === opts.userId && c.consumedAt === null) c.consumedAt = now;
    }
  }
  const challenge: ChallengeRecord = {
    id: randomId('c'),
    purpose: opts.purpose,
    userId: opts.userId,
    sessionId: opts.sessionId ?? null,
    channel: opts.channel,
    destination: opts.destination,
    codeHash: '',
    expiresAt: 0,
    attempts: 0,
    sends: 0,
    sentAt: 0,
    consumedAt: null,
    demo: null,
  };
  db.challenges.set(challenge.id, challenge);
  deliver(challenge, now);
  return challenge;
}

function deliver(challenge: ChallengeRecord, now: number) {
  const code = generateCode();
  challenge.codeHash = hashCode(challenge.id, code);
  challenge.expiresAt = now + CODE.ttl;
  challenge.attempts = 0;
  challenge.sends += 1;
  challenge.sentAt = now;
  challenge.demo = challenge.userId
    ? send({ channel: challenge.channel, to: challenge.destination, text: TEXT_FOR[challenge.purpose](code), code })
    : null;
}

/** The newest open challenge of a user (or pending session) for a purpose, if any. */
export function openChallenge(db: Db, purpose: ChallengePurpose, owner: { userId?: string; sessionId?: string }): ChallengeRecord | undefined {
  let found: ChallengeRecord | undefined;
  for (const c of db.challenges.values()) {
    if (c.purpose !== purpose || c.consumedAt !== null) continue;
    if (owner.userId && c.userId !== owner.userId) continue;
    if (owner.sessionId && c.sessionId !== owner.sessionId) continue;
    if (!found || c.sentAt > found.sentAt) found = c;
  }
  return found;
}

/** Seconds until another code may be sent. */
export function resendWait(challenge: ChallengeRecord, now = Date.now()): number {
  return Math.max(0, Math.ceil((challenge.sentAt + CODE.resendSeconds * 1000 - now) / 1000));
}

export type ResendResult = { ok: true } | { ok: false; error: string };

/** Sends a new code; `channel` switches between WhatsApp and SMS for phone numbers. */
export function resendChallenge(challenge: ChallengeRecord, channel?: Channel, now = Date.now()): ResendResult {
  const wait = resendWait(challenge, now);
  if (wait > 0) return { ok: false, error: `يمكنك طلب رمز جديد بعد ${wait} ثانية.` };
  if (challenge.sends >= CODE.maxSends) {
    return { ok: false, error: 'وصلت إلى الحد الأقصى لإعادة الإرسال. ابدأ العملية من جديد بعد قليل.' };
  }
  if (channel && channel !== 'email' && challenge.channel !== 'email') challenge.channel = channel;
  deliver(challenge, now);
  return { ok: true };
}

export type CheckResult = { ok: true } | { ok: false; error: string };

function attemptsLeft(n: number): string {
  if (n === 1) return 'تبقّت محاولة واحدة';
  if (n === 2) return 'تبقّت محاولتان';
  return `تبقّت ${n} محاولات`;
}

/** Checks a code, counting the attempt. A matched challenge is consumed. */
export function checkCode(challenge: ChallengeRecord, code: string, now = Date.now()): CheckResult {
  if (challenge.consumedAt !== null) return { ok: false, error: 'استُخدم هذا الرمز من قبل — اطلب رمزًا جديدًا.' };
  if (challenge.expiresAt <= now) return { ok: false, error: 'انتهت صلاحية الرمز — اطلب رمزًا جديدًا.' };
  if (challenge.attempts >= CODE.maxAttempts) return { ok: false, error: 'استنفدت محاولات هذا الرمز — اطلب رمزًا جديدًا.' };
  challenge.attempts += 1;
  if (!challenge.userId || !safeEqual(hashCode(challenge.id, code), challenge.codeHash)) {
    const left = CODE.maxAttempts - challenge.attempts;
    return { ok: false, error: left > 0 ? `الرمز غير صحيح — ${attemptsLeft(left)}.` : 'الرمز غير صحيح واستنفدت المحاولات — اطلب رمزًا جديدًا.' };
  }
  challenge.consumedAt = now;
  return { ok: true };
}
