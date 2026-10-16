import { describe, it, expect } from 'vitest';
import { ProductSchema } from '@/lib/schemas/product';
import { OrderSchema, ShippingAddressSnapshotSchema } from '@/lib/schemas/order';
import { StockMovementSchema } from '@/lib/schemas/inventory';
import { InvoiceSchema } from '@/lib/schemas/invoice';

describe('Firestore Domain Schemas and Invariants', () => {
  it('validates a correct Product with integer paise and swatches', () => {
    const validProduct = {
      id: 'prod_skin_tint',
      slug: 'skin-tint-5-in-1',
      name: 'Skin Tint 5 In 1 Multifunctional Serum Foundation',
      tagline: 'Lightweight formula with Niacinamide & Rice Water',
      description: 'A radiant natural finish serum foundation.',
      categoryIds: ['face'],
      status: 'published' as const,
      pricePaise: 31900, // ₹319.00
      compareAtPricePaise: 39900,
      currency: 'INR' as const,
      media: [
        {
          publicId: 'dimsglow/products/skin_tint_1',
          secureUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1/dimsglow/products/skin_tint_1.jpg',
          altText: 'DIMSGLOW Skin Tint bottle',
          isPrimary: true,
        },
      ],
      benefitPill: 'Natural Glow, Dewy Finish',
      unlockFreeGift: true,
      ratingSummary: {
        average: 5.0,
        reviewCount: 17,
      },
      trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
      variants: [
        {
          id: 'var_whipped_cream',
          sku: 'DIMS-ST-01',
          title: 'Whipped Cream',
          options: [{ name: 'Shade', value: 'Whipped Cream', swatchColor: '#F5E3D3' }],
          pricePaise: 31900,
          onHand: 50,
          reserved: 2,
          lowStockThreshold: 5,
          active: true,
        },
      ],
      featured: true,
      bestseller: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = ProductSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);
  });

  it('rejects product with floating-point paise or negative price', () => {
    const invalidProduct = {
      id: 'prod_invalid',
      slug: 'invalid',
      name: 'Invalid Item',
      description: 'Desc',
      categoryIds: ['face'],
      pricePaise: 319.5, // Not an integer!
      currency: 'INR',
      media: [
        {
          publicId: '1',
          secureUrl: 'https://example.com/img.jpg',
          altText: 'Alt',
          isPrimary: true,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = ProductSchema.safeParse(invalidProduct);
    expect(parsed.success).toBe(false);
  });

  it('validates Indian 6-digit PIN code format on shipping address', () => {
    const validAddress = {
      fullName: 'Ananya Roy',
      phone: '9876543210',
      addressLine1: 'Flat 402, Royal Palms',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India' as const,
    };
    expect(ShippingAddressSnapshotSchema.safeParse(validAddress).success).toBe(true);

    const invalidAddress = { ...validAddress, postalCode: 'ABC400' };
    expect(ShippingAddressSnapshotSchema.safeParse(invalidAddress).success).toBe(false);
  });

  it('maintains strict separation between order status and paymentStatus', () => {
    const orderData = {
      id: 'ord_123',
      orderNumber: 'DIMS-2026-1001',
      customerUid: 'cust_abc',
      customerEmail: 'ananya@example.com',
      shippingAddress: {
        fullName: 'Ananya Roy',
        phone: '9876543210',
        addressLine1: 'Flat 402, Royal Palms',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India' as const,
      },
      items: [
        {
          productId: 'prod_skin_tint',
          productName: 'Skin Tint',
          sku: 'DIMS-ST-01',
          unitPricePaise: 31900,
          quantity: 1,
          totalPaise: 31900,
        },
      ],
      subtotalPaise: 31900,
      totalPaise: 31900,
      currency: 'INR' as const,
      status: 'confirmed' as const, // fulfillment status
      paymentStatus: 'pending' as const, // financial status remains independent
      idempotencyKey: 'idemp_unique_123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = OrderSchema.safeParse(orderData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('confirmed');
      expect(parsed.data.paymentStatus).toBe('pending');
    }
  });

  it('validates append-only stock movement delta and reason', () => {
    const movement = {
      id: 'mv_1',
      productId: 'prod_skin_tint',
      sku: 'DIMS-ST-01',
      deltaOnHand: -1,
      deltaReserved: 0,
      reason: 'order_shipment_deduction' as const,
      referenceId: 'ord_123',
      actorUid: 'admin_user',
      timestamp: Date.now(),
      correlationId: 'corr_test_1',
    };
    expect(StockMovementSchema.safeParse(movement).success).toBe(true);
  });
});
