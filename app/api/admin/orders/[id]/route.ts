import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession, assertPermission } from '@/lib/auth/serverAuth';
import { adminDb, hasAdminCredentials } from '@/lib/firebase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/orders/[id]
 * Permanently removes an order record from Firestore with audit logging.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const session = await verifyServerSession(idToken);
      assertPermission(session, 'orders:manage');
    }

    if (hasAdminCredentials && adminDb && typeof adminDb.collection === 'function') {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const snap = await orderRef.get();

      if (snap.exists) {
        const orderData = snap.data();
        await orderRef.delete();

        // Also clean up invoice if linked
        if (orderData?.invoiceId) {
          await adminDb.collection('invoices').doc(orderData.invoiceId).delete().catch(() => {});
        }

        // Log audit event
        await adminDb.collection('auditEvents').add({
          action: 'ORDER_DELETED',
          orderId,
          orderNumber: orderData?.orderNumber,
          timestamp: Date.now(),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order record ${orderId} permanently deleted.`,
    });
  } catch (error: any) {
    console.error('Error deleting order record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete order record' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[id]
 * Fetches an order record from Firestore.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;

    if (hasAdminCredentials && adminDb && typeof adminDb.collection === 'function') {
      const snap = await adminDb.collection('orders').doc(orderId).get();
      if (snap.exists) {
        return NextResponse.json({ success: true, order: snap.data() });
      }
    }

    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching order' },
      { status: 500 }
    );
  }
}
