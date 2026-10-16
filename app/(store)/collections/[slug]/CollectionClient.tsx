'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CATEGORIES, CATALOG_PRODUCTS } from '@/lib/data/catalog';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import { SlidersHorizontal, ArrowUpDown, ChevronRight, Check, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface CollectionClientProps {
  slug: string;
}

export function CollectionClient({ slug }: CollectionClientProps) {
  const category = CATEGORIES[slug] || (slug === 'all' ? {
    id: 'all',
    slug: 'all',
    title: 'All Products',
    description: 'Explore our complete luxury cosmetic, skincare, and fragrance collections.',
    bannerTitle: 'Explore Complete DIMSGLOW Collection',
    bannerSubtitle: 'High-performance, toxic-free formulations designed for everyday luxury',
    bannerBg: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
  } : null);

  if (!category) {
    notFound();
  }

  const [sortBy, setSortBy] = useState<'featured' | 'priceLow' | 'priceHigh' | 'rating'>('featured');
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Quick-view / Choose options state (matching page 23 of PDF)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSelectedVariant, setQuickViewSelectedVariant] = useState<ProductVariant | null>(null);

  // Filter products by category and stock
  const filteredProducts = useMemo(() => {
    let list = slug === 'all' 
      ? CATALOG_PRODUCTS 
      : CATALOG_PRODUCTS.filter((p) => p.categoryIds.includes(category.id));

    if (filterInStockOnly) {
      list = list.filter((p) => p.variants.some((v) => v.onHand > v.reserved));
    }

    const sorted = [...list];
    if (sortBy === 'priceLow') {
      sorted.sort((a, b) => (a.variants[0]?.pricePaise || a.pricePaise) - (b.variants[0]?.pricePaise || b.pricePaise));
    } else if (sortBy === 'priceHigh') {
      sorted.sort((a, b) => (b.variants[0]?.pricePaise || b.pricePaise) - (a.variants[0]?.pricePaise || a.pricePaise));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.ratingSummary?.average || 5) - (a.ratingSummary?.average || 5));
    }
    return sorted;
  }, [slug, category.id, filterInStockOnly, sortBy]);

  const handleOpenQuickView = (product: Product, variant?: ProductVariant) => {
    setQuickViewProduct(product);
    setQuickViewSelectedVariant(variant || product.variants[0] || null);
  };

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    // Phase 6 will wire this to persistent Firestore cart state
    alert(`Added to cart: ${product.name} ${variant?.title ? `(${variant.title})` : ''}`);
    setQuickViewProduct(null);
  };

  return (
    <StorefrontShell>
      {/* Category Hero Banner matching PDF pages 15-20 */}
      <section className={`w-full bg-gradient-to-r ${category.bannerBg} text-white py-12 md:py-16 px-4`}>
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#D4AF37] mb-2">
            DIMSGLOW EXCLUSIVE COLLECTION
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white uppercase tracking-wider mb-3">
            {category.bannerTitle}
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl font-light">
            {category.bannerSubtitle}
          </p>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mt-6 text-xs text-white/60">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/collections" className="hover:text-white transition">Collections</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">{category.title}</span>
          </nav>
        </div>
      </section>

      {/* Main Catalog View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Toolbar: Counter, Sort, and Mobile Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#E8E2E7] gap-4 mb-8">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2A1810]">
              {category.title}
            </h2>
            <p className="text-xs text-[#705335] mt-0.5">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#E8E2E7] rounded-[6px] text-xs font-semibold text-[#2A1810] bg-white hover:border-[#D4AF37] transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#541235]" />
              Filters
              {filterInStockOnly && (
                <span className="w-2 h-2 rounded-full bg-[#541235]" />
              )}
            </button>

            {/* Sort Selector */}
            <div className="relative inline-flex items-center">
              <label htmlFor="catalog-sort" className="sr-only">Sort products</label>
              <ArrowUpDown className="w-3.5 h-3.5 text-[#705335] absolute left-3 pointer-events-none" />
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="pl-8 pr-8 py-2 bg-white border border-[#E8E2E7] rounded-[6px] text-xs font-medium text-[#2A1810] focus:outline-none focus:border-[#541235] cursor-pointer"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="rating">Highest Rated</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4-Column Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#FDFBF7] rounded-[12px] border border-[#E8E2E7]">
            <p className="text-base font-serif font-bold text-[#2A1810]">No products found</p>
            <p className="text-xs text-[#705335] mt-1">Try resetting your active filters to see all available items.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setFilterInStockOnly(false)}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p, v) => handleOpenQuickView(p, v)}
                onAddToCart={(p, v) => handleAddToCart(p, v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Slideout / Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Products"
      >
        <div className="space-y-6 pt-2">
          {/* Availability */}
          <div>
            <h4 className="text-xs font-bold text-[#2A1810] uppercase tracking-wider mb-3">Availability</h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filterInStockOnly}
                onChange={(e) => setFilterInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[#E8E2E7] text-[#541235] focus:ring-[#541235]"
              />
              <span className="text-xs text-[#2A1810] group-hover:text-[#541235] transition">
                In Stock Only ({CATALOG_PRODUCTS.filter((p) => p.variants.some((v) => v.onHand > v.reserved)).length})
              </span>
            </label>
          </div>

          {/* Quick Categories Navigation */}
          <div>
            <h4 className="text-xs font-bold text-[#2A1810] uppercase tracking-wider mb-3">Other Categories</h4>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/collections/all"
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  slug === 'all'
                    ? 'bg-[#541235] text-white border-[#541235]'
                    : 'bg-white text-[#2A1810] border-[#E8E2E7] hover:border-[#D4AF37]'
                }`}
              >
                All Products
              </Link>
              {Object.values(CATEGORIES).map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    slug === c.slug
                      ? 'bg-[#541235] text-white border-[#541235]'
                      : 'bg-white text-[#2A1810] border-[#E8E2E7] hover:border-[#D4AF37]'
                  }`}
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E2E7] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setFilterInStockOnly(false);
                setIsFilterModalOpen(false);
              }}
              className="text-xs font-medium text-[#705335] underline hover:text-[#541235]"
            >
              Clear All
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFilterModalOpen(false)}
            >
              Apply ({filteredProducts.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick View / Choose Shade Modal matching page 23 of PDF */}
      {quickViewProduct && (
        <Modal
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          title="Choose Your Shade"
          maxWidth="xl"
        >
          <div className="flex flex-col md:flex-row gap-6 pt-2">
            {/* Thumbnail */}
            <div className="relative w-full md:w-48 aspect-square rounded-[8px] overflow-hidden bg-[#F4F0EB] flex-shrink-0">
              <Image
                src={quickViewSelectedVariant?.imageUrl || quickViewProduct.media[0]?.secureUrl || '/brand/dimsglow-logo.jpg'}
                alt={quickViewProduct.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Selection Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4AF37]">
                  {quickViewProduct.benefitPill || 'BESTSELLER'}
                </span>
                <h3 className="text-base font-serif font-bold text-[#2A1810] mt-0.5">
                  {quickViewProduct.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-lg font-bold text-[#2A1810]">
                    {formatPricePaise(quickViewSelectedVariant?.pricePaise || quickViewProduct.pricePaise)}
                  </span>
                  {quickViewProduct.compareAtPricePaise && (
                    <span className="text-xs text-[#705335] line-through">
                      {formatPricePaise(quickViewProduct.compareAtPricePaise)}
                    </span>
                  )}
                </div>

                {/* Shades */}
                {quickViewProduct.variants.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[#2A1810]">Select Shade:</span>
                      <span className="text-[#541235] font-medium">{quickViewSelectedVariant?.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickViewProduct.variants.map((variant) => {
                        const isSelected = quickViewSelectedVariant?.id === variant.id;
                        const swatchColor = variant.options.find((o) => o.swatchColor)?.swatchColor;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => setQuickViewSelectedVariant(variant)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border text-xs transition ${
                              isSelected
                                ? 'border-[#541235] bg-[#541235]/5 font-semibold text-[#541235]'
                                : 'border-[#E8E2E7] bg-white text-[#2A1810] hover:border-[#D4AF37]'
                            }`}
                          >
                            {swatchColor && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/15 flex-shrink-0"
                                style={{ backgroundColor: swatchColor }}
                              />
                            )}
                            <span>{variant.title}</span>
                            {isSelected && <Check className="w-3 h-3 text-[#541235]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-[#E8E2E7] flex items-center gap-3">
                <Button
                  variant="primary"
                  className="flex-1 py-2.5 text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
                  onClick={() => handleAddToCart(quickViewProduct, quickViewSelectedVariant || undefined)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </Button>
                <Link
                  href={`/products/${quickViewProduct.slug}`}
                  className="px-4 py-2.5 border border-[#E8E2E7] rounded-[6px] text-xs font-semibold text-[#2A1810] hover:border-[#D4AF37] transition text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </StorefrontShell>
  );
}
