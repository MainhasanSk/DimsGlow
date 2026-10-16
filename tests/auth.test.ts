import { describe, it, expect } from 'vitest';
import {
  ROLE_DEFAULT_PERMISSIONS,
  type StaffRole,
} from '@/lib/auth/roles';
import {
  assertPermission,
  assertStaff,
  type VerifiedSession,
} from '@/lib/auth/serverAuth';

describe('RBAC Roles and Permission Verification', () => {
  it('confirms owner has all core management permissions', () => {
    const ownerPermissions = ROLE_DEFAULT_PERMISSIONS.owner;
    expect(ownerPermissions).toContain('orders:manage');
    expect(ownerPermissions).toContain('inventory:manage');
    expect(ownerPermissions).toContain('finance:manage');
    expect(ownerPermissions).toContain('users:manage');
    expect(ownerPermissions).toContain('settings:manage');
  });

  it('restricts order manager from touching users and settings', () => {
    const orderManagerPermissions = ROLE_DEFAULT_PERMISSIONS.order_manager;
    expect(orderManagerPermissions).toContain('orders:manage');
    expect(orderManagerPermissions).not.toContain('users:manage');
    expect(orderManagerPermissions).not.toContain('settings:manage');
  });

  it('allows owner to execute any action even if not explicitly listed', () => {
    const ownerSession: VerifiedSession = {
      uid: 'owner-123',
      role: 'owner',
      permissions: [],
      status: 'active',
    };
    expect(() => assertPermission(ownerSession, 'settings:manage')).not.toThrow();
  });

  it('permits staff member with required permission', () => {
    const financeSession: VerifiedSession = {
      uid: 'fin-1',
      role: 'finance_manager',
      permissions: ['finance:read', 'finance:manage'],
      status: 'active',
    };
    expect(() => assertPermission(financeSession, 'finance:manage')).not.toThrow();
  });

  it('rejects staff member missing required permission', () => {
    const orderSession: VerifiedSession = {
      uid: 'ord-1',
      role: 'order_manager',
      permissions: ['orders:read', 'orders:manage'],
      status: 'active',
    };
    expect(() => assertPermission(orderSession, 'finance:manage')).toThrow(
      /Missing required permission/i
    );
  });

  it('rejects customers from privileged staff boundaries', () => {
    const customerSession: VerifiedSession = {
      uid: 'cust-1',
      role: 'customer',
      permissions: [],
      status: 'active',
    };
    expect(() => assertStaff(customerSession)).toThrow(/Staff access required/i);
  });

  it('allows valid staff roles in assertStaff', () => {
    const staffSession: VerifiedSession = {
      uid: 'staff-1',
      role: 'admin',
      permissions: ['orders:read'],
      status: 'active',
    };
    expect(() => assertStaff(staffSession)).not.toThrow();
  });
});
