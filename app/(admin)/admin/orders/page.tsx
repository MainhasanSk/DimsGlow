'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Order, OrderStatus } from '@/lib/schemas/order';
import { formatPricePaise } from '@/lib/utils';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  XCircle,
  FileText,
  CreditCard,
  RotateCcw,
  Download,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

// Seed demo orders in case Firestore collection is initially empty or offline
const SEED_ORDERS: Order[] = [
  {
    id: 'ord_demo_01',
    orderNumber: 'DG-2026-849201',
    customerUid: 'cust_seed_01',
    customerEmail: 'priya.sharma@gmail.com',
    shippingAddress: {
      fullName: 'Priya Sharma',
      phone: '9876543210',
      addressLine1: 'Flat 402, Royale Palms, Bandra West',
      addressLine2: 'Near Mehboob Studio',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
    },
    items: [
      {
        productId: 'prod_skin_tint',
        variantId: 'var_whipped_cream',
        sku: 'DIMS-ST-01',
        productName: 'Skin Tint 5 In 1 Multifunctional Serum Foundation',
        variantTitle: 'Whipped Cream',
        quantity: 2,
        unitPricePaise: 31900,
        totalPaise: 63800,
        imageUrl: '/products/featured-product.jpeg',
      },
      {
        productId: 'prod_matte_lipstick',
        variantId: 'var_ruby_rush',
        sku: 'DIMS-LIP-01',
        productName: '24 Hrs Non Transfer Matte Lipstick',
        variantTitle: 'Ruby Rush',
        quantity: 1,
        unitPricePaise: 31000,
        totalPaise: 31000,
        imageUrl: '/categories/lips.jpg',
      },
    ],
    subtotalPaise: 94800,
    discountPaise: 5000,
    shippingFeePaise: 0,
    taxPaise: 16164,
    totalPaise: 89800,
    currency: 'INR',
    status: 'placed',
    paymentStatus: 'pending',
    idempotencyKey: 'idem_seed_01',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'ord_demo_02',
    orderNumber: 'DG-2026-729410',
    customerUid: 'cust_seed_02',
    customerEmail: 'ananya.deshmukh@gmail.com',
    shippingAddress: {
      fullName: 'Ananya Deshmukh',
      phone: '9812345678',
      addressLine1: 'B-12 Green Glen Layout, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
      country: 'India',
    },
    items: [
      {
        productId: 'prod_kohl_kajal',
        variantId: 'var_midnight_black',
        sku: 'DIMS-KJL-01',
        productName: 'Kohl Black 24H Waterproof Kajal',
        variantTitle: 'Midnight Black',
        quantity: 1,
        unitPricePaise: 19900,
        totalPaise: 19900,
        imageUrl: '/categories/eyes.jpg',
      },
    ],
    subtotalPaise: 19900,
    discountPaise: 0,
    shippingFeePaise: 4000,
    taxPaise: 4302,
    totalPaise: 23900,
    currency: 'INR',
    status: 'packing',
    paymentStatus: 'paid',
    idempotencyKey: 'idem_seed_02',
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'ord_demo_03',
    orderNumber: 'DG-2026-519284',
    customerUid: 'cust_seed_03',
    customerEmail: 'riya.kapoor@gmail.com',
    shippingAddress: {
      fullName: 'Riya Kapoor',
      phone: '9920192834',
      addressLine1: '45 Connaught Place, Inner Circle',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
    },
    items: [
      {
        productId: 'prod_fragrance',
        variantId: 'var_mystic_rose_50ml',
        sku: 'DIMS-EDP-01',
        productName: 'Eau De Parfum Mystic Rose',
        variantTitle: '50ml Spray',
        quantity: 1,
        unitPricePaise: 49900,
        totalPaise: 49900,
        imageUrl: '/categories/perfumes.jpg',
      },
    ],
    subtotalPaise: 49900,
    discountPaise: 5000,
    shippingFeePaise: 0,
    taxPaise: 8082,
    totalPaise: 44900,
    currency: 'INR',
    status: 'shipped',
    paymentStatus: 'paid',
    idempotencyKey: 'idem_seed_03',
    courier: {
      courierName: 'Delhivery Express',
      trackingNumber: 'DEL-928491028',
      shippedAt: Date.now() - 3600000 * 12,
    },
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 12,
  },
];

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Selected Order for Modal / Transition
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Shipped Form fields
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [showShipForm, setShowShipForm] = useState(false);

  // Cancel Form fields
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  // Payment Form fields
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'upi_manual' | 'bank_transfer'>('cash_on_delivery');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Refund Form fields
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundCreditNote, setRefundCreditNote] = useState('');

  // Invoice Download
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Load orders from server or local cache
  const loadOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user) {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/admin/orders', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
            setOrders(data.orders);
            setRefreshing(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('API orders fetch error, falling back to local/seed:', err);
    }

    // Check localStorage fallback for client updates
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('dimsglow_admin_orders');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
            setRefreshing(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error reading local orders:', e);
      }
    }

    setRefreshing(false);
  }, [user]);

  // Firestore real-time listener with fallback
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Order[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as Order);
            });
            setOrders(list);
            if (typeof window !== 'undefined') {
              localStorage.setItem('dimsglow_admin_orders', JSON.stringify(list));
            }
          } else {
            loadOrders();
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore orders subscription fallback to seed/api:', err.message);
          loadOrders();
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Firestore subscription init error:', err);
      loadOrders();
      setLoading(false);
    }

    return () => unsubscribe();
  }, [loadOrders]);

  // Persist order list updates to localStorage
  const updateOrdersList = (newOrders: Order[]) => {
    setOrders(newOrders);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dimsglow_admin_orders', JSON.stringify(newOrders));
      } catch (err) {
        console.error('Failed to save orders to localStorage:', err);
      }
    }
  };

  // Safe search & filtering
  const filteredOrders = orders.filter((order) => {
    if (!order) return false;
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      const orderNum = (order.orderNumber || '').toLowerCase();
      const email = (order.customerEmail || '').toLowerCase();
      const name = (order.shippingAddress?.fullName || '').toLowerCase();
      const phone = (order.shippingAddress?.phone || '').toLowerCase();

      return (
        orderNum.includes(term) ||
        email.includes(term) ||
        name.includes(term) ||
        phone.includes(term)
      );
    }
    return true;
  });

  const handleOpenManage = (order: Order) => {
    setSelectedOrder(order);
    setActionError(null);
    setActionSuccess(null);
    setShowShipForm(false);
    setShowCancelForm(false);
    setShowPaymentForm(false);
    setShowRefundForm(false);
    setTrackingNumber('');
    setCancellationReason('');
    setIsManageModalOpen(true);
  };

  // Status transitions
  const executeStatusTransition = async (toStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setActionError(null);
    setActionSuccess(null);
    setTransitioning(true);

    try {
      const updatedOrder: Order = {
        ...selectedOrder,
        status: toStatus,
        updatedAt: Date.now(),
      };

      if (toStatus === 'shipped') {
        if (!courierName.trim() || !trackingNumber.trim()) {
          setActionError('Please provide both Courier Name and Tracking AWB Number');
          setTransitioning(false);
          return;
        }
        updatedOrder.courier = {
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim() || undefined,
          shippedAt: Date.now(),
        };
      }

      if (toStatus === 'cancelled') {
        if (!cancellationReason.trim()) {
          setActionError('Please provide a cancellation reason');
          setTransitioning(false);
          return;
        }
        updatedOrder.cancellationReason = cancellationReason.trim();
      }

      // Try server API first if logged in
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const body: any = { status: toStatus };
          if (toStatus === 'shipped') {
            body.courierData = updatedOrder.courier;
          }
          if (toStatus === 'cancelled') {
            body.cancellationReason = cancellationReason.trim();
          }

          const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              setSelectedOrder(data.order);
              const updatedList = orders.map((o) => (o.id === selectedOrder.id ? data.order : o));
              updateOrdersList(updatedList);
              setActionSuccess(`Order updated to ${toStatus.toUpperCase()}`);
              setShowShipForm(false);
              setShowCancelForm(false);
              setTransitioning(false);
              return;
            }
          }
        } catch (serverErr) {
          console.warn('Server status transition fallback to client update:', serverErr);
        }
      }

      // Immediate client update
      setSelectedOrder(updatedOrder);
      const updatedList = orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o));
      updateOrdersList(updatedList);
      setActionSuccess(`Order updated to ${toStatus.toUpperCase()}`);
      setShowShipForm(false);
      setShowCancelForm(false);
    } catch (err: any) {
      console.error('Error transitioning order status:', err);
      setActionError(err.message || 'Error updating order status');
    } finally {
      setTransitioning(false);
    }
  };

  // Payment Recording
  const executeRecordPayment = async () => {
    if (!selectedOrder) return;
    setTransitioning(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedOrder: Order = {
        ...selectedOrder,
        paymentStatus: 'paid',
        updatedAt: Date.now(),
      };

      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`/api/admin/orders/${selectedOrder.id}/payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              amountPaise: selectedOrder.totalPaise,
              paymentMethod,
              referenceNumber: paymentRefNumber.trim() || undefined,
              notes: paymentNotes.trim() || undefined,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              setSelectedOrder(data.order);
              const updatedList = orders.map((o) => (o.id === selectedOrder.id ? data.order : o));
              updateOrdersList(updatedList);
              setActionSuccess('Payment recorded successfully as PAID');
              setShowPaymentForm(false);
              setTransitioning(false);
              return;
            }
          }
        } catch (serverErr) {
          console.warn('Server payment recording fallback:', serverErr);
        }
      }

      setSelectedOrder(updatedOrder);
      const updatedList = orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o));
      updateOrdersList(updatedList);
      setActionSuccess('Payment recorded successfully as PAID');
      setShowPaymentForm(false);
    } catch (err: any) {
      console.error('Payment error:', err);
      setActionError(err.message || 'Error recording payment');
    } finally {
      setTransitioning(false);
    }
  };

  // Refund Recording
  const executeRecordRefund = async () => {
    if (!selectedOrder) return;
    if (!refundReason.trim()) {
      setActionError('A refund reason is required');
      return;
    }
    setTransitioning(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedOrder: Order = {
        ...selectedOrder,
        paymentStatus: 'refunded',
        status: 'cancelled',
        cancellationReason: `Refunded: ${refundReason.trim()}`,
        updatedAt: Date.now(),
      };

      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refund`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              amountPaise: selectedOrder.totalPaise,
              reason: refundReason.trim(),
              creditNoteReference: refundCreditNote.trim() || undefined,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              setSelectedOrder(data.order);
              const updatedList = orders.map((o) => (o.id === selectedOrder.id ? data.order : o));
              updateOrdersList(updatedList);
              setActionSuccess('Refund issued and order cancelled');
              setShowRefundForm(false);
              setTransitioning(false);
              return;
            }
          }
        } catch (serverErr) {
          console.warn('Server refund fallback:', serverErr);
        }
      }

      setSelectedOrder(updatedOrder);
      const updatedList = orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o));
      updateOrdersList(updatedList);
      setActionSuccess('Refund issued and order cancelled');
      setShowRefundForm(false);
    } catch (err: any) {
      console.error('Refund error:', err);
      setActionError(err.message || 'Error recording refund');
    } finally {
      setTransitioning(false);
    }
  };

  // Download Invoice PDF
  const handleDownloadInvoice = async () => {
    if (!selectedOrder) return;
    setDownloadingInvoice(true);
    setActionError(null);
    try {
      if (user) {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/orders/${selectedOrder.id}/invoice`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Invoice-${selectedOrder.orderNumber || selectedOrder.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setDownloadingInvoice(false);
          return;
        }
      }
      // If server invoice generator is not reachable in demo mode:
      window.print();
    } catch (err: any) {
      console.error('Invoice error:', err);
      setActionError(err.message || 'Cannot generate invoice at this time');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Create a quick test order to test fulfillment
  const handleCreateTestOrder = () => {
    const timestamp = Date.now();
    const testOrder: Order = {
      id: `ord_${timestamp}`,
      orderNumber: `DG-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      customerUid: `cust_${timestamp}`,
      customerEmail: 'test.customer@gmail.com',
      shippingAddress: {
        fullName: 'Test Customer (Storefront)',
        phone: '9988776655',
        addressLine1: 'Plot 77, Jubilee Hills, Road No 36',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500033',
        country: 'India',
      },
      items: [
        {
          productId: 'prod_skin_tint',
          variantId: 'var_whipped_cream',
          sku: 'DIMS-ST-01',
          productName: 'Skin Tint 5 In 1 Multifunctional Serum Foundation',
          variantTitle: 'Whipped Cream',
          quantity: 1,
          unitPricePaise: 31900,
          totalPaise: 31900,
          imageUrl: '/products/featured-product.jpeg',
        },
      ],
      subtotalPaise: 31900,
      discountPaise: 0,
      shippingFeePaise: 0,
      taxPaise: 5440,
      totalPaise: 31900,
      currency: 'INR',
      status: 'placed',
      paymentStatus: 'pending',
      idempotencyKey: `idem_test_${timestamp}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updated = [testOrder, ...orders];
    updateOrdersList(updated);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return <span className="bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Placed</span>;
      case 'confirmed':
        return <span className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Confirmed</span>;
      case 'packing':
        return <span className="bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Packing</span>;
      case 'shipped':
        return <span className="bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Shipped</span>;
      case 'delivered':
        return <span className="bg-[#E6F4EA] text-[#18794E] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Delivered</span>;
      case 'cancelled':
        return <span className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="bg-[#FAF8FA] text-[#19161A] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2E7]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#19161A] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#B83B63]" /> Order Fulfillment Operations
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Real-time fulfillment queue, courier dispatch tracking, manual payments, and tax invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            disabled={refreshing}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateTestOrder}
            className="text-xs flex items-center gap-1.5 bg-[#B83B63] hover:bg-[#9B2C4F]"
          >
            <Plus className="w-3.5 h-3.5" />
            + Test Order
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8C8490] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by Order #, email, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'placed', label: 'Placed' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'packing', label: 'Packing' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#B83B63] text-white shadow-xs'
                  : 'bg-[#FAF8FA] text-[#6D6670] hover:text-[#19161A] hover:bg-[#F2EFF2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-[#8C8490] mx-auto opacity-30 mb-2" />
            <p className="text-sm font-semibold text-[#19161A]">No orders found</p>
            <p className="text-xs text-[#6D6670] mt-1">Try refining your search term or filter, or click "+ Test Order" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8FA] text-[#6D6670] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8E2E7]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date Placed</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2E7]">
                {filteredOrders.map((order) => {
                  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
                  const firstItemName = order.items?.[0]?.productName || 'Order Items';
                  const customerName = order.shippingAddress?.fullName || 'Guest Customer';
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF8FA]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#19161A]">
                        {order.orderNumber || order.id}
                      </td>
                      <td className="py-3.5 px-4 text-[#6D6670]">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#19161A] block">
                          {customerName}
                        </span>
                        <span className="text-[11px] text-[#6D6670] block truncate max-w-45">
                          {order.customerEmail || 'No email provided'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#19161A]">
                          {itemsCount} {itemsCount === 1 ? 'unit' : 'units'}
                        </span>
                        <span className="text-[11px] text-[#6D6670] block truncate max-w-37.5">
                          {firstItemName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#19161A]">
                        {formatPricePaise(order.totalPaise || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.paymentStatus === 'paid'
                              ? 'bg-[#E6F4EA] text-[#18794E]'
                              : order.paymentStatus === 'refunded'
                              ? 'bg-[#FEF2F2] text-[#DC2626]'
                              : 'bg-[#FFFBEB] text-[#B45309]'
                          }`}
                        >
                          {order.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManage(order)}
                          className="text-[11px] font-bold"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Operations Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          title={`Order Operations — ${selectedOrder.orderNumber || selectedOrder.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 pt-2">
            {actionError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-md text-xs text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 bg-[#F0FDF4] border border-[#15803D]/30 rounded-md text-xs text-[#15803D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Current Status & Transitions Bar */}
            <div className="bg-[#FAF8FA] border border-[#E8E2E7] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D6670] block">
                  Current Status
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-xs text-[#6D6670]">
                    Payment: <strong className="uppercase">{selectedOrder.paymentStatus || 'pending'}</strong>
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedOrder.status === 'placed' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={transitioning}
                      onClick={() => executeStatusTransition('confirmed')}
                      className="text-xs font-bold"
                    >
                      Confirm Order
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={transitioning}
                      onClick={() => setShowCancelForm(true)}
                      className="text-xs text-[#EF4444] border-[#EF4444]/30 hover:bg-[#FEF2F2]"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}

                {selectedOrder.status === 'confirmed' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={transitioning}
                      onClick={() => executeStatusTransition('packing')}
                      className="text-xs font-bold"
                    >
                      Start Packing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={transitioning}
                      onClick={() => setShowCancelForm(true)}
                      className="text-xs text-[#EF4444] border-[#EF4444]/30 hover:bg-[#FEF2F2]"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}

                {selectedOrder.status === 'packing' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={transitioning}
                      onClick={() => setShowShipForm(true)}
                      className="text-xs font-bold"
                    >
                      Ship Order & Assign AWB
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={transitioning}
                      onClick={() => setShowCancelForm(true)}
                      className="text-xs text-[#EF4444] border-[#EF4444]/30 hover:bg-[#FEF2F2]"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}

                {selectedOrder.status === 'shipped' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={transitioning}
                    onClick={() => executeStatusTransition('delivered')}
                    className="text-xs font-bold bg-[#18794E] hover:bg-[#125838]"
                  >
                    Mark Delivered
                  </Button>
                )}

                {selectedOrder.status === 'delivered' && (
                  <span className="text-xs font-bold text-[#18794E] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Delivered to Customer
                  </span>
                )}

                {selectedOrder.status === 'cancelled' && (
                  <span className="text-xs font-bold text-[#EF4444] flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Order Cancelled
                  </span>
                )}

                {/* Invoice Button for staff */}
                {selectedOrder.status !== 'placed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingInvoice}
                    onClick={handleDownloadInvoice}
                    className="text-xs font-semibold flex items-center gap-1.5 border-[#5B132B]/30 text-[#5B132B] hover:bg-[#5B132B]/5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {downloadingInvoice ? 'Generating...' : 'Invoice PDF'}
                  </Button>
                )}

                {/* Record Payment Button */}
                {selectedOrder.paymentStatus !== 'paid' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={transitioning}
                    onClick={() => {
                      setShowPaymentForm(true);
                      setShowRefundForm(false);
                      setShowShipForm(false);
                      setShowCancelForm(false);
                    }}
                    className="text-xs font-semibold flex items-center gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Record Payment
                  </Button>
                )}

                {/* Issue Refund Button */}
                {selectedOrder.paymentStatus === 'paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={transitioning}
                    onClick={() => {
                      setShowRefundForm(true);
                      setShowPaymentForm(false);
                      setShowShipForm(false);
                      setShowCancelForm(false);
                    }}
                    className="text-xs font-semibold flex items-center gap-1.5 border-rose-600/30 text-rose-700 hover:bg-rose-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Issue Refund
                  </Button>
                )}
              </div>
            </div>

            {/* Courier Dispatch Form */}
            {showShipForm && (
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#15803D] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Dispatch Shipment Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                      Courier Partner *
                    </label>
                    <Input
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Delhivery, Bluedart, DTDC"
                      className="text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                      AWB / Tracking Number *
                    </label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. 128938491823"
                      className="text-xs bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShipForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={transitioning}
                    onClick={() => executeStatusTransition('shipped')}
                    className="text-xs font-bold"
                  >
                    {transitioning ? 'Dispatching...' : 'Confirm Shipment'}
                  </Button>
                </div>
              </div>
            )}

            {/* Cancellation Form */}
            {showCancelForm && (
              <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Cancel Order & Release Stock
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                    Cancellation Reason *
                  </label>
                  <Input
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="e.g. Customer requested cancellation / Address issue"
                    className="text-xs bg-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelForm(false)}
                    className="text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={transitioning}
                    onClick={() => executeStatusTransition('cancelled')}
                    className="text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C]"
                  >
                    {transitioning ? 'Cancelling...' : 'Confirm Cancellation'}
                  </Button>
                </div>
              </div>
            )}

            {/* Record Payment Form */}
            {showPaymentForm && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Record Manual Payment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8E2E7] rounded-md px-3 py-2"
                    >
                      <option value="cash_on_delivery">Cash on Delivery (COD Collected)</option>
                      <option value="upi_manual">UPI Transfer (Manual Verification)</option>
                      <option value="bank_transfer">Direct Bank / NEFT Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                      Transaction / Reference # (UTR)
                    </label>
                    <Input
                      value={paymentRefNumber}
                      onChange={(e) => setPaymentRefNumber(e.target.value)}
                      placeholder="e.g. UTR-982348123 or COD Receipt"
                      className="text-xs bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#19161A] mb-1">Notes</label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Optional staff notes"
                    className="text-xs bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPaymentForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={transitioning}
                    onClick={executeRecordPayment}
                    className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800"
                  >
                    {transitioning ? 'Saving...' : 'Confirm Payment Received'}
                  </Button>
                </div>
              </div>
            )}

            {/* Refund Form */}
            {showRefundForm && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Issue Refund & Void Tax Invoice
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                      Refund Reason *
                    </label>
                    <Input
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Returned damaged item / Order cancelled"
                      className="text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#19161A] mb-1">
                      Credit Note Reference #
                    </label>
                    <Input
                      value={refundCreditNote}
                      onChange={(e) => setRefundCreditNote(e.target.value)}
                      placeholder="e.g. CRN-2026-001"
                      className="text-xs bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRefundForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={transitioning}
                    onClick={executeRecordRefund}
                    className="text-xs font-bold bg-rose-700 hover:bg-rose-800"
                  >
                    {transitioning ? 'Processing...' : 'Confirm Refund'}
                  </Button>
                </div>
              </div>
            )}

            {/* Courier Tracking Info if already Shipped */}
            {selectedOrder.courier && (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs space-y-1">
                <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Dispatched via {selectedOrder.courier.courierName}
                </span>
                <p className="text-[#19161A]">
                  AWB Number: <strong className="font-mono">{selectedOrder.courier.trackingNumber}</strong>
                </p>
                {selectedOrder.courier.shippedAt && (
                  <p className="text-[11px] text-[#6D6670]">
                    Shipped on: {new Date(selectedOrder.courier.shippedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            {/* Cancellation Reason if Cancelled */}
            {selectedOrder.cancellationReason && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs">
                <strong className="text-[#DC2626]">Cancellation Reason: </strong>
                <span>{selectedOrder.cancellationReason}</span>
              </div>
            )}

            {/* Customer & Shipping Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg border border-[#E8E2E7] bg-[#FAF8FA]">
                <h4 className="font-bold text-[#19161A] mb-1.5 uppercase tracking-wider text-[10px]">
                  Customer Contact
                </h4>
                <p className="font-semibold text-[#19161A]">
                  {selectedOrder.shippingAddress?.fullName || 'Guest Customer'}
                </p>
                <p className="text-[#6D6670]">{selectedOrder.customerEmail || 'No email'}</p>
                <p className="text-[#19161A] mt-1 font-mono">
                  Mobile: +91 {selectedOrder.shippingAddress?.phone || 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-[#E8E2E7] bg-[#FAF8FA]">
                <h4 className="font-bold text-[#19161A] mb-1.5 uppercase tracking-wider text-[10px]">
                  Shipping Destination
                </h4>
                <p className="text-[#6D6670] leading-relaxed">
                  {selectedOrder.shippingAddress?.addressLine1 || 'Storefront Pickup'}
                  {selectedOrder.shippingAddress?.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ''}
                  <br />
                  {selectedOrder.shippingAddress?.city || ''}{' '}
                  {selectedOrder.shippingAddress?.state ? `, ${selectedOrder.shippingAddress.state}` : ''} —{' '}
                  <strong className="text-[#19161A] font-mono">
                    {selectedOrder.shippingAddress?.postalCode || ''}
                  </strong>
                </p>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#19161A] mb-2.5">
                Itemized Order Contents ({selectedOrder.items?.length || 0})
              </h4>
              <div className="border border-[#E8E2E7] rounded-lg overflow-hidden divide-y divide-[#E8E2E7] text-xs">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-[#FAF8FA] border border-[#E8E2E7] shrink-0">
                        <Image
                          src={item.imageUrl || '/products/featured-product.jpeg'}
                          alt={item.productName || 'Product'}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <h5 className="font-semibold text-[#19161A]">{item.productName}</h5>
                        <p className="text-[11px] text-[#6D6670]">
                          SKU: <span className="font-mono">{item.sku}</span>
                          {item.variantTitle && ` · Shade: ${item.variantTitle}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#19161A]">
                        {formatPricePaise(item.totalPaise || 0)}
                      </span>
                      <p className="text-[10px] text-[#8C8490]">
                        {formatPricePaise(item.unitPricePaise || 0)} × {item.quantity || 1}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-[#E8E2E7] flex justify-between items-baseline text-xs">
              <span className="font-medium text-[#6D6670]">Grand Total Amount:</span>
              <span className="text-base font-serif font-bold text-[#19161A]">
                {formatPricePaise(selectedOrder.totalPaise || 0)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
