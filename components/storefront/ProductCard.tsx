'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import { Star, ChevronDown, Check, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product, selectedVariant?: ProductVariant) => void;
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
}

export function ProductCard({ product, onQuickView, onAddToCart }: ProductCardProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];

  const primaryImage =
    currentVariant?.imageUrl ||
    product.media.find((m) => m.isPrimary)?.secureUrl ||
    product.media[0]?.secureUrl ||
    '/brand/dimsglow-logo.jpg';

  const pricePaise = currentVariant ? currentVariant.pricePaise : product.pricePaise;
  const compareAtPaise = currentVariant?.compareAtPricePaise || product.compareAtPricePaise;
  const isOutOfStock = currentVariant ? currentVariant.onHand <= currentVariant.reserved : false;

  return (
    <div className="group relative bg-white border border-[#E8E2E7] rounded-[10px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-[#B83B63]/40">
      {/* Top Media Container */}
      <div className="relative aspect-square w-full bg-[#FAF8FA] overflow-hidden flex items-center justify-center p-4">
        {/* Unlock Free Gift Badge */}
        {product.unlockFreeGift && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#B83B63] bg-[#FBEAF0] px-2 py-0.5 rounded-[4px] shadow-xs border border-[#B83B63]/20">
              UNLOCK FREE GIFT
            </span>
          </div>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="relative w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        >
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          {/* Benefit Pill Tag */}
          {product.benefitPill && (
            <div className="inline-block">
              <span className="text-[10px] font-semibold text-[#B83B63] bg-[#FBEAF0] px-2 py-0.5 rounded-[3px]">
                {product.benefitPill}
              </span>
            </div>
          )}

          {/* Product Title */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-bold text-[#19161A] line-clamp-1 hover:text-[#B83B63] transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Rating Summary */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#6D6670]">
            <span className="flex items-center font-bold text-[#18794E]">
              ★ {product.ratingSummary.average.toFixed(1)}
            </span>
            <span>({product.ratingSummary.reviewCount} Reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-sm sm:text-base font-bold text-[#19161A]">
              {formatPricePaise(pricePaise)}
            </span>
            {compareAtPaise && compareAtPaise > pricePaise && (
              <span className="text-xs text-[#9A939E] line-through">
                {formatPricePaise(compareAtPaise)}
              </span>
            )}
          </div>
        </div>

        {/* Swatch Selector Dots (if product has variants with swatches) */}
        {product.variants.length > 1 && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {product.variants.map((v, idx) => {
                const swatch = v.options.find((o) => o.swatchColor)?.swatchColor || '#E8E2E7';
                const isSelected = selectedVariantIndex === idx;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantIndex(idx)}
                    title={v.title}
                    className="relative w-4 h-4 rounded-full border border-black/15 transition-transform hover:scale-110 focus:outline-none cursor-pointer shrink-0"
                    style={{ backgroundColor: swatch }}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white drop-shadow-xs" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button: SELECT SHADE v or ADD TO CART */}
        <div className="pt-2">
          {isOutOfStock ? (
            <Button variant="outline" size="sm" disabled className="w-full text-xs">
              SOLD OUT
            </Button>
          ) : product.variants.length > 1 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onQuickView ? onQuickView(product, currentVariant) : null}
              className="w-full text-xs font-bold"
            >
              SELECT SHADE <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddToCart ? onAddToCart(product, currentVariant) : null}
              className="w-full text-xs font-bold"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" /> ADD TO CART
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
