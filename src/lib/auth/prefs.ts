import 'server-only';
import { OPERATING_BRANCHES } from '../roles';
import type { NotificationPrefs } from './types';

const PREF_KEYS: (keyof NotificationPrefs)[] = ['orderUpdates', 'boxReminders', 'offers', 'opsAlerts', 'dailyDigest', 'smsFallback'];

/** Copies only known boolean preferences from client input; anything else keeps its current value. */
export function sanitizePrefs(input: unknown, current: NotificationPrefs): NotificationPrefs {
  const source = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const next = { ...current };
  for (const key of PREF_KEYS) if (typeof source[key] === 'boolean') next[key] = source[key];
  return next;
}

export function isOperatingBranch(value: unknown): value is string {
  return typeof value === 'string' && OPERATING_BRANCHES.includes(value);
}
