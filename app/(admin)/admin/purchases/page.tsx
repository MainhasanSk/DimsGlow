'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Package,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  IndianRupee,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { PurchaseOrder, Supplier, PurchaseOrderItem } from '@/lib/schemas/operations';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';

export default function AdminPurchasesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [receiveTargetPo, setReceiveTargetPo] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Create PO
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{
    productId: string;
    productTitle: string;
    sku: string;
    orderedQuantity: number;
    unitCostRupees: number;
  }>>([
    {
      productId: CATALOG_PRODUCTS[0]?.id || 'prod_1',
      productTitle: CATALOG_PRODUCTS[0]?.name || 'Luxury Lipstick',
      sku: CATALOG_PRODUCTS[0]?.variants[0]?.sku || 'LIP-001',
      orderedQuantity: 25,
      unitCostRupees: 250,
    },
  ]);

  // Form states for Add Supplier
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    notes: '',
  });

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();

      // Fetch POs
      const poRes = await fetch(`/api/admin/purchases?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const poData = await poRes.json();
      if (poData.success) {
        setPurchaseOrders(poData.purchaseOrders || []);
      }

      // Fetch Suppliers
      const supRes = await fetch('/api/admin/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const supData = await supRes.json();
      if (supData.success) {
        setSuppliers(supData.suppliers || []);
        if (supData.suppliers.length > 0 && !selectedSupplierId) {
          setSelectedSupplierId(supData.suppliers[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching purchase data:', err);
      setFeedbackMessage({ type: 'error', text: 'Failed to load purchase records.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, statusFilter]);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      if (!supplier) throw new Error('Please select a valid supplier');

      const items: PurchaseOrderItem[] = poItems.map((item) => ({
        productId: item.productId,
        productTitle: item.productTitle,
        sku: item.sku,
        orderedQuantity: Number(item.orderedQuantity),
        receivedQuantity: 0,
        unitCostPaise: Math.round(Number(item.unitCostRupees) * 100),
        totalCostPaise: Math.round(Number(item.orderedQuantity) * Number(item.unitCostRupees) * 100),
      }));

      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId: supplier.id,
          supplierName: supplier.name,
          items,
          notes: poNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedbackMessage({ type: 'success', text: `Purchase order ${data.purchaseOrder.poNumber} created successfully.` });
      setIsCreatePoOpen(false);
      setPoNotes('');
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to create purchase order.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivePo = async (po: PurchaseOrder) => {
    if (!user) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/purchases/${po.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: 'Stock checked and verified by receiving manager',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedbackMessage({ type: 'success', text: data.message || `PO ${po.poNumber} received and stock ledger updated.` });
      setReceiveTargetPo(null);
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to receive purchase order.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newSupplier,
          status: 'active',
          categoriesSupplied: ['Cosmetics', 'Skin Care'],
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFeedbackMessage({ type: 'success', text: `Vendor ${data.supplier.name} added successfully.` });
      setIsAddSupplierOpen(false);
      setNewSupplier({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        gstin: '',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to add supplier.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F161E] font-serif-brand">
            Purchases & Supplier Operations
          </h1>
          <p className="text-xs text-[#5D4E60] mt-0.5">
            Manage procurement orders, vendor relations, and atomic inventory restocking transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pos' ? (
            <Button
              onClick={() => setIsCreatePoOpen(true)}
              className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </Button>
          ) : (
            <Button
              onClick={() => setIsAddSupplierOpen(true)}
              className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Vendor</span>
            </Button>
          )}

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 border border-black/10 rounded-[6px] hover:bg-white text-[#5D4E60] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-[8px] text-xs font-medium flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
              : 'bg-[#FDF0ED] text-[#D9381E] border border-[#F5C6CB]'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-current underline cursor-pointer ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-black/10 flex gap-4">
        <button
          onClick={() => setActiveTab('pos')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'pos'
              ? 'border-[#B83B63] text-[#B83B63]'
              : 'border-transparent text-[#5D4E60] hover:text-[#1F161E]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-[#B83B63] text-[#B83B63]'
              : 'border-transparent text-[#5D4E60] hover:text-[#1F161E]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3.5 rounded-[8px] border border-black/10 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {['all', 'ordered', 'received', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#1F161E] text-white'
                      : 'bg-black/5 text-[#5D4E60] hover:bg-black/10'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#5D4E60]">
              Showing {purchaseOrders.length} procurement orders
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[10px] border border-black/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#1F161E] font-bold uppercase tracking-wider text-[10px] border-b border-black/10">
                  <tr>
                    <th className="py-3.5 px-4">PO Number</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Items & Units</th>
                    <th className="py-3.5 px-4">Total Cost</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Ordered Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#5D4E60]">
                        <Package className="w-8 h-8 mx-auto text-black/20 mb-2" />
                        <p className="font-semibold">No purchase orders found</p>
                        <p className="text-[11px] text-black/40 mt-0.5">
                          Create a new purchase order to start tracking procurement and stock receipts.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const totalUnits = po.items.reduce((s, i) => s + i.orderedQuantity, 0);
                      const receivedUnits = po.items.reduce((s, i) => s + (i.receivedQuantity || 0), 0);

                      return (
                        <tr key={po.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#1F161E]">
                            {po.poNumber}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#1F161E]">
                            {po.supplierName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#1F161E] block">
                              {po.items.length} line items ({totalUnits} units)
                            </span>
                            <span className="text-[10px] text-[#5D4E60] block">
                              {po.items[0]?.productTitle} {po.items.length > 1 ? `+${po.items.length - 1} more` : ''}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#1F161E]">
                            ₹{(po.totalAmountPaise / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            {po.status === 'received' ? (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Received</span>
                              </Badge>
                            ) : po.status === 'ordered' ? (
                              <Badge variant="warning" className="gap-1">
                                <Clock className="w-3 h-3" />
                                <span>In Transit</span>
                              </Badge>
                            ) : po.status === 'cancelled' ? (
                              <Badge variant="outline" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                <span>Cancelled</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline">Draft</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#5D4E60]">
                            {new Date(po.orderedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {po.status === 'ordered' && (
                              <Button
                                size="sm"
                                onClick={() => setReceiveTargetPo(po)}
                                className="bg-[#1E7E34] hover:bg-[#155724] text-white text-[11px] h-7 px-2.5 cursor-pointer"
                              >
                                Receive & Restock
                              </Button>
                            )}
                            {po.status === 'received' && (
                              <span className="text-[11px] font-semibold text-[#1E7E34] flex items-center justify-end gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Restocked
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-[10px] border border-black/10 text-center">
                <Building className="w-8 h-8 mx-auto text-black/20 mb-2" />
                <p className="font-semibold text-[#1F161E]">No suppliers registered</p>
                <p className="text-xs text-[#5D4E60] mt-0.5">
                  Add your cosmetics vendors to initiate purchase orders.
                </p>
              </div>
            ) : (
              suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white p-5 rounded-[10px] border border-black/10 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[#1F161E] text-sm">{sup.name}</h3>
                      <Badge variant={sup.status === 'active' ? 'success' : 'outline'}>
                        {sup.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#B83B63] font-semibold mt-0.5">
                      Contact: {sup.contactPerson}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-[#5D4E60]">
                      <p>Email: <span className="text-[#1F161E]">{sup.email}</span></p>
                      <p>Phone: <span className="text-[#1F161E]">{sup.phone}</span></p>
                      {sup.gstin && <p className="font-mono text-[11px]">GSTIN: {sup.gstin}</p>}
                      <p className="text-[11px] text-[#5D4E60] line-clamp-2">Address: {sup.address}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex justify-between items-center text-[11px]">
                    <span className="text-black/40">
                      Added {new Date(sup.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSupplierId(sup.id);
                        setIsCreatePoOpen(true);
                      }}
                      className="text-[#B83B63] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Create PO</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {isCreatePoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[12px] p-6 max-w-xl w-full shadow-2xl border border-black/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-black/10">
              <h2 className="text-lg font-bold text-[#1F161E] font-serif-brand">
                Create Luxury Procurement Order
              </h2>
              <button
                onClick={() => setIsCreatePoOpen(false)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1F161E] block mb-1">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson} - {s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[#1F161E]">Order Line Items</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextProd = CATALOG_PRODUCTS[poItems.length % CATALOG_PRODUCTS.length];
                      setPoItems([
                        ...poItems,
                        {
                          productId: nextProd.id,
                          productTitle: nextProd.name,
                          sku: nextProd.variants[0]?.sku || nextProd.id,
                          orderedQuantity: 20,
                          unitCostRupees: 300,
                        },
                      ]);
                    }}
                    className="text-[#B83B63] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                {poItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF8F5] rounded-[8px] border border-black/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#1F161E]">Item #{idx + 1}</span>
                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          className="text-[#EF4444] hover:underline cursor-pointer text-[11px]"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-[#5D4E60] block mb-0.5">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const prod = CATALOG_PRODUCTS.find((p) => p.id === e.target.value);
                            if (prod) {
                              const updated = [...poItems];
                              updated[idx] = {
                                ...updated[idx],
                                productId: prod.id,
                                productTitle: prod.name,
                                sku: prod.variants[0]?.sku || prod.id,
                              };
                              setPoItems(updated);
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-black/20 rounded-[4px] bg-white text-xs"
                        >
                          {CATALOG_PRODUCTS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (SKU: {p.variants[0]?.sku || p.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#5D4E60] block mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.orderedQuantity}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].orderedQuantity = parseInt(e.target.value, 10) || 1;
                            setPoItems(updated);
                          }}
                          className="w-full px-2 py-1.5 border border-black/20 rounded-[4px] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#5D4E60] block mb-0.5">Cost per unit (₹)</label>
                        <input
                          type="number"
                          min="1"
                          value={item.unitCostRupees}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].unitCostRupees = parseFloat(e.target.value) || 0;
                            setPoItems(updated);
                          }}
                          className="w-full px-2 py-1.5 border border-black/20 rounded-[4px] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#5D4E60] block mb-0.5">Line Total</label>
                        <div className="px-2 py-1.5 bg-black/5 rounded-[4px] font-bold text-[#1F161E]">
                          ₹{(item.orderedQuantity * item.unitCostRupees).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-[#1F161E] block mb-1">Procurement Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Expected delivery by Friday, batch expiry 2028."
                  className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs">
                  <span className="text-[#5D4E60]">Estimated Total: </span>
                  <span className="text-sm font-bold text-[#1F161E]">
                    ₹{poItems.reduce((s, i) => s + i.orderedQuantity * i.unitCostRupees, 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatePoOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white cursor-pointer"
                  >
                    {isSubmitting ? 'Placing Order...' : 'Submit Purchase Order'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIVE PO & RESTOCK */}
      {receiveTargetPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[12px] p-6 max-w-md w-full shadow-2xl border border-black/10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <h2 className="text-base font-bold text-[#1F161E] font-serif-brand">
                Confirm Inventory Restock
              </h2>
              <button
                onClick={() => setReceiveTargetPo(null)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#5D4E60]">
              <p>
                You are about to mark purchase order{' '}
                <strong className="text-[#1F161E] font-mono">{receiveTargetPo.poNumber}</strong> as{' '}
                <strong className="text-[#1E7E34]">RECEIVED</strong>.
              </p>

              <div className="bg-[#FAF8F5] p-3 rounded-[8px] border border-black/10 space-y-1.5">
                <p className="font-bold text-[#1F161E] text-[11px] uppercase tracking-wide">
                  Items to restock into ledger:
                </p>
                {receiveTargetPo.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{it.productTitle}</span>
                    <span className="font-bold text-[#1E7E34]">+{it.orderedQuantity} units</span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[#FFF8E7] border border-[#FFEBAA] rounded-[6px] text-[11px] text-[#856404] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  This executes an atomic transaction that idempotently appends to `stockMovements` and prevents double counting.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setReceiveTargetPo(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => handleReceivePo(receiveTargetPo)}
                className="bg-[#1E7E34] hover:bg-[#155724] text-white cursor-pointer"
              >
                {isSubmitting ? 'Restocking...' : 'Confirm Receipt & Restock'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[12px] p-6 max-w-lg w-full shadow-2xl border border-black/10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <h2 className="text-base font-bold text-[#1F161E] font-serif-brand">
                Register New Supplier / Vendor
              </h2>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Company / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="e.g. Aura Fragrances & Packaging Ltd"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="vendor@aurapack.in"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F161E] block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#1F161E] block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={newSupplier.gstin}
                    onChange={(e) => setNewSupplier({ ...newSupplier, gstin: e.target.value.toUpperCase() })}
                    placeholder="18AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#1F161E] block mb-1">Physical Address *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    placeholder="Industrial Area, Phase 2, Guwahati, Assam"
                    className="w-full px-3 py-2 border border-black/20 rounded-[6px] bg-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Vendor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
