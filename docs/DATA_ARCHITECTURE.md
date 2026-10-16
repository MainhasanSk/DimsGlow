# DIMSGLOW — Firestore Data Architecture, Pagination, and Recovery Guide

## 1. Domain Modeling and Consistency Invariants

1. **Integer Minor Currency Units:**
   - All prices, subtotals, taxes, shipping charges, and order totals are stored as integer **paise** (`pricePaise`), with `currency: "INR"`.
   - Floating-point arithmetic is strictly prohibited for monetary mutations.

2. **Immutable Snapshots:**
   - Orders and invoices snapshot current customer data, shipping address, and line item prices at confirmation. Subsequent edits to products or customer profiles do not alter historical orders or tax invoices.

3. **Separate Fulfillment and Payment States:**
   - Fulfillment `status` (`placed` → `confirmed` → `packing` → `shipped` → `delivered` / `cancelled`) is completely separate from `paymentStatus` (`pending` → `paid` / `refunded`).

4. **Append-Only Auditing:**
   - Privileged operations write to `auditEvents/{eventId}` with actor UID, role, action, target, correlation ID, and safe before/after summaries. Sensitive fields (passwords, tokens, API keys) are scrubbed before storage.

## 2. Query Pagination Strategy

- For large collections (Products, Orders, Customers, Stock Movements, Audit Events), unbounded `.get()` queries are prohibited.
- Use deterministic order and Firestore query cursors:
  ```typescript
  const query = adminDb
    .collection('orders')
    .orderBy('createdAt', 'desc')
    .startAfter(cursorTimestamp)
    .limit(pageSize);
  ```

## 3. Data Retention and Archiving

- **Orders & Invoices:** Retained indefinitely for statutory tax/accounting compliance (minimum 7 years per Indian tax guidelines). Voided invoices remain on record with `status: "voided"` and a reason.
- **Stock Movements & Order Events:** Permanent append-only ledger for audit reconciliation.
- **Customer Carts & Favorites:** Transient user-owned documents; items can be updated or removed by the owning user.

## 4. Backup and Disaster Recovery

- **Firestore Backups:** Automated daily exports to a secure Cloud Storage bucket (`dimsglowweb-backups`) using Google Cloud Scheduled Exports.
- **Cloudinary Assets:** Cloudinary maintains multi-datacenter asset storage. Asset public IDs and secure URLs are stored in Firestore `mediaAssets`.
