'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getProductBySlug, CATALOG_PRODUCTS } from '@/lib/data/catalog';
import { useProducts } from '@/lib/catalog/productStore';
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
import { RadianceComparisonSlider } from '@/components/storefront/RadianceComparisonSlider';
import { useCart } from '@/lib/cart/CartContext';
import { useAuth } from '@/lib/auth/AuthContext';

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, toggleFavorite, isFavorite } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [pincode, setPincode] = useState('');
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'faq'>('desc');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [recCategory, setRecCategory] = useState<string>('all');
  const [addingCombo, setAddingCombo] = useState(false);

  // Review System States
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState<number>(5.0);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(17);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewAlert, setReviewAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProduct() {
      const p = await getProductBySlug(slug);
      if (p) {
        setProduct(p);
        setSelectedVariant(p.variants[0] || null);
      }
    }
    loadProduct();

    // Fetch approved customer reviews
    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?slug=${slug}`);
        const data = await res.json();
        if (data.success && data.reviews && data.reviews.length > 0) {
          setReviewsList(data.reviews);
          setAverageScore(data.averageRating);
          setTotalReviewsCount(data.totalReviews);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      }
    }
    loadReviews();
  }, [slug]);

  // Sticky bottom bar trigger on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { products: liveProducts } = useProducts();
  const currentCatalog = React.useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of CATALOG_PRODUCTS) {
      map.set(p.slug, p);
    }
    for (const p of liveProducts) {
      map.set(p.slug, p);
    }
    return Array.from(map.values());
  }, [liveProducts]);

  const activeProduct =
    product ||
    currentCatalog.find((p) => p.slug === slug) ||
    CATALOG_PRODUCTS.find((p) => p.slug === slug) ||
    currentCatalog[0];
  const activeVar = selectedVariant || activeProduct?.variants?.[0];

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

  // Find complementary pair product for the current product
  const pairedProduct =
    currentCatalog.find((p) => {
      if (p.id === activeProduct.id) return false;
      if (activeProduct.categoryIds.includes('face')) return p.categoryIds.includes('lips');
      if (activeProduct.categoryIds.includes('lips')) return p.categoryIds.includes('eyes');
      if (activeProduct.categoryIds.includes('eyes')) return p.categoryIds.includes('face');
      return p.categoryIds.includes('face');
    }) || currentCatalog.find((p) => p.id !== activeProduct.id);

  const handleAddComboBoth = () => {
    if (!pairedProduct) return;
    setAddingCombo(true);
    handleAddToCart();
    const pairedVar = pairedProduct.variants[0];
    addToCart({
      id: `${pairedProduct.id}_${pairedVar?.id || 'default'}`,
      productId: pairedProduct.id,
      variantId: pairedVar?.id,
      productName: pairedProduct.name,
      variantTitle: pairedVar?.title,
      quantity: 1,
      unitPricePaise: pairedVar?.pricePaise || pairedProduct.pricePaise,
      compareAtPricePaise: pairedVar?.compareAtPricePaise || pairedProduct.compareAtPricePaise,
      imageUrl: pairedVar?.imageUrl || pairedProduct.media[0]?.secureUrl,
      slug: pairedProduct.slug,
    });
    setTimeout(() => setAddingCombo(false), 500);
  };

  const recProducts = currentCatalog.filter((p) => {
    if (p.id === activeProduct.id) return false;
    if (recCategory === 'all') return true;
    return p.categoryIds.includes(recCategory);
  });

  const exclusiveCoupons = [
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
            <div className="relative aspect-square w-full rounded-xl bg-[#FAF8FA] border border-[#E8E2E7] overflow-hidden flex items-center justify-center p-8 group">
              {/* Trust Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-white bg-[#B83B63] px-2.5 py-1 rounded-sm shadow-sm">
                  SPF 50+ PA++++ • CLINICAL GLOW
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
              {(activeProduct.media && activeProduct.media.length > 0
                ? activeProduct.media
                : [{ publicId: 'def', secureUrl: '/products/featured-product.jpeg', altText: activeProduct.name, isPrimary: true }]
              ).map((med, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`relative w-18 h-18 rounded-lg border-2 bg-[#FAF8FA] overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                    activeMediaIndex === idx
                      ? 'border-[#B83B63] shadow-xs scale-105'
                      : 'border-[#E8E2E7] hover:border-[#6D6670]'
                  }`}
                >
                  <Image
                    src={med.secureUrl || '/brand/dimsglow-logo.jpg'}
                    alt={med.altText || `View ${idx + 1}`}
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
                    className="text-[11px] font-bold px-2.5 py-1 rounded-sm bg-[#E6F4EA] text-[#18794E] border border-[#18794E]/20"
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
                    className="p-3 rounded-lg bg-[#FAF8FA] border border-[#E8E2E7] hover:border-[#B83B63]/40 flex flex-col justify-between space-y-2 transition-colors"
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
                      className="text-[10px] font-bold text-[#19161A] bg-white border border-[#E8E2E7] hover:bg-[#FBEAF0] hover:text-[#B83B63] px-2 py-1 rounded-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
          <section className="p-8 sm:p-12 rounded-2xl bg-[#FAF8FA] border border-[#E8E2E7] text-center space-y-6">
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

            <RadianceComparisonSlider
              beforeImage="/product/skin-before.jpg"
              afterImage="/product/skin-after.jpg"
              beforeAlt="Before DIMSGLOW Tinted Sunscreen - Natural Bare Skin"
              afterAlt="After DIMSGLOW Tinted Sunscreen - Radiant & Flawless Glass Skin"
            />
          </section>

          {/* Section 3: Ingredients Callout (Rice Water + Niacinamide) */}
          <section className="p-8 sm:p-12 rounded-2xl bg-[#FBEAF0] border border-[#F5D8E4] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
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
          <section className="border border-[#E8E2E7] rounded-xl bg-white p-6 sm:p-10 space-y-6">
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
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(averageScore) ? 'fill-[#D4AF37]' : 'text-black/15'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-[#18794E]">{averageScore}</span>
                  <span className="text-xs text-[#6D6670]">({totalReviewsCount} verified reviews)</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (!user) {
                    router.push(`/sign-in?redirect=/products/${slug}`);
                  } else {
                    setIsReviewModalOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                Write a review
              </Button>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4">
              {(reviewsList.length > 0 ? reviewsList : [
                {
                  id: 'curated_1',
                  customerName: 'Sneha Patel',
                  rating: 5,
                  title: 'A perfect shade match and what a coverage!',
                  comment: 'I just love it. I am so mesmerised that I had to write a review. I have some dark circles which this skin tint was able to cover in a buildable way. No cakiness after applying and it adds a subtle shine that stays all day long.',
                  verifiedPurchase: true,
                  createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
                },
                {
                  id: 'curated_2',
                  customerName: 'Kavita Das',
                  rating: 5,
                  title: 'Lightweight and non-comedogenic',
                  comment: 'My dermatologist warned me against heavy foundations. DIMSGLOW skin tint feels like a serum and lets my skin breathe in Guwahati humidity. Very impressed!',
                  verifiedPurchase: true,
                  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
                },
              ]).map((rev) => (
                <div key={rev.id || rev.customerName} className="p-5 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#19161A]">{rev.customerName}</h4>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] text-[#18794E] font-semibold">✓ Verified Buyer</span>
                      )}
                    </div>
                    <div className="flex text-[#D4AF37]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-[#D4AF37]' : 'text-black/15'}`} />
                      ))}
                    </div>
                  </div>
                  <h5 className="text-xs font-bold text-[#19161A]">{rev.title}</h5>
                  <p className="text-xs text-[#6D6670] leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6: Frequently Paired Together (Combo Routine) */}
          {pairedProduct && (
            <section className="p-6 sm:p-8 rounded-2xl bg-[#FAF8FA] border border-[#E8E2E7] space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
                  FREQUENTLY PAIRED TOGETHER
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-brand text-[#19161A] mt-1">
                  Complete Your Glam Routine & Save
                </h3>
                <p className="text-xs text-[#6D6670] mt-0.5">
                  Pair this formulation with our bestselling match for all-day radiance and coverage.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-5 rounded-xl border border-[#E8E2E7]">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center md:justify-start">
                  {/* Item 1: Current Product */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] relative overflow-hidden shrink-0">
                      <Image
                        src={activeProduct.media[0]?.secureUrl || '/brand/dimsglow-logo.jpg'}
                        alt={activeProduct.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#19161A] line-clamp-1 max-w-37.5">
                        {activeProduct.name}
                      </h4>
                      <p className="text-xs font-bold text-[#B83B63]">{formatPricePaise(currentPrice)}</p>
                      <span className="text-[10px] text-[#6D6670]">{activeVar?.title || 'Selected'}</span>
                    </div>
                  </div>

                  {/* Plus Symbol */}
                  <span className="text-xl font-bold text-[#D4AF37] px-1">+</span>

                  {/* Item 2: Paired Product */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg border border-[#E8E2E7] bg-[#FAF8FA] relative overflow-hidden shrink-0">
                      <Image
                        src={pairedProduct.media[0]?.secureUrl || '/brand/dimsglow-logo.jpg'}
                        alt={pairedProduct.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#19161A] line-clamp-1 max-w-37.5">
                        {pairedProduct.name}
                      </h4>
                      <p className="text-xs font-bold text-[#B83B63]">
                        {formatPricePaise(pairedProduct.pricePaise)}
                      </p>
                      <span className="text-[10px] text-[#6D6670]">
                        {pairedProduct.variants[0]?.title || 'Bestseller Shade'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bundle Total & CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 text-center md:text-right">
                  <div>
                    <span className="text-[11px] text-[#6D6670] block">Combo Price (10% Extra Off):</span>
                    <div className="flex items-center gap-2 justify-center md:justify-end">
                      <span className="text-lg font-bold text-[#19161A]">
                        {formatPricePaise(Math.round((currentPrice + pairedProduct.pricePaise) * 0.9))}
                      </span>
                      <span className="text-xs text-[#8C8490] line-through">
                        {formatPricePaise(currentPrice + pairedProduct.pricePaise)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={addingCombo}
                    onClick={handleAddComboBoth}
                    className="text-xs font-bold uppercase tracking-wider px-5 shadow-md"
                  >
                    {addingCombo ? 'Adding Both...' : 'Add Both to Bag'}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Section 7: Explore More By Category */}
          <section className="space-y-8 border-t border-[#E8E2E7] pt-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
                  EXPLORE OUR LUXURY COLLECTIONS
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A] mt-1">
                  You May Also Love
                </h3>
                <p className="text-xs text-[#6D6670] mt-0.5">
                  Select a category below to discover matching shades, active skincare serums, and eye essentials.
                </p>
              </div>
              <Link
                href="/collections/all"
                className="text-xs font-bold text-[#B83B63] hover:text-[#982D50] flex items-center gap-1 group"
              >
                View Full Catalog <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'All Products' },
                { id: 'face', label: 'Face Essentials' },
                { id: 'lips', label: 'Lip Luxury' },
                { id: 'eyes', label: 'Eyes & Lashes' },
                { id: 'skin-care', label: 'Skin Radiance' },
                { id: 'nails', label: 'Nail Lacquers' },
                { id: 'perfumes', label: 'Fragrances & Sets' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setRecCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                    recCategory === cat.id
                      ? 'bg-[#B83B63] text-white shadow-sm'
                      : 'bg-white border border-[#E8E2E7] text-[#6D6670] hover:text-[#19161A] hover:border-[#B83B63]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product Recommendations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {recProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
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
              <div className="w-10 h-10 rounded-md overflow-hidden border border-[#E8E2E7] relative shrink-0">
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
      {/* Interactive Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-black/10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-black/10">
              <h3 className="text-base font-bold text-[#19161A] font-serif-brand">
                Review {activeProduct.name}
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-black/40 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {reviewAlert && (
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  reviewAlert.type === 'success'
                    ? 'bg-[#EBF7EE] text-[#1E7E34] border border-[#C3E6CB]'
                    : 'bg-[#FDF0ED] text-[#D9381E] border border-[#F5C6CB]'
                }`}
              >
                {reviewAlert.text}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) {
                  router.push(`/sign-in?redirect=/products/${slug}`);
                  return;
                }
                setIsSubmittingReview(true);
                setReviewAlert(null);
                try {
                  const token = await user.getIdToken();
                  const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      productId: activeProduct.id,
                      productSlug: slug,
                      productTitle: activeProduct.name,
                      rating: newReviewRating,
                      title: newReviewTitle,
                      comment: newReviewComment,
                    }),
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.error);

                  setReviewAlert({ type: 'success', text: data.message });
                  setNewReviewTitle('');
                  setNewReviewComment('');
                  setTimeout(() => {
                    setIsReviewModalOpen(false);
                    setReviewAlert(null);
                  }, 2500);
                } catch (err: any) {
                  setReviewAlert({ type: 'error', text: err.message || 'Failed to submit review' });
                } finally {
                  setIsSubmittingReview(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-[#19161A] block mb-1.5">Your Rating *</label>
                <div className="flex gap-1.5 items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewReviewRating(s)}
                      className="p-1 text-[#D4AF37] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= newReviewRating ? 'fill-[#D4AF37]' : 'text-black/15'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#19161A] ml-2">{newReviewRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#19161A] block mb-1">Headline / Review Title *</label>
                <input
                  type="text"
                  required
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  placeholder="e.g. Gorgeous coverage that stays all day!"
                  className="w-full px-3 py-2 border border-black/20 rounded-md text-xs bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#19161A] block mb-1">Your Honest Experience *</label>
                <textarea
                  rows={4}
                  required
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Tell other beauty lovers about shade match, longevity, formula texture, and finish..."
                  className="w-full px-3 py-2 border border-black/20 rounded-md text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview || !newReviewTitle.trim() || !newReviewComment.trim()}
                  className="bg-[#B83B63] hover:bg-[#9B2C4F] text-white cursor-pointer"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StorefrontShell>
  );
}
