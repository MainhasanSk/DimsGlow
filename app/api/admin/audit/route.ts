import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import type { AuditEvent } from '@/lib/schemas/audit';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    // Only Owner and Admin can inspect full audit trail
    if (!['owner', 'admin'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    let query = adminDb.collection('auditEvents').orderBy('timestamp', 'desc');

    if (action && action !== 'all') {
      query = query.where('action', '==', action) as any;
    }
    if (targetType && targetType !== 'all') {
      query = query.where('targetType', '==', targetType) as any;
    }

    const snap = await query.limit(limit).get();
    const events: AuditEvent[] = [];
    snap.forEach((d) => events.push(d.data() as AuditEvent));

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Error fetching audit events:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit events' },
      { status: 500 }
    );
  }
}
