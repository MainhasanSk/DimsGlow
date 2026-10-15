# DIMSGLOW — Security Requirements and Operations Runbook

Security is a release requirement, not merely final polish. The application handles customer contact/shipping details, orders, invoices, staff privileges and finance records.

## 1. Threat model and assets

Protect customer accounts/addresses/carts/favorites/order history, staff credentials/permissions, stock/order/payment/refund/invoice integrity, supplier/purchase/expense data, Firebase configuration, Cloudinary secrets, report downloads, backups and audit logs.

Assume an attacker can inspect/modify browser code, replay requests, change IDs/JSON, call Firebase REST/SDK directly, guess public endpoints, automate requests and possess a normal customer account. A client-side `isAdmin` flag, hidden menu or disabled button is not authorization.

## 2. Authentication and RBAC

### Firebase Authentication

- Firebase Auth is the identity provider for customers/staff. Apply email verification/MFA requirements according to owner-approved policy.
- No shared admin password, default credential, hardcoded email allowlist in client code, or public staff registration.
- Bootstrap the first owner through a documented one-time trusted procedure; remove temporary privilege after setup.
- Customer password reset uses Firebase's secure reset email/action code. Use generic messaging where possible to avoid account enumeration.
- Owner-preferred admin reset/account recovery can occur in Firebase Console. When disabling/removing staff, also revoke refresh tokens where available and perform server-side account/revocation checks for sensitive actions.
- After roles change, force token refresh where appropriate. Because open pages/ID tokens may persist, all privileged endpoints recheck current access server-side.

### Roles and permissions

- Candidate roles: `owner`, `admin`, `order_manager`, `inventory_manager`, `finance_manager`, `support_manager`, `analyst_readonly`.
- Store active state and detailed permissions in server-managed `userAccess/{uid}`. Optional Firebase custom claims carry only small coarse role data; do not store a large permission matrix/profile in claims.
- Only owner or a narrowly authorized access manager may grant rights; never allow users to elevate themselves or grant beyond their own grantable scope.
- Enforce permissions for reads and exports as well as writes—especially finance, customer PII, audit and backup screens.
- UI route guards are for UX; server checks are the security boundary.

## 3. Firestore and RTDB controls

- Start with default-deny rules.
- Public access: read only published catalog/category/site content fields that are safe for public exposure.
- Customer access: only own profile/cart/favorites/addresses/orders/events; profile updates limited to an explicit field allowlist.
- Customer client writes to order totals, invoice state, payments/refunds, stock movements, roles/access, settings, purchases, expenses, aggregates and audit are prohibited.
- Minimize direct staff writes to sensitive records; route mutations through trusted handlers for atomic stock/order/invoice/audit side effects.
- RTDB rules deny by default. If presence is enabled, the client may write only its own presence node, not operational records or another user's data.
- **Critical:** Firebase Admin SDK bypasses Firestore Rules. Each Admin-SDK route/function must verify ID token, account status, role, exact permission, schema and business state independently.
- Execute automated allow/deny rules tests in the Firebase Emulator Suite in CI.

## 4. Every privileged endpoint must

1. Require a valid Firebase ID token/session.
2. Check active/non-disabled account and revoked-token status for sensitive paths as configured.
3. Derive actor UID from verified identity; never trust actor UID/role in request body.
4. Enforce role + action-level permission.
5. Validate schema, normalize input and allowlist editable fields.
6. Verify referenced order/product/supplier/invoice belongs to allowed scope.
7. Use idempotency keys for retry-prone actions (orders, stock receipts, payment/refund events as appropriate).
8. Use transactions or a recoverable state machine; no silent partial side effects.
9. Apply abuse/rate controls to public/expensive paths.
10. Add a safe audit entry with correlation ID.
11. Return only necessary fields; avoid leaking other users'/finance details.
12. Return stable error codes and safe client messages; do not expose exception traces.

## 5. Cloudinary security

- Store `CLOUDINARY_API_SECRET` only server-side in a secret manager/server env; never use a `NEXT_PUBLIC_` prefix for it.
- Only catalog/content roles may request signed upload params. Restrict folder, resource type, formats/MIME, size, transformation and other signed parameters.
- Validate upload metadata and store trusted `public_id`/`secure_url` using server-authorized writes.
- Avoid general unsigned uploads in production. If deliberately enabled, restrict it and document abuse recovery.
- Delete assets through authorized server logic only after checking current references/retention; don't remove media still used by products.
- Public product images can be public; private business documents must not be placed in public media folders. Reject active formats such as SVG/HTML unless explicitly required and safely handled.
- Use responsive Cloudinary transformations rather than sending originals unnecessarily.

## 6. Secrets and supply chain

- Prefer platform workload identity/default service account for Firebase Admin rather than downloading credentials into source.
- `.env.example` has names/placeholders only. Ignore `.env.local`, credential files, reset links, tokens, production exports and real secrets in Git.
- Browser Firebase config is not a secret by itself, but still needs proper rules/App Check; private service credentials are secrets and remain server-side.
- Scan source, Git history and production bundles/source maps for secrets. Do not publish source maps that expose secrets/private environment values.
- Pin packages in lockfile, use supported runtimes, review dependency advisories and remove unused packages.
- Protect GitHub/Firebase/Cloudinary accounts with MFA, least privilege and named staff accounts; do not share owner's credential.

## 7. Invoice, finance and download protection

- Treat invoice PDFs, XLSX exports, customer data and admin reports as sensitive.
- Invoice download verifies order ownership or allowed staff permission, current order state, active invoice and current cancellation/refund state on every request.
- Generate/stream PDF behind authenticated endpoint; no stable public URL or predictable unauthenticated path.
- Allocate invoice numbers server-side with collision-safe strategy; render from immutable seller/buyer/item/totals snapshots rather than current mutable product documents.
- Cancellation/refund blocks customer download and preserves a void/ineligible invoice record plus audit. Owner/accountant decides credit-note/legal handling. Never delete tax records merely to hide UI.
- No online gateway in v1. Do not collect card numbers, CVV, passwords or bank credentials. Manual payment reference must not contain sensitive payment credentials.
- Payment/refund changes require finance/owner permission, amount/currency validation, actor/time/reason/reference and audit trail.

## 8. Privacy and data minimization

- Collect only fields needed for account, shipping, invoice/legal requirements and support.
- Never store passwords in Firestore, logs, CRM notes or exports.
- Mask phone/email in broad analytics screens unless a role needs them.
- Exports include minimum necessary columns and require explicit permission; advise staff about safe storage of downloaded files.
- Agree with owner/legal adviser on retention, deletion requests, tax/order records and backup retention. Define compliant deactivation/anonymization where legal records need to be retained.
- Sanitize reviews, CRM notes and rich text; protect against stored/reflected XSS.

## 9. App hardening and abuse resistance

- Enable Firebase App Check on supported services after compatibility tests; it supplements authorization, never replaces it.
- Rate-limit or control sign-up/reset, order creation, uploads, search and expensive exports as appropriate.
- If cookie-based sessions are used, implement CSRF protection and secure/HttpOnly/SameSite flags.
- Use HTTPS, relevant security headers and a tested Content Security Policy allowing only required Firebase/Cloudinary endpoints.
- Sanitize all user content; do not render arbitrary raw HTML from Firestore.
- Document IDs are not secrets; always authorize after lookup.
- Never expose stack traces, project credentials, filesystem paths or tokens to clients.

## 10. Audit logging and monitoring

Log at least: staff invitation/access changes; product price/stock/catalog changes; media replacement/deletion; order transitions/cancellation; stock adjustments/purchase receipt; invoice issue/void; manual payment/refund; report export; backups; configuration changes.

Each record should include actor UID/role, action, target type/ID, timestamp, request/correlation ID, safe before/after summary and reason. Never log access tokens, passwords, API secrets, full card/bank details or unnecessary PII. Client cannot mutate/delete audit records. Alert on repeated authorization failures, unexpected admin grants, error spikes and backup failure.

## 11. Backup and recovery

- **Firestore:** Configure exports/backups suited to budget and agreed RPO/RTO; restrict storage access and test restore into a separate environment.
- **Realtime Database:** If used, back up data/rules. Presence data may need less retention than business records, but configuration/rules should be recoverable.
- **Cloudinary:** Maintain `public_id` inventory and documented asset recovery. Firestore metadata backup does not include media binaries.
- **Code/config:** Version control functions, rules, indexes and deployment instructions. Restore secrets from managed secret storage, never from Git.
- Record backup time, outcome, storage location, retention, test restore result and responsible operator. A backup is not verified until restoration succeeds.
- Define RPO (acceptable data loss) and RTO (recovery duration) with the client rather than inventing a guarantee.

## 12. Incident response

1. **Contain:** disable compromised staff, revoke sessions, rotate affected secrets, restrict upload endpoints or pause functions as required.
2. **Preserve:** retain safe logs/audit events and note timing, targets and correlation IDs.
3. **Assess:** identify exposed data, permissions, modified order/stock/finance records and affected customers.
4. **Recover:** restore trusted configuration/data, reconcile stock/orders/finance through event trails, invalidate sessions, verify rules.
5. **Notify:** follow applicable legal/client obligations and owner-approved notification process.
6. **Learn:** document root cause/timeline, add regression tests and update this runbook.

## 13. Production security release checklist

- [ ] Named owner/staff accounts, MFA where available, least privilege and account recovery confirmed.
- [ ] No public staff signup, default credentials or backdoor.
- [ ] Firestore/RTDB default-deny rules and automated tests pass.
- [ ] Protected endpoints enforce token/status/permission/schema checks.
- [ ] Order/stock/payment/invoice transitions are idempotent and audited.
- [ ] Invoice/PDF/XLSX ownership and cancel/refund blocking tested server-side.
- [ ] Cloudinary signatures restricted; API secret absent from client bundle/source map/Git.
- [ ] Production has no test fixtures or committed secret/service-account files.
- [ ] Dependency, secret, source-map, headers/CSP and authorization checks pass.
- [ ] Staging backup restore succeeded; owner understands recovery steps.
- [ ] Budget/monitoring/error/backup alerts and recovery contacts are configured.
- [ ] Owner/accountant approves seller/GST, invoices, shipping and refund policies.
