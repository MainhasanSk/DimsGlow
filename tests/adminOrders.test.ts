import { describe, it, expect } from 'vitest';
import { hasPermission } from '../lib/auth/roles';

describe('Phase 8 Admin Orders State Machine & Permissions', () => {
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['packing', 'cancelled'],
    packing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  function validateTransition(from: string, to: string) {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(`Invalid status transition from "${from}" to "${to}"`);
    }
    return true;
  }

  it('permits valid linear progression (placed -> confirmed -> packing -> shipped -> delivered)', () => {
    expect(validateTransition('placed', 'confirmed')).toBe(true);
    expect(validateTransition('confirmed', 'packing')).toBe(true);
    expect(validateTransition('packing', 'shipped')).toBe(true);
    expect(validateTransition('shipped', 'delivered')).toBe(true);
  });

  it('permits cancellation from pre-shipment states only', () => {
    expect(validateTransition('placed', 'cancelled')).toBe(true);
    expect(validateTransition('confirmed', 'cancelled')).toBe(true);
    expect(validateTransition('packing', 'cancelled')).toBe(true);
  });

  it('rejects jumping steps directly or cancelling terminal states', () => {
    expect(() => validateTransition('placed', 'shipped')).toThrow();
    expect(() => validateTransition('placed', 'delivered')).toThrow();
    expect(() => validateTransition('shipped', 'cancelled')).toThrow();
    expect(() => validateTransition('delivered', 'cancelled')).toThrow();
    expect(() => validateTransition('cancelled', 'confirmed')).toThrow();
  });

  it('enforces RBAC permissions for orders:manage', () => {
    expect(hasPermission('owner', 'orders:manage')).toBe(true);
    expect(hasPermission('admin', 'orders:manage')).toBe(true);
    expect(hasPermission('order_manager', 'orders:manage')).toBe(true);
    expect(hasPermission('analyst_readonly', 'orders:manage')).toBe(false);
    expect(hasPermission('customer', 'orders:manage')).toBe(false);
  });
});
