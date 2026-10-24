'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { useCart } from '@/lib/cart/CartContext';
import {
  Sparkles,
  ShieldCheck,
  Star,
  CheckCircle2,
  Truck,
  Droplets,
  Sun,
  Clock,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  Zap,
  Award,
  Layers,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadianceComparisonSlider } from '@/components/storefront/RadianceComparisonSlider';

interface HeroSlide {
  src: string;
  alt: string;
  buttonText: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/product/hero-section-img1.png',
    alt: 'DIMSGLOW Sun Protection for a Brighter You - Tinted Sunscreen SPF 50+',
    buttonText: 'ORDER NOW',
  },
  {
    src: '/product/hero-section-img2.png',
    alt: 'DIMSGLOW Tinted Sunscreen SPF 50+ - Your Daily Glow Essential',
    buttonText: 'SHOP NOW',
  },
];

interface ProductImage {
  src: string;
  alt: string;
  title: string;
}

const PRODUCT_IMAGES: ProductImage[] = [
  {
    src: '/product/sunscreen-bottle-offer.jpg',
    alt: 'DIMSGLOW Tinted Sunscreen SPF 50+ Bottle Offer',
    title: 'Flagship Sunscreen Bottle',
  },
  {
    src: '/product/sunscreen-magazine-model.jpg',
    alt: 'DIMSGLOW Sunscreen Featured on Beauty Today Magazine',
    title: 'As Featured in Beauty Today',
  },
  {
    src: '/product/sunscreen-before-after.jpg',
    alt: 'DIMSGLOW Sunscreen Before & After Results',
    title: 'Before & After Results',
  },
  {
    src: '/product/sunscreen-split-glow.jpg',
    alt: 'Fades Tan & Pigmentation - DIMSGLOW',
    title: 'Fades Tan & Pigmentation',
  },
];

const PRODUCT_PRICE_PAISE = 99900;
const COMPARE_PRICE_PAISE = 129900;

const REVIEWS = [
  {
    id: 'r1',
    name: 'Priyanka Sharma',
    city: 'Mumbai',
    rating: 5,
    title: 'Finally, zero white cast on my warm skin!',
    comment:
      'I was so skeptical because most Indian sunscreens leave an ashy white layer. DIMSGLOW tinted formula literally melted into my skin like a primer. It blurred my pigmentation and gave this dewy glass skin glow. Wearing it every single day now!',
    tag: 'Zero White Cast',
    date: '3 days ago',
  },
  {
    id: 'r2',
    name: 'Ananya Deshmukh',
    city: 'Bengaluru',
    rating: 5,
    title: 'My stubborn dark spots started fading in 2 weeks',
    comment:
      'The combination of SPF 50+ with active brightening ingredients actually works. My post-acne marks on my cheeks have visibly softened. It is not oily at all, perfect under Bangalore humidity.',
    tag: 'Fades Dark Spots',
    date: '1 week ago',
  },
  {
    id: 'r3',
    name: 'Dr. Meera Iyer',
    city: 'Delhi NCR',
    rating: 5,
    title: 'Dermatologically well-balanced formulation',
    comment:
      'Broad spectrum UVA/UVB PA++++ with blue light defense in a non-comedogenic base. Doesn’t clog pores and gives a radiant, clean tint. Highly recommended for daily outdoor protection.',
    tag: 'Dermatologist Verified',
    date: '2 weeks ago',
  },
  {
    id: 'r4',
    name: 'Sneha Patel',
    city: 'Ahmedabad',
    rating: 5,
    title: 'Replaced my daily foundation completely!',
    comment:
      'Gives just enough natural tint to even out my complexion, redness, and sun tan without feeling like heavy makeup. My skin breathes, stays hydrated, and looks radiant all day.',
    tag: 'Natural Glow Finish',
    date: '2 weeks ago',
  },
];

const FAQS = [
  {
    q: 'Does DIMSGLOW Tinted Sunscreen leave a white cast?',
    a: 'No, absolutely not. DIMSGLOW Tinted Sunscreen is formulated with micro-sheer pigments that adapt universally across all Indian skin tones. It blends into a weightless, invisible, dewy glow with zero chalkiness or white residue.',
  },
  {
    q: 'How does it help fade dark spots and pigmentation?',
    a: 'It combines broad-spectrum SPF 50+ PA++++ with clinical brightening actives. By blocking 98% of UVA/UVB and HEV blue light, it prevents melanin overproduction, allowing active brightening ingredients to visibly fade existing sun spots and acne marks over 14–21 days.',
  },
  {
    q: 'Is it suitable for oily, combination, or acne-prone skin?',
    a: 'Yes! It is dermatologically tested, non-comedogenic (won’t clog pores), and crafted with an oil-free, breathable hydrating finish that controls excess shine while keeping skin plump.',
  },
  {
    q: 'Can I use it as a makeup primer?',
    a: 'Yes, it works beautifully as a 2-in-1 hydrating primer and UV shield. It creates a smooth, luminous base that holds makeup or looks stunning worn completely on its own.',
  },
  {
    q: 'How long does one 50 ml bottle last?',
    a: 'With recommended daily morning application (2 finger-lengths for face and neck), a 50 ml bottle typically lasts 45 to 60 days.',
  },
  {
    q: 'What payment methods do you support?',
    a: 'We accept Cash on Delivery (COD) across India, alongside all major UPI options (GPay, PhonePe, Paytm), credit/debit cards, and net banking with 100% secure encrypted checkout.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { addToCart, setIsCartDrawerOpen } = useCart();
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHeroSlidePaused, setIsHeroSlidePaused] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAdding, setIsAdding] = useState(false);

  // Auto-slide hero banner timer (every 5 seconds, pauses on hover)
  useEffect(() => {
    if (isHeroSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroSlidePaused]);

  const handlePrevHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // Auto-slide product image timer (every 4 seconds, pauses on hover)
  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % PRODUCT_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  const handlePrevSlide = () => {
    setActiveImageIndex((prev) => (prev - 1 + PRODUCT_IMAGES.length) % PRODUCT_IMAGES.length);
  };

  const handleNextSlide = () => {
    setActiveImageIndex((prev) => (prev + 1) % PRODUCT_IMAGES.length);
  };

  const handleAddToCart = async (goToCheckout = false) => {
    setIsAdding(true);
    try {
      await addToCart({
        id: 'prod_tinted_sunscreen_spf50_var_sunscreen_50ml',
        productId: 'prod_tinted_sunscreen_spf50',
        variantId: 'var_sunscreen_50ml',
        productName: 'DIMSGLOW Tinted Sunscreen SPF 50+ (50 ml)',
        variantTitle: '50 ml | 1.69 FL. OZ.',
        quantity: 1,
        unitPricePaise: PRODUCT_PRICE_PAISE,
        compareAtPricePaise: COMPARE_PRICE_PAISE,
        imageUrl: PRODUCT_IMAGES[0].src,
        slug: 'tinted-sunscreen-spf50',
      });

      if (goToCheckout) {
        router.push('/checkout');
      } else {
        setIsCartDrawerOpen(true);
      }
    } catch (err) {
      console.error('Failed to add to bag:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <StorefrontShell>
      {/* 1. FULL-WIDTH PANORAMIC HERO SLIDING BANNER */}
      <section
        className="relative w-full bg-[#FFF0F4] overflow-hidden border-b border-[#F0EBF0]"
        onMouseEnter={() => setIsHeroSlidePaused(true)}
        onMouseLeave={() => setIsHeroSlidePaused(false)}
      >
        <div
          className="relative w-full aspect-[1024/384] max-h-[640px] select-none group shadow-inner overflow-hidden"
          style={{ aspectRatio: '1024 / 384' }}
        >
          {/* Sliding Track */}
          <div
            className="flex h-full w-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentHeroSlide * 100}%)` }}
          >
            {HERO_SLIDES.map((slide, idx) => (
              <div key={slide.src} className="relative min-w-full h-full">
                <Link href="#shop" className="block relative w-full h-full cursor-pointer">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={idx === 0}
                    className="object-cover w-full h-full"
                    sizes="100vw"
                  />
                </Link>
              </div>
            ))}
          </div>

          {/* Left Navigation Chevron */}
          <button
            type="button"
            onClick={handlePrevHeroSlide}
            aria-label="Previous hero banner"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-[#19161A] hover:text-[#B83B63] shadow-lg border border-white/50 flex items-center justify-center transition-all opacity-85 sm:opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-20 backdrop-blur-xs"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Navigation Chevron */}
          <button
            type="button"
            onClick={handleNextHeroSlide}
            aria-label="Next hero banner"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-[#19161A] hover:text-[#B83B63] shadow-lg border border-white/50 flex items-center justify-center transition-all opacity-85 sm:opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-20 backdrop-blur-xs"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full z-20">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentHeroSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentHeroSlide === idx
                    ? 'w-7 bg-[#B83B63]'
                    : 'w-2 bg-white/70 hover:bg-white'
                }`}
                aria-label={`Go to banner slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION TRUST STRIP */}
      <div className="bg-[#19161A] text-white py-2.5 sm:py-3 px-3 sm:px-4 border-b border-[#2D1B24] overflow-hidden">
        {/* Desktop View: Centered Row */}
        <div className="hidden md:flex max-w-7xl mx-auto items-center justify-around gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#D4AF37]" />
            <span>FREE EXPRESS DELIVERY PAN-INDIA</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#B83B63]" />
            <span>CASH ON DELIVERY & UPI ACCEPTED</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>DERMATOLOGICALLY TESTED FOR ALL SKIN TYPES</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B83B63]" />
            <span>SPECIAL LAUNCH OFFER: FLAT ₹300 OFF</span>
          </div>
        </div>

        {/* Mobile View: Clean Single-Line Continuous Ticker */}
        <div className="md:hidden overflow-hidden whitespace-nowrap">
          <div className="inline-flex items-center gap-6 animate-marquee text-[10.5px] font-bold tracking-wider">
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
              FREE EXPRESS DELIVERY PAN-INDIA
            </span>
            <span className="text-[#D4AF37] opacity-60">•</span>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B83B63]" />
              CASH ON DELIVERY & UPI ACCEPTED
            </span>
            <span className="text-[#D4AF37] opacity-60">•</span>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              DERMATOLOGICALLY TESTED FOR ALL SKIN TYPES
            </span>
            <span className="text-[#D4AF37] opacity-60">•</span>
            {/* Seamless repetition for infinite continuous loop */}
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
              FREE EXPRESS DELIVERY PAN-INDIA
            </span>
            <span className="text-[#D4AF37] opacity-60">•</span>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B83B63]" />
              CASH ON DELIVERY & UPI ACCEPTED
            </span>
            <span className="text-[#D4AF37] opacity-60">•</span>
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              DERMATOLOGICALLY TESTED FOR ALL SKIN TYPES
            </span>
            <span className="text-[#D4AF37] opacity-60">•</span>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT DETAIL & BUY BOX SECTION */}
      <section id="shop" className="bg-linear-to-b from-[#FFF5F8] via-[#FFF9FA] to-white py-8 sm:py-14 border-b border-[#F0EBF0] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Product Images Sliding Gallery - Perfectly Visible in Mobile & Desktop */}
            <div className="lg:col-span-6 space-y-4">
              <div
                className="relative aspect-[702/1024] w-full max-w-[460px] mx-auto rounded-2xl overflow-hidden bg-white border border-[#E8E2E7] shadow-xl group select-none"
                style={{ aspectRatio: '702 / 1024' }}
                onMouseEnter={() => setIsSlidePaused(true)}
                onMouseLeave={() => setIsSlidePaused(false)}
              >
                {/* Sliding Image Track */}
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                >
                  {PRODUCT_IMAGES.map((img, idx) => (
                    <div
                      key={img.src}
                      className="relative min-w-full h-full flex items-center justify-center bg-white"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        priority={idx === 0}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  ))}
                </div>

                {/* Left & Right Chevron Buttons */}
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Previous slide"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#19161A] hover:text-[#B83B63] shadow-md border border-[#E8E2E7] flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Next slide"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#19161A] hover:text-[#B83B63] shadow-md border border-[#E8E2E7] flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slide Indicator Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
                  {PRODUCT_IMAGES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'w-6 bg-[#B83B63]'
                          : 'w-2 bg-white/70 hover:bg-white'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Synchronized 4 Thumbnails */}
              <div className="grid grid-cols-4 gap-2.5 max-w-[460px] mx-auto px-1 sm:px-0">
                {PRODUCT_IMAGES.map((img, idx) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-[702/1024] rounded-xl overflow-hidden bg-white border-2 transition-all p-0.5 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#B83B63] ring-2 ring-[#B83B63]/25 scale-102 shadow-sm'
                        : 'border-[#E8E2E7] hover:border-[#B83B63]/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>

              {/* Verified Trust Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] font-semibold text-[#6D6670]">
                <div className="p-2.5 rounded-xl bg-[#FAF8FA] border border-[#E8E2E7]">
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#B83B63]" />
                  <span>Dermatologically Tested</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF8FA] border border-[#E8E2E7]">
                  <Sun className="w-4 h-4 mx-auto mb-1 text-[#D4AF37]" />
                  <span>Blue Light Shield</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF8FA] border border-[#E8E2E7]">
                  <Droplets className="w-4 h-4 mx-auto mb-1 text-[#B83B63]" />
                  <span>Zero White Cast</span>
                </div>
              </div>
            </div>

            {/* Right: High-Converting Buy Box */}
            <div className="lg:col-span-6 space-y-6">
              {/* Category & Rating */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B83B63]/10 text-[#B83B63] text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DIMSGLOW SUNSCREEN • SKINCARE REDEFINED</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold font-serif-brand text-[#19161A] tracking-tight leading-tight">
                  Fade Dark Spots. Reveal Your Glow.
                </h1>

                <p className="text-sm sm:text-base font-semibold text-[#B83B63]">
                  DIMSGLOW Tinted Sunscreen SPF 50+ PA++++
                </p>

                <p className="text-xs sm:text-sm text-[#6D6670] leading-relaxed">
                  Your daily glow essential! Advanced UV protection meets clinical skin tone correction.
                  Reduces tanning, fades stubborn dark spots & pigmentation, and guards against blue light with an ultra-hydrating, zero-white-cast radiant finish.
                </p>

                {/* Star rating summary */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center text-[#E5A93C]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#19161A]">4.9 / 5.0</span>
                  <span className="text-xs text-[#9A939E]">• 1,420+ Verified Customers</span>
                </div>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2E7] shadow-xs flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-[#6D6670] uppercase tracking-wider block">
                    Special Launch Offer
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#B83B63]">
                      ₹999
                    </span>
                    <span className="text-base line-through text-[#9A939E]">
                      ₹1,299
                    </span>
                    <span className="text-xs font-bold text-[#B83B63] bg-[#B83B63]/10 px-2.5 py-0.5 rounded-full">
                      SAVE ₹300 (23% OFF)
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  In Stock • Dispatches in 24h
                </span>
              </div>

              {/* Single Product Specification Badge */}
              <div className="p-3.5 rounded-xl border border-[#E8E2E7] bg-[#FAF8FA] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B83B63]" />
                  <span className="font-bold text-[#19161A]">Single Bottle (50 ml | 1.69 FL. OZ.)</span>
                </div>
                <span className="text-[11px] font-semibold text-[#6D6670]">45–60 Days Supply</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button
                  onClick={() => handleAddToCart(false)}
                  disabled={isAdding}
                  className="w-full py-4 text-sm sm:text-base font-bold bg-[#19161A] hover:bg-black text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{isAdding ? 'ADDING TO BAG...' : 'ADD TO BAG • ₹999'}</span>
                </Button>

                <Button
                  onClick={() => handleAddToCart(true)}
                  disabled={isAdding}
                  className="w-full py-4 text-sm sm:text-base font-bold bg-linear-to-r from-[#B83B63] to-[#881337] hover:brightness-110 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>BUY NOW (CASH ON DELIVERY AVAILABLE)</span>
                </Button>
              </div>

              {/* Bulleted Guarantees */}
              <div className="pt-2 border-t border-[#E8E2E7] grid grid-cols-2 gap-2 text-xs text-[#6D6670]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free Express Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine Direct from Brand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Safe for All Skin Types</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CLINICAL RESULTS: COVERAGE THAT LOOKS LIKE SKIN */}
      <section className="py-14 sm:py-20 bg-linear-to-b from-white via-[#FFF9FA] to-white border-b border-[#F0EBF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
              CLINICAL RESULTS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              COVERAGE THAT LOOKS LIKE SKIN
            </h2>
            <p className="text-xs sm:text-sm text-[#6D6670] max-w-xl mx-auto">
              Drag the interactive slider to see how DIMSGLOW blurs imperfections while preserving real skin texture.
            </p>
          </div>

          <RadianceComparisonSlider
            beforeImage="/product/skin-before.jpg"
            afterImage="/product/skin-after.jpg"
            beforeAlt="Before DIMSGLOW Tinted Sunscreen - Natural Bare Skin"
            afterAlt="After DIMSGLOW Tinted Sunscreen - Radiant & Flawless Glass Skin"
          />
        </div>
      </section>

      {/* 2. FOUR CORE CLINICAL PILLARS */}
      <section id="benefits" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#B83B63] uppercase tracking-widest">
              More Than Just Sunscreen
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              Why Choose DIMSGLOW Tinted Sunscreen?
            </h2>
            <p className="text-xs sm:text-sm text-[#6D6670]">
              Formulated specifically for Indian skin to fight UV damage, stubborn tanning, and digital photoaging in one daily step.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-[#FFF9FA] border border-[#F5D8E4] hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#F0D0DC] flex items-center justify-center text-[#B83B63] shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#19161A]">Brightening Care</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                Targets dark spots, pigmentation, and uneven sun tan. Gently accelerates cell turnover for a luminous, clarified glow.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-[#FFF9FA] border border-[#F5D8E4] hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#F0D0DC] flex items-center justify-center text-[#B83B63] shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#19161A]">Anti-Ageing Care</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                Shields skin collagen from photo-breakdown, helping to prevent and visibly soften fine lines, wrinkles, and loss of firmness.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-[#FFF9FA] border border-[#F5D8E4] hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#F0D0DC] flex items-center justify-center text-[#B83B63] shadow-xs">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#19161A]">Daily Skin Protection</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                High-potency SPF 50+ PA++++ broad-spectrum UVA & UVB defense combined with digital Blue Light protection against screen rays.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-[#FFF9FA] border border-[#F5D8E4] hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#F0D0DC] flex items-center justify-center text-[#B83B63] shadow-xs">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#19161A]">Hydrating Finish</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                Non-comedogenic, weightless formula that locks in continuous moisture with an adaptive sheer tint and zero greasy white cast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BEFORE & AFTER TRANSFORMATION SHOWCASE */}
      <section id="results" className="py-14 sm:py-20 bg-linear-to-b from-[#FFF5F8] to-white border-y border-[#F0EBF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#B83B63] uppercase tracking-widest">
              Proven Real Results
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              Fades Tan & Pigmentation — For a Brighter, Even-Toned You
            </h2>
            <p className="text-xs sm:text-sm text-[#6D6670]">
              Because your skin deserves more. Witness visible transformation with daily morning application.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Visual Graphic */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="w-full max-w-[420px] mx-auto rounded-xl overflow-hidden bg-white border border-[#E8E2E7] shadow-xl">
                <Image
                  src="/product/sunscreen-before-after.jpg"
                  alt="DIMSGLOW Sunscreen Before and After Results"
                  width={702}
                  height={1024}
                  className="w-full h-auto block object-contain"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 420px, 460px"
                />
              </div>
            </div>

            {/* Clinical Highlights & Statistics */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-[#E8E2E7] shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#B83B63]/10 text-[#B83B63] flex items-center justify-center font-black text-lg shrink-0">
                    95%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#19161A]">Dark Spot Reduction</h4>
                    <p className="text-xs text-[#6D6670]">
                      Observed visible fading of stubborn post-acne and sun pigmentation in 14 days.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E8E2E7] shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 text-[#AA771C] flex items-center justify-center font-black text-lg shrink-0">
                    98%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#19161A]">Zero White Cast</h4>
                    <p className="text-xs text-[#6D6670]">
                      Agreed the sheer universal tint absorbed cleanly across light, medium, and deep Indian complexions.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E8E2E7] shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#B83B63]/10 text-[#B83B63] flex items-center justify-center font-black text-lg shrink-0">
                    92%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#19161A]">Tanning Defense</h4>
                    <p className="text-xs text-[#6D6670]">
                      Reported complete protection against tanning and sunburn even during peak afternoon hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instant Purchase CTA */}
              <div className="pt-2">
                <Button
                  onClick={() => handleAddToCart(false)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#B83B63] hover:bg-[#9E2E52] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>CLAIM LAUNCH OFFER (₹999)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAGAZINE EDITORIAL SPOTLIGHT */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-linear-to-r from-[#19161A] to-[#2D1B24] text-white p-6 sm:p-10 lg:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 w-full max-w-[360px] sm:max-w-[400px] mx-auto flex items-center justify-center">
              <div className="w-full relative shadow-2xl rounded-lg overflow-hidden border border-white/20 bg-black/40">
                <Image
                  src="/product/sunscreen-magazine-model.jpg"
                  alt="Beauty Today Magazine Feature - Your Daily Glow Essential"
                  width={682}
                  height={1024}
                  priority
                  className="w-full h-auto block object-contain"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 360px, 400px"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 sm:pl-4">
              <span className="text-[11px] font-bold text-[#D4AF37] tracking-widest uppercase">
                As Featured in Beauty Today
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold font-serif-brand leading-tight">
                Your Daily Glow Essential
              </h2>

              <p className="text-sm text-white/80 leading-relaxed">
                “DIMSGLOW Skincare Redefined delivers powerful sun defense with skin tone transformation.
                More than just a sunscreen — it gives brighter skin, a younger look, and all-day confidence.”
              </p>

              <div className="pt-2 grid grid-cols-2 gap-3 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>Remove Darkspots & Pigmentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>Blue Light Defense</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>Remove Wrinkles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>Keep Skin Hydrated</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/products/tinted-sunscreen-spf50"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#19161A] font-bold text-xs uppercase tracking-wider hover:bg-[#FFF0F4] transition-colors"
                >
                  <span>Experience The Glow</span>
                  <ArrowRight className="w-4 h-4 text-[#B83B63]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIMPLE 3-STEP DAILY ROUTINE */}
      <section className="py-14 sm:py-18 bg-[#FFF9FA] border-t border-[#F0EBF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-[#B83B63] uppercase tracking-widest">
              Simple Application
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              How to Use for Best Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8E2E7] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#B83B63] text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="font-bold text-sm text-[#19161A]">Dispense</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                Pump two finger-lengths of DIMSGLOW Tinted Sunscreen onto your fingertips.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8E2E7] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#B83B63] text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="font-bold text-sm text-[#19161A]">Dot & Spread</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                Dot evenly across your face, neck, and exposed areas 15 minutes before stepping out.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8E2E7] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#B83B63] text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="font-bold text-sm text-[#19161A]">Blend & Glow</h3>
              <p className="text-xs text-[#6D6670] leading-relaxed">
                Blend smoothly with gentle circular motions for an instant, tinted radiant glow. Reapply every 3-4 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED CUSTOMER REVIEWS */}
      <section id="reviews" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-[#B83B63] uppercase tracking-widest block">
                Loved by 1,420+ Women Across India
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A] mt-1">
                Real Customer Reviews
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex text-[#E5A93C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-bold text-[#19161A]">4.9 Overall Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REVIEWS.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-2xl bg-[#FFF9FA] border border-[#F0EBF0] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex text-[#E5A93C]">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#9A939E]">{review.date}</span>
                  </div>

                  <h3 className="text-xs font-bold text-[#19161A] leading-snug">
                    {review.title}
                  </h3>

                  <p className="text-[11px] text-[#6D6670] leading-relaxed">
                    “{review.comment}”
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E2E7] flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-[#19161A] block">{review.name}</span>
                    <span className="text-[10px] text-[#9A939E]">{review.city}</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-14 sm:py-20 bg-[#FAF8FA] border-t border-[#E8E2E7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold text-[#B83B63] uppercase tracking-widest">
              Have Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#E8E2E7] bg-white overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-[#19161A] flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#B83B63] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-[#6D6670] leading-relaxed border-t border-[#FAF8FA]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FIXED STICKY MOBILE CTA BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2E7] p-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#E8E2E7] shrink-0">
            <Image
              src="/product/sunscreen-bottle-offer.jpg"
              alt="Sunscreen"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-[#19161A] block leading-tight">
              DIMSGLOW Tinted Sunscreen
            </span>
            <span className="text-xs font-extrabold text-[#B83B63]">
              ₹999 <span className="text-[10px] line-through text-[#9A939E]">₹1,299</span>
            </span>
          </div>
        </div>

        <Button
          onClick={() => handleAddToCart(false)}
          className="px-5 py-2.5 bg-linear-to-r from-[#B83B63] to-[#881337] text-white text-xs font-bold rounded-xl shadow-md shrink-0"
        >
          ORDER NOW
        </Button>
      </div>
    </StorefrontShell>
  );
}
