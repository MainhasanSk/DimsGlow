import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import {
  CrmCustomerProfile,
  CrmCustomerProfileSchema,
  CrmStaffNote,
  CrmStaffNoteSchema,
  CustomerTag,
} from '@/lib/schemas/operations';
import type { Order } from '@/lib/schemas/order';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';

export async function listCrmCustomers(options?: {
  tag?: string;
  search?: string;
  limit?: number;
}): Promise<CrmCustomerProfile[]> {
  // 1. Fetch registered customers from customers collection
  const customerMap = new Map<string, {
    uid: string;
    email: string;
    displayName: string;
    phone?: string;
    orders: Order[];
    tags: CustomerTag[];
  }>();

  try {
    // Try customers collection first
    const customersSnap = await adminDb.collection('customers').get();
    customersSnap.forEach((doc) => {
      const c = doc.data();
      const uid = c.uid || doc.id;
      customerMap.set(uid, {
        uid,
        email: c.email || 'customer@dimsglow.com',
        displayName: c.displayName || c.name || 'Customer',
        phone: c.phone || undefined,
        orders: [],
        tags: ['new_shopper'],
      });
    });
  } catch (custErr) {
    console.warn('CRM customers collection query warning:', custErr);
  }

  // Also check users collection for any registered users not in customers
  try {
    const usersSnap = await adminDb.collection('users').get();
    usersSnap.forEach((doc) => {
      const u = doc.data();
      const uid = u.uid || doc.id;
      if (!customerMap.has(uid)) {
        customerMap.set(uid, {
          uid,
          email: u.email || '',
          displayName: u.displayName || u.name || 'Customer',
          phone: u.phone || u.phoneNumber || undefined,
          orders: [],
          tags: ['new_shopper'],
        });
      }
    });
  } catch (usersErr) {
    console.warn('CRM users collection query warning:', usersErr);
  }

  // 2. Query completed orders and aggregate
  const ordersSnap = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();

  ordersSnap.forEach((doc) => {
    const order = doc.data() as Order;
    const uid = order.customerUid || order.customerEmail;
    if (!customerMap.has(uid)) {
      customerMap.set(uid, {
        uid,
        email: order.customerEmail,
        displayName: order.shippingAddress?.fullName || 'Customer',
        phone: order.shippingAddress?.phone,
        orders: [],
        tags: ['new_shopper'],
      });
    }
    customerMap.get(uid)!.orders.push(order);
  });

  // Fetch custom tags if stored in `crmProfiles`
  const profilesSnap = await adminDb.collection('crmProfiles').get();
  const storedTags = new Map<string, CustomerTag[]>();
  profilesSnap.forEach((d) => {
    const data = d.data();
    if (data.tags) storedTags.set(d.id, data.tags);
  });

  const profiles: CrmCustomerProfile[] = [];

  for (const [uid, cust] of customerMap.entries()) {
    const successfulOrders = cust.orders.filter((o) => o.status !== 'cancelled');
    const totalOrders = successfulOrders.length;
    const lifetimeValuePaise = successfulOrders.reduce((sum, o) => sum + o.totalPaise, 0);
    const averageOrderValuePaise = totalOrders > 0 ? Math.round(lifetimeValuePaise / totalOrders) : 0;

    let tags = storedTags.get(uid) || cust.tags;
    // Auto-tag VIP if lifetime value >= 5000 INR (500000 paise) or >= 3 orders
    if (lifetimeValuePaise >= 500000 || totalOrders >= 3) {
      if (!tags.includes('vip')) {
        tags = [...tags.filter((t) => t !== 'new_shopper'), 'vip', 'repeat_buyer'];
      }
    }

    const sortedOrders = [...cust.orders].sort((a, b) => a.createdAt - b.createdAt);
    const firstOrderDate = sortedOrders[0]?.createdAt;
    const lastOrderDate = sortedOrders[sortedOrders.length - 1]?.createdAt;

    profiles.push({
      uid,
      email: cust.email,
      displayName: cust.displayName,
      phone: cust.phone,
      tags: Array.from(new Set(tags)),
      totalOrders,
      lifetimeValuePaise,
      averageOrderValuePaise,
      firstOrderDate,
      lastOrderDate,
      notesCount: 0,
      createdAt: firstOrderDate || Date.now(),
      updatedAt: lastOrderDate || Date.now(),
    });
  }

  // Sort by lifetime value descending
  profiles.sort((a, b) => b.lifetimeValuePaise - a.lifetimeValuePaise);

  let filtered = profiles;
  if (options?.tag && options.tag !== 'all') {
    filtered = filtered.filter((p) => p.tags.includes(options.tag as CustomerTag));
  }
  if (options?.search) {
    const term = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.displayName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.phone && p.phone.includes(term))
    );
  }

  return filtered.slice(0, options?.limit || 50);
}

export async function addCustomerStaffNote(
  customerUid: string,
  text: string,
  actorUid: string,
  actorName: string,
  actorRole: UserRole
): Promise<CrmStaffNote> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'crm:manage')) {
    throw new Error('Forbidden: Insufficient permissions to add CRM customer notes');
  }

  const noteRef = adminDb.collection('crmProfiles').doc(customerUid).collection('notes').doc();
  const timestamp = Date.now();

  const note = CrmStaffNoteSchema.parse({
    id: noteRef.id,
    customerUid,
    text: text.trim(),
    authorUid: actorUid,
    authorName: actorName,
    authorRole: actorRole,
    createdAt: timestamp,
  });

  await noteRef.set(note);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'crm_note_added',
    targetType: 'crmProfiles',
    targetId: customerUid,
    afterSummary: {
      textSnippet: text.slice(0, 50),
    },
  });

  return note;
}

export async function listCustomerStaffNotes(customerUid: string): Promise<CrmStaffNote[]> {
  const notesSnap = await adminDb
    .collection('crmProfiles')
    .doc(customerUid)
    .collection('notes')
    .orderBy('createdAt', 'desc')
    .get();

  const notes: CrmStaffNote[] = [];
  notesSnap.forEach((d) => notes.push(d.data() as CrmStaffNote));
  return notes;
}

export async function updateCustomerTags(
  customerUid: string,
  tags: CustomerTag[],
  actorUid: string,
  actorRole: UserRole
): Promise<CustomerTag[]> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'crm:manage')) {
    throw new Error('Forbidden: Insufficient permissions to update customer tags');
  }

  const profileRef = adminDb.collection('crmProfiles').doc(customerUid);
  await profileRef.set({ tags, updatedAt: Date.now() }, { merge: true });

  await logAuditEvent({
    actorUid,
    actorRole,
    action: 'crm_tags_updated',
    targetType: 'crmProfiles',
    targetId: customerUid,
    afterSummary: { tags },
  });

  return tags;
}
