import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { transitionOrderStatus } from '@/lib/orders/orderService';
import { OrderStatusEnum } from '@/lib/schemas/order';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    const body = await req.json();
    const toStatus = OrderStatusEnum.parse(body.status);

    const updatedOrder = await transitionOrderStatus({
      orderId,
      toStatus,
      actorUid: session.uid,
      actorRole: session.role,
      courierData: body.courierData,
      cancellationReason: body.cancellationReason,
      note: body.note,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update order status' },
      { status: 400 }
    );
  }
}
