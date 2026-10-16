import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { listCustomerStaffNotes, addCustomerStaffNote } from '@/lib/crm/crmService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await context.params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'crm:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const notes = await listCustomerStaffNotes(uid);
    return NextResponse.json({ success: true, notes });
  } catch (error: any) {
    console.error('Error fetching CRM notes:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await context.params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'crm:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.text || !body.text.trim()) {
      return NextResponse.json({ success: false, error: 'Note text is required' }, { status: 400 });
    }

    const note = await addCustomerStaffNote(
      uid,
      body.text,
      session.uid,
      session.email?.split('@')[0] || 'Staff',
      session.role
    );

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Error adding CRM note:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add note' },
      { status: 500 }
    );
  }
}
