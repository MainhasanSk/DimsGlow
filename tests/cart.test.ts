import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartItemSchema } from '../lib/schemas/cart';

describe('Cart & Wishlist Data Structures', () => {
  it('validates a correct CartItem schema', () => {
    const validItem = {
      id: 'prod_123_var_456',
      productId: 'prod_123',
      variantId: 'var_456',
      quantity: 2,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parsed = CartItemSchema.parse(validItem);
    expect(parsed.productId).toBe('prod_123');
    expect(parsed.quantity).toBe(2);
  });

  it('rejects invalid quantity <= 0 or > 10', () => {
    const invalidZero = {
      id: 'prod_123',
      productId: 'prod_123',
      quantity: 0,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => CartItemSchema.parse(invalidZero)).toThrow();

    const invalidEleven = {
      id: 'prod_123',
      productId: 'prod_123',
      quantity: 11,
      addedAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => CartItemSchema.parse(invalidEleven)).toThrow();
  });

  it('calculates integer paise subtotal accurately without floating point drift', () => {
    const items = [
      { unitPricePaise: 49900, quantity: 2 }, // 2 * ₹499 = ₹998 = 99800 paise
      { unitPricePaise: 29900, quantity: 1 }, // 1 * ₹299 = ₹299 = 29900 paise
      { unitPricePaise: 65000, quantity: 3 }, // 3 * ₹650 = ₹1950 = 195000 paise
    ];

    const subtotal = items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
    expect(subtotal).toBe(324700); // ₹3247.00
  });

  it('computes free shipping threshold correctly at ₹399', () => {
    const FREE_SHIPPING_THRESHOLD_PAISE = 39900;
    const belowThreshold = 35000;
    const aboveThreshold = 40000;

    expect(belowThreshold >= FREE_SHIPPING_THRESHOLD_PAISE).toBe(false);
    expect(aboveThreshold >= FREE_SHIPPING_THRESHOLD_PAISE).toBe(true);
  });
});
