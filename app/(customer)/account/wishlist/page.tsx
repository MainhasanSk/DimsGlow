'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart/CartContext';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import { formatPricePaise } from '@/lib/utils';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { favorites, toggleFavorite, addToCart } = useCart();

  const favoritedProducts = CATALOG_PRODUCTS.filter((p) =>
    favorites.includes(p.id)
  );

  const handleMoveToCart = (product: typeof CATALOG_PRODUCTS[0]) => {
    const defaultVariant = product.variants[0];
    addToCart({
      id: `${product.id}_${defaultVariant?.id || 'default'}`,
      productId: product.id,
      variantId: defaultVariant?.id,
      productName: product.name,
      variantTitle: defaultVariant?.title,
      quantity: 1,
      unitPricePaise: defaultVariant?.pricePaise || product.pricePaise,
      compareAtPricePaise: defaultVariant?.compareAtPricePaise || product.compareAtPricePaise,
      imageUrl: defaultVariant?.imageUrl || product.media[0]?.secureUrl,
      slug: product.slug,
    });
    toggleFavorite(product.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E2E7]">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#19161A]">
            My Wishlist ({favoritedProducts.length})
          </h1>
          <p className="text-xs text-[#6D6670] mt-0.5">
            Keep track of your favorite luxury cosmetics and skincare restocks.
          </p>
        </div>
        {favoritedProducts.length > 0 && (
          <Link href="/collections/all">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              Explore More
            </Button>
          </Link>
        )}
      </div>

      {favoritedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E2E7] p-8">
          <div className="w-16 h-16 rounded-full bg-[#FAF4F7] text-[#B83B63] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 opacity-40" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#19161A]">Your wishlist is empty</h2>
          <p className="text-xs text-[#6D6670] max-w-sm mx-auto mt-1 mb-6">
            Tap the heart icon on any product to save it here for later or add directly to your bag.
          </p>
          <Link href="/collections/all">
            <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider px-6">
              Discover Bestsellers
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {favoritedProducts.map((product) => {
            const defaultVar = product.variants[0];
            const price = defaultVar?.pricePaise || product.pricePaise;
            const comparePrice = defaultVar?.compareAtPricePaise || product.compareAtPricePaise;
            const primaryImage =
              defaultVar?.imageUrl ||
              product.media[0]?.secureUrl ||
              '/brand/dimsglow-logo.jpg';

            return (
              <div
                key={product.id}
                className="bg-white rounded-[10px] border border-[#E8E2E7] overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-[#B83B63]/40 transition-all"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-[#FAF8FA] p-4 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 shadow-xs hover:bg-white text-[#B83B63] transition-colors cursor-pointer"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4 text-[#8C8490] hover:text-[#EF4444]" />
                    </button>

                    <Link href={`/products/${product.slug}`} className="relative w-full h-full">
                      <Image
                        src={primaryImage}
                        alt={product.name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    </Link>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-1.5">
                    {product.benefitPill && (
                      <span className="text-[10px] font-semibold text-[#B83B63] bg-[#FBEAF0] px-2 py-0.5 rounded-[3px] inline-block">
                        {product.benefitPill}
                      </span>
                    )}

                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-xs font-bold text-[#19161A] line-clamp-1 hover:text-[#B83B63] transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-sm font-bold text-[#19161A]">
                        {formatPricePaise(price)}
                      </span>
                      {comparePrice && comparePrice > price && (
                        <span className="text-xs text-[#9A939E] line-through">
                          {formatPricePaise(comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Move to Cart CTA */}
                <div className="p-4 pt-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMoveToCart(product)}
                    className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Bag
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
