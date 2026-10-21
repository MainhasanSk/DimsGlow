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
  Trash2,
  Printer,
  Phone,
  Mail,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load orders directly from server API or Firestore
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
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
            setRefreshing(false);
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('API orders fetch error:', err);
    }
    setRefreshing(false);
    setLoading(false);
  }, [user]);

  // Firestore real-time listener: strictly listens to live database records
  useEffect(() => {
    // Immediate API load for instant responsiveness
    loadOrders();

    let unsubscribe = () => {};
    try {
      const q = collection(db, 'orders');
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Order[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as Order);
            });
            list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setOrders(list);
          } else {
            // Live Firestore collection has 0 orders
            setOrders([]);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Firestore orders live listener status:', err.message);
          loadOrders();
        }
      );
    } catch (err) {
      console.warn('Firestore subscription init error:', err);
      loadOrders();
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

  // Permanently delete an order record from Firestore
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete order record #${orderNumber}? This will remove it from Firebase Firestore.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      if (db) {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'orders', orderId)).catch(() => {});
      }
      if (user) {
        const idToken = await user.getIdToken();
        await fetch(`/api/admin/orders/${orderId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        }).catch(() => {});
      }
      const updated = orders.filter((o) => o.id !== orderId);
      updateOrdersList(updated);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      setActionSuccess(`Order #${orderNumber} deleted permanently from Firestore.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Delete order error:', err);
      setActionError(err.message || 'Failed to delete order record');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1-Click WhatsApp Invoice Dispatch
  const handleSendWhatsAppInvoice = (order: Order) => {
    const phone = (order.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceUrl = `${origin}/api/orders/${order.id}/invoice`;
    const message = `Hello ${order.shippingAddress?.fullName || 'Customer'},\n\nThank you for shopping with *DIMSGLOW Luxury Cosmetics*! ✨\n\nYour official Tax Invoice for Order *#${order.orderNumber}* is ready.\n\n📦 *Order Summary*:\n• Total Amount: ${formatPricePaise(order.totalPaise)}\n• Status: ${order.status.toUpperCase()}\n• Payment: ${order.paymentStatus.toUpperCase()}\n\n📄 *Download Official PDF Invoice*:\n${invoiceUrl}\n\nFor any support, reply to this message or email us at support@dimsglow.com.\n\nWarm regards,\n*Team DIMSGLOW*`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // 1-Click Email Invoice Dispatch
  const handleSendEmailInvoice = (order: Order) => {
    const email = order.customerEmail;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const invoiceUrl = `${origin}/api/orders/${order.id}/invoice`;
    const subject = `Official Tax Invoice - DIMSGLOW Order #${order.orderNumber}`;
    const body = `Dear ${order.shippingAddress?.fullName || 'Customer'},\n\nThank you for choosing DIMSGLOW Luxury Cosmetics.\n\nPlease find the details of your purchase below:\n\nOrder Number: ${order.orderNumber}\nInvoice Amount: ${formatPricePaise(order.totalPaise)}\nStatus: ${order.status.toUpperCase()}\n\nYou can download your official GST Tax Invoice PDF at:\n${invoiceUrl}\n\nIf you have any questions regarding your delivery, feel free to reply to this email.\n\nBest regards,\nDIMSGLOW Cosmetics Pvt. Ltd.`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handlePrintInvoice = async (order?: Order | null) => {
    const targetOrder = order || selectedOrder;
    if (!targetOrder || !user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/orders/${targetOrder.id}/invoice`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Cannot print invoice: ${data.error || 'Invoice available after order confirmation.'}`);
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const printWin = window.open(blobUrl, '_blank');
      if (printWin) {
        printWin.focus();
      }
    } catch (err) {
      console.error('Print invoice error:', err);
      alert('Failed to load official invoice PDF for printing.');
    }
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
            <p className="text-xs text-[#6D6670] mt-1">Try refining your search term or filter.</p>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenManage(order)}
                            className="text-[11px] font-bold"
                          >
                            Manage
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber || order.id)}
                            className="text-[11px] text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#B91C1C] p-1.5 h-8 w-8"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
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

            {/* Official Tax Invoice & Dispatch Actions */}
            <div className="pt-4 border-t border-[#E8E2E7] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D6670] block">
                Official Tax Invoice & Customer Dispatch
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="text-xs font-semibold flex items-center justify-center gap-1.5 h-9"
                  title="Download GST Tax Invoice PDF"
                >
                  <Download className="w-3.5 h-3.5 text-[#B83B63]" />
                  {downloadingInvoice ? 'Generating...' : 'Download PDF'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="text-xs font-semibold flex items-center justify-center gap-1.5 h-9"
                  title="Print Tax Invoice"
                >
                  <Printer className="w-3.5 h-3.5 text-[#19161A]" />
                  Print
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSendWhatsAppInvoice(selectedOrder)}
                  className="text-xs font-semibold flex items-center justify-center gap-1.5 h-9 bg-[#25D366] hover:bg-[#1EBE5D] text-white border-0"
                  title="Send Invoice & Order Details to Customer via WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendEmailInvoice(selectedOrder)}
                  className="text-xs font-semibold flex items-center justify-center gap-1.5 h-9"
                  title="Send Invoice Summary to Customer via Email"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B83B63]" />
                  Email
                </Button>
              </div>

              {/* Delete Record from Database */}
              <div className="pt-3 border-t border-[#E8E2E7] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#DC2626] block">Danger Zone</span>
                  <span className="text-[10px] text-[#6D6670]">Permanently remove this order from Firestore database</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isDeleting}
                  onClick={async () => {
                    await handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber || selectedOrder.id);
                    setIsManageModalOpen(false);
                  }}
                  className="text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center gap-1.5 h-8 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Delete Record'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
