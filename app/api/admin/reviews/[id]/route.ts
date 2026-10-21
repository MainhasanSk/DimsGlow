import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/auth/roles';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import type { Review } from '@/lib/schemas/operations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** PATCH /api/admin/reviews/[id] — approve, reject, or hide a review */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const { id: reviewId } = await params;
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const snap = await reviewRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const current = snap.data() as Review;
    const body = await req.json();
    const { action, reason } = body; // action: 'approve' | 'reject' | 'hide'

    if (!['approve', 'reject', 'hide'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action. Use: approve, reject, hide' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      hide: 'hidden',
    };

    const timestamp = Date.now();
    const updates: Partial<Review> = {
      status: statusMap[action] as any,
      moderatedByUid: session.uid,
      moderatedAt: timestamp,
      updatedAt: timestamp,
    };
    if (reason?.trim()) updates.moderationReason = reason.trim();

    await reviewRef.update(updates);

    await logAuditEvent({
      actorUid: session.uid,
      actorRole: session.role,
      action: `review_${action}d`,
      targetType: 'reviews',
      targetId: reviewId,
      reason,
      afterSummary: {
        productTitle: current.productTitle,
        customerName: current.customerName,
        rating: current.rating,
        newStatus: statusMap[action],
      },
    });

    return NextResponse.json({ success: true, status: statusMap[action] });
  } catch (error: any) {
    console.error('Error moderating review:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to moderate review' },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/reviews/[id] — permanently delete a review */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const { id: reviewId } = await params;
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const snap = await reviewRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const reviewData = snap.data() as Review;
    await reviewRef.delete();

    await logAuditEvent({
      actorUid: session.uid,
      actorRole: session.role,
      action: 'review_deleted',
      targetType: 'reviews',
      targetId: reviewId,
      beforeSummary: {
        productTitle: reviewData.productTitle,
        customerName: reviewData.customerName,
        rating: reviewData.rating,
        status: reviewData.status,
      },
    });

    return NextResponse.json({ success: true, message: 'Review deleted permanently' });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}
