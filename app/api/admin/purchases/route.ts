import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { listPurchaseOrders, createPurchaseOrder } from '@/lib/operations/purchaseService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'inventory:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const purchaseOrders = await listPurchaseOrders(status);
    return NextResponse.json({ success: true, purchaseOrders });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'inventory:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const po = await createPurchaseOrder(body, session.uid, session.role);

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
