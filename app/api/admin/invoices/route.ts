import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { fetchAdminInvoices } from '@/lib/invoices/invoiceService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (
      session.role === 'customer' ||
      (!hasPermission(session.role, 'finance:read') && !hasPermission(session.role, 'orders:read'))
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const invoices = await fetchAdminInvoices({ status, search, limit });

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error: any) {
    console.error('Error fetching admin invoices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
