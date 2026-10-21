import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Order, OrderStatus, CourierTracking } from '@/lib/schemas/order';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';
import { generateOrderInvoiceSnapshot, voidOrderInvoice } from '@/lib/invoices/invoiceService';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export interface StatusTransitionInput {
  orderId: string;
  toStatus: OrderStatus;
  actorUid: string;
  actorRole: UserRole;
  courierData?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string;
    notes?: string;
  };
  cancellationReason?: string;
  note?: string;
}

export async function transitionOrderStatus(input: StatusTransitionInput): Promise<Order> {
  const { orderId, toStatus, actorUid, actorRole, courierData, cancellationReason, note } = input;

  // 1. Authorize: only staff with orders:manage or owners can update orders
  if (actorRole === 'customer' || !hasPermission(actorRole, 'orders:manage')) {
    throw new Error('Forbidden: Insufficient permissions to modify order status');
  }

  const orderRef = adminDb.collection('orders').doc(orderId);
  const timestamp = Date.now();

  let updatedOrder: Order | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const currentOrder = orderDoc.data() as Order;
    const fromStatus = currentOrder.status;

    // Validate state machine rules
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new Error(
        `Invalid status transition from "${fromStatus}" to "${toStatus}". Allowed: [${allowed.join(', ')}]`
      );
    }

    const updates: Partial<Order> = {
      status: toStatus,
      updatedAt: timestamp,
    };

    // If transitioning to shipped, require courier metadata and update stock
    if (toStatus === 'shipped') {
      if (!courierData?.courierName?.trim() || !courierData?.trackingNumber?.trim()) {
        throw new Error('Courier name and tracking number (AWB) are required to mark order as shipped');
      }

      const courierSnapshot: CourierTracking = {
        courierName: courierData.courierName.trim(),
        trackingNumber: courierData.trackingNumber.trim(),
        trackingUrl: courierData.trackingUrl?.trim() || undefined,
        shippedAt: timestamp,
        notes: courierData.notes?.trim() || undefined,
      };

      updates.courier = courierSnapshot;

      // Deduct from onHand and release reservation for each item in the movement ledger
      for (const item of currentOrder.items) {
        const movementRef = adminDb.collection('stockMovements').doc();
        transaction.set(movementRef, {
          id: movementRef.id,
          productId: item.productId,
          variantId: item.variantId || 'default',
          sku: item.sku,
          type: 'order_shipped',
          quantityDelta: -item.quantity,
          referenceId: orderId,
          referenceType: 'order',
          actorUid,
          reason: `Shipment dispatched via ${courierData.courierName} (AWB: ${courierData.trackingNumber})`,
          createdAt: timestamp,
        });
      }
    }

    // If transitioning to cancelled, release reserved stock
    if (toStatus === 'cancelled') {
      if (!cancellationReason?.trim()) {
        throw new Error('A cancellation reason is required to cancel an order');
      }

      updates.cancellationReason = cancellationReason.trim();

      for (const item of currentOrder.items) {
        const movementRef = adminDb.collection('stockMovements').doc();
        transaction.set(movementRef, {
          id: movementRef.id,
          productId: item.productId,
          variantId: item.variantId || 'default',
          sku: item.sku,
          type: 'order_reservation_released',
          quantityDelta: item.quantity,
          referenceId: orderId,
          referenceType: 'order',
          actorUid,
          reason: `Order cancelled: ${cancellationReason.trim()}`,
          createdAt: timestamp,
        });
      }
    }

    // Commit order update
    transaction.update(orderRef, updates);

    // Append order lifecycle event
    const eventRef = orderRef.collection('events').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      orderId,
      type: `order_${toStatus}`,
      fromStatus,
      toStatus,
      actorUid,
      actorRole,
      note: note || cancellationReason || `Order status updated to ${toStatus}`,
      createdAt: timestamp,
    });

    updatedOrder = {
      ...currentOrder,
      ...updates,
    };
  });

  if (!updatedOrder) {
    throw new Error('Failed to update order');
  }

  // Handle invoice generation on confirmation
  if (toStatus === 'confirmed') {
    try {
      const invoice = await generateOrderInvoiceSnapshot(updatedOrder, actorUid, actorRole);
      (updatedOrder as Order).invoiceId = invoice.id;
    } catch (invErr) {
      console.error('Failed to generate invoice snapshot on confirmation:', invErr);
    }
  }

  // Handle invoice voiding on cancellation
  if (toStatus === 'cancelled') {
    try {
      await voidOrderInvoice(
        orderId,
        cancellationReason || 'Order cancelled by staff',
        undefined,
        actorUid,
        actorRole
      );
    } catch (invErr) {
      console.error('Failed to void invoice on cancellation:', invErr);
    }
  }

  // Audit logging
  await logAuditEvent({
    actorUid,
    actorRole,
    action: `order_status_${toStatus}`,
    targetType: 'orders',
    targetId: orderId,
    reason: note || cancellationReason || `Order status updated to ${toStatus}`,
    afterSummary: {
      status: toStatus,
      orderNumber: (updatedOrder as Order).orderNumber,
      courier: courierData?.courierName,
      cancellationReason,
      invoiceId: (updatedOrder as Order).invoiceId,
    },
  });

  return updatedOrder as Order;
}

export async function fetchAdminOrders(options: {
  status?: string;
  limit?: number;
  search?: string;
}): Promise<Order[]> {
  const maxLimit = options.limit ? Math.max(options.limit, 100) : 100;
  const snap = await adminDb.collection('orders').get();
  let orders: Order[] = [];
  snap.forEach((d) => orders.push(d.data() as Order));

  // Sort descending by createdAt in memory
  orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (options.status && options.status !== 'all') {
    orders = orders.filter((o) => o.status === options.status);
  }

  if (options.search) {
    const term = options.search.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(term)) ||
        (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(term)) ||
        (o.shippingAddress?.phone && o.shippingAddress.phone.includes(term))
    );
  }

  return orders.slice(0, maxLimit);
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const docSnap = await adminDb.collection('orders').doc(orderId).get();
  if (!docSnap.exists) return null;
  return docSnap.data() as Order;
}
