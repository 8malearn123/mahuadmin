# منصة ماهو الرقمية — لوحات التشغيل

Operations dashboard for Mahu café (Arabic, RTL): orders pipeline, scheduled box bookings, order log, customer lookup, loyalty, customer portal, menu & add-ons, inbound applications, branches, users and role-based access.

Built with Next.js 16 (App Router), React 19, TypeScript and CSS Modules. It is a port of the "Mahu Dashboard" design export and runs on seeded mock data; changes made in the UI live in memory and reset on reload. Accounts and sessions live in the server process and reset when it restarts.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`.

Sign in with one of the demo accounts listed on the sign-in page (password `mahu2026` for all):

| Role | Account | Notes |
| --- | --- | --- |
| مدير النظام | 0500117301 · noura@mahu.sa | two-step verification is required for this role |
| الإدارة العامة | 0500117302 · khalid@mahu.sa | |
| مدير الفرع | 0500117303 · turki@mahu.sa | Jazan branch |
| الباريستا / الكاشير | 0500117304 | Jazan branch |
| العميل | 0544130447 · fahad.z@example.com | the sample customer of the design |

Also seeded: an Abu Arish barista (0500117306), a suspended barista (0500117307) and a pending invitation.

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | development value | Signs the session, trusted-device and reset cookies. Set a long random value (`openssl rand -base64 32`) before deploying. |
| `MAHU_DEMO` | on in `pnpm dev`, off in production builds | Demo mode: verification codes and invitation links appear on screen in a "صندوق الرسائل التجريبي", and the sign-in page lists the demo accounts. No messages are sent anywhere yet, so a production build of this demo needs `MAHU_DEMO=1`; leave it off once `send()` in `src/lib/auth/messages.ts` delivers real WhatsApp, SMS and email. |
| `NEXT_PUBLIC_SITE_URL` | `#` | Target of the "الموقع العام ↗" links. |

## Project layout

```
src/proxy.ts             optimistic check before rendering: page loads need a signed, unexpired session cookie
src/app/                 routes: dashboard screens under (dashboard)/, sign-in steps under (auth)/, root layout, global tokens
src/features/<screen>/   screen component, its CSS module, and select.ts (pure state → view data)
src/features/auth/       sign-in, sign-up, verification, recovery, invitations, onboarding, lock screen + their Server Actions
src/features/account/    the signed-in user's profile, contacts, preferences, password, two-step, devices
src/features/users/      admin user management: invitations, roles and branches, suspension, sessions
src/features/shell/      sidebar (account, admin role preview, role-filtered nav), header, role banner, session guard
src/ui/                  shared primitives: Card, StatCard, Segmented, Button, Field, TextField, PasswordField, OtpInput, Modal, Toggle…
src/lib/auth/            auth core: store (users, sessions, codes, invitations), session cookies, data access layer, policy
src/lib/data/            seed data (orders, boxes, menu, people, insights, org, customer portal)
src/lib/store/           reducer + DashboardProvider (useDashboard, useUiState), SessionProvider
src/lib/roles.ts         roles: allowed screens, branch scope, menu editing, PII level, idle lock, two-step policy
src/lib/views.ts         screens: route, nav label, title, subtitle
public/fonts/            Almarai and Zain (self-hosted, OFL)
```

## Accounts and sessions

- **Sign-in** with a mobile number (any Saudi format, Arabic digits included) or email and a password. "تذكرني" keeps the session for 30 days; otherwise it ends with the browser or after 12 hours. Five wrong passwords pause the account for 15 minutes; suspended accounts are told so only after the right password.
- **Two-step verification** sends a 6-digit WhatsApp code (or SMS) after the password. It is required for system admins, optional for everyone else, and a browser can be trusted for 30 days.
- **Customers sign up** themselves: name, mobile, optional email, password, consent. The number is verified by code, then a short onboarding sets the preferred branch and notifications. A number that already earned loyalty points at the cashier keeps them. A sign-up that never verifies its number releases it after 30 minutes, and an unverified email doesn't block anyone else from using it.
- **Staff join by invitation** from the users screen (admins only): the link sets a password, the admin-assigned number is verified, and the role's onboarding follows. Until the number is verified the admin can re-send (which starts over) or withdraw the invitation. Admins also change roles and branches, suspend or reactivate accounts, and end sessions; changes reach open tabs within a minute.
- **Password recovery** sends a code to the verified number or email. The page looks the same for unknown accounts, and a reset ends every session.
- **Account page** ("حسابي", from the sidebar): name, phone and email changes confirmed by a code sent to the new contact, preferences, password, two-step, connected devices, sign-in activity, and account deletion for customers.
- **Session states.** Staff screens lock after 15 minutes without activity (10 for baristas) or with "قفل الشاشة"; the lock covers the page in place, so drafts and filters survive, and the password reopens it. Locking, unlocking and signing out apply to every open tab. Sessions ended elsewhere (sign-out of other devices, password change, suspension) land on the sign-in page with the reason.
- **Where access is checked.** `proxy.ts` only pre-checks the cookie signature. Every page calls `requireView`/`requireActive` and every Server Action re-reads the session from the store (`src/lib/auth/dal.ts`), so hiding a screen in the UI is never the only protection. Passwords are hashed with scrypt; codes and invitation tokens are stored hashed; cookies are httpOnly, SameSite=Lax and Secure in production.
- **Before production:** move `src/lib/auth/store.ts` to a database (the auth modules are its only users), connect `send()` to a messaging provider, set `SESSION_SECRET`, keep demo mode off, and run behind a proxy that sets `X-Real-IP` or appends to `X-Forwarded-For` (the per-IP limits read it; per-account lockouts don't depend on it).

## Notes

- **Roles.** Each account has a role and, for branch managers and baristas, a branch; the dashboard shows only that scope. A system admin can still preview another role from the sidebar (it opens that role's first screen, as the old role switcher did) and end the preview from the banner. Screens a role can't open redirect to its landing screen.
- **State.** Filters, searches and form drafts persist while you move between screens; everything resets on a full reload or when another account signs in. Swap `src/lib/data` and the reducer actions for API calls when a backend exists.
- **Design tokens.** The Mahu tokens live in `src/app/globals.css`; components reference them through CSS variables. The sign-in pages use the brand's scene tokens (`--scene-*`) for the illustration in the brand panel.
- **Fixes relative to the design export.**
  - The hourly orders chart now draws its bars. They collapsed to zero height in the export, and they now scale with the selected period.
  - Menu edits, availability and images are keyed by item id, not name or row position.
  - The image picked while adding a product is kept on the new product.
  - Duplicate city tabs are avoided when several branches are added in the same city.
  - Keyboard focus is visible, text fields included.
