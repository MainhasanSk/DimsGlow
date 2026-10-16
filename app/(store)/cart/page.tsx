'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { useCart } from '@/lib/cart/CartContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatPricePaise } from '@/lib/utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronRight,
  Gift,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FREE_SHIPPING_THRESHOLD_PAISE = 39900; // ₹399
const STANDARD_SHIPPING_FEE_PAISE = 4900; // ₹49
const GIFT_WRAP_FEE_PAISE = 9900; // ₹99

const AVAILABLE_COUPONS = [
  { code: 'EXTRA5', discountPercent: 5, description: 'Extra 5% off on all orders' },
  { code: 'SHIPFREE', freeShipping: true, description: 'Free shipping on any order' },
  { code: 'LIPOIL', freeGift: 'Free Lip Oil', minOrderPaise: 69900, description: 'Free Lip Oil on orders above ₹699' },
  { code: 'CASE', freeGift: 'Free Lipstick Case', minOrderPaise: 59900, description: 'Free Lipstick Case on orders above ₹599' },
];

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    totalItemCount,
    subtotalPaise,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof AVAILABLE_COUPONS[0] | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [includeGiftWrap, setIncludeGiftWrap] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Calculations
  const isFreeShipping = subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE || appliedCoupon?.freeShipping;
  const shippingFeePaise = items.length === 0 || isFreeShipping ? 0 : STANDARD_SHIPPING_FEE_PAISE;
  const giftWrapFeePaise = includeGiftWrap && items.length > 0 ? GIFT_WRAP_FEE_PAISE : 0;

  const discountPaise = appliedCoupon?.discountPercent
    ? Math.round((subtotalPaise * appliedCoupon.discountPercent) / 100)
    : 0;

  const estimatedTotalPaise = Math.max(
    0,
    subtotalPaise - discountPaise + shippingFeePaise + giftWrapFeePaise
  );

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalPaise / FREE_SHIPPING_THRESHOLD_PAISE) * 100)
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const found = AVAILABLE_COUPONS.find((c) => c.code === code);
    if (!found) {
      setCouponError('Invalid or expired coupon code');
      return;
    }

    if (found.minOrderPaise && subtotalPaise < found.minOrderPaise) {
      setCouponError(`This coupon requires a minimum cart subtotal of ${formatPricePaise(found.minOrderPaise)}`);
      return;
    }

    setAppliedCoupon(found);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      router.push('/sign-in?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <StorefrontShell>
      {/* Breadcrumb */}
      <div className="bg-[#FAF8FA] border-b border-[#E8E2E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#6D6670] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#B83B63] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[#19161A] font-semibold">Shopping Bag</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#19161A] mb-2">
          Your Shopping Bag
        </h1>
        <p className="text-xs text-[#6D6670] mb-8">
          {items.length === 0
            ? 'Your bag is currently empty.'
            : `Review your items (${totalItemCount} ${totalItemCount === 1 ? 'item' : 'items'}) before checkout.`}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-[#FAF8FA] rounded-[12px] border border-[#E8E2E7] max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-white border border-[#E8E2E7] flex items-center justify-center mx-auto mb-4 text-[#B83B63] shadow-xs">
              <ShoppingBag className="w-10 h-10 opacity-30" />
            </div>
            <h2 className="text-lg font-serif font-bold text-[#19161A]">Your bag is empty</h2>
            <p className="text-xs text-[#6D6670] max-w-sm mx-auto mt-2 mb-6">
              Discover DIMSGLOW&apos;s curated luxury cosmetics, radiant skincare essentials, and toxic-free formulations.
            </p>
            <Link href="/collections/all">
              <Button variant="primary" size="lg" className="text-xs font-bold tracking-wider uppercase px-8">
                Explore Collections
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
            {/* Left 8 cols: Line Items & Addons */}
            <div className="lg:col-span-8 space-y-6">
              {/* Free shipping milestone */}
              <div className="bg-[#FAF4F7] rounded-[10px] p-4 border border-[#E8E2E7]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#19161A] mb-2">
                  <span className="flex items-center gap-2 text-[#B83B63]">
                    <Truck className="w-4 h-4 shrink-0" />
                    {remainingForFreeShipping > 0 ? (
                      <>Add {formatPricePaise(remainingForFreeShipping)} more to get <strong>FREE Standard Delivery</strong></>
                    ) : (
                      <span className="text-[#047857] flex items-center gap-1 font-bold">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        Congratulations! You have unlocked FREE Standard Delivery!
                      </span>
                    )}
                  </span>
                  <span className="text-[#6D6670] font-mono">{freeShippingProgress}%</span>
                </div>
                <div className="w-full bg-[#E8E2E7] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B83B63] h-full rounded-full transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-[12px] border border-[#E8E2E7] overflow-hidden divide-y divide-[#E8E2E7]">
                {items.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex gap-4 sm:gap-6 items-center">
                    {/* Thumbnail */}
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[8px] bg-[#FAF8FA] border border-[#E8E2E7] overflow-hidden shrink-0 group"
                    >
                      <Image
                        src={item.imageUrl || '/brand/dimsglow-logo.jpg'}
                        alt={item.productName}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    {/* Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-xs sm:text-sm font-bold text-[#19161A] hover:text-[#B83B63] transition-colors line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[#8C8490] hover:text-[#EF4444] p-1 transition-colors cursor-pointer"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.variantTitle && (
                        <p className="text-[11px] text-[#6D6670] mt-0.5">
                          Shade: <span className="font-semibold text-[#19161A]">{item.variantTitle}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-baseline gap-2 mt-2">
                        <span className="text-xs sm:text-sm font-bold text-[#19161A]">
                          {formatPricePaise(item.unitPricePaise)}
                        </span>
                        {item.compareAtPricePaise && (
                          <span className="text-[11px] text-[#8C8490] line-through">
                            {formatPricePaise(item.compareAtPricePaise)}
                          </span>
                        )}
                        <span className="text-[10px] text-[#18794E] font-semibold bg-[#E6F4EA] px-1.5 py-0.5 rounded">
                          Tax Included
                        </span>
                      </div>

                      {/* Stepper & Line Item Subtotal */}
                      <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-[#F2EFF2]">
                        <div className="flex items-center border border-[#E8E2E7] rounded-[6px] overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-[#6D6670] hover:bg-[#FAF8FA] hover:text-[#19161A] transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 py-1 text-xs font-semibold text-[#19161A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            className="px-2.5 py-1 text-[#6D6670] hover:bg-[#FAF8FA] hover:text-[#19161A] transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold text-[#19161A]">
                            {formatPricePaise(item.unitPricePaise * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gift Wrap & Packaging Checkbox */}
              <div className="bg-white rounded-[10px] border border-[#E8E2E7] p-4 flex items-center justify-between gap-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includeGiftWrap}
                    onChange={(e) => setIncludeGiftWrap(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#19161A] group-hover:text-[#B83B63] transition-colors flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#B83B63]" />
                      Add Signature DIMSGLOW Gift Box & Satin Ribbon
                    </span>
                    <p className="text-[11px] text-[#6D6670] mt-0.5">
                      Includes luxury embossed magnetic box and personalized greeting message (+₹99).
                    </p>
                  </div>
                </label>
                <span className="text-xs font-bold text-[#19161A] shrink-0 font-mono">
                  {formatPricePaise(GIFT_WRAP_FEE_PAISE)}
                </span>
              </div>

              {/* Order Notes / Special Instructions */}
              <div className="bg-white rounded-[10px] border border-[#E8E2E7] p-4">
                <label htmlFor="order-note" className="block text-xs font-bold text-[#19161A] mb-1.5">
                  Order Delivery Instructions (Optional)
                </label>
                <textarea
                  id="order-note"
                  rows={2}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Special instructions for delivery, landmark, or gate code..."
                  className="w-full text-xs p-3 border border-[#E8E2E7] rounded-[6px] focus:outline-none focus:border-[#B83B63] resize-none"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-[#8C8490] hover:text-[#EF4444] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
                <Link
                  href="/collections/all"
                  className="text-xs font-semibold text-[#B83B63] hover:underline flex items-center gap-1"
                >
                  Continue Shopping <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 4 cols: Order Summary */}
            <div className="lg:col-span-4 space-y-4 sticky top-24">
              <div className="bg-white rounded-[12px] border border-[#E8E2E7] p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-base font-serif font-bold text-[#19161A] pb-3 border-b border-[#E8E2E7]">
                  Order Summary
                </h3>

                {/* Coupon Code Input */}
                <div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#8C8490] absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="cart-coupon"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="pl-8 text-xs uppercase font-mono h-10"
                      />
                    </div>
                    <Button type="submit" variant="primary" size="md" className="shrink-0 text-xs font-bold">
                      APPLY
                    </Button>
                  </form>

                  {couponError && (
                    <p className="text-[11px] text-[#EF4444] mt-1.5">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <div className="mt-2.5 p-2.5 bg-[#FAF4F7] border border-[#B83B63]/30 rounded-[6px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#B83B63]" />
                        <div>
                          <span className="text-xs font-bold text-[#B83B63] font-mono">
                            {appliedCoupon.code} APPLIED
                          </span>
                          <p className="text-[10px] text-[#6D6670]">{appliedCoupon.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="p-1 text-[#8C8490] hover:text-[#EF4444] transition-colors cursor-pointer"
                        aria-label="Remove coupon"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Line Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-[#E8E2E7] text-xs">
                  <div className="flex items-center justify-between text-[#6D6670]">
                    <span>Bag Subtotal ({totalItemCount} items)</span>
                    <span className="font-semibold text-[#19161A]">{formatPricePaise(subtotalPaise)}</span>
                  </div>

                  {discountPaise > 0 && (
                    <div className="flex items-center justify-between text-[#047857]">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span className="font-semibold">-{formatPricePaise(discountPaise)}</span>
                    </div>
                  )}

                  {includeGiftWrap && (
                    <div className="flex items-center justify-between text-[#6D6670]">
                      <span>Signature Gift Packaging</span>
                      <span className="font-semibold text-[#19161A]">{formatPricePaise(giftWrapFeePaise)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#6D6670]">
                    <span>Shipping & Delivery</span>
                    {shippingFeePaise === 0 ? (
                      <span className="font-bold text-[#047857] uppercase tracking-wider text-[11px]">FREE</span>
                    ) : (
                      <span className="font-semibold text-[#19161A]">{formatPricePaise(shippingFeePaise)}</span>
                    )}
                  </div>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-[#E8E2E7] flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#19161A]">Estimated Total</span>
                    <p className="text-[10px] text-[#8C8490]">Inclusive of all applicable taxes</p>
                  </div>
                  <span className="text-xl font-serif font-bold text-[#19161A]">
                    {formatPricePaise(estimatedTotalPaise)}
                  </span>
                </div>

                {/* Checkout CTA */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProceedToCheckout}
                  className="w-full text-xs font-bold uppercase tracking-wider py-3 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Button>

                {!user && (
                  <p className="text-[11px] text-center text-[#6D6670]">
                    Sign in to sync your saved bag and addresses across devices.
                  </p>
                )}
              </div>

              {/* Trust Badges */}
              <div className="bg-[#FAF8FA] rounded-[10px] border border-[#E8E2E7] p-4 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-[#19161A]">
                  <ShieldCheck className="w-4 h-4 text-[#18794E] shrink-0" />
                  <span className="font-medium">100% Authentic DIMSGLOW Formulations</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#19161A]">
                  <Truck className="w-4 h-4 text-[#B83B63] shrink-0" />
                  <span className="font-medium">Direct Pan-India Express Shipping</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#19161A]">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="font-medium">Cruelty Free, PETA Certified & Vegan</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
