import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import type { Order } from '@/lib/schemas/order';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    // Query customer's orders from Firestore admin
    const ordersMap = new Map<string, Order>();

    // Query by customerUid
    const uidSnap = await adminDb
      .collection('orders')
      .where('customerUid', '==', session.uid)
      .get();

    uidSnap.forEach((doc) => {
      ordersMap.set(doc.id, doc.data() as Order);
    });

    // Query by customerEmail as fallback
    if (session.email) {
      const emailSnap = await adminDb
        .collection('orders')
        .where('customerEmail', '==', session.email)
        .get();

      emailSnap.forEach((doc) => {
        ordersMap.set(doc.id, doc.data() as Order);
      });
    }

    const orders = Array.from(ordersMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (err: any) {
    console.error('Error in customer orders GET API:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
