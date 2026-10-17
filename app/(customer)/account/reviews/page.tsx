'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { Star, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerReviewsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E8E2E7]">
        <h1 className="text-xl font-serif font-bold text-[#19161A]">
          My Product Reviews
        </h1>
        <p className="text-xs text-[#6D6670] mt-0.5">
          Share your authentic experience with DIMSGLOW cosmetics and earn beauty reward points.
        </p>
      </div>

      <div className="text-center py-16 bg-white rounded-xl border border-[#E8E2E7] p-8">
        <div className="w-16 h-16 rounded-full bg-[#FAF4F7] text-[#B83B63] flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 opacity-40 fill-current" />
        </div>
        <h3 className="text-base font-serif font-bold text-[#19161A]">
          No verified reviews submitted yet
        </h3>
        <p className="text-xs text-[#6D6670] max-w-sm mx-auto mt-1 mb-6">
          Once your order has been delivered, you can rate and review your favorite cosmetics directly from the product page.
        </p>
        <Link href="/account/orders">
          <Button variant="outline" size="sm" className="text-xs font-bold">
            Check Delivered Orders
          </Button>
        </Link>
      </div>
    </div>
  );
}
