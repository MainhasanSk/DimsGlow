import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { listSuppliers, createSupplier, updateSupplier } from '@/lib/operations/supplierService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'inventory:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'active' | 'inactive' | undefined;

    const suppliers = await listSuppliers(status);
    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch suppliers' },
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

    if (session.role === 'customer' || !hasPermission(session.role, 'inventory:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    if (body.id) {
      // Update existing supplier
      const updated = await updateSupplier(body.id, body, session.uid, session.role);
      return NextResponse.json({ success: true, supplier: updated });
    } else {
      // Create new supplier
      const created = await createSupplier(body, session.uid, session.role);
      return NextResponse.json({ success: true, supplier: created });
    }
  } catch (error: any) {
    console.error('Error creating/updating supplier:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save supplier' },
      { status: 500 }
    );
  }
}
