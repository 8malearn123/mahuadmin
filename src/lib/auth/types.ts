import type { RoleId, Tone } from '../types';

/*
 * Shapes that cross from the server to the browser. They never carry password hashes,
 * codes (outside the demo inbox) or other users' session ids.
 */

export type Channel = 'whatsapp' | 'sms' | 'email';

/** Why a session ended; shown as a notice on the sign-in page. */
export type SignOutReason =
  | 'signed-out'
  | 'expired'
  | 'revoked'
  | 'password-changed'
  | 'password-reset'
  | 'suspended'
  | 'deleted'
  | 'unlock-failed';

/** A message the demo build shows on screen instead of sending it through WhatsApp, SMS or email. */
export interface DemoMessage {
  channel: Channel;
  /** Masked destination, e.g. "+966 5•• ••0447". */
  to: string;
  text: string;
  /** The code inside the message, so the inbox can fill it in. */
  code?: string;
  /** Invitation link, so the admin can copy it. */
  link?: string;
  /** Riyadh time it was "sent", e.g. "09:04". */
  time: string;
}

export interface NotificationPrefs {
  /** Customer: order status updates on WhatsApp. */
  orderUpdates: boolean;
  /** Customer: box delivery reminders. */
  boxReminders: boolean;
  /** Customer: offers and new items (marketing; off unless opted in). */
  offers: boolean;
  /** Staff: operational alerts (stock, prep times) on WhatsApp. */
  opsAlerts: boolean;
  /** Staff: daily summary by email. */
  dailyDigest: boolean;
  /** Fall back to SMS when WhatsApp can't be delivered. */
  smsFallback: boolean;
}

/** The signed-in account as the dashboard shell sees it. */
export interface SessionUser {
  id: string;
  name: string;
  role: RoleId;
  /** Assigned branch for single-branch roles and customers; "الكل" for multi-branch roles. */
  branch: string;
  /** "05XXXXXXXX" — the user's own number. */
  phone: string;
  /** Minutes without activity before the screen locks; null = never. */
  idleMinutes: number | null;
}

/** Everything the account pages show about the signed-in user. */
export interface AccountView {
  name: string;
  role: RoleId;
  roleName: string;
  scope: string;
  isCustomer: boolean;
  phone: string;
  phoneVerified: boolean;
  email: string | null;
  emailVerified: boolean;
  twoStep: boolean;
  twoStepRequired: boolean;
  /** Preferred branch (customers) or assigned branch (staff). */
  branch: string;
  prefs: NotificationPrefs;
  memberSince: string;
  /** e.g. "قبل 3 أشهر"; null if never changed since the account was created. */
  passwordChanged: string | null;
  idleMinutes: number | null;
}

export interface SessionView {
  id: string;
  device: string;
  current: boolean;
  started: string;
  lastSeen: string;
  remembered: boolean;
  locked: boolean;
}

export interface ActivityView {
  id: string;
  text: string;
  device: string;
  when: string;
  tone: Tone;
}

export type UserStatus = 'active' | 'unverified' | 'invited' | 'suspended';

/** A row on the admin users screen. */
export interface UserRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: RoleId;
  branch: string;
  scope: string;
  status: UserStatus;
  twoStep: boolean;
  lastSignIn: string;
  activeSessions: number;
  /** For pending invitations, e.g. "تنتهي خلال 3 أيام". */
  inviteNote: string | null;
  /** Invited, or accepted but never verified: the invitation can be re-sent or withdrawn. */
  awaitingSetup: boolean;
  isSelf: boolean;
}

/** What the onboarding wizard submits at the end. */
export interface OnboardingInput {
  /** Customers: preferred branch. */
  branch?: string;
  prefs: NotificationPrefs;
  /** Staff: turn on two-step verification. */
  twoStep?: boolean;
}

/** Heartbeat answer: the session's state now, and the account's current role and branch. */
export interface SessionPing {
  status: 'signed-out' | 'two-step' | 'unverified' | 'onboarding' | 'locked' | 'active';
  reason?: SignOutReason | null;
  role?: RoleId;
  branch?: string;
}

/** Result of a form Server Action, read with useActionState. */
export interface FormState<F extends string = string> {
  /** Field → message shown under it. */
  errors?: Partial<Record<F, string>>;
  /** Message about the whole form (wrong password, too many attempts…). */
  error?: string;
  success?: string;
  demo?: DemoMessage | null;
  /** Seconds until another code can be requested. */
  resendIn?: number;
  /** Changes on every completed submission, so forms can reset fields after a success. */
  at?: number;
}
