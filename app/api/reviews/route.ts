import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { getApprovedReviewsForProduct, submitProductReview } from '@/lib/reviews/reviewService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Product slug is required' }, { status: 400 });
    }

    const summary = await getApprovedReviewsForProduct(slug);
    return NextResponse.json({ success: true, ...summary });
  } catch (error: any) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to submit a review for this luxury item.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    const body = await req.json();

    const review = await submitProductReview({
      productId: body.productId,
      productSlug: body.productSlug,
      productTitle: body.productTitle,
      customerUid: session.uid,
      customerName: session.email?.split('@')[0] || 'Valued Client',
      customerEmail: session.email || '',
      rating: body.rating,
      title: body.title,
      comment: body.comment,
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Thank you! Your review has been submitted and is pending moderation by our team.',
    });
  } catch (error: any) {
    console.error('Error submitting product review:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
