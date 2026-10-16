import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { receivePurchaseOrder } from '@/lib/operations/purchaseService';
import { hasPermission } from '@/lib/auth/roles';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'inventory:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const receivedPo = await receivePurchaseOrder(
      {
        poId: id,
        receivedItems: body.receivedItems,
        note: body.note,
      },
      session.uid,
      session.role
    );

    return NextResponse.json({
      success: true,
      purchaseOrder: receivedPo,
      message: `Purchase order ${receivedPo.poNumber} successfully received and inventory restocked.`,
    });
  } catch (error: any) {
    console.error('Error receiving purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to receive purchase order' },
      { status: 500 }
    );
  }
}
