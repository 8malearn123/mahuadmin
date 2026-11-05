import 'server-only';
import type { Db } from './store';

/**
 * Fixed-window rate limit. Counts a hit against `key` and reports whether it is
 * within `max` per `windowMs`, and if not, how long until the window resets.
 */
export function hit(db: Db, key: string, max: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfter: number } {
  let counter = db.counters.get(key);
  if (!counter || counter.resetAt <= now) {
    counter = { count: 0, resetAt: now + windowMs };
    db.counters.set(key, counter);
  }
  counter.count += 1;
  return { ok: counter.count <= max, retryAfter: Math.max(0, counter.resetAt - now) };
}
