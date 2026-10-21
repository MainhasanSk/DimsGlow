import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/auth/roles';
import { logAuditEvent } from '@/lib/audit/auditLogger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PATCH /api/admin/expenses/[id] — update an expense */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'finance:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id: expenseId } = await params;
    if (!expenseId) {
      return NextResponse.json({ success: false, error: 'Expense ID is required' }, { status: 400 });
    }

    const expenseRef = adminDb.collection('expenses').doc(expenseId);
    const snap = await expenseRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, any> = { updatedAt: Date.now() };

    if (body.title) updateData.title = body.title.trim();
    if (body.category) updateData.category = body.category;
    if (body.amountPaise !== undefined) updateData.amountPaise = body.amountPaise;
    if (body.paymentMode) updateData.paymentMode = body.paymentMode;
    if (body.vendorName !== undefined) updateData.vendorName = body.vendorName;
    if (body.referenceNumber !== undefined) updateData.referenceNumber = body.referenceNumber;
    if (body.date) updateData.date = body.date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await expenseRef.update(updateData);

    await logAuditEvent({
      actorUid: session.uid,
      actorRole: session.role,
      action: 'expense_updated',
      targetType: 'expenses',
      targetId: expenseId,
      afterSummary: updateData,
    });

    return NextResponse.json({ success: true, message: 'Expense updated successfully' });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/expenses/[id] — delete an expense */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'finance:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id: expenseId } = await params;
    if (!expenseId) {
      return NextResponse.json({ success: false, error: 'Expense ID is required' }, { status: 400 });
    }

    const expenseRef = adminDb.collection('expenses').doc(expenseId);
    const snap = await expenseRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    const expenseData = snap.data();
    await expenseRef.delete();

    await logAuditEvent({
      actorUid: session.uid,
      actorRole: session.role,
      action: 'expense_deleted',
      targetType: 'expenses',
      targetId: expenseId,
      beforeSummary: {
        expenseNumber: expenseData?.expenseNumber,
        category: expenseData?.category,
        amountPaise: expenseData?.amountPaise,
      },
    });

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
