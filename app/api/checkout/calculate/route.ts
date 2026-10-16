import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderTotals } from '@/lib/checkout/checkoutService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const calculation = calculateOrderTotals({
      items: body.items,
      couponCode: body.couponCode,
      includeGiftWrap: body.includeGiftWrap,
    });

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to calculate checkout totals' },
      { status: 400 }
    );
  }
}
