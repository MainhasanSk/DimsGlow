import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { recordManualRefund } from '@/lib/payments/paymentService';
import { hasPermission } from '@/lib/auth/roles';

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

    if (session.role === 'customer' || !hasPermission(session.role, 'finance:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    const updatedOrder = await recordManualRefund({
      orderId,
      amountPaise: body.amountPaise,
      reason: body.reason,
      creditNoteReference: body.creditNoteReference,
      notes: body.notes,
      actorUid: session.uid,
      actorRole: session.role,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Error recording refund:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record refund' },
      { status: 400 }
    );
  }
}
