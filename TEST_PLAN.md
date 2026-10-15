# DIMSGLOW — Test Plan and Release Gates

## 1. Objectives

Verify functionality, authorization/data isolation, order/stock consistency, invoice eligibility, live updates, visual fidelity, accessibility and recovery. Use emulator/staging fixtures, never production customer data.

## 2. Test layers and tools

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | State transitions, totals, invoice eligibility, permissions, report formulas and validation |
| Component | React Testing Library | Forms, variants, cart controls, empty/error/loading states, order timeline and action eligibility |
| Firebase rules | Emulator Suite + rules-unit-testing | Public reads, own-record isolation, blocked customer writes to server-owned data, staff restrictions |
| Integration | Firebase Emulator Suite + Functions test harness | Place order, stock reserve/shipment/cancel, purchase receipt, payment/refund, audit side effects |
| E2E | Playwright | Full customer/admin journeys, route guards, realtime updates, invoice download block, XLSX export |
| Visual | Playwright screenshots | Home, collection, PDP, cart, customer order and admin dashboard at target viewports |
| Security | Manual checklist + secret/dependency scanners | AuthZ bypass, malformed input, uploads, exposed secrets, rules, rate limits, headers/logs |
| Recovery | Staging exercise | Firestore/RTDB restore and Cloudinary asset recovery |

## 3. Test environment and fixtures

- Local: Firebase Emulator Suite and a mocked Cloudinary adapter or isolated development folder.
- Staging: separate Firebase project and Cloudinary folder/preset; no real customer data.
- Never use actual payment credentials or production exports in test fixtures.
- Create deterministic fake Customer A/B, owner, restricted admin, order manager, finance manager and disabled staff test accounts.
- Seed fixtures only through explicit emulator scripts that refuse production project IDs.
- Use a controlled clock/timezone and integer paise for all money assertions.

## 4. Functional test matrix

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-01 | Customer signs up | Firebase user and own profile created; no staff role |
| AUTH-02 | Invalid credentials/email | Helpful error; no crash or secret leak |
| AUTH-03 | Customer requests reset | Firebase reset flow starts; generic response does not reveal account existence unnecessarily |
| AUTH-04 | Password reset completes | New password works; old password fails new sign-in |
| AUTH-05 | Customer directly opens `/admin` | UI and protected backend both deny access |
| AUTH-06 | Staff role is revoked in an open session | Subsequent sensitive actions are denied server-side |
| DATA-01 | Customer A guesses Customer B's order/cart/address ID | Read denied; no data disclosed |
| CATALOG-01 | Admin publishes product with Cloudinary asset | Actual Firestore data/asset appear on public site |
| CATALOG-02 | Public user queries draft product | Product is not exposed in public view/query |
| CATALOG-03 | Product is out of stock | Purchase action disabled; honest stock state shown |
| CART-01 | Customer adds variant to cart | Firestore cart and UI count update consistently |
| CART-02 | Customer signs in on another device | Persistent Firestore cart/favorites restore |
| ORDER-01 | Valid checkout | One order, server-calculated totals, snapshots and reservation are created |
| ORDER-02 | Client tampers with price/discount/total | Server ignores submitted totals and recomputes canonical values |
| ORDER-03 | Duplicate order retry with same idempotency key | Same result or safe rejection; no duplicate order/reservation |
| ORDER-04 | Two customers compete for final unit | Only one reservation succeeds; no negative availability |
| ORDER-05 | Admin order queue receives order | Newest order first with correct total/status/customer reference |
| ORDER-06 | Invalid status transition submitted | Rejected with no partial stock/invoice mutation |
| ORDER-07 | Admin confirms order | Event and invoice metadata recorded; customer screen updates without reload |
| ORDER-08 | Admin packs and ships with courier details | Tracking visible; stock on-hand/reserved changes once |
| ORDER-09 | Admin marks delivered | Timeline shows delivery; review eligibility follows policy |
| ORDER-10 | Customer tries to cancel after shipment | Direct cancel unavailable; support/return route shown |
| STOCK-01 | Pre-shipment cancellation | Reserved quantity released once; movement and audit exist |
| STOCK-02 | Refund on shipped item, no return recorded | Stock is not incremented automatically |
| STOCK-03 | Purchase receipt is submitted twice | Idempotency prevents duplicate stock increment |
| INV-01 | Invoice requested before confirmation | Denied server-side; no PDF/link exposed |
| INV-02 | Confirmed eligible invoice requested | Correct immutable snapshot, invoice number/totals and safe filename |
| INV-03 | User guesses another customer's invoice ID | Download denied without private metadata leakage |
| INV-04 | Confirmed order later cancelled | UI hides/blocks invoice and server denies; invoice history retained/voided |
| INV-05 | Refund recorded | Download blocked; refund/void/credit-note metadata remains auditable |
| PAY-01 | Finance marks order paid manually | Payment record, actor and timestamp saved; dashboard metrics update |
| PAY-02 | Order manager tries to change payment | Denied unless explicit permission granted |
| FIN-01 | Valid expense is recorded | Saved once and filterable by date/category |
| FIN-02 | Negative/overflow amount or unknown currency submitted | Validation rejects request |
| PO-01 | Purchase order partially received | Only received units increase stock; unreceived units remain open |
| CRM-01 | Support user opens customer detail | Only required support fields visible; restricted finance/access fields denied |
| REVIEW-01 | Customer submits review under configured policy | Valid review saved/moderated; rating aggregate updates exactly once |
| REPORT-01 | Weekly/monthly/yearly filters change | Same date/timezone semantics are applied consistently |
| REPORT-02 | XLSX exported for interval | Data, rows and totals match UI report definition; safe filename |
| REPORT-03 | Unauthorized user calls export endpoint | Denied server-side |
| MEDIA-01 | Unauthorized customer requests upload signature | Denied |
| MEDIA-02 | Staff attempts disallowed file/folder/size | Signature/upload rejected; no uncontrolled asset created |
| AUD-01 | Admin changes price/stock/payment/order/role | Audit includes actor/action/time/target/correlation ID; no secrets |
| RT-01 | Customer logs out/unmounts order page | Listeners unsubscribe; no prior-user data remains subscribed |
| ERR-01 | Firestore/network error occurs | Honest error/retry state; no fake success or demo fallback |

## 5. Order and invoice state matrix

| Order/invoice state | Customer direct cancel | Invoice download | Stock treatment |
|---|---|---|---|
| `placed` | Allowed by default policy | No | Reserved |
| `confirmed` | Allowed before packing by default policy | Yes if active invoice exists | Reserved |
| `packing` | Admin decision before shipment; customer action follows approved policy | Yes unless ineligible | Reserved |
| `shipped` | Direct cancellation unavailable; follow return/support process | Yes unless refunded/voided | On-hand down, reservation released |
| `delivered` | Follow return/refund policy | Yes unless refunded/voided | No inventory change unless return is received/inspected |
| `cancelled` | Not applicable | No | Release reservation if never shipped; never blindly restock shipped goods |
| refunded/voided | Follow refund/accounting process | No | Based on physical return/inspection, not solely financial refund |

The customer-visible button is not security. `downloadInvoice` enforces eligibility on every request.

## 6. Visual and responsive testing

Capture at least 1440×900, 1024×768, 768×1024 and 390×844 (or closest supported sizes):

- Home with campaign/featured-product sections.
- Collection with filtering/sorting and product grid.
- PDP with gallery/variants/purchase panel.
- Cart/checkout with validation and stock conflict.
- Customer order details with status timeline and invoice action.
- Admin dashboard in populated and empty states.
- Admin order detail, product editor and reports view.

Compare against approved reference structure: logo/header spacing, promo-strip height, grid count, image aspect ratio, price/CTA hierarchy, PDP columns and footer depth. Different DIMSGLOW brand assets/colors are not a failure. Check clipping, unintended horizontal scrolling and sticky elements covering controls.

## 7. Accessibility checks

- Keyboard-only navigation through menus, dialogs, variant controls, filters, forms and tables.
- Visible focus, valid focus order, Escape dismissal and focus restoration.
- All inputs labeled; validation errors associated programmatically; icon-only actions named.
- Status text is not color-only; test contrast for small text and buttons.
- Screen readers announce important cart/order updates politely without repeated noise.
- Respect reduced-motion preference.

## 8. Security test checklist

- [ ] Firestore/RTDB rules default deny; automated tests run in CI.
- [ ] Direct SDK/REST requests cannot alter orders, payments, stock, invoices, role/access or audit records.
- [ ] Protected endpoints reject missing/expired/revoked token, disabled account, wrong role/permission and malformed input.
- [ ] Tamper with UID/role/price/amount/order/invoice IDs on sensitive paths.
- [ ] No secret in source maps, client bundle, public environment variables, logs, Git history or build artifacts.
- [ ] Cloudinary secret is absent from client; signed uploads enforce role/folder/MIME/size/rate limits.
- [ ] PDF/XLSX downloads authorize every request and do not use predictable public links.
- [ ] Rate limits/abuse controls exist for reset, order creation, uploads and expensive exports as appropriate.
- [ ] Security headers/CSP and dependency review are checked on production build.

## 9. Performance validation

Set measurable baselines during implementation; do not promise unsupported absolute targets before measurement.

- Public collection page renders usable content quickly on a typical mobile connection; media is transformed/responsive.
- No catalog/order page fetches unbounded records.
- Admin reports constrain date ranges and query only required fields/documents.
- Large exports are paginated/streamed or bounded with a maximum row/date range where needed.
- Order listeners are scoped to the signed-in user and unsubscribed when not used.

## 10. Release gates

Production launch is blocked until:

1. No critical/high security issue or broken core flow remains.
2. Authentication, role authorization and rules tests pass.
3. Order placement, status transitions, stock, cancellation/refund and invoice gating pass.
4. Dashboard and exports reconcile to source records on deterministic tests.
5. Client approves desktop/mobile visual review.
6. Owner/accountant approves seller/GST/invoice and shipping/return/refund policy.
7. Backup and restore has been demonstrated in staging.
8. Firebase/Cloudinary configuration is reviewed and no secret is exposed.
9. Production projects are separated from test data, with budget/monitoring alerts configured.
10. Handover docs and admin training are delivered.
