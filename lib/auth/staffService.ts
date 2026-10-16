import 'server-only';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  ROLE_DEFAULT_PERMISSIONS,
  type Permission,
  type StaffRole,
  type UserAccessRecord,
} from './roles';
import { assertPermission, verifyServerSession } from './serverAuth';

/**
 * Provisions or updates a staff member's access record in Firestore `userAccess/{uid}`.
 * Only callers with `users:manage` permission or `owner` role are authorized.
 */
export async function setUserAccess(
  operatorIdToken: string,
  targetEmail: string,
  targetRole: StaffRole,
  customPermissions?: Permission[]
): Promise<{ success: boolean; uid: string }> {
  // 1. Authorize operator
  const operatorSession = await verifyServerSession(operatorIdToken);
  assertPermission(operatorSession, 'users:manage');

  // 2. Lookup target user in Firebase Auth
  const targetUser = await adminAuth.getUserByEmail(targetEmail.trim().toLowerCase());
  const now = Date.now();

  const permissionsToAssign =
    customPermissions && customPermissions.length > 0
      ? customPermissions
      : ROLE_DEFAULT_PERMISSIONS[targetRole];

  const accessRecord: UserAccessRecord = {
    uid: targetUser.uid,
    role: targetRole,
    permissions: permissionsToAssign,
    status: 'active',
    createdBy: operatorSession.uid,
    createdAt: now,
    updatedAt: now,
  };

  // 3. Write canonical userAccess document
  await adminDb.collection('userAccess').doc(targetUser.uid).set(accessRecord, { merge: true });

  // 4. Set coarse role in custom claims for convenience, though server always validates userAccess
  await adminAuth.setCustomUserClaims(targetUser.uid, {
    role: targetRole,
  });

  return { success: true, uid: targetUser.uid };
}

/**
 * Disables or revokes a staff member's access.
 */
export async function revokeStaffAccess(
  operatorIdToken: string,
  targetUid: string
): Promise<{ success: boolean }> {
  const operatorSession = await verifyServerSession(operatorIdToken);
  assertPermission(operatorSession, 'users:manage');

  if (targetUid === operatorSession.uid) {
    throw new Error('Self-revocation prohibited: You cannot revoke your own staff access');
  }

  const now = Date.now();
  await adminDb.collection('userAccess').doc(targetUid).update({
    status: 'disabled',
    updatedAt: now,
  });

  // Revoke Firebase Auth refresh tokens immediately
  await adminAuth.revokeRefreshTokens(targetUid);

  return { success: true };
}
