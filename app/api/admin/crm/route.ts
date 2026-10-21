import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { listCrmCustomers } from '@/lib/crm/crmService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'crm:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;

    const customers = await listCrmCustomers({ tag, search });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error fetching CRM customers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch CRM customers' },
      { status: 500 }
    );
  }
}
