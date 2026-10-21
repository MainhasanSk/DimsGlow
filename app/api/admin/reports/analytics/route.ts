import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { getAnalyticsSummary } from '@/lib/reports/reportService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'reports:read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') as any) || '30d';

    const analytics = await getAnalyticsSummary({ range });

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
