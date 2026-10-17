'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import {
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  ArrowRight,
  Truck,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'DIMSGLOW-ORDER';
  const orderNumber = searchParams.get('orderNumber') || orderId;

  return (
    <StorefrontShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-2xl border border-[#E8E2E7] shadow-lg p-6 sm:p-10 text-center space-y-6">
          {/* Animated celebration icon */}
          <div className="w-20 h-20 rounded-full bg-[#E6F4EA] text-[#18794E] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37] block mb-1">
              ORDER CONFIRMED
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#19161A]">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-[#6D6670] mt-2 max-w-md mx-auto leading-relaxed">
              We have received your order and our laboratory dispatch team is preparing your package.
            </p>
          </div>

          {/* Order Reference Box */}
          <div className="bg-[#FAF8FA] border border-[#E8E2E7] rounded-[10px] p-4 max-w-sm mx-auto flex items-center justify-between text-xs">
            <span className="text-[#6D6670] font-medium">Order Number:</span>
            <span className="font-mono font-bold text-[#B83B63] text-sm">{orderNumber}</span>
          </div>

          {/* 4-Step Order Progress Timeline */}
          <div className="pt-4 border-t border-[#E8E2E7]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#19161A] mb-6">
              Order Fulfillment Pipeline
            </h3>
            <div className="grid grid-cols-4 gap-2 relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#18794E] text-white flex items-center justify-center text-xs font-bold mb-1.5 shadow-xs">
                  ✓
                </div>
                <span className="text-[11px] font-bold text-[#18794E]">Placed</span>
                <span className="text-[9px] text-[#8C8490]">Recorded</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF4F7] text-[#B83B63] border border-[#B83B63]/40 flex items-center justify-center text-xs font-bold mb-1.5">
                  2
                </div>
                <span className="text-[11px] font-bold text-[#19161A]">Confirmed</span>
                <span className="text-[9px] text-[#8C8490]">In Review</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF8FA] text-[#8C8490] border border-[#E8E2E7] flex items-center justify-center text-xs font-bold mb-1.5">
                  3
                </div>
                <span className="text-[11px] font-medium text-[#6D6670]">Packing</span>
                <span className="text-[9px] text-[#8C8490]">Warehouse</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-[#FAF8FA] text-[#8C8490] border border-[#E8E2E7] flex items-center justify-center text-xs font-bold mb-1.5">
                  4
                </div>
                <span className="text-[11px] font-medium text-[#6D6670]">Delivered</span>
                <span className="text-[9px] text-[#8C8490]">At Doorstep</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-[#E8E2E7] flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/account/orders" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider py-3 px-6 flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" /> View in Dashboard
              </Button>
            </Link>

            <Link href="/collections/all" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider py-3 px-6">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="pt-2 text-center text-xs text-[#6D6670]">
            Questions about your order?{' '}
            <a
              href={`https://wa.me/913614556830?text=Hi%20DIMSGLOW,%20I%20have%20an%20inquiry%20regarding%20Order%20${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B83B63] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Contact VIP Hotline on WhatsApp <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
