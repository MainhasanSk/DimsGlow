# DIMSGLOW — UI/UX Design Specification

**Purpose:** Convert the supplied reference PDF into reproducible component/layout rules. This document defines the customer-facing visual language and a separate admin console. It does not authorize copying another company's logo, product copy or unlicensed media.

## 1. Reference audit

The supplied PDF contains 69 pages of screenshots of the Insight Cosmetics India storefront: category/collection grids, product detail views, editorial and informational panels, reviews, FAQs and footers. Repeated visual patterns include a predominantly white canvas, slim promotional strip, centered logo, top category navigation and utility icons, image-led product cards, visible reviews/prices, shade/variant choices and magenta/red CTA bars. PDP screenshots show product gallery with thumbnails on the left and product purchase panel on the right; the purchase panel includes swatches, offer panels, Add to Cart/Buy Now controls, delivery checking and trust messaging. Some captures show a sticky purchase bar and floating support shortcut.

**Implementation interpretation:** Match the hierarchy, spacing logic, grid density, product-card anatomy, browsing/variant/purchase interactions and footer depth. Replace the other brand's logo, colors, product copy, claims and imagery with approved DIMSGLOW branding and assets. The supplied Google short URL could not be opened directly in the research browser, so the PDF is the source for this interpretation. Pixel-level review requires final DIMSGLOW brand assets and approved desktop/mobile screenshots.

## 2. Brand and visual tokens

Use these defaults until the client provides an official style guide. Centralize them in CSS variables/Tailwind theme.

| Token | Starting value | Purpose |
|---|---|---|
| `--color-page` | `#FFFFFF` | Storefront canvas |
| `--color-text` | `#19161A` | Primary text |
| `--color-muted` | `#6D6670` | Supporting text |
| `--color-border` | `#E8E2E7` | Dividers and borders |
| `--color-accent` | `#B83B63` | Primary action/active state; replace if official DIMSGLOW brand differs |
| `--color-accent-hover` | `#982D50` | Hover/pressed action |
| `--color-soft-accent` | `#FBEAF0` | Promo/selected panels |
| `--color-surface-muted` | `#F7F5F7` | Neutral panels and alternate admin rows |
| `--color-success` | `#18794E` | Success |
| `--color-warning` | `#946200` | Low stock/pending |
| `--color-danger` | `#B42318` | Destructive/error |
| `--radius-card` | `10px` | Cards |
| `--radius-control` | `6px` | Inputs/buttons |
| `--shadow-float` | `0 8px 28px rgba(25,22,26,.10)` | Cart/menu float only |

Keep cards mostly flat and the product imagery prominent. Use a brand-compatible sans serif; use licensed assets or standard system fallbacks. Do not create an unapproved commercial font dependency.

## 3. Responsive layout rules

- Content max width around `1440px`, centered.
- Page gutters: desktop `32–48px`, tablet `20–28px`, mobile `16px`.
- Header hierarchy: slim announcement row, main header, category nav. The logo should stay visually centered on desktop even if utilities are asymmetric.
- Product grid: four columns on wide desktop, three on smaller laptop/tablet landscape, two on mobile; one only on very narrow layouts or special content.
- Wide collection views may show a filter sidebar; mobile filters use an accessible side/bottom sheet with Apply/Clear actions.
- Keep image aspect ratios consistent. Use `contain` for product packaging as appropriate and `cover` for lifestyle banners.
- Sticky header/purchase bars must not cover content, keyboard focus or mobile browser controls.
- Use real responsive images/Cloudinary transformations; avoid pulling original high-resolution assets when unnecessary.

## 4. Public site information architecture

```text
/
├── /collections/[slug]
├── /products/[slug]
├── /search?q=...
├── /cart
├── /about
├── /contact
├── /faq
├── /shipping-policy
├── /cancellation-refund-policy
├── /privacy-policy
├── /terms
├── /sign-in
├── /sign-up
├── /reset-password
└── /account
    ├── /profile
    ├── /addresses
    ├── /cart
    ├── /favorites
    ├── /orders
    └── /orders/[orderId]
```

Admin shell routes (independent layout; shared design primitives are fine):

```text
/admin
├── /dashboard
├── /products
├── /categories-and-content
├── /inventory
├── /orders
├── /orders/[orderId]
├── /invoices
├── /sales
├── /purchases
├── /suppliers
├── /expenses
├── /customers
├── /reviews
├── /reports
├── /users-and-permissions
├── /settings
└── /backups-and-audit
```

## 5. Storefront component behavior

### 5.1 Announcement bar

- One slim top row backed by a published Firestore `siteContent` record.
- It may display one concise announcement; optional rotating messages must not shift page layout.
- Do not hardcode discount thresholds, promotional dates, shipping claims or free-gift offers.

### 5.2 Header and navigation

- Desktop: category/shop menu, centered DIMSGLOW logo, search/account/order link/favorites if enabled/cart count.
- Mobile: compact logo, menu drawer, search and cart actions. Menus close on Escape and route changes and restore focus correctly.
- Active navigation gets one clear indicator; avoid competing highlights.
- Cart count comes from the signed-in user's Firestore cart.

### 5.3 Home page

Suggested order, with sections controlled from Firestore when sensible:

1. Announcement bar.
2. Main header/category navigation.
3. Hero/campaign banner with accessible heading, CTA and approved Cloudinary image.
4. Featured categories/collections.
5. New arrivals/featured products.
6. Promotional/editorial panels.
7. Best sellers/curated collection.
8. Brand story/value strip.
9. Genuine approved testimonials/reviews only.
10. Newsletter only if email collection/consent is actually implemented.
11. Footer: shop, company, policies and contact details.

Hide empty public sections or show a deliberate admin-preview empty state. Never fabricate product/review content.

### 5.4 Collection/search pages

- Show breadcrumb, title, description, result count and sort control.
- Filters can cover category, price, availability and product attributes only when supported by actual schema.
- Card anatomy: image, optional configured badge, rating/count, title, current/compare-at price, variant selector or “Choose options”, primary CTA.
- Use cursor pagination/lazy loading; preserve search/filter state in URL where practical.
- Disable valid-purchase controls for out-of-stock products and show a clear state.

### 5.5 Product detail page (PDP)

Desktop two-column composition:

- **Left:** main gallery image, thumbnail rail/row, next/previous, meaningful alt text; add zoom only if it works accessibly.
- **Right:** breadcrumb, title, rating/review count, current price, optional compare-at price, stock, variant options, quantity, configured offer panels, Add to Cart/Buy Now and delivery/dispatch information.
- **Below fold:** description, specs, shipping/returns info, real reviews, FAQ/related products and approved editorial content.
- Mobile: gallery first, purchase panel beneath; primary CTA must be easy to reach. Sticky purchase bar must not cover content.
- Selecting a variant updates SKU, price, availability and image when variant data supports it.
- Show a pincode/serviceability checker only if the owner provides a genuine source/rule. Otherwise show the shipping-policy link; never fake availability results.

### 5.6 Cart and checkout

- Cart shows selected variant, quantity controls, remove action, current availability, subtotal and configured discount/tax/shipping estimates.
- Persistent cart/order requires sign-in. A visitor attempting to save/use cart is redirected to sign-in and returned to the intended path.
- Checkout validates addresses; final totals come from server calculation. Do not collect card details while no gateway is in scope.
- On price/stock conflict, identify the affected item and request confirmation after updating; do not create an order with stale totals.
- Success view shows order number and link to order details.

### 5.7 Authentication screens

- Minimal brand-aligned sign-in/sign-up/reset forms with persistent labels, validation, loading, show/hide password toggle and useful error states.
- Password reset is Firebase email/action-code flow. Do not expose account existence unnecessarily.
- Admin sign-in rejects customers without active staff access. No public “create admin” option.

### 5.8 Customer dashboard

- Simple nav: Overview, Orders, Addresses/Profile, Favorites, Cart, Reviews, Help/Policies.
- Orders show order number/date/total/payment state/fulfillment state and detail link.
- Order detail timeline shows timestamps/status and courier/tracking only when assigned.
- Invoice action appears only when eligible. Canceled/refunded orders display a clear explanation rather than a broken button.
- Use Firestore listeners for live status and unsubscribe on unmount/logout. Show loading/stale/error states.

## 6. Admin console design

### 6.1 Admin shell

- Sidebar grouped by Overview, Commerce, Operations, Finance, Customers, Analytics and System.
- Top bar: breadcrumbs/title, optional global search, alert indicator, staff account and sign-out.
- Neutral background, strong typography, restrained accent and clear status colors. Optimize information density, not consumer product-grid aesthetics.
- Tables support search, filters, cursor pagination and sortable columns. Bulk actions exist only when they are valid; destructive actions need confirmation and audit.
- On mobile, sidebar becomes a drawer; wide tables become cards or intentionally scroll horizontally with visible cues.

### 6.2 Dashboard visualizations

Show only real Firestore-backed values, with the selected date range and timezone displayed:

- Order counts by status; gross order value; paid amount and pending balance as separately labeled values.
- Sales trend by day/week/month, with comparison only if calculated consistently.
- Order-status pipeline, recent orders, low-stock items, top products, expense/purchase summaries and unresolved alerts.
- Clicking a chart/KPI opens a filtered data view using the same date/status definition.
- Empty dataset means clear zero/empty state—not fake graph data.

### 6.3 Required modules

| Module | Key table/detail fields | Main actions |
|---|---|---|
| Inventory | SKU, product, variant, on-hand/reserved/available, threshold, movement history | Edit catalog, adjust stock with reason, view ledger/low stock |
| Orders | Newest-first order/customer/date/total/status/payment | Confirm, pack, ship with courier, deliver, cancel with reason, view timeline |
| Invoices | Invoice number/order/issued/status/total | Authorized view/download, void metadata, credit-note reference; never erase history |
| Sales | KPI cards, trend, product breakdown | Date filters, XLSX export |
| Purchases | PO/supplier/dates/received qty/total/status | Create, order, partial/full receive; update stock only on receipt |
| Suppliers | Business/contact/terms/optional GSTIN/status | Create/edit, purchase history |
| Expenses | Date/category/vendor/amount/reference | Create/edit per permission, filters and approved export |
| CRM | Customer, order summary, tags, support notes | Safe notes and customer order context |
| Reviews | Product/customer/rating/date/moderation state | Approve/reject/hide with reason and audit |
| User access | Staff/email/role/status/module permissions | Invite, suspend, revoke and audit; never store passwords |
| Reports | Period filters, chart/table, defined KPIs | Weekly/monthly/yearly/custom range, XLSX export |
| Backup/audit | Backup status/time, audit query | View records and controlled recovery status |
| Store settings | Seller/GST, invoice prefix, shipping, policies and content | Validated changes, preview and audit |

## 7. Interaction states and accessibility

Each async screen/component needs loading, populated, empty, validation-error, permission-denied, network/server-error and retry/stale states where relevant. Use layout-stable skeletons.

- All controls have accessible names; inputs have persistent labels.
- Dialogs/menus manage focus, Escape and focus restoration appropriately.
- Use semantic heading levels, keyboard-operable variants/gallery/filter controls, visible focus rings and sufficient contrast.
- Never communicate order status by color alone; pair color with readable text/icon.
- Respect reduced-motion preferences; animations should be subtle.
- Announce important cart/order state changes without excessive repeated screen-reader announcements.

## 8. Data/content restrictions

- Firestore is the source for products/categories/order/finance data; Cloudinary serves media.
- Sanitize rich text. Do not render arbitrary database HTML without allowlist/sanitizer.
- Store meaningful alt text. Use empty alt only for purely decorative images whose text is already available.
- Public pages show published records only; admin preview can show drafts.
- Never invent reviews, sale claims, prices, shipping guarantees, ratings, tax fields or tracking events.

## 9. Design acceptance checklist

- Compare home, collection, PDP, cart, customer order and admin dashboard with approved target screenshots.
- Header/logo alignment, promo strip height, grid density, image ratio, price/CTA hierarchy, PDP columns and footer depth match approved structure.
- Mobile/tablet retain hierarchy and do not overflow horizontally.
- Filter sheets, variants, cart drawer, sticky purchase controls and all buttons work.
- Admin tables/charts remain readable with populated and empty datasets.
- Keyboard/accessibility checks in `TEST_PLAN.md` pass.
