'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCart } from '@/lib/cart/CartContext';
import { db } from '@/lib/firebase/client';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import type { Order } from '@/lib/schemas/order';
import { formatPricePaise } from '@/lib/utils';
import {
  ShoppingBag,
  Heart,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  PackageCheck,
  ChevronRight,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountOverviewPage() {
  const { user, profile } = useAuth();
  const { favoritesCount } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.displayName || user?.displayName || 'Customer';

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    async function loadOverviewData() {
      try {
        // Fetch recent orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('customerUid', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const orderSnap = await getDocs(ordersQuery);
        const fetchedOrders: Order[] = [];
        orderSnap.forEach((doc) => {
          fetchedOrders.push(doc.data() as Order);
        });
        setOrders(fetchedOrders);

        // Fetch address count
        const addrSnap = await getDocs(
          collection(db, 'addresses', uid, 'savedAddresses')
        );
        setAddressCount(addrSnap.size);
      } catch (err) {
        console.warn('Error loading account overview:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOverviewData();
  }, [user]);

  const recentOrder = orders[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-[#541235] via-[#751B47] to-[#B83B63] rounded-xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37] block mb-1">
            DIMSGLOW PRIVILEGE MEMBER
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-light leading-relaxed mb-6">
            Manage your luxury beauty orders, track shipments in real-time, customize your delivery addresses, and explore curated recommendations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/collections/all">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white text-white hover:text-[#541235] border-white/30 text-xs font-bold"
              >
                Browse Catalog
              </Button>
            </Link>
            <Link href="/account/orders">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white text-white hover:text-[#541235] border-white/30 text-xs font-bold"
              >
                View Order History
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-full border-8 border-white/10 pointer-events-none" />
      </div>

      {/* 3 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6D6670] uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {orders.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF4F7] text-[#B83B63] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6D6670] uppercase tracking-wider block">
              Wishlist Items
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {favoritesCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF4F7] text-[#B83B63] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6D6670] uppercase tracking-wider block">
              Saved Addresses
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {addressCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF4F7] text-[#B83B63] flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Order Card */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2E7]">
          <div>
            <h3 className="text-base font-serif font-bold text-[#19161A]">
              Recent Order
            </h3>
            <p className="text-xs text-[#6D6670]">Track status and order contents</p>
          </div>
          <Link
            href="/account/orders"
            className="text-xs font-bold text-[#B83B63] hover:underline flex items-center gap-1"
          >
            All Orders <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentOrder ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[#6D6670]">Order ID: </span>
                <span className="font-mono font-bold text-[#19161A]">{recentOrder.id}</span>
              </div>
              <div>
                <span className="text-[#6D6670]">Placed On: </span>
                <span className="font-semibold text-[#19161A]">
                  {new Date(recentOrder.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    recentOrder.status === 'delivered'
                      ? 'bg-[#E6F4EA] text-[#18794E]'
                      : recentOrder.status === 'cancelled'
                      ? 'bg-[#FEF2F2] text-[#EF4444]'
                      : 'bg-[#FAF4F7] text-[#B83B63]'
                  }`}
                >
                  {recentOrder.status}
                </span>
              </div>
            </div>

            {/* Line items thumbnail row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {recentOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[#FAF8FA] border border-[#E8E2E7]"
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white border border-[#E8E2E7] shrink-0">
                    <Image
                      src={item.imageUrl || '/brand/dimsglow-logo.jpg'}
                      alt={item.productName}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#19161A] line-clamp-1 max-w-37.5">
                      {item.productName}
                    </h4>
                    <p className="text-[10px] text-[#6D6670]">
                      Qty: {item.quantity} · {formatPricePaise(item.unitPricePaise)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8E2E7]">
              <span className="text-xs text-[#6D6670]">Total Amount:</span>
              <span className="text-sm font-bold text-[#19161A]">
                {formatPricePaise(recentOrder.totalPaise)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <PackageCheck className="w-10 h-10 text-[#8C8490] mx-auto opacity-40 mb-2" />
            <p className="text-xs font-medium text-[#6D6670]">
              You haven&apos;t placed any orders with DIMSGLOW yet.
            </p>
            <Link href="/collections/all" className="inline-block mt-3">
              <Button variant="primary" size="sm" className="text-xs font-bold">
                Start Shopping
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Customer VIP Assistance Box */}
      <div className="bg-[#FAF8FA] rounded-[10px] border border-[#E8E2E7] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#E6F4EA] text-[#18794E] flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#19161A]">Need Personal Beauty Assistance?</h4>
            <p className="text-[11px] text-[#6D6670]">
              Our DIMSGLOW beauty advisors are ready to assist you via WhatsApp hotline.
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/913614556830?text=Hi%20DIMSGLOW%20Support,%20I%20need%20help%20with%20my%20account"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="text-xs font-bold text-[#18794E] border-[#18794E]">
            Chat on WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
