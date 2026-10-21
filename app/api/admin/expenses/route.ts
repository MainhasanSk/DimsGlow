import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { listExpenses, createExpense, getExpenseSummary } from '@/lib/operations/expenseService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'finance:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const includeSummary = searchParams.get('includeSummary') === 'true';

    const expenses = await listExpenses({ category });
    const summary = includeSummary ? await getExpenseSummary() : null;

    return NextResponse.json({
      success: true,
      expenses,
      summary,
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch expenses' },
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

    if (session.role === 'customer' || !hasPermission(session.role, 'finance:manage')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const expense = await createExpense(body, session.uid, session.role);

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error recording expense:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record expense' },
      { status: 500 }
    );
  }
}
