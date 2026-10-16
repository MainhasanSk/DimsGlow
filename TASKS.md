# DIMSGLOW — Phased Implementation Plan

Use the checkboxes to track work. Each phase needs a verified deliverable before proceeding.

## Phase 0 — Repository and reference audit

- [x] Inspect repository, current stack/routing, dependencies, working features, tests, Firebase setup and deployment.
- [x] Read all nine docs; report conflicts and blocking owner decisions.
- [x] Review reference PDF, identify visible pages/components and request approved desktop/mobile screenshots if pixel-level sign-off is required.
- [x] Confirm production/staging Firebase projects, Authentication setup, Firestore/RTDB locations, Cloudinary environment and domain without pasting secrets into source or chat.
- [x] Run baseline build/lint/typecheck/tests and record results.

**Deliverables:** repository audit, reference page inventory, blocker/decision list, baseline results. **Exit:** no destructive changes; known state and approvals documented.

## Phase 1 — Scaffold and environment separation

- [x] Keep or establish Next.js App Router + TypeScript according to repo audit.
- [x] Add strict typing/lint/format scripts and commit lockfile.
- [x] Add design tokens and accessible UI primitives.
- [x] Add `.env.example` with safe placeholders; separate dev/staging/prod settings.
- [x] Configure Firebase Emulator Suite and local scripts.
- [x] Add CI for install, lint, typecheck, unit tests and production build.
- [x] Confirm hosting, region and budget alerts before provisioning resources.

**Deliverables:** reproducible start/build, env template, CI, emulator guide. **Exit:** clean clone works without production secrets.

## Phase 2 — Firebase Auth and route/access guards

- [x] Initialize client SDK once and Admin SDK in server-only code.
- [x] Implement customer sign-up/sign-in/sign-out/reset and useful error states.
- [x] Verify ID tokens/sessions in protected routes and every server action/function.
- [x] Add customer and admin guards; server authorization is mandatory.
- [x] Document first-owner secure bootstrap; remove temporary bootstrap privilege.
- [x] Add staff invitation/access/role workflow; client cannot write permissions.
- [x] Test disabled users, customers at admin routes, stale claims and revoked sessions.

**Deliverables:** auth, protected routes, permission service, auth/rules tests. **Exit:** URL/client-state changes cannot grant admin access.

## Phase 3 — Firestore schema, rules, indexes and audit

- [x] Create typed models/validators for product/variant, profile/address/cart/order/invoice/inventory/purchase/supplier/expense/review/report.
- [x] Write default-deny Firestore and RTDB rules; allow only necessary access.
- [x] Add Emulator Suite allow/deny rules tests and execute them in CI.
- [x] Generate composite indexes from actual queries in `firestore.indexes.json`.
- [x] Implement audit/event writer and correlation IDs.
- [x] Document retention, pagination and restore approach.

**Deliverables:** schema, rules, indexes and audit infrastructure. **Exit:** rules tests prove isolation; permissive development rules are not deployable.

## Phase 4 — Design system and storefront shell

- [x] Implement tokens, typography, responsive containers, buttons, inputs, cards, badges, dialogs, drawers, toasts and skeletons.
- [x] Build announcement bar, centered-logo header, category nav, search/account/cart utilities.
- [x] Build footer, policy/contact/about pages and mobile navigation.
- [x] Implement reference hierarchy using approved DIMSGLOW assets.
- [x] Test keyboard, Escape, focus management and reduced motion.

**Deliverables:** reusable shell, responsive pages and screenshot comparisons. **Exit:** header/navigation/footer approved on desktop and mobile.

## Phase 5 — Catalog, Cloudinary and editorial content

- [x] Admin create/edit/archive products, categories and variants with validation.
- [x] Add signed Cloudinary upload workflow and asset metadata records.
- [x] Build published collection grid, search, supported filter/sort, cursor pagination and PDP gallery.
- [x] Make banners/featured collections/navigation configurable in Firestore.
- [x] Implement out-of-stock, empty, loading and broken-image states.
- [x] Verify no fake product, price, rating or media content appears in production.

**Deliverables:** live catalog, Cloudinary integration, collection/PDP pages. **Exit:** publish/edit changes reflect on public site.

## Phase 6 — Customer dashboard, cart and favorites

- [x] Implement own-profile and saved-address edit with ownership rules.
- [x] Implement persistent Firestore cart, variant/quantity/removal and favorites.
- [x] Build customer overview/orders/reviews/navigation shell.
- [x] Verify Customer A cannot read Customer B's profile/cart/address/favorites.

**Deliverables:** functional customer account. **Exit:** cross-device data restores from Firestore; no authoritative localStorage state.

## Phase 7 — Checkout, order creation and stock consistency

- [ ] Implement checkout and server-side total calculation from canonical catalog/settings.
- [ ] Build idempotent `placeOrder` with Firestore transaction, snapshots, stock reservation and order event.
- [ ] Build on-hand/reserved/available views and append-only movement ledger.
- [ ] Test stale prices, stock conflicts, repeated click/retry and competing purchases of last unit.
- [ ] Build confirmation/order detail UI.

**Deliverables:** order placement and safe stock reserve. **Exit:** no negative stock, duplicate order or client-controlled total in concurrency tests.

## Phase 8 — Admin orders and live tracking

- [ ] Build newest-first orders table with filters/search/pagination and detail view.
- [ ] Implement validated status actions: confirm, pack, ship, deliver, cancel with reason/courier data.
- [ ] Implement reservation release, shipment deduction and idempotent cancellation effects.
- [ ] Subscribe customer view to relevant Firestore updates; handle unsubscribe/loading/error states.
- [ ] Show timeline and manually entered courier/tracking information.
- [ ] Test invoice eligibility after confirm/cancel/refund.

**Deliverables:** operational order management and live tracking. **Exit:** admin/customer states stay consistent under refresh and rapid status changes.

## Phase 9 — Invoices, manual payments and refunds

- [ ] Add validated seller/tax/invoice settings; do not invent GST/legal fields.
- [ ] Allocate invoice numbers server-side and save immutable snapshots on confirmation.
- [ ] Generate protected PDF and check user/order/current eligibility on every download.
- [ ] Implement manual payment recording; no gateway code in v1.
- [ ] Implement refund record, invoice hiding/voiding and credit-note reference fields.
- [ ] Get owner/accountant validation of tax treatment before production.

**Deliverables:** protected PDF, manual payment trail and cancellation/refund access rules. **Exit:** unconfirmed/cancelled/voided/refunded order cannot download; audit remains intact.

## Phase 10 — Purchase, supplier, expense, CRM and reviews

- [ ] Supplier management and purchase history.
- [ ] Purchase orders with partial/full receipt and idempotent stock increment.
- [ ] Expense forms/categories/date/vendor/reference with role restrictions.
- [ ] CRM customer summary/order history/tags/safe notes.
- [ ] Review eligibility, deduplication and moderation.

**Deliverables:** linked operations/finance/CRM modules. **Exit:** stock and financial records trace to events; duplicate receipt/retry does not double count.

## Phase 11 — Dashboard, analytics and Excel export

- [ ] Define KPI formulas, timezone, currency and cancellation/refund treatment.
- [ ] Build live KPI/chart panels, recent orders, low-stock and payment/order pipeline.
- [ ] Implement weekly/monthly/yearly/custom server report service.
- [ ] Generate authorized `.xlsx` with filters matching the dashboard.
- [ ] Add aggregate idempotency/reconciliation if denormalized summaries are needed.
- [ ] Verify export/chart totals against deterministic fixtures.

**Deliverables:** live admin analytics and Excel reports. **Exit:** metrics reproduce source records; empty data yields zero/empty state, not fake values.

## Phase 12 — Roles, audit, backup and hardening

- [ ] Finalize role matrix and implement staff invite/grant/suspend/revoke.
- [ ] Cover every privileged mutation with audit records.
- [ ] Document Firestore/RTDB/Cloudinary backup/restore procedures.
- [ ] Scan rules/endpoints/secrets/dependencies and production build output.
- [ ] Add abuse controls, App Check where compatible, headers/CSP and safe logging.
- [ ] Configure alerts, monitoring, error tracking, backup schedule and budget thresholds.

**Deliverables:** access controls, security runbook, restore proof and release checklist. **Exit:** least privilege and staging restore verified; no unresolved critical/high issue.

## Phase 13 — End-to-end QA, visual polish and launch

- [ ] Execute `TEST_PLAN.md` across available browsers and viewport sizes.
- [ ] Run visual regression against approved screenshots.
- [ ] Test full auth/order/live tracking/invoice/cancel/refund/stock/payment/roles/report workflows.
- [ ] Check keyboard/accessibility, contrast, labels, reduced motion and error states.
- [ ] Verify policies, seller/GST fields, contact info, shipping/returns, domain and SSL.
- [ ] Deploy staging and obtain client sign-off; deploy production and smoke-test.
- [ ] Hand over repo, env variable list, Firebase/Cloudinary guide, admin guide and recovery contacts.

**Deliverables:** live site, test report, approval and handover. **Exit:** all release gates pass, no critical/high bugs, owner approves policies/settings.

## Definition of done for any task

- [ ] Behavior matches PRD and approved design.
- [ ] Authorization and server-side validation exist where relevant.
- [ ] Loading/empty/error/unauthorized states are handled.
- [ ] Relevant tests are added and actually run.
- [ ] No fake production data, secrets, unapproved gateway or unrelated refactor.
- [ ] Privileged mutations produce event/audit records.
- [ ] Update `MEMORY.md`/`DECISIONS.md` if accepted facts, decisions or project status change.
