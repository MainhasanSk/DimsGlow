'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getProductBySlug, CATALOG_PRODUCTS } from '@/lib/data/catalog';
import type { Product, ProductVariant } from '@/lib/schemas/product';
import { formatPricePaise } from '@/lib/utils';
import {
  Star,
  Check,
  Copy,
  CheckCheck,
  Truck,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FAQAccordion } from '../../faq/page';
import { useCart } from '@/lib/cart/CartContext';

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [pincode, setPincode] = useState('');
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'faq'>('desc');
  const [beforeAfterSlider, setBeforeAfterSlider] = useState(50);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const p = await getProductBySlug(slug);
      if (p) {
        setProduct(p);
        setSelectedVariant(p.variants[0] || null);
      }
    }
    loadProduct();
  }, [slug]);

  // Sticky bottom bar trigger on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!product && slug) {
    // Return loading skeleton or handle not found
    const defaultProduct = CATALOG_PRODUCTS[0];
    if (defaultProduct && slug !== defaultProduct.slug) {
      // If slug doesn't match any, show notFound
      const exists = CATALOG_PRODUCTS.some((p) => p.slug === slug);
      if (!exists) notFound();
    }
  }

  const activeProduct = product || CATALOG_PRODUCTS[0];
  const activeVar = selectedVariant || activeProduct.variants[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setPincodeMessage('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setPincodeMessage(`✓ In Stock: Estimated delivery in 2-4 business days to ${pincode.trim()}`);
  };

  const currentPrice = activeVar?.pricePaise || activeProduct.pricePaise;
  const currentCompareAt = activeVar?.compareAtPricePaise || activeProduct.compareAtPricePaise;

  const handleAddToCart = () => {
    addToCart({
      id: `${activeProduct.id}_${activeVar?.id || 'default'}`,
      productId: activeProduct.id,
      variantId: activeVar?.id,
      productName: activeProduct.name,
      variantTitle: activeVar?.title,
      quantity: 1,
      unitPricePaise: currentPrice,
      compareAtPricePaise: currentCompareAt,
      imageUrl: activeVar?.imageUrl || activeProduct.media[0]?.secureUrl,
      slug: activeProduct.slug,
    });
  };

  const handleBuyNow = () => {
    addToCart({
      id: `${activeProduct.id}_${activeVar?.id || 'default'}`,
      productId: activeProduct.id,
      variantId: activeVar?.id,
      productName: activeProduct.name,
      variantTitle: activeVar?.title,
      quantity: 1,
      unitPricePaise: currentPrice,
      compareAtPricePaise: currentCompareAt,
      imageUrl: activeVar?.imageUrl || activeProduct.media[0]?.secureUrl,
      slug: activeProduct.slug,
    });
    router.push('/checkout');
  };

  const exclusiveCoupons = [
    { code: 'LIPOIL', title: 'FREE Lip Oil & Lip Color', subtitle: 'On orders above ₹699' },
    { code: 'CASE', title: 'FREE Lipstick Case', subtitle: 'On orders above ₹599' },
    { code: 'MASCARA', title: 'FREE Voluminous Mascara', subtitle: 'On orders above ₹499' },
    { code: 'LIPCREAM', title: 'FREE Lip Cream', subtitle: 'On orders above ₹399' },
    { code: 'EXTRA5', title: 'EXTRA 5% OFF', subtitle: 'On all prepaid orders' },
    { code: 'SHIPFREE', title: 'FREE SHIPPING', subtitle: 'On all orders above ₹399' },
  ];

  return (
    <StorefrontShell>
      {/* Breadcrumbs */}
      <div className="bg-[#FAF8FA] border-b border-[#E8E2E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#6D6670] flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#B83B63] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href="/collections/all" className="hover:text-[#B83B63] transition-colors">Best Seller</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[#19161A] font-semibold truncate">{activeProduct.name}</span>
        </div>
      </div>

      {/* Main Two-Column PDP Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Product Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-[12px] bg-[#FAF8FA] border border-[#E8E2E7] overflow-hidden flex items-center justify-center p-8 group">
              {/* Trust & Gift Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-white bg-[#B83B63] px-2.5 py-1 rounded-[4px] shadow-sm">
                  1 MIRACLE FORMULA SPF 20
                </span>
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#B83B63] bg-[#FBEAF0] px-2.5 py-1 rounded-[4px] shadow-xs border border-[#B83B63]/20">
                  UNLOCK FREE GIFT
                </span>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleFavorite(activeProduct.id)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 hover:bg-[#FBEAF0] text-[#6D6670] hover:text-[#B83B63] shadow-sm transition-colors cursor-pointer"
                aria-label={isFavorite(activeProduct.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-5 h-5 ${isFavorite(activeProduct.id) ? 'fill-[#B83B63] text-[#B83B63]' : ''}`} />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={activeProduct.media[activeMediaIndex]?.secureUrl || '/brand/dimsglow-logo.jpg'}
                  alt={activeProduct.name}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
            </div>

            {/* Thumbnail Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(0)}
                  className={`relative w-18 h-18 rounded-[8px] border-2 bg-[#FAF8FA] overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                    activeMediaIndex === 0 && idx === 0
                      ? 'border-[#B83B63] shadow-xs scale-105'
                      : 'border-[#E8E2E7] hover:border-[#6D6670]'
                  }`}
                >
                  <Image
                    src="/brand/dimsglow-logo.jpg"
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover p-1"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Purchase Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 border-b border-[#E8E2E7] pb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B83B63]">
                DIMSGLOW MAKE-UP ESSENTIALS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-serif-brand text-[#19161A] tracking-tight">
                {activeProduct.name}
              </h1>
              {activeProduct.tagline && (
                <p className="text-xs sm:text-sm text-[#6D6670] leading-relaxed">
                  {activeProduct.tagline}
                </p>
              )}

              {/* Price & Taxes */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl sm:text-3xl font-black text-[#19161A]">
                  {formatPricePaise(currentPrice)}
                </span>
                {currentCompareAt && currentCompareAt > currentPrice && (
                  <span className="text-sm text-[#9A939E] line-through font-semibold">
                    {formatPricePaise(currentCompareAt)}
                  </span>
                )}
                <span className="text-xs text-[#6D6670] font-medium">
                  (inclusive of all taxes)
                </span>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <div className="flex text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-[#18794E]">
                  ★ {activeProduct.ratingSummary.average.toFixed(1)}
                </span>
                <span className="text-[#6D6670]">
                  ({activeProduct.ratingSummary.reviewCount} Reviews)
                </span>
              </div>

              {/* Trust Badges Inline */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {activeProduct.trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-[4px] bg-[#E6F4EA] text-[#18794E] border border-[#18794E]/20"
                  >
                    ✓ {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Shade Selector with Names and Swatches */}
            {activeProduct.variants.length > 0 && (
              <div className="space-y-3 border-b border-[#E8E2E7] pb-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#19161A]">
                    {activeProduct.variants.length} Shades
                  </span>
                  <span className="text-xs font-bold text-[#B83B63]">
                    Selected Shade: {activeVar?.title || 'Default'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {activeProduct.variants.map((v) => {
                    const swatch = v.options.find((o) => o.swatchColor)?.swatchColor || '#E8E2E7';
                    const isSelected = activeVar?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        title={v.title}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#B83B63] ring-offset-2 scale-110 border-white'
                            : 'border-black/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch }}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-xs" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Website Exclusive Offers Cards */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#19161A]">
                Website Exclusive Offers
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {exclusiveCoupons.map((coupon) => (
                  <div
                    key={coupon.code}
                    className="p-3 rounded-[8px] bg-[#FAF8FA] border border-[#E8E2E7] hover:border-[#B83B63]/40 flex flex-col justify-between space-y-2 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-[#B83B63] tracking-wider uppercase block">
                        CODE : {coupon.code}
                      </span>
                      <h4 className="text-[11px] font-bold text-[#19161A] line-clamp-1">
                        {coupon.title}
                      </h4>
                      <p className="text-[9px] text-[#6D6670]">{coupon.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="text-[10px] font-bold text-[#19161A] bg-white border border-[#E8E2E7] hover:bg-[#FBEAF0] hover:text-[#B83B63] px-2 py-1 rounded-[4px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedCoupon === coupon.code ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-[#18794E]" /> COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> COPY CODE
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs: ADD TO CART & BUY NOW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-xs font-bold border-2 border-[#B83B63] text-[#B83B63] hover:bg-[#FBEAF0] cursor-pointer"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="w-4 h-4 mr-2" /> ADD TO CART
              </Button>

              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold shadow-md bg-[#B83B63] hover:bg-[#982D50] cursor-pointer"
                onClick={handleBuyNow}
              >
                <Zap className="w-4 h-4 mr-1.5 fill-current" /> BUY NOW
              </Button>
            </div>

            {/* Pincode Serviceability & Delivery Checker */}
            <div className="p-4 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#19161A]">
                <Truck className="w-4 h-4 text-[#B83B63]" />
                <span>Ships & Delivers By (In stock, and ready to ship)</span>
              </div>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <Input
                  id="pincode-check"
                  placeholder="Enter 6-digit PIN code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  className="h-10 text-xs bg-white"
                />
                <Button type="submit" variant="primary" size="md" className="shrink-0 text-xs font-bold">
                  CHECK
                </Button>
              </form>

              {pincodeMessage && (
                <p
                  className={`text-xs font-semibold ${
                    pincodeMessage.startsWith('✓') ? 'text-[#18794E]' : 'text-[#B42318]'
                  }`}
                >
                  {pincodeMessage}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#6D6670] border-t border-[#E8E2E7]">
                <ShieldCheck className="w-4 h-4 text-[#18794E]" />
                <span>100% Original Products Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rich Below-the-fold Sections (Matching Pages 34 to 45 of PDF) */}
        <div className="mt-20 space-y-16">
          {/* Section 1: "More Than Just Coverage" */}
          <section className="p-8 sm:p-12 rounded-[16px] bg-[#FAF8FA] border border-[#E8E2E7] text-center space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
              SKIN-FIRST PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif-brand text-[#19161A]">
              More Than Just Coverage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#19161A]">Radiant Hydration</h3>
                <p className="text-xs text-[#6D6670]">
                  Fresh & plump all day with Rice Water & plant squalane moisture infusion.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#19161A]">SPF 20 PA++++</h3>
                <p className="text-xs text-[#6D6670]">
                  Everyday broad-spectrum sun shield defending against UVA/UVB photo-damage.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#19161A]">Stay-Put Wear</h3>
                <p className="text-xs text-[#6D6670]">
                  Comfortable, lightweight second-skin breathable finish that resists creasing.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Interactive Before & After Slider */}
          <section className="space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
                CLINICAL RESULTS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
                COVERAGE THAT LOOKS LIKE SKIN
              </h2>
              <p className="text-xs text-[#6D6670]">
                Drag the interactive slider to see how DIMSGLOW blurs imperfections while preserving real skin texture.
              </p>
            </div>

            <div className="max-w-2xl mx-auto relative aspect-[4/3] rounded-[16px] overflow-hidden border border-[#E8E2E7] shadow-lg select-none">
              {/* After Layer (Background) */}
              <div className="absolute inset-0 bg-[#E8D0BA] flex items-center justify-center text-[#19161A] p-6 text-center">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest bg-[#18794E] text-white px-3 py-1 rounded-full">
                    AFTER: RADIANT & FLAWLESS
                  </span>
                  <p className="text-xs text-[#19161A]/80 font-medium max-w-sm mx-auto">
                    Even complexion, blurred pores, glowing skin texture, zero cakey residue.
                  </p>
                </div>
              </div>

              {/* Before Layer (Foreground clipped by slider percentage) */}
              <div
                className="absolute inset-0 bg-[#FAF8FA] border-r-2 border-white shadow-2xl flex items-center justify-center text-[#6D6670] p-6 text-center overflow-hidden"
                style={{ width: `${beforeAfterSlider}%` }}
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest bg-[#6D6670] text-white px-3 py-1 rounded-full">
                    BEFORE: NATURAL BARE SKIN
                  </span>
                  <p className="text-xs text-[#6D6670] font-medium max-w-sm mx-auto">
                    Uneven tones, visible pores, redness, and dark circles.
                  </p>
                </div>
              </div>

              {/* Slider Input Controller */}
              <input
                type="range"
                min="0"
                max="100"
                value={beforeAfterSlider}
                onChange={(e) => setBeforeAfterSlider(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                aria-label="Before and after coverage comparison slider"
              />

              {/* Visual Split Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-md z-10 pointer-events-none"
                style={{ left: `${beforeAfterSlider}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-[#E8E2E7] flex items-center justify-center text-[10px] font-black text-[#19161A]">
                  ↔
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Ingredients Callout (Rice Water + Niacinamide) */}
          <section className="p-8 sm:p-12 rounded-[16px] bg-[#FBEAF0] border border-[#F5D8E4] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
                PURE ACTIVE BOTANICALS
              </span>
              <h2 className="text-3xl font-bold font-serif-brand text-[#19161A]">
                Packed with Goodness & SPF 20 PA++++
              </h2>
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-[10px] bg-white border border-[#E8E2E7] space-y-1">
                  <h4 className="text-sm font-bold text-[#19161A]">Niacinamide</h4>
                  <p className="text-xs text-[#6D6670]">
                    Brightens overall skin tone, smoothes surface texture, and refines enlarged pores.
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white border border-[#E8E2E7] space-y-1">
                  <h4 className="text-sm font-bold text-[#19161A]">Fermented Rice Water</h4>
                  <p className="text-xs text-[#6D6670]">
                    Deeply hydrates, calms irritation, and locks in moisture for an all-day natural dewy finish.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
                <Image
                  src="/brand/dimsglow-logo.jpg"
                  alt="DIMSGLOW Ingredients Showcase"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Tabbed Product Description & FAQ */}
          <section className="border border-[#E8E2E7] rounded-[12px] bg-white p-6 sm:p-10 space-y-6">
            <div className="flex items-center gap-6 border-b border-[#E8E2E7] text-xs sm:text-sm font-bold tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`pb-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'desc'
                    ? 'border-[#B83B63] text-[#B83B63]'
                    : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
                }`}
              >
                DESCRIPTION
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`pb-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'faq'
                    ? 'border-[#B83B63] text-[#B83B63]'
                    : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
                }`}
              >
                FAQ
              </button>
            </div>

            {activeTab === 'desc' ? (
              <div className="prose prose-sm text-xs text-[#19161A] leading-relaxed space-y-4">
                <p>
                  Discover the ultimate multitasking foundation that transforms your beauty routine. This 5-in-1 powerhouse effortlessly blends the benefits of a primer, foundation, sunscreen, and moisturizer in one sleek formula. Enriched with Niacinamide and rice water, it hydrates, brightens, and nourishes while providing a smooth, glowing finish.
                </p>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#19161A]">Key Features:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-[#6D6670]">
                    <li>Blurs pores and imperfections, creating a smooth canvas.</li>
                    <li>Delivers a luminous, dewy finish with long-lasting coverage.</li>
                    <li>SPF 20 protection to shield skin while perfecting your look.</li>
                    <li>Packed with moisturizing ingredients for plump, hydrated skin.</li>
                    <li>Infused with Rice Water for hydration, soothing & natural glow.</li>
                    <li>Enriched with Niacinamide to brighten, repair skin, and minimize pores.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <FAQAccordion />
            )}
          </section>

          {/* Section 5: Customer Reviews */}
          <section className="space-y-6 border-t border-[#E8E2E7] pt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-brand text-[#19161A]">
                  Customer Reviews
                </h3>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#18794E]">5.0</span>
                  <span className="text-xs text-[#6D6670]">(17 verified reviews)</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => alert('Review submission will open for verified purchase accounts.')}
              >
                Write a review
              </Button>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
              {[
                {
                  author: 'Sneha Patel',
                  rating: 5,
                  title: 'A perfect shade match and what a coverage!',
                  body: 'I just love it. I am so mesmerised that I had to write a review. I have some dark circles which this skin tint was able to cover in a buildable way. No cakiness after applying and it adds a subtle shine that stays all day long.',
                  date: 'Verified Buyer • 2 weeks ago',
                },
                {
                  author: 'Kavita Das',
                  rating: 5,
                  title: 'Lightweight and non-comedogenic',
                  body: 'My dermatologist warned me against heavy foundations. DIMSGLOW skin tint feels like a serum and lets my skin breathe in Guwahati humidity. Very impressed!',
                  date: 'Verified Buyer • 1 month ago',
                },
              ].map((rev) => (
                <div key={rev.author} className="p-5 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#19161A]">{rev.author}</h4>
                      <span className="text-[10px] text-[#18794E] font-semibold">✓ {rev.date}</span>
                    </div>
                    <div className="flex text-[#D4AF37]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <h5 className="text-xs font-bold text-[#19161A]">{rev.title}</h5>
                  <p className="text-xs text-[#6D6670] leading-relaxed">{rev.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Purchase Bar (On scroll) */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E2E7] shadow-xl p-3 sm:p-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] overflow-hidden border border-[#E8E2E7] relative shrink-0">
                <Image
                  src={activeProduct.media[0]?.secureUrl || '/brand/dimsglow-logo.jpg'}
                  alt={activeProduct.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h4 className="text-xs font-bold text-[#19161A] line-clamp-1">{activeProduct.name}</h4>
                <p className="text-xs font-bold text-[#B83B63]">{formatPricePaise(currentPrice)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToCart}
                className="text-xs font-bold cursor-pointer"
              >
                ADD TO CART
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBuyNow}
                className="text-xs font-bold cursor-pointer"
              >
                BUY NOW
              </Button>
            </div>
          </div>
        </div>
      )}
    </StorefrontShell>
  );
}
