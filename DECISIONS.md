# DIMSGLOW — Architecture Decision Records

Status values: **Accepted**, **Proposed**, **Open**, **Superseded**. Changing an accepted decision requires a dated record of reason and migration impact.

## ADR-001 — Frontend framework

- **Status:** Accepted baseline.
- **Decision:** Next.js App Router + React + TypeScript.
- **Reason:** Coherent storefront/customer/admin app with public server-rendering and realtime client views.
- **Constraint:** Use stable versions supported by the selected host; inspect existing repo before changing framework.
- **Alternatives:** React SPA/Vite or existing mature stack if repo audit justifies it.

## ADR-002 — Authentication

- **Status:** Accepted.
- **Decision:** Firebase Authentication for customers and staff identities.
- **Rules:** Customer signup never grants staff access. Staff provisioning is owner-controlled/server-authorized; no hardcoded credentials. Customers use Firebase reset-email flow. Per owner preference, admin password/account recovery is performed in Firebase Console and is paired with server-side disable/revocation as appropriate.
- **Consequence:** Identity is separate from profile/access records; backend never trusts client-only role data.

## ADR-003 — Canonical data store

- **Status:** Accepted.
- **Decision:** Cloud Firestore is the source of truth for products, variants, customers, cart/favorites, orders/events, invoice metadata, stock movements, purchase, suppliers, expenses, reviews, CRM notes, access metadata, settings, audit and aggregates.
- **Reason:** Owner has no SQL database and wants Firebase-backed data.
- **Consequence:** Model documents/subcollections/indexes intentionally; use snapshots and transactional/idempotent business services.

## ADR-004 — Realtime Database

- **Status:** Accepted with narrow scope.
- **Decision:** RTDB is for lightweight presence/transient signals only, if a real feature needs it. Do not mirror orders or catalog records into RTDB.
- **Reason:** Firestore listeners already update customer order tracking in real time; duplicate state creates sync drift.
- **Consequence:** RTDB can remain provisioned but unused in v1 if presence is not required; any added use needs defined ownership/consistency rules.

## ADR-005 — Media storage

- **Status:** Accepted.
- **Decision:** Cloudinary stores product/variant/category/campaign/editorial media; Firestore stores `public_id`, `secure_url`, alt text and relationships.
- **Security:** Generate signed upload params on trusted server after checking staff permission. `api_secret` never reaches client/repository. Avoid general unsigned uploads in production.

## ADR-006 — Trusted backend

- **Status:** Accepted.
- **Decision:** Cloud Functions for Firebase 2nd gen (Node.js 22 baseline) for canonical privileged operations, with authenticated Next.js server routes as needed for session handling or PDF/XLSX streaming.
- **Reason:** Browser code is untrusted and Firebase Admin SDK bypasses Rules.
- **Consequence:** Shared server services must avoid divergent implementations of order/stock/invoice rules. Verify token, active user, role, permission and input on every request.

## ADR-007 — Hosting

- **Status:** Proposed default; confirm in Phase 1.
- **Decision:** Firebase App Hosting for Next.js if supported region, prerequisites and billing fit.
- **Alternative:** Vercel + Firebase services if owner prefers or App Hosting constraints require it.
- **Owner action:** Approve host/region, check current pricing and enable budget alerts before production provisioning.

## ADR-008 — Persistent cart/favorites

- **Status:** Accepted.
- **Decision:** Persist under authenticated UID in Firestore; checkout requires sign-in.
- **Reason:** Owner wants persistent Firebase-backed customer dashboard rather than authoritative local state.
- **Consequence:** Visitors can browse, but saving cart/favorites prompts sign-in. No persistent localStorage as source of truth.

## ADR-009 — Payment gateway

- **Status:** Accepted for v1: no gateway.
- **Decision:** Do not implement online payment gateway initially; authorized owner/finance staff manually record payment state and references.
- **Reason:** No provider/merchant requirements were supplied, and owner asks for admin-managed status.
- **Consequence:** Do not collect card details. Any future gateway needs a new ADR, webhook/idempotency design and security review.

## ADR-010 — Order lifecycle/tracking

- **Status:** Accepted.
- **Decision:** Canonical statuses: `placed`, `confirmed`, `packing`, `shipped`, `delivered`, `cancelled`. Every transition is server-validated and appended to history. Courier/tracking is entered manually in v1.
- **Inventory:** Reserve at order placement; decrement on-hand/release reserve at shipment; pre-shipment cancellation releases reserve once; returned stock is restocked only after authorized receipt/inspection.
- **Customer cancel policy:** Default direct cancellation before shipment; after dispatch use support/return process. Owner approves final copy/cutoff.

## ADR-011 — Invoice cancellation/refund

- **Status:** Accepted technical rule; accounting handling open.
- **Decision:** Invoice download begins after confirmation. Cancellation/refund blocks customer download and marks metadata voided/ineligible, retaining audit/accounting history. Generate PDFs on demand through protected endpoint.
- **Important:** Do not delete issued tax records. Owner/accountant must approve GST treatment, cancellations, refunds and credit notes. Do not guess tax rates, GSTIN or place-of-supply logic.

## ADR-012 — Analytics/XLSX

- **Status:** Accepted.
- **Decision:** One shared server report service provides dashboard and export data. Derived aggregates require idempotent updates and reconciliation.
- **Consequence:** Explicitly define order-date vs payment-date vs fulfillment-date measures and distinguish gross orders from cash received.

## ADR-013 — UI reference

- **Status:** Accepted.
- **Decision:** Use supplied PDF's layout/interaction patterns: announcement strip, centered-logo header, category nav, product cards/grid, variant-aware PDP, campaigns and multi-column footer. Build a separate admin console.
- **Constraint:** Use DIMSGLOW-approved branding and authorized assets. Google short URL was not accessible directly, so if it refers to a different target, owner must provide direct URL/screenshots and approve `DESIGN.md` changes.

## ADR-014 — Role-based access

- **Status:** Accepted baseline; detailed matrix open.
- **Decision:** Owner full access; other staff have scoped module/action permissions. Server-controlled access doc is authoritative; optional custom claim only carries coarse role. Protected functions verify current permissions.
- **Open:** Decide who can invite users, change tax/settings, record refunds, void invoices, export finance/customer reports or launch backups.

## ADR-015 — Owner decisions required before production

- **Status:** Open.
1. DIMSGLOW logo, colors, product taxonomy/copy and approved media.
2. Seller legal name/address/GSTIN, HSN/SAC, tax/invoice rules and accountant approval.
3. Allowed payment methods (no gateway in v1), reference/proof fields and role allowed to mark paid.
4. Shipping zones, charges, estimates, serviceability and courier fields.
5. Cancellation/return/refund policy and credit-note handling.
6. Staff role/permission matrix and owner bootstrap approver.
7. Hosting, Firebase resource locations, budget, backup retention, RPO/RTO.
8. Review policy: purchase verified, editing/moderation and image uploads.
9. Email delivery, support contact, domain and reset-email configuration.

## ADR-016 — Baseline infrastructure settings and assets received

- **Date:** 2026-10-15
- **Status:** Accepted baseline.
- **Decision:**
  - **Firebase:** Project `dimsglowweb`, Database URL `https://dimsglowweb-default-rtdb.asia-southeast1.firebasedatabase.app`, Storage `dimsglowweb.firebasestorage.app`.
  - **Cloudinary:** Cloud name `web8vmww`, signed server-side media storage pattern.
  - **Brand Assets:** Approved DIMSGLOW gold embossed emblem/wordmark supplied (`.user_uploaded/media_1792077392939.jpg`).
  - **Customer Support Contact:** WhatsApp hotline configured to `+913614556830`.
- **Infrastructure Status:**
  - Cloudinary credentials (Cloud name, API Key `898349595447971`, and API Secret) secured for server-side signed operations.
- **Open Items:**
  - Admin/service-account credential method for Firebase Admin SDK (Node.js backend) or local emulator workflow for initial development phases.
  - Final legal seller entity name, registered GSTIN, invoice prefix, and return cutoff policy.

## Adding a decision

Record ID/date/status/context/decision/alternatives/consequences/security/data migration impact/implementation links/owner approval. Append rather than erasing history.
