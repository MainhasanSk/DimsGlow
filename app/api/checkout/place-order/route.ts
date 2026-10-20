import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { placeOrderTransaction } from '@/lib/checkout/checkoutService';
import { ShippingAddressSnapshotSchema } from '@/lib/schemas/order';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+913614556830';
const CLEAN_ADMIN_WHATSAPP = ADMIN_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize session - user must be authenticated with account profile
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required: You must have an account to place an order.' },
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

    const customerUid = session.uid;
    const customerEmail = session.email || body.shippingAddress.email || 'customer@dimsglow.com';
    const customerName = validatedAddress.fullName;
    const customerPhone = validatedAddress.phone;

    // 3. Execute transactional order creation in database
    const order = await placeOrderTransaction({
      customerUid,
      customerEmail,
      shippingAddress: validatedAddress,
      items: body.items,
      couponCode: body.couponCode,
      includeGiftWrap: Boolean(body.includeGiftWrap),
      orderNote: body.orderNote,
      idempotencyKey: body.idempotencyKey,
    });

    const timestamp = Date.now();

    // 4. Save/update customer details in customer section data (customers/{uid})
    try {
      const customerDocRef = adminDb.collection('customers').doc(customerUid);
      const customerDoc = await customerDocRef.get();

      if (customerDoc.exists) {
        await customerDocRef.update({
          displayName: customerName,
          phone: customerPhone,
          lastOrderAt: timestamp,
          totalOrders: FieldValue.increment(1),
          totalSpendPaise: FieldValue.increment(order.totalPaise),
          updatedAt: timestamp,
        });
      } else {
        await customerDocRef.set({
          uid: customerUid,
          email: customerEmail,
          displayName: customerName,
          phone: customerPhone,
          role: 'customer',
          status: 'active',
          totalOrders: 1,
          totalSpendPaise: order.totalPaise,
          addresses: [validatedAddress],
          firstOrderAt: timestamp,
          lastOrderAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    } catch (custErr) {
      console.warn('Customer profile sync warning:', custErr);
    }

    // 5. Update CRM profile in crmProfiles/{customerUid} so Admin CRM immediately shows this customer
    try {
      const crmDocRef = adminDb.collection('crmProfiles').doc(customerUid);
      const crmDoc = await crmDocRef.get();
      if (!crmDoc.exists) {
        await crmDocRef.set({
          uid: customerUid,
          email: customerEmail,
          displayName: customerName,
          phone: customerPhone,
          tags: ['new_shopper'],
          totalOrders: 1,
          lifetimeValuePaise: order.totalPaise,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else {
        await crmDocRef.update({
          totalOrders: FieldValue.increment(1),
          lifetimeValuePaise: FieldValue.increment(order.totalPaise),
          updatedAt: timestamp,
        });
      }
    } catch (crmErr) {
      console.warn('CRM profile sync warning:', crmErr);
    }

    // 6. Generate WhatsApp notification for Admin WhatsApp number (+913614556830)
    const itemsSummary = order.items
      .map(
        (it) =>
          `• ${it.quantity}x ${it.productName}${it.variantTitle ? ` (${it.variantTitle})` : ''} - ₹${(it.totalPaise / 100).toFixed(0)}`
      )
      .join('\n');

    const totalRupees = (order.totalPaise / 100).toFixed(0);
    const orderDate = new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const adminSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const whatsappMessage = [
      `🚨 *NEW ORDER RECEIVED - DIMSGLOW COSMETICS*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 *Order Number:* ${order.orderNumber}`,
      `👤 *Customer Name:* ${customerName}`,
      `📞 *Customer Phone:* ${customerPhone}`,
      `✉️ *Customer Email:* ${customerEmail}`,
      ``,
      `📍 *Delivery Address:*`,
      `${validatedAddress.addressLine1}${validatedAddress.addressLine2 ? `, ${validatedAddress.addressLine2}` : ''}`,
      `${validatedAddress.city}, ${validatedAddress.state} - ${validatedAddress.postalCode}`,
      `Country: India`,
      ``,
      `🛍️ *Ordered Items:*`,
      itemsSummary,
      ``,
      `💰 *Total Amount:* ₹${totalRupees}`,
      `💵 *Payment Method:* Cash on Delivery (COD) / Pending`,
      `🕒 *Order Date:* ${orderDate}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔗 *Manage in Admin Console:*`,
      `${adminSiteUrl}/admin/orders`,
    ].join('\n');

    const adminWhatsappUrl = `https://wa.me/${CLEAN_ADMIN_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;

    return NextResponse.json({
      success: true,
      order,
      adminWhatsappUrl,
      whatsappMessage,
      adminWhatsappNumber: ADMIN_WHATSAPP_NUMBER,
    });
  } catch (err: any) {
    console.error('Error in place-order route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to place order' },
      { status: 400 }
    );
  }
}
