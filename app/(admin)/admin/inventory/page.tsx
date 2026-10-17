'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Minus,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

interface InventoryItem {
  productId: string;
  productName: string;
  productSlug: string;
  category: string;
  imageUrl: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  swatchColor?: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
}

export default function AdminInventoryPage() {
  // Flatten products and variants into inventory items
  const initialItems: InventoryItem[] = useMemo(() => {
    const list: InventoryItem[] = [];
    CATALOG_PRODUCTS.forEach((p) => {
      const img = p.media?.find((m) => m.isPrimary)?.secureUrl || p.media?.[0]?.secureUrl || '/brand/dimsglow-logo.jpg';
      p.variants.forEach((v) => {
        const swatch = v.options?.find((o) => o.swatchColor)?.swatchColor;
        list.push({
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
          category: p.categoryIds[0] || 'all',
          imageUrl: img,
          variantId: v.id,
          variantTitle: v.title,
          sku: v.sku,
          swatchColor: swatch,
          onHand: v.onHand,
          reserved: v.reserved,
          lowStockThreshold: v.lowStockThreshold || 5,
        });
      });
    });
    return list;
  }, []);

  const [inventory, setInventory] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');

  // Adjust Stock Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<string>('0');
  const [adjustmentReason, setAdjustmentReason] = useState('Restock Shipment');

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.variantTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const available = item.onHand - item.reserved;
      let matchesStatus = true;
      if (statusFilter === 'low') {
        matchesStatus = available > 0 && available <= item.lowStockThreshold;
      } else if (statusFilter === 'out') {
        matchesStatus = available <= 0;
      } else if (statusFilter === 'healthy') {
        matchesStatus = available > item.lowStockThreshold;
      }

      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, statusFilter]);

  // Metrics
  const totalSkuCount = inventory.length;
  const totalUnits = inventory.reduce((acc, i) => acc + i.onHand, 0);
  const lowStockCount = inventory.filter(
    (i) => i.onHand - i.reserved > 0 && i.onHand - i.reserved <= i.lowStockThreshold
  ).length;
  const outOfStockCount = inventory.filter((i) => i.onHand - i.reserved <= 0).length;

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentQty('10');
    setAdjustmentReason('Restock Shipment');
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const delta = parseInt(adjustmentQty, 10) || 0;
    setInventory((prev) =>
      prev.map((i) =>
        i.sku === selectedItem.sku
          ? { ...i, onHand: Math.max(0, i.onHand + delta) }
          : i
      )
    );

    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif-brand text-[#19161A] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#B83B63]" /> Inventory Management
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Realtime warehouse ledger, SKU shade stock tracking, reservations, and restock alerts.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Total Active SKUs</span>
            <p className="text-2xl font-black text-[#19161A]">{totalSkuCount}</p>
            <span className="text-[10px] text-[#6D6670]">Across all shade variants</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Warehouse Units</span>
            <p className="text-2xl font-black text-[#18794E]">{totalUnits}</p>
            <span className="text-[10px] text-[#18794E] font-medium">Physical on-hand count</span>
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
            <span className="text-[10px] text-rose-500 font-semibold">Zero available units</span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <Card className="bg-white border-[#E8E2E7]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-[#6D6670] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search inventory by product, SKU, or shade name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] focus:outline-none focus:border-[#B83B63]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] focus:outline-none focus:border-[#B83B63]"
              >
                <option value="all">All Stock Health Levels</option>
                <option value="healthy">Healthy Stock ({'>'} Threshold)</option>
                <option value="low">Low Stock Warning (≤ Threshold)</option>
                <option value="out">Out of Stock (0 units)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FA] border-b border-[#E8E2E7] text-[#6D6670] uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item & Shade Variant</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4 text-center">On-Hand</th>
                <th className="py-3 px-4 text-center">Reserved</th>
                <th className="py-3 px-4 text-center">Available</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2E7]">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6D6670]">
                    No inventory items match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const available = item.onHand - item.reserved;
                  const isOut = available <= 0;
                  const isLow = available > 0 && available <= item.lowStockThreshold;

                  return (
                    <tr key={item.sku} className="hover:bg-[#FAF8FA]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg border border-[#E8E2E7] overflow-hidden shrink-0 bg-[#FAF8FA]">
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-[#19161A] line-clamp-1">
                              {item.productName}
                            </h4>
                            <div className="flex items-center gap-1.5">
                              {item.swatchColor && (
                                <span
                                  className="w-3 h-3 rounded-full border border-black/20 shrink-0 inline-block"
                                  style={{ backgroundColor: item.swatchColor }}
                                />
                              )}
                              <span className="text-[11px] text-[#6D6670] font-medium">
                                {item.variantTitle}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#19161A]">
                        {item.sku}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-[#19161A]">
                        {item.onHand}
                      </td>

                      <td className="py-3 px-4 text-center text-[#6D6670]">
                        {item.reserved}
                      </td>

                      <td className="py-3 px-4 text-center font-black text-sm">
                        <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-[#18794E]'}>
                          {available}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isOut ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3" /> Out of Stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="warning" className="flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Low ({available} left)
                          </Badge>
                        ) : (
                          <Badge variant="success" className="flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjust(item)}
                          className="text-xs"
                        >
                          Adjust Qty
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`Adjust Inventory: ${selectedItem.sku}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div className="p-3 rounded-lg bg-[#FAF8FA] border border-[#E8E2E7] space-y-1 text-xs">
              <p className="font-bold text-[#19161A]">{selectedItem.productName}</p>
              <p className="text-[#6D6670]">Variant: {selectedItem.variantTitle}</p>
              <div className="flex gap-4 pt-1 font-semibold">
                <span>Current On-Hand: <strong>{selectedItem.onHand}</strong></span>
                <span>Reserved: <strong>{selectedItem.reserved}</strong></span>
                <span>Available: <strong className="text-[#18794E]">{selectedItem.onHand - selectedItem.reserved}</strong></span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Quantity Adjustment (+/- units) *</label>
              <Input
                type="number"
                placeholder="+10 or -5"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(e.target.value)}
                required
              />
              <p className="text-[10px] text-[#6D6670]">
                Enter a positive number to add stock (restock), or a negative number to write off.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Reason for Adjustment</label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-white focus:outline-none focus:border-[#B83B63]"
              >
                <option value="Restock Shipment">Restock Shipment from Manufacturer</option>
                <option value="Inventory Audit Correction">Physical Cycle Count Correction</option>
                <option value="Damage / Spoilage">Damaged / Expired Stock Disposal</option>
                <option value="Customer Return">Customer Return Restock</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E8E2E7]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-[#5B132B] hover:bg-[#781838] text-white"
              >
                <Save className="w-4 h-4 mr-1.5" /> Confirm Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
