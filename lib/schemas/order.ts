import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'placed',
  'confirmed',
  'packing',
  'shipped',
  'delivered',
  'cancelled',
]);

export const PaymentStatusEnum = z.enum([
  'pending',
  'paid',
  'partially_refunded',
  'refunded',
  'failed',
]);

export const ShippingAddressSnapshotSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().regex(/^\d{6}$/, 'Postal code must be a 6-digit Indian PIN code'),
  country: z.literal('India').default('India'),
});

export const OrderItemSnapshotSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  variantId: z.string().optional(),
  variantTitle: z.string().optional(),
  sku: z.string(),
  unitPricePaise: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  totalPaise: z.number().int().nonnegative(),
  imageUrl: z.string().optional(),
});

export const CourierTrackingSchema = z.object({
  courierName: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().url().optional(),
  shippedAt: z.number(),
  notes: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(), // e.g. "DIMS-2026-1001"
  customerUid: z.string(),
  customerEmail: z.string().email(),
  shippingAddress: ShippingAddressSnapshotSchema,
  items: z.array(OrderItemSnapshotSchema).min(1),
  subtotalPaise: z.number().int().nonnegative(),
  discountPaise: z.number().int().nonnegative().default(0),
  shippingFeePaise: z.number().int().nonnegative().default(0),
  taxPaise: z.number().int().nonnegative().default(0),
  totalPaise: z.number().int().nonnegative(),
  currency: z.literal('INR').default('INR'),
  status: OrderStatusEnum.default('placed'),
  paymentStatus: PaymentStatusEnum.default('pending'),
  paymentMethod: z.string().optional().default('cod'),
  invoiceId: z.string().optional(),
  courier: CourierTrackingSchema.optional(),
  cancellationReason: z.string().optional(),
  idempotencyKey: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const OrderEventSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  type: z.enum([
    'order_placed',
    'order_confirmed',
    'order_packing',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'payment_recorded',
    'refund_recorded',
    'invoice_generated',
    'invoice_voided',
  ]),
  fromStatus: OrderStatusEnum.optional(),
  toStatus: OrderStatusEnum.optional(),
  actorUid: z.string(),
  actorRole: z.string(),
  note: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.number(),
  correlationId: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>;
export type ShippingAddressSnapshot = z.infer<typeof ShippingAddressSnapshotSchema>;
export type CourierTracking = z.infer<typeof CourierTrackingSchema>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
export type OrderEvent = z.infer<typeof OrderEventSchema>;
