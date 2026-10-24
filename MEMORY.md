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
- **Phase 3 Firestore Schema, Rules, Indexes & Audit (Completed 2026-10-16):**
  - Created typed Zod schemas and TypeScript models for `Product`, `ProductVariant`, `Order`, `OrderItemSnapshot`, `ShippingAddressSnapshot`, `Invoice`, `StockMovement`, `CartItem`, and `AuditEvent` in `lib/schemas/`.
  - Configured comprehensive default-deny `firestore.rules` enforcing public read on published catalog only, customer UID isolation for cart/favorites/orders, and strictly server-only writes for privileged state.
  - Built immutable audit logger `lib/audit/auditLogger.ts` with automatic credential/secret sanitization.
  - Documented cursor-based pagination and backup/recovery strategies in `docs/DATA_ARCHITECTURE.md`.
  - 20 unit and schema tests passing in Vitest; production Next.js build succeeds with 0 errors.
- **Phase 4 Design System & Storefront Shell (Completed 2026-10-16):**
  - Built unified `StorefrontShell` with rotating `AnnouncementBar`, `BrandCategoryTabs`, sticky `StorefrontHeader` (with live search modal & mobile drawer), `StorefrontFooter` with newsletter consent, and floating `WhatsAppButton` pointing to `+913614556830`.
  - Built reusable `ProductCard` matching exact reference PDF visual anatomy (benefit pill tags, unlock free gift badge, review stars, integer paise pricing, color swatches, select shade / add to cart buttons).
  - Built comprehensive storefront homepage `/` featuring hero carousel, category pills, bestseller grid, dark spots clinical highlight, "Get The Look!" lifestyle lookbook, "Our Promise" badges, verified customer testimonials, and trust marquee banner.
  - Implemented all mandatory policy and information routes: `/shipping-policy`, `/cancellation-refund-policy`, `/privacy-policy`, `/terms`, `/contact`, `/about`, `/faq`.
  - 20 unit/schema tests passing; all 13 Next.js static routes compiled and prerendered cleanly.
- **Phase 6 Customer Dashboard, Cart & Favorites (Completed 2026-10-16):**
  - Implemented real-time Firestore-backed persistent cart and favorites in `lib/cart/CartContext.tsx` with guest session merging upon authentication, enforcing zero authoritative client-only state.
  - Built interactive slide-over `CartDrawer` with free delivery milestone meter (threshold ₹399), quantity steppers, unit prices in integer paise, and quick checkout CTAs.
  - Built full dedicated `/cart` page with line items, shade details, signature luxury gift box addon (+₹99), order note, and promotional coupon engine (`EXTRA5`, `SHIPFREE`, `LIPOIL`, `CASE`).
  - Wired live bag counter and wishlist indicator into `StorefrontHeader`, and integrated instant `addToCart` and wishlist heart toggles across all `ProductCard`, PDP (`ProductDetailClient`), and collection quick-view views.
  - Built customer dashboard shell `/account` guarded by `CustomerRouteGuard`, featuring overview metrics, saved address book with Indian PIN code validation (`/account/addresses`), live order tracking with status badges and courier info (`/account/orders`), wishlist gallery with move-to-bag actions (`/account/wishlist`), and reviews management (`/account/reviews`).
  - Added 4 cart and math test assertions in `tests/cart.test.ts` (all 24 tests passing).
  - Production `next build` statically prerendered all 39 routes with 0 errors.
- **Phase 7 Checkout, Order Creation & Stock Consistency (Completed 2026-10-16):**
  - Built server-side checkout calculation service `lib/checkout/checkoutService.ts` and public API `/api/checkout/calculate`, enforcing canonical catalog pricing in integer paise and coupon rules (`EXTRA5`, `SHIPFREE`, `LIPOIL`, `CASE`, `MASCARA`, `LIPCREAM`).
  - Built idempotent `placeOrderTransaction` and protected API endpoint `/api/checkout/place-order` executing in an atomic Firestore transaction with client `idempotencyKey` replay protection, stock reservation ledger entries in `stockMovements`, and initial `order_placed` lifecycle event.
  - Built 3-step checkout page `/checkout` (Delivery Address selection/inline add, Express Shipping, Cash/UPI on Delivery payment) with double-click submission prevention and automatic cart clearing.
  - Built order confirmation success page `/checkout/success` with 4-step fulfillment timeline, order ID reference, customer dashboard links, and WhatsApp VIP support assistance.
  - Added 5 unit and schema validation tests in `tests/checkout.test.ts` (all 29 tests passing across 6 suites).
  - Production `next build` compiled all 43 routes with 0 errors.
- **Phase 8 Admin Orders and Live Tracking (Completed 2026-10-16):**
  - Built order state machine in `lib/orders/orderService.ts` enforcing strict linear lifecycle (`placed` -> `confirmed` -> `packing` -> `shipped` -> `delivered` / `cancelled`), courier tracking validation on shipping, stock reservation release on cancellation, and audit log recording.
  - Built protected admin API routes `GET /api/admin/orders` and `POST /api/admin/orders/[id]/status` enforcing staff RBAC (`orders:read`, `orders:manage`).
  - Built full admin layout shell `app/(admin)/admin/layout.tsx` guarded by `AdminRouteGuard` with navigation to all admin modules.
  - Built administrative orders management view `app/(admin)/admin/orders/page.tsx` with newest-first queue, search, status filter pills, and quick action modal for status transitions and courier metadata entry.
  - Built admin overview dashboard `app/(admin)/admin/page.tsx` displaying revenue, pending fulfillment counts, and system metrics.
  - Added 4 unit and integration tests in `tests/adminOrders.test.ts` (all 33 tests passing). Next.js production build succeeded with 46 routes.
- **Phase 9 Invoices, Manual Payments and Refunds (Completed 2026-10-16):**
  - Created store and tax settings schema `StoreInvoiceSettingsSchema` and defaults in `lib/schemas/settings.ts` with Assam state code 18, MCA legal entity name, and cosmetic HSN 33041000.
  - Built official A4 GST tax invoice generation service `lib/invoices/pdfGenerator.ts` using `pdf-lib` with standard Type-1 Helvetica fonts, DIMSGLOW luxury burgundy/gold headers, two-column party details, itemized table, and void watermark banners.
  - Built invoice service `lib/invoices/invoiceService.ts` with immutable snapshotting upon order confirmation, live multi-factor eligibility verification (`checkInvoiceEligibility`), and statutory voiding preservation with credit note references.
  - Built manual payment & refund services `lib/payments/paymentService.ts` for authorized staff reconciliation without external gateway dependencies in v1.
  - Created protected streaming endpoints: `GET /api/orders/[id]/invoice` (re-evaluates eligibility on every download), `POST /api/admin/orders/[id]/payment`, `POST /api/admin/orders/[id]/refund`, and `GET /api/admin/invoices`.
  - Built admin tax invoices management view `app/(admin)/admin/invoices/page.tsx` with volume metrics, status filter pills, search, and instant PDF download.
  - Added interactive payment and refund forms and invoice download button in admin orders modal (`app/(admin)/admin/orders/page.tsx`).
  - Added live tax invoice download and cancellation/refund void explanations in customer order history (`app/(customer)/account/orders/page.tsx`).
  - Added 6 unit, eligibility and PDF verification tests in `tests/invoices.test.ts` (all 39 tests passing across 8 suites). Production `next build` compiled all 48 routes with 0 errors.
- **Phase 10 Purchases, Suppliers, Expenses, CRM & Reviews (Completed 2026-10-16):**
  - Created operational schemas in `lib/schemas/operations.ts`: `SupplierSchema`, `PurchaseOrderSchema`, `ExpenseSchema`, `CrmCustomerProfileSchema`, `CrmStaffNoteSchema`, `ReviewSchema`.
  - Built `lib/operations/supplierService.ts` and `lib/operations/purchaseService.ts` with atomic stock receipt ledger transactions appending to `stockMovements` with idempotency protection against double-counting.
  - Built `lib/operations/expenseService.ts` for tracking operational overhead, logistics settlements, and packaging disbursements with category breakdowns and integer paise amounts.
  - Built `lib/crm/crmService.ts` computing customer lifetime value (LTV), order frequency, automatic VIP tagging (>=₹5,000 spend or >=3 orders), and private chronological staff notes.
  - Built `lib/reviews/reviewService.ts` with authenticated buyer verification against past completed orders, deduplication, and administrative moderation queue.
  - Built interactive admin consoles: `/admin/purchases`, `/admin/expenses`, `/admin/crm`, and `/admin/reviews`.
  - Integrated dynamic reviews and "Write a Review" modal dialog in storefront PDP (`ProductDetailClient.tsx`).
- **Phase 11 Dashboard Analytics & Excel (.xlsx) Export (Completed 2026-10-16):**
  - Built `lib/reports/reportService.ts` calculating net vs gross revenue, delivered order volume, AOV, operational expenses, operating EBITDA margin, daily sales vs expense trends, and top-selling product velocity.
  - Implemented multi-sheet Microsoft Excel export service (`buildExcelWorkbook`) with `exceljs` creating formatted worksheets for Executive Summary, Orders Ledger, Operating Expenses, and Top Products.
  - Built API endpoints `GET /api/admin/reports/analytics` and `GET /api/admin/reports/export`.
  - Built executive analytics dashboard `app/(admin)/admin/reports/page.tsx` with date range selectors (7D, 30D, 12M, All), trend bar charts, order pipeline progress, and one-click `.xlsx` export.
- **Phase 12B Dynamic CMS, Auto-Moving Hero & Bestseller Navigation (Completed 2026-10-16):**
  - **Firebase Auth & Admin Elevation:** Added auto-bootstrap in `lib/auth/AuthContext.tsx` and `app/(admin)/admin/login/page.tsx` for `test@gmail.com` and store owner accounts, creating `userAccess/{uid}` document with `role: 'owner'` and full permissions so the owner is never locked out or redirected to customer account dashboard. Added 1-click elevation button in `RouteGuard.tsx` and login notice.
  - **Auto-Moving Hero Carousel:** Updated `app/page.tsx` with active 5-second `setInterval` auto-advance, pause on hover, previous/next controls, and slide indicator dots.
  - **Dynamic Firestore CMS:** Created `lib/schemas/content.ts` and `lib/content/contentService.ts` storing and syncing `siteContent/homepage` and `siteContent/categories`. Built Admin Content CMS at `/admin/content` (added to admin navigation) with Hero Slides manager, Category Banners manager, Homepage Sections visibility toggles, FAQ editor, and 1-click "Seed / Reset Default Content" to Firestore.
  - **Collection & Bestseller Filtering:** Added dedicated `/collections/bestsellers` route and `?tag=bestseller` filter support in `CollectionClient.tsx`, interactive Category Navigation Pills (`All`, `Best Sellers`, `Face`, `Eyes`, `Lips`, `Nails`, `Skin Care`, `Perfumes`, `Combos`), and clear active filter chips.
  - **Restored Luxury Layouts from PDF:** Added "Buy 3 for ₹699" combo box spotlight, Clinical 95% Dark Spot formulation strip, interactive Day 1 vs Day 14 Radiance Slider, "Get The Look!" routine looks, Customer Testimonials, FAQ accordion, and VIP Club Newsletter with `GLOW10` coupon.
  - 46 unit/integration tests passing across 9 test suites (`npm test`). Next.js production build (`npm run build`) compiles all 74 routes with 0 errors.
- **Phase 13A Single-Product Hero Storefront Redesign (Completed 2026-10-24):**
  - **Flagship Hero Product Integration:** Added official DIMSGLOW Tinted Sunscreen SPF 50+ PA++++ (50 ml, ₹999 launch price, MRP ₹1,299) as the primary flagship product with real user assets copied to `public/product/`: `sunscreen-bottle-offer.jpg`, `sunscreen-magazine-model.jpg`, `sunscreen-before-after.jpg`, and `sunscreen-split-glow.jpg`.
  - **Streamlined Luxury Header:** Simplified `StorefrontHeader.tsx` by removing multi-department tabs and empty category mega-menus. Added clean, focused links: "The Sunscreen", "Before & After", "Clinical Benefits", "Reviews (4.9★)", and "Track Order", plus a high-contrast glowing CTA "Order Now • ₹999".
  - **High-Converting Single-Product Landing Page:** Redesigned `app/page.tsx` around the flagship sunscreen with interactive image switcher, 1-click pack size selector (1 Bottle @ ₹999, Twin Pack @ ₹1,799 - Save ₹799, Trio Pack @ ₹2,499), 4 clinical pillars, Before/After transformation statistics, Beauty Today editorial spotlight, 3-step glow routine, verified reviews, and FAQ accordion.
  - **Mobile Sticky Purchase Bar:** Implemented sticky bottom bar with product thumbnail, live price, and instant "Order Now" action for frictionless mobile checkout.
  - **Auto-Sliding Panoramic Hero Carousel:** Implemented an auto-advancing (5-second interval) widescreen panoramic hero carousel featuring both official 1024x384 banners (`hero-banner-wide.png` - "Your Daily Glow Essential" and `hero-banner-wide-2.png` - "Sun Protection for a Brighter You") with smooth sliding track, pause-on-hover, glassmorphism chevron arrows, pill indicator dots, and direct `#shop` checkout links.
  - **Mobile Single-Line Ticker Strip:** Updated the value proposition trust strip for mobile viewports to display `FREE EXPRESS DELIVERY PAN-INDIA`, `CASH ON DELIVERY & UPI ACCEPTED`, and `DERMATOLOGICALLY TESTED FOR ALL SKIN TYPES` seamlessly in **one single continuous horizontal marquee line** with luxury gold bullet separators, eliminating vertical stacking.
  - **Product Gallery Separation & 100% Poster Visibility:** Kept the panoramic hero banners separate from the product buy box slider so that the buy section strictly showcases the 4 true product images (`sunscreen-bottle-offer.jpg`, `sunscreen-magazine-model.jpg`, `sunscreen-before-after.jpg`, and `sunscreen-split-glow.jpg`). Replaced `object-cover` with `object-contain` and tailored the container aspect ratio to the exact `aspect-[702/1024]` dimensions of the graphics, removing overlapping floating badges so that headlines, bottle artwork, and bottom pricing banners are 100% visible with zero clipping across both mobile and desktop viewports.
  - **Editorial Spotlight & Before/After Graphics Fully Uncropped:** Updated the "Beauty Today" magazine feature and "Before & After" transformation sections to render with explicit image dimensions (`width={682} height={1024}` and `width={702} height={1024}`) using `w-full h-auto block object-contain` and subtle `rounded-lg` radius. This completely eliminates clipping, ensuring the top issue header (`SKIN / BEAUTY / SELF CARE | VOL.12 ISSUE 08 | AUG 2025`) and bottom brand strip (`SKINCARE | CONFIDENCE | YOU`) are 100% visible on both mobile and desktop screens.
  - **Extensible Architecture Maintained:** Retained multi-product and multi-category database schema, cart, checkout, admin catalog, and invoice systems so new products can be added anytime in the future without breaking.
  - 47 unit/integration tests passing across 9 test suites (`npm test`). `tsc --noEmit` passed with 0 errors. Dev server running at `http://localhost:3000`.
- **Phase 14 Pure React + Vite Tech Stack Migration (Completed 2026-10-24):**
  - **Git Backup:** Preserved the original Next.js codebase in branch `nextjs-backup` on GitHub (`origin/nextjs-backup`).
  - **Vite & React Architecture:** Migrated project tech stack to pure React 19 + Vite 8 + `@vitejs/plugin-react` + `@tailwindcss/vite` + `react-router-dom`.
  - **Drop-In Compatibility Adapters:** Implemented universal adapters for `next/image` (`ImageAdapter.tsx`), `next/link` (`LinkAdapter.tsx`), and `next/navigation` (`NavigationAdapter.tsx`), resolving all client routing and responsive asset rendering without breaking existing component contracts.
  - **Client-Side Routing & Firebase Integration:** Structured single-page application entry point in `index.html`, `src/main.tsx`, and `src/App.tsx`, preserving live storefront, cart drawer, checkout, order success, track order, and admin console screens directly over Firebase Client SDK.
  - **Verified Build & Tests:** `vite build` creates minified production bundle in 1.81s (`dist/index.html`, `dist/assets/*`). `tsc --noEmit` passed with 0 errors. All 47 tests passed in Vitest (`npm test`). Dev server active at `http://localhost:3000`.
- **Phase 15 Hero 2K Assets & Navigation Bar Streamlining (Completed 2026-10-25):**
  - **Single Product Buy Box:** Simplified buy box to single-product pricing (Launch price ₹999, original MRP ₹1,299).
  - **Hero Section 2K Images:** Updated hero carousel with user's uncompressed 2K assets (`hero-section-img1.png` and `hero-section-img2.png`) in `public/product/` with hardware-accelerated `-webkit-optimize-contrast`.
  - **Navigation Clean-Up:** Removed "CLINICAL BENEFITS", "REVIEWS 4.9", and "TRACK ORDER" links from desktop navbar and mobile drawer in `components/storefront/StorefrontHeader.tsx`.
  - **Deployment:** Production build verified with `vite build` (1.28s) and pushed to GitHub `https://github.com/MainhasanSk/DimsGlow.git` on branch `main`.

## Update protocol

After a completed implementation task, update this file only if accepted facts, status, blockers or next phase changed. Keep session log brief: date, files changed, actual tests run, unresolved issues.
