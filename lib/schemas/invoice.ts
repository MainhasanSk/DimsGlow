import { z } from 'zod';
import { OrderItemSnapshotSchema, ShippingAddressSnapshotSchema } from './order';

export const InvoiceSellerSnapshotSchema = z.object({
  legalName: z.string().default('DIMSGLOW COSMETICS PRIVATE LIMITED'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().default('Guwahati, Assam, India - 781001'),
  state: z.string().default('Assam'),
  stateCode: z.string().default('18'),
  contactPhone: z.string().default('+913614556830'),
  contactEmail: z.string().default('support@dimsglow.com'),
});

export const InvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(), // e.g. "INV-2026-10001"
  orderId: z.string(),
  orderNumber: z.string(),
  customerUid: z.string(),
  status: z.enum(['active', 'voided']).default('active'),
  issueDate: z.number(),
  seller: InvoiceSellerSnapshotSchema,
  buyer: ShippingAddressSnapshotSchema,
  lineItems: z.array(OrderItemSnapshotSchema),
  subtotalPaise: z.number().int().nonnegative(),
  discountPaise: z.number().int().nonnegative().default(0),
  taxPaise: z.number().int().nonnegative().default(0),
  shippingFeePaise: z.number().int().nonnegative().default(0),
  totalPaise: z.number().int().nonnegative(),
  currency: z.literal('INR').default('INR'),
  voidReason: z.string().optional(),
  creditNoteReference: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceSellerSnapshot = z.infer<typeof InvoiceSellerSnapshotSchema>;
