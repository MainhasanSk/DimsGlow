import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { placeOrderTransaction } from '@/lib/checkout/checkoutService';
import { ShippingAddressSnapshotSchema } from '@/lib/schemas/order';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to place an order' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    // 2. Parse and validate body
    const body = await req.json();

    if (!body.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Validate shipping address snapshot
    const validatedAddress = ShippingAddressSnapshotSchema.parse(body.shippingAddress);

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.idempotencyKey) {
      return NextResponse.json(
        { success: false, error: 'idempotencyKey is required' },
        { status: 400 }
      );
    }

    // 3. Execute transactional order creation
    const order = await placeOrderTransaction({
      customerUid: session.uid,
      customerEmail: session.email || 'customer@dimsglow.com',
      shippingAddress: validatedAddress,
      items: body.items,
      couponCode: body.couponCode,
      includeGiftWrap: Boolean(body.includeGiftWrap),
      orderNote: body.orderNote,
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: any) {
    console.error('Error in place-order route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to place order' },
      { status: 400 }
    );
  }
}
