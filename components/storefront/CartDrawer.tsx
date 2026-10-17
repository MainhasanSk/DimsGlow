'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart/CartContext';
import { formatPricePaise } from '@/lib/utils';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/lib/settings/settingsService';

export function CartDrawer() {
  const {
    items,
    totalItemCount,
    subtotalPaise,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeItem,
  } = useCart();
  const { settings } = useStoreSettings();

  const freeThresholdPaise = (settings.freeDeliveryThresholdRupees || 399) * 100;

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const remainingForFreeShipping = Math.max(0, freeThresholdPaise - subtotalPaise);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalPaise / freeThresholdPaise) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E8E2E7] flex items-center justify-between bg-[#FAF8FA]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B83B63]" />
              <h2 className="text-base font-serif font-bold text-[#19161A]">
                Shopping Bag ({totalItemCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-[#6D6670] hover:text-[#19161A] hover:bg-white rounded-full transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Milestone */}
          <div className="bg-[#FAF4F7] px-5 py-3 border-b border-[#E8E2E7]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#19161A] mb-1.5">
              <span className="flex items-center gap-1.5 text-[#B83B63]">
                <Truck className="w-4 h-4" />
                {remainingForFreeShipping > 0 ? (
                  <>Add {formatPricePaise(remainingForFreeShipping)} more for FREE Delivery</>
                ) : (
                  <span className="text-[#047857] flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Unlocked FREE Standard Delivery!
                  </span>
                )}
              </span>
              <span className="text-[#6D6670]">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-[#E8E2E7] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#B83B63] h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Item List / Empty State */}
          <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-[#E8E2E7]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#FAF8FA] border border-[#E8E2E7] flex items-center justify-center mb-4 text-[#B83B63]">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#19161A]">Your bag is empty</h3>
                <p className="text-xs text-[#6D6670] max-w-xs mt-1.5 mb-6">
                  Explore our luxury, toxic-free cosmetic formulations and skincare essentials.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCartDrawerOpen(false)}
                >
                  <Link href="/collections/all">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={() => setIsCartDrawerOpen(false)}
                    className="relative w-18 h-18 rounded-lg bg-[#FAF8FA] border border-[#E8E2E7] overflow-hidden shrink-0"
                  >
                    <Image
                      src={item.imageUrl || '/brand/dimsglow-logo.jpg'}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsCartDrawerOpen(false)}
                          className="text-xs font-semibold text-[#19161A] hover:text-[#B83B63] transition-colors line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[#8C8490] hover:text-[#EF4444] transition-colors p-1"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.variantTitle && (
                        <p className="text-[11px] text-[#6D6670] mt-0.5">
                          Shade: <span className="font-medium text-[#19161A]">{item.variantTitle}</span>
                        </p>
                      )}

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs font-bold text-[#19161A]">
                          {formatPricePaise(item.unitPricePaise)}
                        </span>
                        {item.compareAtPricePaise && (
                          <span className="text-[10px] text-[#8C8490] line-through">
                            {formatPricePaise(item.compareAtPricePaise)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-[#E8E2E7] rounded-md overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-[#6D6670] hover:bg-[#FAF8FA] hover:text-[#19161A] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-semibold text-[#19161A]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="px-2 py-1 text-[#6D6670] hover:bg-[#FAF8FA] hover:text-[#19161A] transition-colors disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#E8E2E7] bg-[#FAF8FA] space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#6D6670] font-medium">Estimated Subtotal</span>
                <span className="text-lg font-serif font-bold text-[#19161A]">
                  {formatPricePaise(subtotalPaise)}
                </span>
              </div>
              <p className="text-[11px] text-[#8C8490]">
                Taxes, shipping discounts & coupons applied during checkout.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/cart"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider py-2.5">
                    View Cart
                  </Button>
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-full"
                >
                  <Button variant="primary" className="w-full text-xs font-bold uppercase tracking-wider py-2.5 flex items-center justify-center gap-1.5">
                    Checkout <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
