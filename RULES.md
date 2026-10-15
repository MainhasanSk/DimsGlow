# DIMSGLOW — AI Coding Agent Rules

These instructions are mandatory for Anti-gravity and future coding agents. Read the nine documents in the order listed by `README.md` before making code changes.

## 1. Work method

1. Inspect the existing repository first: framework, routing, package manager, working features, Firebase setup, deployment and tests.
2. Treat `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `DECISIONS.md`, `TEST_PLAN.md` and `SECURITY.md` as the build contract. Follow the latest accepted decision in `DECISIONS.md`. If ambiguity remains, ask; do not invent a business rule.
3. Implement phases in `TASKS.md` sequentially. Use small vertical slices and test each phase before proceeding.
4. Preserve working code. Do not rewrite unrelated pages, styling, routes, configuration or models. Explain and get approval before an out-of-scope change.
5. Use strict TypeScript, typed domain models, small maintainable components and centralized schemas/services. Avoid `any`, unsafe casts and duplicated business logic.
6. Inspect the diff and run relevant checks after changes. Do not claim tests passed unless they were run.

## 2. No invented production data

- Never hardcode products, orders, customers, sales, reviews, inventory, invoices, report values, admin users or courier events.
- Production data comes from Firestore, Firebase Authentication and Cloudinary. Empty datasets show an honest empty state; do not fall back to demo JSON.
- Test fixtures are allowed only in unit tests, emulators or explicit development seed scripts. Seed commands must guard against production project IDs.
- Do not use `localStorage` as authoritative storage for customer or business data. React memory state may support transient UI only. Persistent cart/favorites live in Firestore.

## 3. Authentication and authorization

- Firebase Authentication is required. Customer sign-up never grants staff access.
- Never hardcode admin credentials, allowlists in client code, API tokens, service-account JSON, Cloudinary secrets or permanent bypass flags.
- Check identity, active account and permissions in every protected server action/API/function. A UI route guard alone is not security.
- Never trust client-supplied role, permission, UID, amount, price, tax, total, invoice eligibility or actor identity.
- Staff roles/access are server-managed. Client writes to role/access documents are prohibited.
- Refresh claims/revoke staff access where required after permission change; see `SECURITY.md`.

## 4. Data ownership and mutations

- Firestore is the canonical database. Cloudinary stores approved media. RTDB is for explicitly approved presence/transient signals only.
- Validate every external input server-side; normalize identifiers and enforce size/range limits.
- The server computes all checkout totals from current records; ignore browser-submitted totals.
- Order creation, reservation/release, shipment deduction, purchase receiving, invoice state, payment and refund operations must be transactional or use an explicit idempotent/recoverable state machine.
- Validate status transitions and append a timeline/audit record for every privileged mutation.
- Never hard-delete financial, invoice, stock movement, order event or audit history as a shortcut. Void/archive and preserve reason/history.
- Use query limits, pagination and required indexes; no unbounded collection reads.

## 5. Order/payment/invoice rules

- `status` and `paymentStatus` are distinct.
- No payment gateway in v1. Do not add one without an accepted `DECISIONS.md` entry.
- Only authorized staff can confirm/pack/ship/deliver/cancel on behalf of the store. Capture cancellation reason and manual courier fields; no fake carrier scans.
- Invoice download starts after confirmation and only while eligible. On cancellation/refund, hide the action and deny the server request, but keep audit/accounting records.
- Every PDF download endpoint rechecks ownership/role, invoice status and current cancellation/refund state. No public permanent invoice links.
- Never hardcode GST rates, seller GSTIN, invoice sequence, shipping fees or invoice prefixes. Use validated settings and immutable order snapshots.

## 6. Firebase and Cloudinary

- Firestore/RTDB rules begin default-deny. Admin SDK bypasses Firestore Rules, so every Admin-SDK endpoint repeats authentication, role and validation checks.
- Public users may read published content only. Customers can read their own documents and cannot write order total/payment/stock/invoice fields.
- Cloudinary secret is server-only. Issue short-lived signed upload parameters only after authorization; restrict folder, type and size.
- Store trusted Cloudinary `public_id` and `secure_url` metadata in Firestore. Do not accept arbitrary external URLs as trusted catalog assets.
- Never change rules to allow all reads/writes to make a feature work.

## 7. UI and design

- Follow `DESIGN.md` layout and responsive rules; use approved DIMSGLOW branding/assets rather than copying competitor assets.
- Use reusable tokens/components; don't add one-off styles that make adjacent pages inconsistent.
- Every visible action works. No fake success toast, inert checkout button, fake chart or dead menu.
- Add loading, empty, validation, unauthorized, network failure and success states.
- Preserve approved sections; do not remove or relayout anything outside the requested scope without approval.
- Use accessible labels, keyboard interactions, focus indicators and text statuses independent of color.

## 8. Performance and maintainability

- Use targeted queries and cursor pagination. Avoid fetching every product/order to filter in the browser.
- Unsubscribe Firestore/RTDB listeners on unmount and logout.
- Use Cloudinary responsive transformations; do not fetch full-size originals unnecessarily.
- Prefer server components for public content where appropriate; use client components for genuine interaction/listeners.
- Keep secrets in platform secret management or server-only environment. `.env.example` contains names/placeholders only.
- Version rules, indexes, functions and environment docs. Never commit `.env.local`, service-account files, real credentials or customer exports.

## 9. Required report after each task

Include:

1. What changed and why.
2. Exact files created/modified.
3. Commands/tests actually run and summarized output.
4. Unimplemented cases, assumptions and blockers.
5. Confirmation no out-of-scope sections changed, or explanation of an approved exception.
6. Next task from `TASKS.md`.

A feature is not complete until success, empty, failure, authorization and relevant race-condition paths are implemented and tested.
