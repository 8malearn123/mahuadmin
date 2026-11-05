import 'server-only';
import { randomId } from './crypto';
import type { ActivityKind, Db } from './store';

/** Adds an entry to the audit log shown on the permissions screen (newest first there). */
export function audit(db: Db, actor: string, text: string, at = Date.now()) {
  db.audit.push({ id: randomId('e'), at, actor, text });
}

/** Records a sign-in related event on the user's own security page. */
export function activity(db: Db, userId: string, kind: ActivityKind, device: string, at = Date.now()) {
  db.activity.push({ id: randomId('a'), userId, at, kind, device });
}
