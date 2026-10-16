'use client';

import React, { useState, useEffect } from 'react';
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

  // Selected Order for Modal / Transition
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Shipped Form fields
  const [courierName, setCourierName] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [showShipForm, setShowShipForm] = useState(false);

  // Cancel Form fields
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  // Real-time Firestore subscription to orders collection
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

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
        console.warn('Orders subscription fallback:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term) ||
        order.shippingAddress.fullName.toLowerCase().includes(term) ||
        order.shippingAddress.phone.includes(term)
      );
    }
    return true;
  });

  const handleOpenManage = (order: Order) => {
    setSelectedOrder(order);
    setActionError(null);
    setShowShipForm(false);
    setShowCancelForm(false);
    setTrackingNumber('');
    setCancellationReason('');
    setIsManageModalOpen(true);
  };

  const executeStatusTransition = async (toStatus: OrderStatus) => {
    if (!selectedOrder || !user) return;
    setActionError(null);
    setTransitioning(true);

    try {
      const idToken = await user.getIdToken();
      const body: any = { status: toStatus };

      if (toStatus === 'shipped') {
        if (!courierName.trim() || !trackingNumber.trim()) {
          setActionError('Please provide both Courier Name and Tracking AWB Number');
          setTransitioning(false);
          return;
        }
        body.courierData = {
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim() || undefined,
        };
      }

      if (toStatus === 'cancelled') {
        if (!cancellationReason.trim()) {
          setActionError('Please provide a mandatory cancellation reason');
          setTransitioning(false);
          return;
        }
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

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setSelectedOrder(data.order);
      setShowShipForm(false);
      setShowCancelForm(false);
    } catch (err: any) {
      console.error('Error transitioning order status:', err);
      setActionError(err.message || 'Error updating order');
    } finally {
      setTransitioning(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return <span className="bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Placed</span>;
      case 'confirmed':
        return <span className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Confirmed</span>;
      case 'packing':
        return <span className="bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Packing</span>;
      case 'shipped':
        return <span className="bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Shipped</span>;
      case 'delivered':
        return <span className="bg-[#E6F4EA] text-[#18794E] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Delivered</span>;
      case 'cancelled':
        return <span className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Cancelled</span>;
      default:
        return <span className="bg-[#FAF8FA] text-[#19161A] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2E7]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#19161A]">
            Order Fulfillment Operations
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Real-time queue sorted newest-first. Manage packaging, dispatch courier, and track status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#6D6670]">
            Total: <strong>{orders.length}</strong> orders
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-[12px] border border-[#E8E2E7] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
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
            { id: 'all', label: 'All' },
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
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
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
      <div className="bg-white rounded-[12px] border border-[#E8E2E7] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-[#8C8490] mx-auto opacity-30 mb-2" />
            <p className="text-sm font-semibold text-[#19161A]">No orders found</p>
            <p className="text-xs text-[#6D6670] mt-1">Try refining your search term or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8FA] text-[#6D6670] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8E2E7]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date Placed</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2E7]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8FA]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#19161A]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-[#6D6670]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#19161A] block">
                        {order.shippingAddress.fullName}
                      </span>
                      <span className="text-[11px] text-[#6D6670] block truncate max-w-[180px]">
                        {order.customerEmail}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[#19161A]">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} units
                      </span>
                      <span className="text-[11px] text-[#6D6670] block truncate max-w-[150px]">
                        {order.items[0]?.productName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#19161A]">
                      {formatPricePaise(order.totalPaise)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        order.paymentStatus === 'paid'
                          ? 'bg-[#E6F4EA] text-[#18794E]'
                          : 'bg-[#FFFBEB] text-[#B45309]'
                      }`}>
                        {order.paymentStatus}
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
                ))}
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
          title={`Order Operations — ${selectedOrder.orderNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 pt-2">
            {actionError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-[6px] text-xs text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Current Status & Transitions Bar */}
            <div className="bg-[#FAF8FA] border border-[#E8E2E7] rounded-[10px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D6670] block">
                  Current Status
                </span>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-xs text-[#6D6670]">
                    Payment: <strong className="uppercase">{selectedOrder.paymentStatus}</strong>
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
              </div>
            </div>

            {/* Courier Dispatch Form (if packing -> shipped) */}
            {showShipForm && (
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] space-y-3">
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
              <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] space-y-3">
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
                    placeholder="e.g. Customer requested cancellation / Incomplete address"
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

            {/* Courier Tracking Info if already Shipped */}
            {selectedOrder.courier && (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] text-xs space-y-1">
                <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Dispatched via {selectedOrder.courier.courierName}
                </span>
                <p className="text-[#19161A]">
                  AWB Number: <strong className="font-mono">{selectedOrder.courier.trackingNumber}</strong>
                </p>
                <p className="text-[11px] text-[#6D6670]">
                  Shipped on:{' '}
                  {new Date(selectedOrder.courier.shippedAt).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* Cancellation Reason if Cancelled */}
            {selectedOrder.cancellationReason && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-xs">
                <strong className="text-[#DC2626]">Cancellation Reason: </strong>
                <span>{selectedOrder.cancellationReason}</span>
              </div>
            )}

            {/* Customer & Shipping Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-[8px] border border-[#E8E2E7] bg-[#FAF8FA]">
                <h4 className="font-bold text-[#19161A] mb-1.5 uppercase tracking-wider text-[10px]">
                  Customer Contact
                </h4>
                <p className="font-semibold text-[#19161A]">{selectedOrder.shippingAddress.fullName}</p>
                <p className="text-[#6D6670]">{selectedOrder.customerEmail}</p>
                <p className="text-[#19161A] mt-1 font-mono">Mobile: +91 {selectedOrder.shippingAddress.phone}</p>
              </div>

              <div className="p-4 rounded-[8px] border border-[#E8E2E7] bg-[#FAF8FA]">
                <h4 className="font-bold text-[#19161A] mb-1.5 uppercase tracking-wider text-[10px]">
                  Shipping Destination
                </h4>
                <p className="text-[#6D6670] leading-relaxed">
                  {selectedOrder.shippingAddress.addressLine1}
                  {selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ''}
                  <br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} —{' '}
                  <strong className="text-[#19161A] font-mono">{selectedOrder.shippingAddress.postalCode}</strong>
                </p>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#19161A] mb-2.5">
                Itemized Order Contents ({selectedOrder.items.length})
              </h4>
              <div className="border border-[#E8E2E7] rounded-[8px] overflow-hidden divide-y divide-[#E8E2E7] text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-[6px] overflow-hidden bg-[#FAF8FA] border border-[#E8E2E7] shrink-0">
                        <Image
                          src={item.imageUrl || '/brand/dimsglow-logo.jpg'}
                          alt={item.productName}
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
                        {formatPricePaise(item.totalPaise)}
                      </span>
                      <p className="text-[10px] text-[#8C8490]">
                        {formatPricePaise(item.unitPricePaise)} × {item.quantity}
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
                {formatPricePaise(selectedOrder.totalPaise)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
