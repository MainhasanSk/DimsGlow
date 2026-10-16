import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { listAdminReviews } from '@/lib/reviews/reviewService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'reviews:moderate')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const reviews = await listAdminReviews(status);
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
