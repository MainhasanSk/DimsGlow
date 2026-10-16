import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { updateCustomerTags } from '@/lib/crm/crmService';
import { hasPermission } from '@/lib/auth/roles';

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
    if (!Array.isArray(body.tags)) {
      return NextResponse.json({ success: false, error: 'Tags array is required' }, { status: 400 });
    }

    const updatedTags = await updateCustomerTags(uid, body.tags, session.uid, session.role);
    return NextResponse.json({ success: true, tags: updatedTags });
  } catch (error: any) {
    console.error('Error updating customer tags:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update tags' },
      { status: 500 }
    );
  }
}
