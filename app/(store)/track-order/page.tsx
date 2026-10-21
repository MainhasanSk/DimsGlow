'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPricePaise } from '@/lib/utils';

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: 'placed' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: number;
  updatedAt?: number;
  totalPaise: number;
  courier?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt?: number;
    notes?: string;
  } | null;
  shippingAddress: {
    city: string;
    state: string;
    postalCode: string;
    fullName: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPricePaise: number;
    imageUrl?: string | null;
  }>;
}

const STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Received & Queued' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Verified by Admin' },
  { key: 'packing', label: 'Packing', desc: 'Cosmetic QA Packaged' },
  { key: 'shipped', label: 'In Transit', desc: 'Handed to Courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Safely Arrived' },
];

export default function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTrackedOrder(null);

    if (!orderQuery.trim() || !contact.trim()) {
      setError('Please provide both your Order ID and phone number or email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderQuery: orderQuery.trim(),
          contact: contact.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Order not found. Please verify the credentials.');
      } else {
        setTrackedOrder(data.order);
      }
    } catch (err: any) {
      setError('Network communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'placed':
        return 0;
      case 'confirmed':
        return 1;
      case 'packing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#B83B63] block mb-2">
            Pan-India Express Dispatch
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#19161A] tracking-tight">
            Live Order Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#6D6670] mt-2 leading-relaxed">
            Track the real-time shipping status and courier journey of your DIMSGLOW luxury beauty products.
          </p>
        </div>

        {/* Tracking Search Card */}
        <div className="bg-white rounded-2xl border border-[#E8E2E7] p-6 sm:p-8 shadow-sm max-w-xl mx-auto mb-12">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#19161A] uppercase tracking-wider mb-1.5">
                Order ID / Order Number *
              </label>
              <Input
                type="text"
                placeholder="e.g. ORD-20261021-0001"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                required
                className="text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19161A] uppercase tracking-wider mb-1.5">
                Registered Mobile Number or Email *
              </label>
              <Input
                type="text"
                placeholder="e.g. 9876543210 or name@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="text-xs sm:text-sm font-medium"
              />
            </div>

            {error && (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-lg text-xs text-[#EF4444] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#B83B63] hover:bg-[#9B2C4F] py-3 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching Shipment...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" /> Track Status Now
                </span>
              )}
            </Button>
          </form>

          <p className="text-[11px] text-[#8C8490] text-center mt-4">
            Need order history or full tax invoices?{' '}
            <Link href="/account/orders" className="text-[#B83B63] font-semibold hover:underline">
              Sign in to your Customer Account
            </Link>
          </p>
        </div>

        {/* Results Card */}
        {trackedOrder && (
          <div className="bg-white rounded-2xl border border-[#E8E2E7] p-6 sm:p-8 shadow-sm space-y-8 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E2E7] gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B83B63]">
                  Verified DIMSGLOW Order
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#19161A] mt-0.5">
                  {trackedOrder.orderNumber}
                </h2>
                <p className="text-xs text-[#6D6670] mt-1">
                  Placed on {new Date(trackedOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-[#6D6670]">Current Shipment Status</span>
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#B83B63] bg-[#FAF4F7] border border-[#B83B63]/20 px-3 py-1 rounded-full mt-1">
                  {trackedOrder.status === 'cancelled'
                    ? 'Cancelled'
                    : STEPS[getStepIndex(trackedOrder.status)].label}
                </span>
              </div>
            </div>

            {/* Stepper */}
            {trackedOrder.status !== 'cancelled' ? (
              <div className="py-4">
                <div className="grid grid-cols-5 gap-2 relative">
                  {/* Connecting Line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E8E2E7] -z-0 hidden sm:block" />
                  <div
                    className="absolute top-4 left-6 h-0.5 bg-[#B83B63] transition-all duration-500 -z-0 hidden sm:block"
                    style={{
                      width: `${(getStepIndex(trackedOrder.status) / (STEPS.length - 1)) * 90}%`,
                    }}
                  />

                  {STEPS.map((step, idx) => {
                    const currentIndex = getStepIndex(trackedOrder.status);
                    const isDone = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? 'bg-[#B83B63] text-white shadow-xs'
                              : 'bg-white border-2 border-[#E8E2E7] text-[#8C8490]'
                          } ${isCurrent ? 'ring-4 ring-[#FAF4F7]' : ''}`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-bold mt-2 ${
                            isCurrent ? 'text-[#B83B63]' : isDone ? 'text-[#19161A]' : 'text-[#8C8490]'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-[#8C8490] hidden sm:block mt-0.5">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-xl text-center text-xs text-[#EF4444]">
                This order was cancelled. If you need any assistance, please reach out to our support concierge.
              </div>
            )}

            {/* Courier Details Card if Shipped */}
            {trackedOrder.courier && (
              <div className="bg-[#FAF8FA] border border-[#E8E2E7] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#19161A] uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-[#B83B63]" /> Courier Dispatch Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#8C8490] block">Logistics Partner:</span>
                    <strong className="text-[#19161A]">{trackedOrder.courier.courierName}</strong>
                  </div>
                  <div>
                    <span className="text-[#8C8490] block">Waybill / AWB Number:</span>
                    <code className="text-[#B83B63] font-bold">{trackedOrder.courier.trackingNumber}</code>
                  </div>
                  {trackedOrder.courier.trackingUrl && (
                    <div className="sm:text-right flex sm:block items-center">
                      <a
                        href={trackedOrder.courier.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B83B63] hover:underline bg-white px-3 py-1.5 rounded-md border border-[#B83B63]/20 shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Track on Partner Site
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Destination & Order Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E8E2E7]">
              <div>
                <h4 className="text-xs font-bold text-[#19161A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B83B63]" /> Shipping Destination
                </h4>
                <div className="p-3.5 bg-[#FAF8FA] rounded-lg border border-[#E8E2E7] text-xs text-[#6D6670] space-y-1">
                  <p className="font-bold text-[#19161A]">{trackedOrder.shippingAddress.fullName}</p>
                  <p>
                    {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state} —{' '}
                    {trackedOrder.shippingAddress.postalCode}
                  </p>
                  <p className="text-[11px] text-[#8C8490]">India</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#19161A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#B83B63]" /> Order Items ({trackedOrder.items.length})
                </h4>
                <div className="divide-y divide-[#E8E2E7] border border-[#E8E2E7] rounded-lg p-2 bg-[#FAF8FA] text-xs">
                  {trackedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.imageUrl && (
                          <div className="w-8 h-8 rounded border border-[#E8E2E7] relative overflow-hidden shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                        )}
                        <span className="font-medium text-[#19161A] truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-[#19161A] shrink-0">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between font-bold text-xs text-[#19161A]">
                    <span>Total Amount:</span>
                    <span className="text-[#B83B63]">{formatPricePaise(trackedOrder.totalPaise)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Footer */}
            <div className="bg-[#FAF4F7] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#6D6670] text-center sm:text-left">
                Have questions about your package delivery or need to update instructions?
              </span>
              <a
                href="https://wa.me/917099307738?text=Hello%20DIMSGLOW,%20I%20have%20an%20inquiry%20regarding%20my%20order"
                target="_blank"
                rel="noreferrer"
                className="bg-[#18794E] hover:bg-[#146340] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                Chat on WhatsApp Support
              </a>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
