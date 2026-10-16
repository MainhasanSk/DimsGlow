export type StaffRole =
  | 'owner'
  | 'admin'
  | 'order_manager'
  | 'inventory_manager'
  | 'finance_manager'
  | 'support_manager'
  | 'analyst_readonly';

export type UserRole = StaffRole | 'customer';

export type Permission =
  | 'orders:read'
  | 'orders:manage'
  | 'inventory:read'
  | 'inventory:manage'
  | 'finance:read'
  | 'finance:manage'
  | 'catalog:read'
  | 'catalog:manage'
  | 'crm:read'
  | 'crm:manage'
  | 'reviews:moderate'
  | 'reports:read'
  | 'reports:export'
  | 'users:manage'
  | 'settings:manage';

export const ROLE_DEFAULT_PERMISSIONS: Record<StaffRole, Permission[]> = {
  owner: [
    'orders:read',
    'orders:manage',
    'inventory:read',
    'inventory:manage',
    'finance:read',
    'finance:manage',
    'catalog:read',
    'catalog:manage',
    'crm:read',
    'crm:manage',
    'reviews:moderate',
    'reports:read',
    'reports:export',
    'users:manage',
    'settings:manage',
  ],
  admin: [
    'orders:read',
    'orders:manage',
    'inventory:read',
    'inventory:manage',
    'catalog:read',
    'catalog:manage',
    'crm:read',
    'crm:manage',
    'reviews:moderate',
    'reports:read',
    'reports:export',
  ],
  order_manager: ['orders:read', 'orders:manage', 'catalog:read'],
  inventory_manager: ['inventory:read', 'inventory:manage', 'catalog:read', 'catalog:manage'],
  finance_manager: ['finance:read', 'finance:manage', 'orders:read', 'reports:read', 'reports:export'],
  support_manager: ['crm:read', 'crm:manage', 'reviews:moderate', 'orders:read'],
  analyst_readonly: ['reports:read', 'orders:read', 'inventory:read', 'finance:read'],
};

export interface UserAccessRecord {
  uid: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'disabled' | 'suspended';
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}
