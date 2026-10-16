import { z } from 'zod';

export const StockMovementReasonEnum = z.enum([
  'order_reservation',
  'order_cancellation_release',
  'order_shipment_deduction',
  'purchase_order_receipt',
  'manual_adjustment',
  'authorized_return_restock',
]);

export const StockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  sku: z.string().min(1),
  deltaOnHand: z.number().int(), // e.g. -1, +50
  deltaReserved: z.number().int(), // e.g. +1, -1
  reason: StockMovementReasonEnum,
  referenceId: z.string(), // e.g. orderId or purchaseOrderId
  note: z.string().optional(),
  actorUid: z.string(),
  timestamp: z.number(),
  correlationId: z.string(),
});

export type StockMovement = z.infer<typeof StockMovementSchema>;
export type StockMovementReason = z.infer<typeof StockMovementReasonEnum>;
