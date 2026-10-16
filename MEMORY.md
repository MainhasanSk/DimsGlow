# DIMSGLOW — Persistent Project Memory for AI Coding Sessions

> Keep these facts current across Anti-gravity sessions. This is not a substitute for the detailed specification.

## Product

- Brand: **DIMSGLOW**; single-brand e-commerce storefront, customer dashboard and protected admin console.
- Admin modules: dashboard/graphs, catalog/inventory, orders, GST invoice metadata/PDF, sales/reports, purchases, suppliers, CRM/customers, expenses, roles/permissions, backups and audit/security.
- Customer features: browse; sign up/sign in/reset password; persistent cart/favorites; order; order history/live tracking; eligible invoice download; cancellation per policy; rating/reviews.
- Admin order queue newest-first. Manual lifecycle: placed → confirmed → packing → shipped with courier/tracking → delivered, or permitted cancellation. Firestore updates customer UI without manual refresh.
- Invoice download starts after confirmation. Cancellation/refund hides and blocks the download, but does not hard-delete accounting/audit history.
- No online payment gateway in v1. Payment records/status are manually managed by authorized staff.

## Technical baseline

- Next.js App Router + React + TypeScript; reusable components and responsive design tokens.
- Firebase Authentication for identity; Cloud Firestore for all durable business records.
- Firebase Realtime Database is restricted to presence/transient signals if required, not duplicate order/catalog state.
- Cloudinary stores product/campaign media; Firestore stores `public_id`, `secure_url` and metadata. Uploads use server-generated signatures.
- Cloud Functions 2nd gen/server handlers implement privileged actions. Verify token, active user, role, permission and schema every time.
- Firebase App Hosting is the proposed host, to be confirmed in Phase 1; check region/prerequisites/pricing and budget alerts.
- Use stable supported dependency versions pinned by lockfile; Node.js 22 baseline for Cloud Functions unless documented otherwise.

## Security and consistency invariants

- Never hardcode production product/order/customer/report/admin data. Production records come from Firestore; media from Cloudinary.
- No hardcoded credentials, API secrets or public admin registration. Owner bootstraps staff; admin password/account recovery is owner-managed in Firebase Console per preference, with server-side access revocation where needed.
- Customer cart/favorites persist in Firestore; checkout requires sign-in. No localStorage as source of truth.
- Firestore is source of truth for order status; use Firestore listeners for real-time customer tracking.
- `placeOrder` validates prices/stock server-side, is idempotent, reserves stock transactionally, and snapshots details.
- `available = onHand - reserved`; reserve on order placement, decrement on-hand/release reserve on shipment, release pre-shipment reservation once, restock returned goods only after receipt/inspection.
- `status` and `paymentStatus` remain separate.
- Invoice PDF generated on demand behind current server authorization checks; no public permanent URL. Re-check cancel/refund/void state every download.
- Firebase Admin SDK bypasses Firestore Rules, so server handlers must independently authorize.
- Cloudinary API secret is server-only; uploaded folders/type/size are restricted.
- Order/stock/finance/audit events are append-only where possible; privileged changes include actor/action/time/reason.

## Reference design

- Supplied PDF is a 69-page capture of an Insight Cosmetics India desktop site: announcement strip, centered logo, category nav, utility icons, campaigns, four-column product grid, image-led cards with rating/price/variant/CTA, PDP gallery-left/purchase-panel-right, offers, editorial/help/footer.
- Reproduce structure and shopping interactions with approved DIMSGLOW branding/assets, not copied competitor identity/media.
- Google short link could not be directly fetched by the research browser; use PDF as visual source unless owner provides a different accessible URL/screenshots.

## Source-of-truth order

1. Latest accepted owner instruction and accepted `DECISIONS.md` entry.
2. `PRD.md` product scope/acceptance.
3. `ARCHITECTURE.md` data model/trust boundaries.
4. `DESIGN.md` visual behavior.
5. `RULES.md` mandatory coding constraints.
6. `TASKS.md` build sequence.
7. `TEST_PLAN.md` and `SECURITY.md` release requirements.

Do not guess legal/tax/shipping/payment/return/staff permissions. Ask the owner and record the answer in `DECISIONS.md`.

## Status and Phase Log

- **Phase 0 Audit (Completed 2026-10-15):**
  - Inspected repository: Greenfield state. 9 markdown specs + 3 PNG diagrams in workspace root; no existing source code, `package.json`, or Git repository.
  - Node / npm baseline: Node v26.2.0, npm 11.13.0 on Windows.
  - Provided credentials:
    - Firebase project `dimsglowweb` (Auth, RTDB `asia-southeast1`, Firestore, Storage).
    - Cloudinary Cloud Name `web8vmww` and API Secret provided (API Key needed for server signed uploads).
    - WhatsApp support number: `+913614556830`.
    - Brand asset: DIMSGLOW gold embossed logo provided in `.user_uploaded/media_1792077392939.jpg`.
  - Reference audit: Detailed 69-page catalog, quick-view, PDP, exclusive coupons, pincode check, Before/After slider, accordion FAQs, reviews, and admin dashboard requirements cataloged.
  - Blockers identified: Cloudinary API Key, Firebase service account/admin credentials for trusted server routes (or emulator plan for Phase 1-3), seller GSTIN/business legal details.
- **Phase 1 Scaffold & Environment Separation (Completed 2026-10-15):**
  - Scaffolded Next.js App Router (16.4.0) with strict TypeScript, Tailwind v4, Lucide icons, clsx/tailwind-merge.
  - Initialized Git repository with clean commits; `.env.local` strictly git-ignored; `.env.example` created with placeholders and documentation.
  - Copied official DIMSGLOW brand gold crest emblem to `public/brand/dimsglow-logo.jpg`.
  - Configured design tokens in `app/globals.css` and built accessible UI primitives: `Button`, `Badge`, `Input`, `Card`, `Modal` in `components/ui/`.
  - Configured test runner (`vitest`, `jsdom`, `@testing-library/react`) with 8 passing unit/component tests in `tests/smoke.test.ts` and `tests/components.test.tsx`.
  - Created baseline Firebase config (`firebase.json`, `firestore.rules` default-deny, `database.rules.json` default-deny, `firestore.indexes.json`).
  - Added CI workflow `.github/workflows/ci.yml`.
  - `typecheck` and production `next build` executed with 0 errors.
- **Phase 2 Firebase Auth & Route/Access Guards (Completed 2026-10-16):**
  - Initialized singleton client Firebase SDK (`lib/firebase/client.ts`) and server-only Admin SDK (`lib/firebase/admin.ts`).
  - Implemented typed RBAC system with roles (`owner`, `admin`, `order_manager`, `inventory_manager`, `finance_manager`, `support_manager`, `analyst_readonly`, `customer`) and granular permissions in `lib/auth/roles.ts`.
  - Built server-side token & access verification in `lib/auth/serverAuth.ts` verifying against canonical Firestore `userAccess/{uid}`.
  - Built React `AuthProvider` and `useAuth` hook in `lib/auth/AuthContext.tsx` with dynamic listener to `userAccess/{uid}` for real-time permission revocation.
  - Created customer authentication pages: `/sign-in` (with Suspense streaming), `/sign-up`, and `/reset-password` (with account enumeration protection).
  - Implemented client route guards: `CustomerRouteGuard` and `AdminRouteGuard` in `components/auth/RouteGuard.tsx`.
  - Built server-side staff provisioning & revocation service `lib/auth/staffService.ts`.
  - Created first-owner secure bootstrap script `scripts/bootstrap-owner.ts` and documentation `docs/OWNER_BOOTSTRAP.md`.
  - 15 unit/component/auth tests passing in Vitest; Next.js production build succeeds with 0 errors.
- **Next Task:** Phase 3 — Firestore schema, rules, indexes and audit (typed Zod models for products/orders/invoices/stock, default-deny rules with isolated customer ownership, and audit logger).

## Update protocol

After a completed implementation task, update this file only if accepted facts, status, blockers or next phase changed. Keep session log brief: date, files changed, actual tests run, unresolved issues.
