import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { Order } from '@/lib/schemas/order';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderQuery, contact } = body;

    if (!orderQuery || !contact) {
      return NextResponse.json(
        { success: false, error: 'Please provide both your Order ID and Phone Number / Email.' },
        { status: 400 }
      );
    }

    const cleanQuery = orderQuery.trim().toUpperCase();
    const cleanContact = contact.trim().toLowerCase().replace(/\s+/g, '');

    // Search orders collection
    const snap = await adminDb.collection('orders').get();
    let foundOrder: Order | null = null;

    snap.forEach((doc) => {
      const data = doc.data() as Order;
      const matchesOrder =
        (data.orderNumber && data.orderNumber.toUpperCase() === cleanQuery) ||
        doc.id.toUpperCase() === cleanQuery ||
        (data.orderNumber && data.orderNumber.toUpperCase().endsWith(cleanQuery));

      if (matchesOrder) {
        const emailMatch = data.customerEmail && data.customerEmail.toLowerCase() === cleanContact;
        const rawPhone = (data.shippingAddress?.phone || '').replace(/\D/g, '');
        const queryDigits = cleanContact.replace(/\D/g, '');
        const phoneMatch = queryDigits.length >= 6 && rawPhone.includes(queryDigits);

        if (emailMatch || phoneMatch) {
          foundOrder = data;
        }
      }
    });

    if (!foundOrder) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No matching order found. Please verify your Order Number (e.g., ORD-20261021-0001) and associated phone or email.',
        },
        { status: 404 }
      );
    }

    const order = foundOrder as Order;

    // Redacted safe response for public tracking
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        totalPaise: order.totalPaise,
        courier: order.courier || null,
        shippingAddress: {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          fullName: order.shippingAddress.fullName,
        },
        items: order.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          unitPricePaise: i.unitPricePaise,
          imageUrl: i.imageUrl || null,
        })),
      },
    });
  } catch (err: any) {
    console.error('Error in track order API:', err);
    return NextResponse.json(
      { success: false, error: 'Internal tracking error. Please try again.' },
      { status: 500 }
    );
  }
}
