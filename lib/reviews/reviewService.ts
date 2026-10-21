import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { Review, ReviewSchema, ReviewStatus } from '@/lib/schemas/operations';
import { logAuditEvent } from '@/lib/audit/auditLogger';
import { hasPermission, type UserRole } from '@/lib/auth/roles';
import type { Order } from '@/lib/schemas/order';

export interface SubmitReviewInput {
  productId: string;
  productSlug: string;
  productTitle: string;
  customerUid: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
}

export async function submitProductReview(input: SubmitReviewInput): Promise<Review> {
  const timestamp = Date.now();

  // 1. Deduplication check: prevent multiple pending reviews by same customer on same product
  const existingSnap = await adminDb
    .collection('reviews')
    .where('productId', '==', input.productId)
    .where('customerUid', '==', input.customerUid)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0].data() as Review;
    if (existing.status === 'pending' || existing.status === 'approved') {
      throw new Error('You have already submitted a review for this product.');
    }
  }

  // 2. Check verified purchase status by scanning customer orders
  let verifiedPurchase = false;
  try {
    const ordersSnap = await adminDb
      .collection('orders')
      .where('customerEmail', '==', input.customerEmail)
      .get();

    for (const doc of ordersSnap.docs) {
      const order = doc.data() as Order;
      if (order.status !== 'cancelled' && order.items.some((it) => it.productId === input.productId)) {
        verifiedPurchase = true;
        break;
      }
    }
  } catch (err) {
    console.error('Failed to verify purchase status:', err);
  }

  const reviewRef = adminDb.collection('reviews').doc();

  const review = ReviewSchema.parse({
    id: reviewRef.id,
    productId: input.productId,
    productSlug: input.productSlug,
    productTitle: input.productTitle,
    customerUid: input.customerUid,
    customerName: input.customerName.trim(),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    title: input.title.trim(),
    comment: input.comment.trim(),
    verifiedPurchase,
    status: 'pending', // Requires admin moderation
    helpfulVotes: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await reviewRef.set(review);

  return review;
}

export async function moderateReview(
  reviewId: string,
  action: 'approve' | 'reject',
  actorUid: string,
  actorRole: UserRole,
  reason?: string
): Promise<Review> {
  if (actorRole === 'customer' || !hasPermission(actorRole, 'reviews:moderate')) {
    throw new Error('Forbidden: Insufficient permissions to moderate customer reviews');
  }

  const reviewRef = adminDb.collection('reviews').doc(reviewId);
  const snap = await reviewRef.get();
  if (!snap.exists) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  const current = snap.data() as Review;
  const newStatus: ReviewStatus = action === 'approve' ? 'approved' : 'rejected';
  const timestamp = Date.now();

  const updates: Partial<Review> = {
    status: newStatus,
    moderatedByUid: actorUid,
    moderatedAt: timestamp,
    moderationReason: reason?.trim() || undefined,
    updatedAt: timestamp,
  };

  await reviewRef.update(updates);

  await logAuditEvent({
    actorUid,
    actorRole,
    action: `review_${action}d`,
    targetType: 'reviews',
    targetId: reviewId,
    reason,
    afterSummary: {
      productTitle: current.productTitle,
      status: newStatus,
      rating: current.rating,
    },
  });

  return {
    ...current,
    ...updates,
  };
}

export interface ProductReviewsSummary {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>; // 1: count, 2: count, etc.
}

export async function getApprovedReviewsForProduct(productSlug: string): Promise<ProductReviewsSummary> {
  const snap = await adminDb
    .collection('reviews')
    .where('productSlug', '==', productSlug)
    .where('status', '==', 'approved')
    .get();

  const reviews: Review[] = [];
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;

  snap.forEach((doc) => {
    const r = doc.data() as Review;
    reviews.push(r);
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    ratingSum += r.rating;
  });

  // Sort descending by creation date in memory
  reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 5.0;

  return {
    reviews,
    totalReviews,
    averageRating,
    ratingDistribution,
  };
}

export async function listAdminReviews(status?: string): Promise<Review[]> {
  const snap = await adminDb.collection('reviews').get();
  let reviews: Review[] = [];
  snap.forEach((doc) => reviews.push(doc.data() as Review));

  // Sort descending by creation date in memory
  reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (status && status !== 'all') {
    reviews = reviews.filter((r) => r.status === status);
  }

  return reviews.slice(0, 100);
}
