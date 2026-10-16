import 'server-only';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { Permission, UserAccessRecord, UserRole } from './roles';

export interface VerifiedSession {
  uid: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  status: 'active' | 'disabled' | 'suspended';
}

/**
 * Verifies a Firebase ID token and fetches authoritative role/permission
 * metadata from the canonical Firestore `userAccess/{uid}` document.
 */
export async function verifyServerSession(idToken: string): Promise<VerifiedSession> {
  if (!idToken) {
    throw new Error('Authentication required: Missing ID token');
  }

  // 1. Verify token with Firebase Admin
  const decodedToken = await adminAuth.verifyIdToken(idToken, true);
  const uid = decodedToken.uid;
  const email = decodedToken.email;

  // 2. Fetch server-authoritative userAccess record from Firestore
  const accessDoc = await adminDb.collection('userAccess').doc(uid).get();

  if (!accessDoc.exists) {
    // Default to customer role if no explicit staff access record exists
    return {
      uid,
      email,
      role: 'customer',
      permissions: [],
      status: 'active',
    };
  }

  const accessData = accessDoc.data() as UserAccessRecord;

  // 3. Check if account is active
  if (accessData.status !== 'active') {
    throw new Error(`Account is ${accessData.status}: Access denied`);
  }

  return {
    uid,
    email,
    role: accessData.role,
    permissions: accessData.permissions || [],
    status: accessData.status,
  };
}

/**
 * Asserts that the authenticated user possesses a specific permission.
 */
export function assertPermission(session: VerifiedSession, requiredPermission: Permission): void {
  if (session.role === 'owner') return; // Owner has superuser authority

  if (!session.permissions.includes(requiredPermission)) {
    throw new Error(`Forbidden: Missing required permission [${requiredPermission}]`);
  }
}

/**
 * Asserts that the user is an active staff member (not a customer).
 */
export function assertStaff(session: VerifiedSession): void {
  if (session.role === 'customer') {
    throw new Error('Forbidden: Staff access required');
  }
}
