'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/client';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import type { Order } from '@/lib/schemas/order';
import { formatPricePaise } from '@/lib/utils';
import {
  ShoppingBag,
  PackageCheck,
  Truck,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Download,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    if (!user) return;
    setDownloadingOrderId(orderId);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Invoice download is currently unavailable for this order.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Invoice download error:', err);
      alert('Unable to download invoice at this moment. Please reach out to WhatsApp VIP support.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('customerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Order);
        });
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Orders subscription error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'delivered') return order.status === 'delivered';
    if (statusFilter === 'cancelled') return order.status === 'cancelled';
    if (statusFilter === 'active') {
      return ['placed', 'confirmed', 'packing', 'shipped'].includes(order.status);
    }
    return true;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return <span className="bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Placed</span>;
      case 'confirmed':
        return <span className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Confirmed</span>;
      case 'packing':
        return <span className="bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Packing</span>;
      case 'shipped':
        return <span className="bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Shipped</span>;
      case 'delivered':
        return <span className="bg-[#E6F4EA] text-[#18794E] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Delivered</span>;
      case 'cancelled':
        return <span className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">Cancelled</span>;
      default:
        return <span className="bg-[#FAF8FA] text-[#19161A] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="pb-4 border-b border-[#E8E2E7] space-y-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#19161A]">
            My Order History ({orders.length})
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Real-time live status updates from DIMSGLOW fulfillment dispatch.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'delivered', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#B83B63] text-white shadow-xs'
                  : 'bg-white border border-[#E8E2E7] text-[#6D6670] hover:text-[#19161A]'
              }`}
            >
              {tab === 'all' ? 'All Orders' : tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E2E7] p-8">
          <PackageCheck className="w-14 h-14 text-[#8C8490] mx-auto opacity-30 mb-3" />
          <h3 className="text-base font-serif font-bold text-[#19161A]">
            No {statusFilter !== 'all' ? statusFilter : ''} orders found
          </h3>
          <p className="text-xs text-[#6D6670] max-w-sm mx-auto mt-1 mb-6">
            When you purchase DIMSGLOW products, your live tracking and official GST tax invoices will appear here.
          </p>
          <Link href="/collections/all">
            <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider px-6">
              Shop Luxury Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-[#E8E2E7] overflow-hidden shadow-xs divide-y divide-[#E8E2E7]"
            >
              {/* Order Card Top Bar */}
              <div className="p-4 sm:p-5 bg-[#FAF8FA] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-[#8C8490] block text-[10px] uppercase font-bold tracking-wider">
                      Order ID
                    </span>
                    <span className="font-mono font-bold text-[#19161A] text-xs">
                      {order.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C8490] block text-[10px] uppercase font-bold tracking-wider">
                      Date Placed
                    </span>
                    <span className="font-semibold text-[#19161A]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C8490] block text-[10px] uppercase font-bold tracking-wider">
                      Total Amount
                    </span>
                    <span className="font-bold text-[#19161A]">
                      {formatPricePaise(order.totalPaise)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 sm:p-5 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 rounded-lg bg-[#FAF8FA] border border-[#E8E2E7] overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl || '/brand/dimsglow-logo.jpg'}
                        alt={item.productName}
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#19161A] truncate">
                        {item.productName}
                      </h4>
                      {item.variantTitle && (
                        <p className="text-[11px] text-[#6D6670]">
                          Shade: <span className="font-medium text-[#19161A]">{item.variantTitle}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-semibold text-[#19161A]">
                          {formatPricePaise(item.unitPricePaise)}
                        </span>
                        <span className="text-[#8C8490]">× {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address & Courier Tracking */}
              <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-[#19161A] block">
                    Delivering to: {order.shippingAddress.fullName}
                  </span>
                  <p className="text-[#6D6670] mt-0.5">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                  </p>
                  {order.courier?.courierName && order.courier?.trackingNumber && (
                    <p className="text-[#18794E] font-medium mt-1 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Courier: {order.courier.courierName} (AWB: {order.courier.trackingNumber})
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Invoice Download & Print Actions */}
                  {['placed', 'confirmed', 'packing', 'shipped', 'delivered'].includes(order.status) &&
                    order.paymentStatus !== 'refunded' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={downloadingOrderId === order.id}
                          onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                          className="text-xs h-7 px-2.5 flex items-center gap-1.5 border-[#E8E2E7] hover:border-[#B83B63] hover:text-[#B83B63] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[#B83B63]" />
                          {downloadingOrderId === order.id ? 'Preparing...' : 'Download Invoice'}
                        </Button>

                        <a
                          href={`/api/orders/${order.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 flex items-center gap-1.5 border-[#E8E2E7] hover:border-[#18794E] hover:text-[#18794E] cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#18794E]" />
                            Print
                          </Button>
                        </a>
                      </>
                    )}

                  {order.status === 'cancelled' && (
                    <span className="text-[11px] font-medium text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Invoice Voided
                    </span>
                  )}

                  {order.paymentStatus === 'refunded' && (
                    <span className="text-[11px] font-medium text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Invoice Voided (Refund Issued)
                    </span>
                  )}

                  <a
                    href={`https://wa.me/913614556830?text=Hi%20DIMSGLOW,%20I%20have%20an%20inquiry%20regarding%20Order%20${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#B83B63] hover:underline flex items-center gap-1 ml-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Order Help
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
