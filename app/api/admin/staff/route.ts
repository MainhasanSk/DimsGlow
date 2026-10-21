import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { hasPermission, ROLE_DEFAULT_PERMISSIONS, StaffRole, UserAccessRecord } from '@/lib/auth/roles';
import { logAuditEvent } from '@/lib/audit/auditLogger';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'users:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const snap = await adminDb.collection('userAccess').orderBy('createdAt', 'desc').get();
    const staffList: Array<UserAccessRecord & { email?: string; displayName?: string }> = [];

    for (const doc of snap.docs) {
      const data = doc.data() as UserAccessRecord;
      try {
        const authUser = await adminAuth.getUser(data.uid);
        staffList.push({
          ...data,
          email: authUser.email,
          displayName: authUser.displayName || authUser.email?.split('@')[0],
        });
      } catch {
        staffList.push({
          ...data,
          email: 'Unknown or Deleted Account',
        });
      }
    }

    return NextResponse.json({ success: true, staff: staffList });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error fetching staff list:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'users:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const targetRole = body.role as StaffRole;

    if (!email || !targetRole) {
      return NextResponse.json(
        { success: false, error: 'Email and target role are required' },
        { status: 400 }
      );
    }

    // Lookup user in Firebase Auth
    let targetUser;
    try {
      targetUser = await adminAuth.getUserByEmail(email);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: `User account not found for ${email}. Please ensure they have created a DIMSGLOW account first.`,
        },
        { status: 404 }
      );
    }

    const permissions = ROLE_DEFAULT_PERMISSIONS[targetRole] || [];
    const timestamp = Date.now();

    const accessRecord: UserAccessRecord = {
      uid: targetUser.uid,
      role: targetRole,
      permissions,
      status: 'active',
      createdBy: session.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Save in Firestore userAccess
    await adminDb.collection('userAccess').doc(targetUser.uid).set(accessRecord);

    // Set Custom Claims on Firebase Auth token
    await adminAuth.setCustomUserClaims(targetUser.uid, {
      role: targetRole,
      permissions,
    });

    await logAuditEvent({
      actorUid: session.uid,
      actorRole: session.role,
      action: 'staff_role_granted',
      targetType: 'userAccess',
      targetId: targetUser.uid,
      afterSummary: {
        email,
        assignedRole: targetRole,
        permissionsCount: permissions.length,
      },
    });

    return NextResponse.json({
      success: true,
      staff: {
        ...accessRecord,
        email: targetUser.email,
        displayName: targetUser.displayName,
      },
      message: `Staff role ${targetRole} successfully provisioned for ${email}.`,
    });
  } catch (error: any) {
    console.error('Error assigning staff role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign staff role' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'users:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const targetUid = body.uid;
    const newStatus = body.status as 'active' | 'suspended';

    if (!targetUid || !['active', 'suspended'].includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: 'Target UID and valid status (active/suspended) are required' },
        { status: 400 }
      );
    }

    const accessRef = adminDb.collection('userAccess').doc(targetUid);
    const snap = await accessRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Staff access record not found' }, { status: 404 });
    }

    await accessRef.update({
      status: newStatus,
      updatedAt: Date.now(),
    });

    // Revoke Firebase Auth refresh tokens if suspended
    if (newStatus === 'suspended') {
      await adminAuth.revokeRefreshTokens(targetUid);
    }

    await logAuditEvent({
      actorUid: session.uid,
      actorRole: session.role,
      action: `staff_status_${newStatus}`,
      targetType: 'userAccess',
      targetId: targetUid,
      afterSummary: { newStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member status updated to ${newStatus}.`,
    });
  } catch (error: any) {
    console.error('Error modifying staff status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update staff status' },
      { status: 500 }
    );
  }
}
