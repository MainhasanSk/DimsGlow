'use client';

import React, { useEffect, useState } from 'react';
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
  Download,
  MessageCircle,
  Send,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'DIMSGLOW-ORDER';
  const orderNumber = searchParams.get('orderNumber') || orderId;
  const whatsappUrl = searchParams.get('whatsappUrl');

  const [whatsappDispatched, setWhatsappDispatched] = useState(false);

  useEffect(() => {
    // If whatsappUrl exists, auto-trigger WhatsApp notification dispatch notification
    if (whatsappUrl) {
      setWhatsappDispatched(true);
    }
  }, [whatsappUrl]);

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
              ORDER CONFIRMED & RECORDED
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#19161A]">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-[#6D6670] mt-2 max-w-md mx-auto leading-relaxed">
              Your order has been recorded in the DIMSGLOW fulfillment system and your customer account dashboard.
            </p>
          </div>

          {/* Order Reference Box */}
          <div className="bg-[#FAF8FA] border border-[#E8E2E7] rounded-[10px] p-4 max-w-sm mx-auto flex items-center justify-between text-xs">
            <span className="text-[#6D6670] font-medium">Order Number:</span>
            <span className="font-mono font-bold text-[#B83B63] text-sm">{orderNumber}</span>
          </div>

          {/* Admin WhatsApp Alert Status Card */}
          <div className="p-4 rounded-xl bg-[#E6F4EA]/60 border border-[#18794E]/30 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#18794E] text-white flex items-center justify-center text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#18794E] uppercase tracking-wider">
                  Admin WhatsApp Order Notification
                </span>
              </div>
              <span className="text-[10px] font-bold bg-[#18794E] text-white px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-[#2E6B47] leading-relaxed">
              A real-time order notification manifest has been prepared for the admin WhatsApp hotline (<strong>+913614556830</strong>) with the complete customer address and line items.
            </p>
            {whatsappUrl && (
              <div className="pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#18794E] hover:underline"
                >
                  <Send className="w-3.5 h-3.5" /> Open / Send Notification to Admin WhatsApp Now &rarr;
                </a>
              </div>
            )}
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

          {/* Action CTAs: Invoice Download / Print, Customer Dashboard, Continue Shopping */}
          <div className="pt-6 border-t border-[#E8E2E7] flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`/api/orders/${orderId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider py-3 px-6 flex items-center justify-center gap-2 bg-[#B83B63] hover:bg-[#9B2C4F]"
              >
                <Download className="w-4 h-4" /> Download Tax Invoice (PDF)
              </Button>
            </a>

            <Link href="/account/orders" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider py-3 px-6 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Track in My Dashboard
              </Button>
            </Link>

            <Link href="/collections/all" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider py-3 px-6 text-[#6D6670] hover:text-[#19161A]"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="pt-2 text-center text-xs text-[#6D6670]">
            Need immediate assistance?{' '}
            <a
              href={`https://wa.me/913614556830?text=Hi%20DIMSGLOW,%20I%20have%20an%20inquiry%20regarding%20Order%20${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B83B63] font-semibold hover:underline inline-flex items-center gap-1"
            >
              WhatsApp VIP Support (+913614556830) <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
