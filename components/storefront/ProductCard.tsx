'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import { Star, ChevronDown, Check, ShoppingBag, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useCart } from '@/lib/cart/CartContext';

export interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product, selectedVariant?: ProductVariant) => void;
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
}

export function ProductCard({ product, onQuickView, onAddToCart }: ProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isShadeModalOpen, setIsShadeModalOpen] = useState(false);
  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const isFav = isFavorite(product.id);

  const primaryImage =
    currentVariant?.imageUrl ||
    product.media.find((m) => m.isPrimary)?.secureUrl ||
    product.media[0]?.secureUrl ||
    '/brand/dimsglow-logo.jpg';

  const pricePaise = currentVariant ? currentVariant.pricePaise : product.pricePaise;
  const compareAtPaise = currentVariant?.compareAtPricePaise || product.compareAtPricePaise;
  const isOutOfStock = currentVariant ? currentVariant.onHand <= currentVariant.reserved : false;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, currentVariant);
    } else {
      addToCart({
        id: `${product.id}_${currentVariant?.id || 'default'}`,
        productId: product.id,
        variantId: currentVariant?.id,
        productName: product.name,
        variantTitle: currentVariant?.title,
        quantity: 1,
        unitPricePaise: pricePaise,
        compareAtPricePaise: compareAtPaise,
        imageUrl: primaryImage,
        slug: product.slug,
      });
    }
  };

  return (
    <div className="group relative bg-white border border-[#E8E2E7] rounded-[10px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-[#B83B63]/40">
      {/* Top Media Container */}
      <div className="relative aspect-square w-full bg-[#FAF8FA] overflow-hidden flex items-center justify-center p-4">
        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-full bg-white/90 shadow-xs hover:bg-white text-[#6D6670] hover:text-[#B83B63] transition-colors cursor-pointer"
          aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#B83B63] text-[#B83B63]' : ''}`} />
        </button>

        {/* Unlock Free Gift Badge */}
        {product.unlockFreeGift && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#B83B63] bg-[#FBEAF0] px-2 py-0.5 rounded-sm shadow-xs border border-[#B83B63]/20">
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
              onClick={() => (onQuickView ? onQuickView(product, currentVariant) : setIsShadeModalOpen(true))}
              className="w-full text-xs font-bold bg-[#5B132B] hover:bg-[#781838]"
            >
              SELECT SHADE <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              className="w-full text-xs font-bold bg-[#5B132B] hover:bg-[#781838]"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" /> ADD TO CART
            </Button>
          )}
        </div>
      </div>

      {/* Built-in Shade Selector Modal */}
      <Modal
        isOpen={isShadeModalOpen}
        onClose={() => setIsShadeModalOpen(false)}
        title={`Select Shade: ${product.name}`}
      >
        <div className="space-y-4 pt-2">
          <div className="flex gap-4 items-center p-3 rounded-lg bg-[#FAF8FA] border border-[#E8E2E7]">
            <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-white border border-[#E8E2E7]">
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#19161A] line-clamp-1">{product.name}</h4>
              <p className="text-xs text-[#B83B63] font-bold mt-0.5">
                {formatPricePaise(pricePaise)}{' '}
                {compareAtPaise && compareAtPaise > pricePaise && (
                  <span className="text-[10px] text-[#9A939E] line-through font-normal">
                    {formatPricePaise(compareAtPaise)}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[#6D6670] mt-0.5">
                Selected: <strong className="text-[#19161A]">{currentVariant?.title}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#19161A] mb-2 uppercase tracking-wider">
              Available Shades ({product.variants.length})
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {product.variants.map((v, idx) => {
                const swatch = v.options.find((o) => o.swatchColor)?.swatchColor || '#E8E2E7';
                const isSelected = selectedVariantIndex === idx;
                const isVariantOos = v.onHand <= v.reserved;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isVariantOos}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#B83B63] bg-[#FBEAF0] ring-1 ring-[#B83B63]'
                        : isVariantOos
                        ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                        : 'border-[#E8E2E7] hover:border-[#B83B63]/40 bg-white'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/20 shrink-0 shadow-xs"
                      style={{ backgroundColor: swatch }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#19161A] truncate">{v.title}</p>
                      <p className="text-[10px] text-[#6D6670]">
                        {isVariantOos ? 'Sold Out' : formatPricePaise(v.pricePaise)}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#B83B63] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsShadeModalOpen(false)}
              className="w-1/3 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={isOutOfStock}
              onClick={() => {
                handleAddToCart();
                setIsShadeModalOpen(false);
              }}
              className="w-2/3 text-xs font-bold bg-[#5B132B] hover:bg-[#781838]"
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              {isOutOfStock ? 'Sold Out' : `ADD TO BAG • ${formatPricePaise(pricePaise)}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
