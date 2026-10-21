import { z } from 'zod';

// ==========================================
// 1. SUPPLIERS / VENDORS
// ==========================================

export const SupplierStatusEnum = z.enum(['active', 'inactive']);
export type SupplierStatus = z.infer<typeof SupplierStatusEnum>;

export const SupplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid supplier email address'),
  phone: z.string().min(10, 'Supplier phone must be at least 10 digits'),
  address: z.string().min(5, 'Supplier address is required'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid 15-character GSTIN format').optional().or(z.literal('')),
  categoriesSupplied: z.array(z.string()).default([]),
  status: SupplierStatusEnum.default('active'),
  notes: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

// ==========================================
// 2. PURCHASE ORDERS & RESTOCKING
// ==========================================

export const PurchaseOrderStatusEnum = z.enum(['draft', 'ordered', 'received', 'cancelled']);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>;

export const PurchaseOrderItemSchema = z.object({
  productId: z.string().min(1),
  productTitle: z.string().min(1),
  variantId: z.string().optional(),
  variantName: z.string().optional(),
  sku: z.string().min(1),
  orderedQuantity: z.number().int().positive('Ordered quantity must be positive'),
  receivedQuantity: z.number().int().nonnegative('Received quantity cannot be negative').default(0),
  unitCostPaise: z.number().int().positive('Unit cost in paise must be positive'),
  totalCostPaise: z.number().int().positive(),
});

export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;

export const PurchaseOrderSchema = z.object({
  id: z.string().min(1),
  poNumber: z.string().min(1), // e.g. PO-2026-0001
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  status: PurchaseOrderStatusEnum.default('draft'),
  items: z.array(PurchaseOrderItemSchema).min(1, 'At least one item is required in a purchase order'),
  totalAmountPaise: z.number().int().positive(),
  notes: z.string().optional(),
  orderedAt: z.number(),
  receivedAt: z.number().optional(),
  receivedByUid: z.string().optional(),
  cancelledAt: z.number().optional(),
  cancellationReason: z.string().optional(),
  createdByUid: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

// ==========================================
// 3. EXPENSES
// ==========================================

export const ExpenseCategoryEnum = z.enum([
  'packaging',
  'logistics',
  'marketing',
  'software',
  'office',
  'utilities',
  'inventory_transport',
  'other',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const PaymentModeEnum = z.enum(['bank_transfer', 'upi', 'cash', 'credit_card']);
export type PaymentMode = z.infer<typeof PaymentModeEnum>;

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  expenseNumber: z.string().min(1), // e.g. EXP-2026-0001
  title: z.string().min(3, 'Expense title must be at least 3 characters'),
  category: ExpenseCategoryEnum,
  amountPaise: z.number().int().positive('Amount in paise must be positive'),
  paymentMode: PaymentModeEnum,
  vendorName: z.string().min(2, 'Vendor/Payee name is required'),
  referenceNumber: z.string().min(1, 'Reference/UTR/Bill number is required'),
  date: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  }),
  receiptUrl: z.string().url().nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),
  createdByUid: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

// ==========================================
// 4. CRM & CUSTOMER 360
// ==========================================

export const CustomerTagEnum = z.enum([
  'vip',
  'repeat_buyer',
  'wholesale',
  'high_return_risk',
  'new_shopper',
]);
export type CustomerTag = z.infer<typeof CustomerTagEnum>;

export const CrmStaffNoteSchema = z.object({
  id: z.string().min(1),
  customerUid: z.string().min(1),
  text: z.string().min(2, 'Note text is required'),
  authorUid: z.string().min(1),
  authorName: z.string().min(1),
  authorRole: z.string().min(1),
  createdAt: z.number(),
});

export type CrmStaffNote = z.infer<typeof CrmStaffNoteSchema>;

export const CrmCustomerProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string(),
  phone: z.string().optional(),
  tags: z.array(CustomerTagEnum).default(['new_shopper']),
  totalOrders: z.number().int().nonnegative().default(0),
  lifetimeValuePaise: z.number().int().nonnegative().default(0), // Total spent in integer paise
  averageOrderValuePaise: z.number().int().nonnegative().default(0),
  firstOrderDate: z.number().optional(),
  lastOrderDate: z.number().optional(),
  notesCount: z.number().int().nonnegative().default(0),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type CrmCustomerProfile = z.infer<typeof CrmCustomerProfileSchema>;

// ==========================================
// 5. REVIEWS & RATINGS
// ==========================================

export const ReviewStatusEnum = z.enum(['pending', 'approved', 'rejected']);
export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

export const ReviewSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  productTitle: z.string().min(1),
  customerUid: z.string().min(1),
  customerName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2, 'Review title must be at least 2 characters'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters'),
  verifiedPurchase: z.boolean().default(false),
  status: ReviewStatusEnum.default('pending'),
  helpfulVotes: z.number().int().nonnegative().default(0),
  moderatedByUid: z.string().optional(),
  moderatedAt: z.number().optional(),
  moderationReason: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Review = z.infer<typeof ReviewSchema>;
