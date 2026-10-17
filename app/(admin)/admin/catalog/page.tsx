'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATALOG_PRODUCTS, CATEGORIES } from '@/lib/data/catalog';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Layers,
  Sparkles,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>(CATALOG_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('299');
  const [newComparePrice, setNewComparePrice] = useState('399');
  const [newCategories, setNewCategories] = useState<string[]>(['face']);
  const [newImagePreview, setNewImagePreview] = useState<string>('/brand/dimsglow-logo.jpg');
  const [newSku, setNewSku] = useState('DIMS-NEW-01');
  const [newInitialStock, setNewInitialStock] = useState('50');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || p.categoryIds.includes(selectedCategory);

      const matchesStatus =
        statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  // Summary Metrics
  const totalProducts = products.length;
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const totalVariants = products.reduce((acc, p) => acc + p.variants.length, 0);

  // Handle Device File Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Add Product Submit
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pricePaise = Math.round(parseFloat(newPrice || '0') * 100);
    const compareAtPaise = Math.round(parseFloat(newComparePrice || '0') * 100);
    const stock = parseInt(newInitialStock || '50', 10);

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      slug,
      name: newTitle,
      tagline: newTagline || 'High-performance luxury formula',
      description: newDescription || 'Crafted with premium ingredients for all-day comfort and radiance.',
      categoryIds: newCategories.length > 0 ? newCategories : ['face', 'all'],
      status: 'published',
      pricePaise,
      compareAtPricePaise: compareAtPaise > 0 ? compareAtPaise : undefined,
      currency: 'INR',
      media: [
        {
          publicId: `upload_${Date.now()}`,
          secureUrl: newImagePreview,
          altText: newTitle,
          isPrimary: true,
        },
      ],
      benefitPill: 'Dermatologically Tested',
      unlockFreeGift: true,
      ratingSummary: { average: 5.0, reviewCount: 1 },
      trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
      variants: [
        {
          id: `var_${Date.now()}`,
          sku: newSku || `DIMS-${Date.now().toString().slice(-4)}`,
          title: 'Standard',
          options: [{ name: 'Default', value: 'Default' }],
          pricePaise,
          onHand: stock,
          reserved: 0,
          lowStockThreshold: 5,
          active: true,
        },
      ],
      featured: true,
      bestseller: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProducts([newProduct, ...products]);
    setIsAddModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewSlug('');
    setNewTagline('');
    setNewDescription('');
    setNewPrice('299');
    setNewComparePrice('399');
    setNewImagePreview('/brand/dimsglow-logo.jpg');
  };

  const toggleProductStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, status: p.status === 'published' ? 'draft' : 'published' }
          : p
      )
    );
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to remove this product from the catalog?')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif-brand text-[#19161A] flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#B83B63]" /> Product Catalog
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Manage your cosmetic collections, descriptions, pricing, shade variants, and publishing status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#5B132B] hover:bg-[#781838] text-white flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Total Products</span>
            <p className="text-2xl font-black text-[#19161A]">{totalProducts}</p>
            <span className="text-[10px] text-[#18794E] font-medium">Active catalog entries</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Live / Published</span>
            <p className="text-2xl font-black text-[#18794E]">{publishedCount}</p>
            <span className="text-[10px] text-[#6D6670]">Visible on storefront</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Total SKU Variants</span>
            <p className="text-2xl font-black text-[#B83B63]">{totalVariants}</p>
            <span className="text-[10px] text-[#6D6670]">Shades & sizes combined</span>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E8E2E7]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-[#6D6670] uppercase">Categories</span>
            <p className="text-2xl font-black text-[#19161A]">{Object.keys(CATEGORIES).length}</p>
            <span className="text-[10px] text-[#6D6670]">Active department collections</span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <Card className="bg-white border-[#E8E2E7]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-[#6D6670] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] focus:outline-none focus:border-[#B83B63]"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] focus:outline-none focus:border-[#B83B63]"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] focus:outline-none focus:border-[#B83B63]"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Draft Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E8E2E7] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FA] border-b border-[#E8E2E7] text-[#6D6670] uppercase font-bold tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Variants / Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2E7]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6D6670]">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImg = p.media?.find((m) => m.isPrimary)?.secureUrl || p.media?.[0]?.secureUrl || '/brand/dimsglow-logo.jpg';
                  const totalOnHand = p.variants.reduce((acc, v) => acc + v.onHand, 0);

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8FA]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg border border-[#E8E2E7] overflow-hidden shrink-0 bg-[#FAF8FA]">
                            <Image
                              src={primaryImg}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-0.5 max-w-xs">
                            <h4 className="font-bold text-[#19161A] line-clamp-1">{p.name}</h4>
                            <p className="text-[10px] text-[#6D6670] line-clamp-1">{p.tagline}</p>
                            <span className="text-[9px] font-mono text-[#B83B63]">
                              SKU: {p.variants[0]?.sku || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.categoryIds.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-full bg-[#FAF8FA] border border-[#E8E2E7] text-[10px] font-semibold text-[#19161A] capitalize"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#19161A] text-sm">
                            {formatPricePaise(p.pricePaise)}
                          </span>
                          {p.compareAtPricePaise && (
                            <span className="block text-[10px] text-[#6D6670] line-through">
                              {formatPricePaise(p.compareAtPricePaise)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#19161A]">
                            {p.variants.length} {p.variants.length === 1 ? 'shade/variant' : 'shades/variants'}
                          </span>
                          <p className="text-[10px] text-[#18794E]">
                            {totalOnHand} units total stock
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleProductStatus(p.id)}
                          className="cursor-pointer"
                        >
                          <Badge
                            variant={p.status === 'published' ? 'success' : 'soft'}
                            className="capitalize cursor-pointer"
                          >
                            {p.status}
                          </Badge>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md hover:bg-[#E8E2E7] text-[#6D6670] hover:text-[#19161A] transition-colors"
                            title="Preview on Storefront"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Cosmetic Product to Catalog"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Product Title *</label>
              <Input
                placeholder="e.g. 24 Hrs Hydra Silk Lipstick"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">URL Slug</label>
              <Input
                placeholder="hydra-silk-lipstick"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#19161A]">Short Tagline</label>
            <Input
              placeholder="e.g. Infused with Vitamin E and Hyaluronic acid for 12hr hydration"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Selling Price (₹) *</label>
              <Input
                type="number"
                placeholder="299"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Compare-at Price (₹)</label>
              <Input
                type="number"
                placeholder="399"
                value={newComparePrice}
                onChange={(e) => setNewComparePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Initial Variant SKU</label>
              <Input
                placeholder="DIMS-LP-99"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#19161A]">Initial Stock Count</label>
              <Input
                type="number"
                placeholder="50"
                value={newInitialStock}
                onChange={(e) => setNewInitialStock(e.target.value)}
              />
            </div>
          </div>

          {/* Device Image Upload */}
          <div className="space-y-2 pt-2 border-t border-[#E8E2E7]">
            <label className="text-xs font-bold text-[#19161A] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#B83B63]" /> Upload Product Image from Device
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg border border-[#E8E2E7] overflow-hidden bg-[#FAF8FA]">
                <Image
                  src={newImagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-[#6D6670] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FAF8FA] file:text-[#19161A] hover:file:bg-[#E8E2E7] cursor-pointer"
                />
                <p className="text-[10px] text-[#6D6670] mt-1">
                  Supports PNG, JPG, WEBP. Fits cleanly with 1:1 square ratio.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E8E2E7]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-[#5B132B] hover:bg-[#781838] text-white"
            >
              <Save className="w-4 h-4 mr-1.5" /> Save Product to Catalog
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
