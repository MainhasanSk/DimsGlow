'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import type { Order } from '@/lib/schemas/order';
import { formatPricePaise } from '@/lib/utils';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminOverviewDashboard() {
  const { user, profile, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchViaApi = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/admin/orders?limit=500', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        }
      } catch (err) {
        console.warn('Admin overview API fallback error:', err);
      } finally {
        setLoading(false);
      }
    };

    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Order[] = [];
          snapshot.forEach((d) => list.push(d.data() as Order));
          setOrders(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Admin overview subscription warning, falling back to API:', err.message);
          fetchViaApi();
        }
      );
    } catch {
      fetchViaApi();
    }

    return () => unsubscribe();
  }, [user]);

  const totalRevenuePaise = orders.reduce((sum, o) => {
    return o.status !== 'cancelled' ? sum + o.totalPaise : sum;
  }, 0);

  const pendingFulfillmentCount = orders.filter((o) =>
    ['placed', 'confirmed', 'packing'].includes(o.status)
  ).length;

  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-[#281D27] via-[#481E34] to-[#7B1F4A] rounded-[14px] p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37] block mb-1">
            EXECUTIVE OPERATIONS CONSOLE
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
            Welcome, {profile?.displayName || user?.displayName || 'Administrator'}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-light leading-relaxed mb-6">
            Live operational pipeline for DIMSGLOW. Real-time fulfillment queue, inventory movements, and authorized audit records.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/orders">
              <Button
                variant="primary"
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#B59128] text-[#19161A] text-xs font-bold uppercase tracking-wider"
              >
                Manage Orders Queue ({pendingFulfillmentCount} Pending)
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white text-white hover:text-[#19161A] border-white/30 text-xs font-bold"
              >
                Inspect Stock Ledger
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6D6670] uppercase tracking-wider block">
              Active Revenue
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {formatPricePaise(totalRevenuePaise)}
            </span>
            <span className="text-[10px] text-[#18794E] font-semibold mt-1 inline-block">
              ✓ Non-cancelled orders
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#E6F4EA] text-[#18794E] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6D6670] uppercase tracking-wider block">
              Pending Fulfillment
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {pendingFulfillmentCount}
            </span>
            <span className="text-[10px] text-[#B83B63] font-semibold mt-1 inline-block">
              Needs packing & dispatch
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#FAF4F7] text-[#B83B63] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6D6670] uppercase tracking-wider block">
              In-Transit Courier
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {shippedCount}
            </span>
            <span className="text-[10px] text-[#15803D] font-semibold mt-1 inline-block">
              AWB numbers assigned
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#F0FDF4] text-[#15803D] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-[10px] p-5 border border-[#E8E2E7] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6D6670] uppercase tracking-wider block">
              Delivered Completed
            </span>
            <span className="text-2xl font-serif font-bold text-[#19161A] mt-1 block">
              {deliveredCount}
            </span>
            <span className="text-[10px] text-[#18794E] font-semibold mt-1 inline-block">
              Successful handovers
            </span>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#E6F4EA] text-[#18794E] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Orders Queue Card */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8E2E7] flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-[#19161A]">
              Live Orders Queue (Newest First)
            </h3>
            <p className="text-xs text-[#6D6670]">Latest orders received from storefront customers</p>
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1">
              Full Queue <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6D6670]">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8FA] text-[#6D6670] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8E2E7]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2E7]">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8FA]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#19161A]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#19161A] block">
                        {order.shippingAddress.fullName}
                      </span>
                      <span className="text-[11px] text-[#6D6670] block truncate max-w-40">
                        {order.customerEmail}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6D6670]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#19161A]">
                      {formatPricePaise(order.totalPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-[#FAF4F7] text-[#B83B63] font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/admin/orders">
                        <Button variant="outline" size="sm" className="text-[10px] font-bold py-1 px-2.5">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
