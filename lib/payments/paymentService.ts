import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Order, PaymentStatus } from '@/lib/schemas/order';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';
import { voidOrderInvoice } from '@/lib/invoices/invoiceService';

export interface RecordPaymentInput {
  orderId: string;
  amountPaise: number;
  paymentMethod: 'cash_on_delivery' | 'upi_manual' | 'bank_transfer' | 'other';
  referenceNumber?: string;
  notes?: string;
  actorUid: string;
  actorRole: UserRole;
}

export interface RecordRefundInput {
  orderId: string;
  amountPaise: number;
  reason: string;
  creditNoteReference?: string;
  notes?: string;
  actorUid: string;
  actorRole: UserRole;
}

/**
 * Records a manual payment reconciliation entry on an order.
 * No online gateway code is executed; updates financial paymentStatus and audit log.
 */
export async function recordManualPayment(input: RecordPaymentInput): Promise<Order> {
  const { orderId, amountPaise, paymentMethod, referenceNumber, notes, actorUid, actorRole } = input;

  if (actorRole === 'customer' || !hasPermission(actorRole, 'finance:manage')) {
    throw new Error('Forbidden: Insufficient permissions to record payment transactions');
  }

  if (amountPaise <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const orderRef = adminDb.collection('orders').doc(orderId);
  const timestamp = Date.now();
  let updatedOrder: Order | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const order = orderDoc.data() as Order;

    if (order.paymentStatus === 'paid') {
      throw new Error('Order is already marked as fully paid');
    }

    if (order.status === 'cancelled') {
      throw new Error('Cannot record payment for a cancelled order');
    }

    // Determine target payment status
    const newPaymentStatus: PaymentStatus = 'paid';

    const updates: Partial<Order> = {
      paymentStatus: newPaymentStatus,
      updatedAt: timestamp,
    };

    transaction.update(orderRef, updates);

    // Append order lifecycle event
    const eventRef = orderRef.collection('events').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      orderId,
      type: 'payment_recorded',
      actorUid,
      actorRole,
      note: notes || `Payment recorded via ${paymentMethod} (${referenceNumber || 'COD'})`,
      metadata: {
        amountPaise,
        paymentMethod,
        referenceNumber,
      },
      timestamp,
      correlationId: eventRef.id,
    });

    updatedOrder = {
      ...order,
      ...updates,
    };
  });

  if (!updatedOrder) {
    throw new Error('Failed to update order payment status');
  }

  // Audit log
  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'payment_recorded',
    targetType: 'orders',
    targetId: orderId,
    reason: notes || `Manual payment of ${amountPaise / 100} INR recorded`,
    afterSummary: {
      paymentStatus: 'paid',
      amountPaise,
      paymentMethod,
      referenceNumber,
    },
  });

  return updatedOrder as Order;
}

/**
 * Records a refund, updates payment status, voids invoice, and logs credit note reference
 */
export async function recordManualRefund(input: RecordRefundInput): Promise<Order> {
  const { orderId, amountPaise, reason, creditNoteReference, notes, actorUid, actorRole } = input;

  if (actorRole === 'customer' || !hasPermission(actorRole, 'finance:manage')) {
    throw new Error('Forbidden: Insufficient permissions to issue refunds');
  }

  if (amountPaise <= 0) {
    throw new Error('Refund amount must be greater than zero');
  }

  if (!reason.trim()) {
    throw new Error('A reason is required to record a refund');
  }

  const orderRef = adminDb.collection('orders').doc(orderId);
  const timestamp = Date.now();
  let updatedOrder: Order | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const order = orderDoc.data() as Order;

    if (order.paymentStatus === 'refunded') {
      throw new Error('Order has already been refunded in full');
    }

    // Determine target payment status
    const isFullRefund = amountPaise >= order.totalPaise;
    const newPaymentStatus: PaymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';

    const updates: Partial<Order> = {
      paymentStatus: newPaymentStatus,
      updatedAt: timestamp,
    };

    transaction.update(orderRef, updates);

    // Append order lifecycle event
    const eventRef = orderRef.collection('events').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      orderId,
      type: 'refund_recorded',
      actorUid,
      actorRole,
      note: `Refund of Rs. ${amountPaise / 100} recorded: ${reason.trim()}`,
      metadata: {
        amountPaise,
        reason,
        creditNoteReference,
        notes,
      },
      timestamp,
      correlationId: eventRef.id,
    });

    updatedOrder = {
      ...order,
      ...updates,
    };
  });

  if (!updatedOrder) {
    throw new Error('Failed to record refund on order');
  }

  // Void invoice and attach credit note reference
  await voidOrderInvoice(
    orderId,
    `Refund recorded: ${reason.trim()}`,
    creditNoteReference || `CRN-${orderId.slice(-6).toUpperCase()}`,
    actorUid,
    actorRole
  );

  // Audit log
  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'refund_recorded',
    targetType: 'orders',
    targetId: orderId,
    reason,
    afterSummary: {
      paymentStatus: (updatedOrder as Order).paymentStatus,
      amountPaise,
      creditNoteReference,
    },
  });

  return updatedOrder as Order;
}
