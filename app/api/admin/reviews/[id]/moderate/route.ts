import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { moderateReview } from '@/lib/reviews/reviewService';
import { hasPermission } from '@/lib/auth/roles';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'reviews:moderate')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid moderation action. Must be approve or reject' },
        { status: 400 }
      );
    }

    const reviewed = await moderateReview(
      id,
      body.action,
      session.uid,
      session.role,
      body.reason
    );

    return NextResponse.json({ success: true, review: reviewed });
  } catch (error: any) {
    console.error('Error moderating review:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to moderate review' },
      { status: 500 }
    );
  }
}
