import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { Supplier, SupplierSchema } from '@/lib/schemas/operations';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';

export async function createSupplier(
  data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>,
  actorUid: string,
  actorRole: UserRole
): Promise<Supplier> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'inventory:manage')) {
    throw new Error('Forbidden: Insufficient permissions to manage suppliers');
  }

  const supplierRef = adminDb.collection('suppliers').doc();
  const timestamp = Date.now();

  const validated = SupplierSchema.parse({
    ...data,
    id: supplierRef.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await supplierRef.set(validated);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'supplier_created',
    targetType: 'suppliers',
    targetId: validated.id,
    afterSummary: {
      name: validated.name,
      contactPerson: validated.contactPerson,
      email: validated.email,
    },
  });

  return validated;
}

export async function updateSupplier(
  id: string,
  updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>,
  actorUid: string,
  actorRole: UserRole
): Promise<Supplier> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'inventory:manage')) {
    throw new Error('Forbidden: Insufficient permissions to manage suppliers');
  }

  const supplierRef = adminDb.collection('suppliers').doc(id);
  const snap = await supplierRef.get();
  if (!snap.exists) {
    throw new Error(`Supplier not found: ${id}`);
  }

  const existing = snap.data() as Supplier;
  const timestamp = Date.now();

  const merged = SupplierSchema.parse({
    ...existing,
    ...updates,
    updatedAt: timestamp,
  });

  await supplierRef.set(merged);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'supplier_updated',
    targetType: 'suppliers',
    targetId: id,
    afterSummary: {
      name: merged.name,
      status: merged.status,
    },
  });

  return merged;
}

export async function listSuppliers(status?: 'active' | 'inactive'): Promise<Supplier[]> {
  let query = adminDb.collection('suppliers').orderBy('name', 'asc');
  if (status) {
    query = query.where('status', '==', status) as any;
  }

  const snapshot = await query.get();
  const suppliers: Supplier[] = [];
  snapshot.forEach((doc) => suppliers.push(doc.data() as Supplier));
  return suppliers;
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const doc = await adminDb.collection('suppliers').doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Supplier;
}
