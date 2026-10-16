import { describe, it, expect } from 'vitest';
import { calculateOrderTotals } from '../lib/checkout/checkoutService';
import { OrderSchema, ShippingAddressSnapshotSchema } from '../lib/schemas/order';

describe('Phase 7 Checkout Calculation & Integrity', () => {
  it('correctly calculates subtotal and applies ₹49 shipping when order is below ₹399', () => {
    // 1 item of ₹319 (31900 paise)
    const result = calculateOrderTotals({
      items: [
        {
          productId: 'prod_skin_tint',
          quantity: 1,
        },
      ],
    });

    expect(result.subtotalPaise).toBe(31900);
    expect(result.shippingFeePaise).toBe(4900); // Below threshold
    expect(result.totalPaise).toBe(31900 + 4900); // ₹368.00
    expect(result.currency).toBe('INR');
  });

  it('unlocks free shipping when subtotal reaches or exceeds ₹399', () => {
    // 2 items of ₹319 = ₹638 (63800 paise)
    const result = calculateOrderTotals({
      items: [
        {
          productId: 'prod_skin_tint',
          quantity: 2,
        },
      ],
    });

    expect(result.subtotalPaise).toBe(63800);
    expect(result.shippingFeePaise).toBe(0); // Free shipping unlocked
    expect(result.totalPaise).toBe(63800);
  });

  it('correctly calculates EXTRA5 coupon (5% discount in integer paise)', () => {
    // 2 items of ₹319 = 63800 paise
    const result = calculateOrderTotals({
      items: [
        {
          productId: 'prod_skin_tint',
          quantity: 2,
        },
      ],
      couponCode: 'EXTRA5',
    });

    const expectedDiscount = Math.round((63800 * 5) / 100); // 3190 paise
    expect(result.discountPaise).toBe(expectedDiscount);
    expect(result.appliedCoupon).toBe('EXTRA5');
    expect(result.totalPaise).toBe(63800 - expectedDiscount);
  });

  it('applies gift packaging fee (+₹99) correctly', () => {
    const result = calculateOrderTotals({
      items: [
        {
          productId: 'prod_skin_tint',
          quantity: 1,
        },
      ],
      includeGiftWrap: true,
    });

    expect(result.giftWrapFeePaise).toBe(9900); // ₹99
    expect(result.totalPaise).toBe(31900 + 4900 + 9900); // ₹467.00
  });

  it('validates a complete Order schema snapshot', () => {
    const validAddress = {
      fullName: 'Priya Sharma',
      phone: '9876543210',
      addressLine1: 'Flat 302, Palm Heights',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India' as const,
    };

    const parsedAddr = ShippingAddressSnapshotSchema.parse(validAddress);
    expect(parsedAddr.fullName).toBe('Priya Sharma');

    const validOrder = {
      id: 'ord_123456789',
      orderNumber: 'DG-2026-123456',
      customerUid: 'cust_abc_123',
      customerEmail: 'priya@example.com',
      shippingAddress: parsedAddr,
      items: [
        {
          productId: 'prod_skin_tint_5in1',
          productName: 'Skin Tint 5 in 1 Daily Foundation',
          sku: 'ST-01-FAIR',
          unitPricePaise: 49900,
          quantity: 1,
          totalPaise: 49900,
        },
      ],
      subtotalPaise: 49900,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 0,
      totalPaise: 49900,
      currency: 'INR' as const,
      status: 'placed' as const,
      paymentStatus: 'pending' as const,
      idempotencyKey: 'idem_key_uuid_1234',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsedOrder = OrderSchema.parse(validOrder);
    expect(parsedOrder.status).toBe('placed');
    expect(parsedOrder.paymentStatus).toBe('pending');
  });
});
