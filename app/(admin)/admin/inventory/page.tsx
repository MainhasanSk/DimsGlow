'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getAllProducts, updateStock, batchUpdateStock } from '@/lib/catalog/productStore';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Save,
  ChevronDown,
  ChevronUp,
  Package,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

interface ProductInventoryGroup {
  product: Product;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  variants: ProductVariant[];
  healthStatus: 'healthy' | 'low' | 'out';
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State for Dedicated Restock Adjustment
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>('');
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>('10');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Restock Shipment Received');

  // Load products from productStore and listen for updates
  const loadInventory = () => {
    const list = getAllProducts();
    setProducts(list);
  };

  useEffect(() => {
    loadInventory();

    const handleUpdate = () => {
      loadInventory();
    };

    window.addEventListener('dimsglow_catalog_updated', handleUpdate);
    return () => window.removeEventListener('dimsglow_catalog_updated', handleUpdate);
  }, []);

  // Group variants by product
  const inventoryGroups: ProductInventoryGroup[] = useMemo(() => {
    return products.map((p) => {
      const totalOnHand = p.variants.reduce((acc, v) => acc + (v.onHand || 0), 0);
      const totalReserved = p.variants.reduce((acc, v) => acc + (v.reserved || 0), 0);
      const totalAvailable = Math.max(0, totalOnHand - totalReserved);

      const hasOutOfStock = p.variants.some((v) => (v.onHand || 0) <= 0);
      const hasLowStock = p.variants.some((v) => {
        const avail = (v.onHand || 0) - (v.reserved || 0);
        return avail > 0 && avail <= (v.lowStockThreshold || 5);
      });

      let healthStatus: 'healthy' | 'low' | 'out' = 'healthy';
      if (totalAvailable <= 0 || hasOutOfStock) {
        healthStatus = 'out';
      } else if (hasLowStock) {
        healthStatus = 'low';
      }

      return {
        product: p,
        totalOnHand,
        totalReserved,
        totalAvailable,
        variants: p.variants,
        healthStatus,
      };
    });
  }, [products]);

  // Filtered inventory list
  const filteredGroups = useMemo(() => {
    return inventoryGroups.filter((group) => {
      const p = group.product;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.categoryIds.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'low') {
        matchesStatus = group.healthStatus === 'low';
      } else if (statusFilter === 'out') {
        matchesStatus = group.healthStatus === 'out';
      } else if (statusFilter === 'healthy') {
        matchesStatus = group.healthStatus === 'healthy';
      }

      return matchesSearch && matchesStatus;
    });
  }, [inventoryGroups, searchQuery, statusFilter]);

  // Overall Warehouse Metrics
  const totalProductsCount = products.length;
  const totalActiveSkus = products.reduce((acc, p) => acc + p.variants.length, 0);
  const totalWarehouseUnits = inventoryGroups.reduce((acc, g) => acc + g.totalOnHand, 0);
  const lowStockCount = inventoryGroups.filter((g) => g.healthStatus === 'low').length;
  const outOfStockCount = inventoryGroups.filter((g) => g.healthStatus === 'out').length;

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Quick inline increment / decrement
  const handleQuickAdjust = (sku: string, currentOnHand: number, delta: number) => {
    const newQty = Math.max(0, currentOnHand + delta);
    updateStock(sku, newQty);
    setLastSavedTime(new Date().toLocaleTimeString('en-IN'));
    showNotification(`Updated SKU ${sku}: ${newQty} units`);
  };

  const handleOpenAdjustModal = (product: Product, defaultSku?: string) => {
    setSelectedProduct(product);
    setSelectedVariantSku(defaultSku || product.variants[0]?.sku || '');
    setAdjustmentDelta('25');
    setAdjustmentReason('Restock Shipment Received');
  };

  const handleSaveModalAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariantSku) return;

    const variant = selectedProduct.variants.find((v) => v.sku === selectedVariantSku);
    if (!variant) return;

    const delta = parseInt(adjustmentDelta, 10) || 0;
    const newOnHand = Math.max(0, (variant.onHand || 0) + delta);

    updateStock(selectedVariantSku, newOnHand);
    setLastSavedTime(new Date().toLocaleTimeString('en-IN'));
    showNotification(`Restocked ${variant.title} (${selectedVariantSku}) to ${newOnHand} units`);
    setSelectedProduct(null);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2E7]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#19161A] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#B83B63]" /> Warehouse & Inventory Operations
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Organized product stock ledger, shade SKU variations, reservations, and restock controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSavedTime && (
            <span className="text-[11px] text-[#18794E] bg-[#E6F4EA] border border-[#A7F3D0] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved at {lastSavedTime}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadInventory}
            className="text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh Ledger
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-[#E6F4EA] border border-[#A7F3D0] text-[#18794E] rounded-lg text-xs font-semibold flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Catalog Products</span>
            <p className="text-2xl font-black text-[#19161A]">{totalProductsCount}</p>
            <span className="text-[10px] text-[#6D6670]">{totalActiveSkus} shade variants total</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Physical Stock</span>
            <p className="text-2xl font-black text-[#18794E]">{totalWarehouseUnits}</p>
            <span className="text-[10px] text-[#18794E] font-medium">Available on-hand units</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Low Stock Alerts</span>
            <p className="text-2xl font-black text-[#D4AF37]">{lowStockCount}</p>
            <span className="text-[10px] text-[#D4AF37] font-semibold">Near restock threshold</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Out of Stock</span>
            <p className="text-2xl font-black text-rose-600">{outOfStockCount}</p>
            <span className="text-[10px] text-rose-500 font-semibold">Requires immediate restock</span>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E2E7] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8C8490] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search products by title, SKU code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'healthy', label: 'Healthy Stock' },
            { id: 'low', label: 'Low Stock Warnings' },
            { id: 'out', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
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

      {/* Organized Product-Centric Inventory Ledger */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FA] border-b border-[#E8E2E7] text-[#6D6670] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Overview</th>
                <th className="py-3 px-4">Categories</th>
                <th className="py-3 px-4 text-center">Total On-Hand</th>
                <th className="py-3 px-4 text-center">Reserved</th>
                <th className="py-3 px-4 text-center">Available</th>
                <th className="py-3 px-4 text-center">Shades</th>
                <th className="py-3 px-4">Stock Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2E7]">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6D6670]">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const p = group.product;
                  const isExpanded = !!expandedProductIds[p.id];
                  const primaryImg =
                    p.media?.find((m) => m.isPrimary)?.secureUrl ||
                    p.media?.[0]?.secureUrl ||
                    '/products/featured-product.jpeg';

                  return (
                    <React.Fragment key={p.id}>
                      {/* Main Product Row */}
                      <tr className="hover:bg-[#FAF8FA]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg border border-[#E8E2E7] overflow-hidden shrink-0 bg-[#FAF8FA]">
                              <Image
                                src={primaryImg}
                                alt={p.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-[#19161A] line-clamp-1">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-[#6D6670] font-mono">
                                Slug: /{p.slug} · Base: {formatPricePaise(p.pricePaise)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.categoryIds.slice(0, 3).map((cid) => (
                              <span
                                key={cid}
                                className="bg-[#FAF8FA] border border-[#E8E2E7] text-[#6D6670] px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              >
                                {cid}
                              </span>
                            ))}
                            {p.categoryIds.length > 3 && (
                              <span className="text-[10px] text-[#8C8490]">
                                +{p.categoryIds.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-[#19161A] text-sm">
                          {group.totalOnHand}
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-[#6D6670]">
                          {group.totalReserved}
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-sm">
                          <span
                            className={
                              group.totalAvailable <= 0
                                ? 'text-rose-600'
                                : group.totalAvailable <= 10
                                ? 'text-[#D4AF37]'
                                : 'text-[#18794E]'
                            }
                          >
                            {group.totalAvailable}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FAF8FA] border border-[#E8E2E7] hover:bg-[#F2EFF2] text-xs font-semibold text-[#19161A] transition-colors cursor-pointer"
                          >
                            <span>{group.variants.length} shades</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          {group.healthStatus === 'healthy' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#18794E] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                              <CheckCircle2 className="w-3 h-3" /> Healthy
                            </span>
                          ) : group.healthStatus === 'low' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
                              <XCircle className="w-3 h-3" /> Out of Stock
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAdjustModal(p)}
                            className="text-[11px] font-bold bg-[#B83B63] hover:bg-[#9B2C4F]"
                          >
                            Update Stock
                          </Button>
                        </td>
                      </tr>

                      {/* Expandable Shade Breakdown Table */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-[#FAF8FA]/80">
                            <div className="p-4 pl-14 space-y-2 border-y border-[#E8E2E7]">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#6D6670]">
                                Shade Variations & SKU Inventory Controls ({group.variants.length})
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.variants.map((v) => {
                                  const swatch = v.options?.find((o) => o.swatchColor)?.swatchColor;
                                  const avail = (v.onHand || 0) - (v.reserved || 0);

                                  return (
                                    <div
                                      key={v.sku}
                                      className="p-3 bg-white rounded-lg border border-[#E8E2E7] shadow-2xs space-y-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {swatch ? (
                                            <span
                                              className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                                              style={{ backgroundColor: swatch }}
                                            />
                                          ) : (
                                            <span className="w-4 h-4 rounded-full bg-neutral-200 border border-neutral-300" />
                                          )}
                                          <div>
                                            <span className="font-bold text-[#19161A] text-xs block">
                                              {v.title}
                                            </span>
                                            <span className="text-[10px] font-mono text-[#6D6670]">
                                              SKU: {v.sku}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-extrabold text-sm text-[#19161A] block">
                                            {v.onHand} units
                                          </span>
                                          <span className="text-[10px] text-[#6D6670]">
                                            {avail} available
                                          </span>
                                        </div>
                                      </div>

                                      {/* Inline Quick Adjustment Buttons */}
                                      <div className="flex items-center justify-between pt-1 border-t border-[#F2EFF2]">
                                        <span className="text-[10px] font-semibold text-[#8C8490]">
                                          Quick Adjust:
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(v.sku, v.onHand || 0, -5)}
                                            className="px-2 py-0.5 bg-[#FAF8FA] hover:bg-[#F2EFF2] border border-[#E8E2E7] rounded text-[11px] font-bold text-[#DC2626] cursor-pointer"
                                            title="Reduce by 5"
                                          >
                                            -5
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(v.sku, v.onHand || 0, -1)}
                                            className="px-2 py-0.5 bg-[#FAF8FA] hover:bg-[#F2EFF2] border border-[#E8E2E7] rounded text-[11px] font-bold text-[#DC2626] cursor-pointer"
                                            title="Reduce by 1"
                                          >
                                            -1
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(v.sku, v.onHand || 0, 1)}
                                            className="px-2 py-0.5 bg-[#FAF8FA] hover:bg-[#F2EFF2] border border-[#E8E2E7] rounded text-[11px] font-bold text-[#18794E] cursor-pointer"
                                            title="Add 1"
                                          >
                                            +1
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(v.sku, v.onHand || 0, 10)}
                                            className="px-2 py-0.5 bg-[#FAF8FA] hover:bg-[#F2EFF2] border border-[#E8E2E7] rounded text-[11px] font-bold text-[#18794E] cursor-pointer"
                                            title="Add 10"
                                          >
                                            +10
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Persistent Bottom Bar with Save / Update Actions */}
      <div className="p-4 bg-white rounded-xl border border-[#E8E2E7] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#B83B63]" />
          <span className="text-xs text-[#6D6670]">
            All inventory modifications sync immediately with storefront stock availability and checkout reservations.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setLastSavedTime(new Date().toLocaleTimeString('en-IN'));
              showNotification('All warehouse stock balances saved and synchronized successfully!');
            }}
            className="text-xs font-bold bg-[#18794E] hover:bg-[#125838] flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save & Sync Inventory
          </Button>
        </div>
      </div>

      {/* Detailed Restock Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Restock Adjustment — ${selectedProduct.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveModalAdjustment} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                Select Shade Variant *
              </label>
              <select
                value={selectedVariantSku}
                onChange={(e) => setSelectedVariantSku(e.target.value)}
                className="w-full text-xs bg-white border border-[#E8E2E7] rounded-md px-3 py-2"
                required
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.sku} value={v.sku}>
                    {v.title} (SKU: {v.sku}) — Current Stock: {v.onHand} units
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                Quantity to Add / Adjust (Units) *
              </label>
              <Input
                type="number"
                value={adjustmentDelta}
                onChange={(e) => setAdjustmentDelta(e.target.value)}
                placeholder="e.g. 50 (or negative to deduct)"
                className="text-xs"
                required
              />
              <span className="text-[10px] text-[#6D6670] mt-0.5 block">
                Enter a positive number to add new received stock, or negative to write off damaged items.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19161A] mb-1">
                Reason / PO Reference *
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full text-xs bg-white border border-[#E8E2E7] rounded-md px-3 py-2"
              >
                <option value="Restock Shipment Received">Restock Shipment Received (Vendor Inflow)</option>
                <option value="Storefront Return Re-integrated">Customer Return Inspected & Restocked</option>
                <option value="Damaged / Breakage Write-off">Damaged / Breakage Write-off</option>
                <option value="Physical Cycle Count Reconcile">Warehouse Physical Audit Reconcile</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2E7]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedProduct(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-[#B83B63] hover:bg-[#9B2C4F]"
              >
                Apply Stock Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
