import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Invoice } from '@/lib/schemas/invoice';
import type { Order } from '@/lib/schemas/order';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';

export interface InvoiceEligibilityResult {
  eligible: boolean;
  status:
    | 'eligible'
    | 'not_confirmed'
    | 'cancelled'
    | 'refunded'
    | 'voided'
    | 'not_found'
    | 'forbidden';
  reason: string;
  invoice?: Invoice;
  order?: Order;
}

/**
 * Idempotently allocates and snapshots an immutable tax invoice upon order confirmation
 */
export async function generateOrderInvoiceSnapshot(
  order: Order,
  actorUid: string,
  actorRole: string
): Promise<Invoice> {
  const invoiceId = order.invoiceId || `inv_${order.id}`;
  const invoiceRef = adminDb.collection('invoices').doc(invoiceId);

  // 1. Check if invoice already exists
  const existingDoc = await invoiceRef.get();
  if (existingDoc.exists) {
    return existingDoc.data() as Invoice;
  }

  const timestamp = Date.now();
  const year = new Date(order.createdAt).getFullYear();
  // Clean order number suffix for invoice number
  const cleanOrderNum = order.orderNumber.replace(/[^0-9]/g, '') || `${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceNumber = `INV-${year}-${cleanOrderNum}`;

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerUid: order.customerUid,
    status: 'active',
    issueDate: timestamp,
    seller: {
      legalName: 'DIMSGLOW COSMETICS PRIVATE LIMITED',
      address: 'G.S. Road, Christian Basti, Guwahati, Assam, India - 781005',
      state: 'Assam',
      stateCode: '18',
      contactPhone: '+913614556830',
      contactEmail: 'support@dimsglow.com',
    },
    buyer: order.shippingAddress,
    lineItems: order.items,
    subtotalPaise: order.subtotalPaise,
    discountPaise: order.discountPaise || 0,
    taxPaise: order.taxPaise || 0,
    shippingFeePaise: order.shippingFeePaise || 0,
    totalPaise: order.totalPaise,
    currency: 'INR',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // 2. Persist invoice document
  await invoiceRef.set(invoice);

  // 3. Link invoiceId back to order if missing
  const orderRef = adminDb.collection('orders').doc(order.id);
  await orderRef.update({
    invoiceId,
    updatedAt: timestamp,
  });

  // 4. Append lifecycle event to order
  const eventRef = orderRef.collection('events').doc();
  await eventRef.set({
    id: eventRef.id,
    orderId: order.id,
    type: 'invoice_generated',
    actorUid,
    actorRole,
    note: `Tax invoice ${invoiceNumber} generated and archived`,
    metadata: { invoiceId, invoiceNumber },
    timestamp,
    correlationId: invoiceId,
  });

  // 5. Audit log
  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'invoice_generated',
    targetType: 'invoices',
    targetId: invoiceId,
    reason: `Invoice generated for confirmed order ${order.orderNumber}`,
    afterSummary: {
      invoiceNumber,
      orderId: order.id,
      totalPaise: order.totalPaise,
    },
  });

  return invoice;
}

/**
 * Checks if a user is currently eligible to download a tax invoice.
 * Re-evaluates live order status, cancellation, and refund state on every request.
 */
export async function checkInvoiceEligibility(
  orderId: string,
  userSession: { uid: string; role: UserRole }
): Promise<InvoiceEligibilityResult> {
  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    return {
      eligible: false,
      status: 'not_found',
      reason: 'Order could not be located in records.',
    };
  }

  const order = orderDoc.data() as Order;

  // Verify access: Customer can only access own orders; staff requires orders:read or finance:read
  const isOwner = order.customerUid === userSession.uid;
  const isAuthorizedStaff =
    userSession.role !== 'customer' &&
    (hasPermission(userSession.role, 'orders:read') || hasPermission(userSession.role, 'finance:read'));

  if (!isOwner && !isAuthorizedStaff) {
    return {
      eligible: false,
      status: 'forbidden',
      reason: 'Access denied: You do not have permission to view or download this invoice.',
    };
  }

  // Check order lifecycle eligibility
  if (order.status === 'placed') {
    return {
      eligible: false,
      status: 'not_confirmed',
      reason: 'Tax invoices are issued once the order is confirmed by our operations team.',
      order,
    };
  }

  if (order.status === 'cancelled') {
    return {
      eligible: false,
      status: 'cancelled',
      reason: `Invoice is voided because the order was cancelled${
        order.cancellationReason ? ` (${order.cancellationReason})` : ''
      }.`,
      order,
    };
  }

  if (order.paymentStatus === 'refunded') {
    return {
      eligible: false,
      status: 'refunded',
      reason: 'Invoice is voided because the order has been refunded in full.',
      order,
    };
  }

  // Fetch invoice record
  const invoiceId = order.invoiceId || `inv_${order.id}`;
  const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();

  if (!invoiceDoc.exists) {
    // If order is confirmed/packing/shipped/delivered but invoice wasn't snapshotted yet, generate it now
    const generatedInvoice = await generateOrderInvoiceSnapshot(
      order,
      userSession.uid,
      userSession.role
    );
    return {
      eligible: true,
      status: 'eligible',
      reason: 'Invoice eligible for download.',
      invoice: generatedInvoice,
      order,
    };
  }

  const invoice = invoiceDoc.data() as Invoice;

  if (invoice.status === 'voided') {
    return {
      eligible: false,
      status: 'voided',
      reason: `This invoice has been voided per GST compliance rules${
        invoice.voidReason ? `: ${invoice.voidReason}` : '.'
      }`,
      invoice,
      order,
    };
  }

  return {
    eligible: true,
    status: 'eligible',
    reason: 'Invoice eligible for download.',
    invoice,
    order,
  };
}

/**
 * Marks an invoice as voided and records reason and credit note references.
 * Preserves immutable audit history without hard-deleting records.
 */
export async function voidOrderInvoice(
  orderId: string,
  voidReason: string,
  creditNoteRef?: string,
  actorUid?: string,
  actorRole?: string
): Promise<Invoice | null> {
  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) return null;
  const order = orderDoc.data() as Order;

  const invoiceId = order.invoiceId || `inv_${order.id}`;
  const invoiceRef = adminDb.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) return null;

  const timestamp = Date.now();
  const updates: Partial<Invoice> = {
    status: 'voided',
    voidReason: voidReason.trim(),
    creditNoteReference: creditNoteRef?.trim() || undefined,
    updatedAt: timestamp,
  };

  await invoiceRef.update(updates);

  // Append order event
  const eventRef = orderRef.collection('events').doc();
  await eventRef.set({
    id: eventRef.id,
    orderId,
    type: 'invoice_voided',
    actorUid: actorUid || 'system',
    actorRole: actorRole || 'system',
    note: `Invoice marked voided: ${voidReason.trim()}`,
    metadata: { voidReason, creditNoteRef },
    timestamp,
    correlationId: invoiceId,
  });

  // Audit log
  if (actorUid) {
    await logAuditEvent({
      actorUid,
      actorRole: (actorRole as UserRole) || 'admin',
      action: 'invoice_voided',
      targetType: 'invoices',
      targetId: invoiceId,
      reason: voidReason,
      afterSummary: {
        status: 'voided',
        creditNoteReference: creditNoteRef,
      },
    });
  }

  const updated = (await invoiceRef.get()).data() as Invoice;
  return updated;
}

/**
 * Fetches all invoices newest-first with optional filtering
 */
export async function fetchAdminInvoices(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<Invoice[]> {
  const queryLimit = options?.limit || 50;
  let q = adminDb.collection('invoices').orderBy('issueDate', 'desc').limit(queryLimit);

  if (options?.status && (options.status === 'active' || options.status === 'voided')) {
    q = adminDb
      .collection('invoices')
      .where('status', '==', options.status)
      .orderBy('issueDate', 'desc')
      .limit(queryLimit);
  }

  const snapshot = await q.get();
  let invoices = snapshot.docs.map((doc) => doc.data() as Invoice);

  if (options?.search?.trim()) {
    const s = options.search.trim().toLowerCase();
    invoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(s) ||
        inv.orderNumber.toLowerCase().includes(s) ||
        inv.buyer.fullName.toLowerCase().includes(s)
    );
  }

  return invoices;
}
