'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Search,
  MessageSquare,
  AlertCircle,
  Trash2,
  EyeOff,
  Eye,
} from 'lucide-react';
import type { Review } from '@/lib/schemas/operations';

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/reviews?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setFeedbackMessage({ type: 'error', text: 'Failed to load reviews.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user, statusFilter]);

  const handleModerate = async (reviewId: string, action: 'approve' | 'reject' | 'hide' | 'delete') => {
    if (!user) return;
    let reason: string | undefined = undefined;

    if (action === 'delete') {
      if (!confirm('Permanently delete this review? This cannot be undone.')) return;
    } else if (action === 'reject') {
      const input = prompt('Enter a rejection reason (e.g. spam, inappropriate content):');
      if (input === null) return;
      reason = input.trim() || 'Did not meet moderation guidelines';
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const method = action === 'delete' ? 'DELETE' : 'PATCH';
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        ...(action !== 'delete' ? { body: JSON.stringify({ action, reason }) } : {}),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const labels: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        hide: 'hidden',
        delete: 'deleted',
      };
      setFeedbackMessage({
        type: 'success',
        text: `Review successfully ${labels[action]}.`,
      });
      fetchReviews();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to moderate review.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Product Review Moderation
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Audit customer reviews, verify authenticated buyers, and publish ratings to product detail pages.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={isLoading}
          className="p-2 border border-black/10 rounded-md hover:bg-white text-[#5D4E60] transition-colors cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
              : 'bg-[#FDF0ED] text-[#D9381E] border border-[#F5C6CB]'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-current underline cursor-pointer ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 rounded-[10px] border border-black/10 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3.5 py-1.5 rounded-full capitalize font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1F161E] text-white'
                  : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
              }`}
            >
              {st} Reviews
            </button>
          ))}
        </div>

        <div className="text-xs text-[#5D4E60]">
          {reviews.length} {statusFilter} review{reviews.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Reviews Queue */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-[10px] border border-black/10 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-black/20 mb-2" />
            <p className="font-semibold text-[#1F161E]">No {statusFilter} reviews found</p>
            <p className="text-xs text-[#5D4E60] mt-0.5">
              Client reviews requiring moderation will show up here.
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1F161E]">{rev.productTitle}</span>
                    <span className="text-[10px] font-mono text-[#5D4E60]">({rev.productSlug})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-[#D4AF37]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating ? 'fill-[#D4AF37]' : 'text-black/15'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#1F161E]">{rev.rating}.0 / 5.0</span>
                    {rev.verifiedPurchase && (
                      <Badge variant="success" className="gap-1 text-[9px] py-0 px-1.5">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      rev.status === 'approved'
                        ? 'success'
                        : rev.status === 'rejected'
                        ? 'outline'
                        : 'warning'
                    }
                    className="capitalize text-[10px]"
                  >
                    {rev.status}
                  </Badge>
                  <span className="text-[11px] text-[#5D4E60]">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-[#1F161E] text-sm">&ldquo;{rev.title}&rdquo;</h4>
                <p className="text-[#5D4E60] leading-relaxed">{rev.comment}</p>
                <p className="text-[11px] text-black/50 pt-1">
                  Submitted by: <strong className="text-[#1F161E]">{rev.customerName}</strong>
                </p>
                {rev.moderationReason && (
                  <p className="text-[11px] text-[#EF4444] bg-[#FDF0ED] p-2 rounded-sm mt-2">
                    Rejection note: {rev.moderationReason}
                  </p>
                )}
              </div>

              {/* Moderation Actions - Available for all review statuses */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/5">
                <span className="text-[11px] text-[#5D4E60]">
                  Status:{' '}
                  <strong className="uppercase text-[#1F161E]">
                    {rev.status}
                  </strong>
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  {/* Delete Button (Permanent) */}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleModerate(rev.id, 'delete')}
                    className="text-[#EF4444] hover:bg-[#FDF0ED] border-[#EF4444]/30 text-xs h-8 cursor-pointer"
                    title="Permanently Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Delete</span>
                  </Button>

                  {/* Reject / Hide Button */}
                  {rev.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleModerate(rev.id, 'hide')}
                      className="text-[#D9381E] hover:bg-[#FDF0ED] border-[#D9381E]/30 text-xs h-8 cursor-pointer"
                      title="Hide from Storefront"
                    >
                      <EyeOff className="w-3.5 h-3.5 mr-1" />
                      <span>Hide / Unpublish</span>
                    </Button>
                  )}

                  {rev.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleModerate(rev.id, 'reject')}
                      className="text-[#EF4444] hover:bg-[#FDF0ED] border-[#EF4444]/30 text-xs h-8 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Reject</span>
                    </Button>
                  )}

                  {/* Approve / Re-publish Button */}
                  {rev.status !== 'approved' && (
                    <Button
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => handleModerate(rev.id, 'approve')}
                      className="bg-[#1E7E34] hover:bg-[#155724] text-white text-xs h-8 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Approve & Publish</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
