# منصة ماهو الرقمية — لوحات التشغيل

Operations dashboard for Mahu café (Arabic, RTL): orders pipeline, scheduled box bookings, order log, customer lookup, loyalty, customer portal, menu & add-ons, inbound applications, branches and role-based access.

Built with Next.js 16 (App Router), React 19, TypeScript and CSS Modules. It is a port of the "Mahu Dashboard" design export and runs on seeded mock data; changes made in the UI live in memory and reset on reload.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`.

Optional: set `NEXT_PUBLIC_SITE_URL` to point the sidebar's "الموقع العام ↗" link at the public website.

## Project layout

```
src/app/                 routes: one page per screen under (dashboard)/, root layout, global tokens
src/features/<screen>/   screen component, its CSS module, and select.ts (pure state → view data)
src/features/shell/      sidebar (role switcher, role-filtered nav), header (branch/period tabs), role banner
src/ui/                  shared primitives: Card, StatCard, Segmented, Button, Field, Modal, Toggle, Bar, ImageSlot…
src/lib/data/            seed data (orders, boxes, menu, people, insights, org, customer portal)
src/lib/store/           reducer + DashboardProvider (useDashboard, useUiState)
src/lib/roles.ts         roles: allowed screens, branch scope, menu editing, PII level
src/lib/views.ts         screens: route, nav label, title, subtitle
public/fonts/            Almarai and Zain (self-hosted, OFL)
```

## Notes

- **Roles.** Switching role in the sidebar opens that role's first screen. Screens a role can't access are never rendered: opening one, for example with Back after a role switch, redirects to the role's landing screen.
- **State.** Filters, searches and form drafts persist while you move between screens; everything resets on a full reload. Swap `src/lib/data` and the reducer actions for API calls when a backend exists.
- **Design tokens.** The Mahu tokens live in `src/app/globals.css`; components reference them through CSS variables.
- **Fixes relative to the design export.**
  - The hourly orders chart now draws its bars. They collapsed to zero height in the export, and they now scale with the selected period.
  - Menu edits, availability and images are keyed by item id, not name or row position.
  - The image picked while adding a product is kept on the new product.
  - Duplicate city tabs are avoided when several branches are added in the same city.
  - Keyboard focus is visible.
