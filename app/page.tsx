'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductCard } from '@/components/storefront/ProductCard';
import type { Product } from '@/lib/schemas/product';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Heart,
  Award,
  Star,
  ArrowRight,
  Leaf,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Bestseller Products matching the reference PDF catalog structure
const SAMPLE_BESTSELLERS: Product[] = [
  {
    id: 'prod_skin_tint',
    slug: 'skin-tint-5-in-1',
    name: 'Skin Tint 5 In 1 Multifunctional Serum Foundation',
    tagline: 'Lightweight formula with Niacinamide & Rice Water for a natural, hydrated glow',
    description: 'A revolutionary 5-in-1 serum foundation that seamlessly blurs pores, hydrates, and protects with SPF 20 PA++++.',
    categoryIds: ['face'],
    status: 'published',
    pricePaise: 31900,
    compareAtPricePaise: 39900,
    currency: 'INR',
    media: [
      {
        publicId: 'dimsglow/products/skin_tint_1',
        secureUrl: '/brand/dimsglow-logo.jpg',
        altText: 'DIMSGLOW Skin Tint 5 In 1 Serum Foundation',
        isPrimary: true,
      },
    ],
    benefitPill: 'Natural Glow, Dewy Finish',
    unlockFreeGift: true,
    ratingSummary: { average: 5.0, reviewCount: 17 },
    trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
    variants: [
      {
        id: 'var_whipped_cream',
        sku: 'DIMS-ST-01',
        title: 'Whipped Cream',
        options: [{ name: 'Shade', value: 'Whipped Cream', swatchColor: '#F5E3D3' }],
        pricePaise: 31900,
        onHand: 40,
        reserved: 1,
        lowStockThreshold: 5,
        active: true,
      },
      {
        id: 'var_vanilla_frappe',
        sku: 'DIMS-ST-02',
        title: 'Vanilla Frappe',
        options: [{ name: 'Shade', value: 'Vanilla Frappe', swatchColor: '#E8D0BA' }],
        pricePaise: 31900,
        onHand: 35,
        reserved: 0,
        lowStockThreshold: 5,
        active: true,
      },
      {
        id: 'var_latte_please',
        sku: 'DIMS-ST-03',
        title: 'Latte Please',
        options: [{ name: 'Shade', value: 'Latte Please', swatchColor: '#D9B89D' }],
        pricePaise: 31900,
        onHand: 28,
        reserved: 2,
        lowStockThreshold: 5,
        active: true,
      },
      {
        id: 'var_cappucino',
        sku: 'DIMS-ST-04',
        title: 'Cappucino',
        options: [{ name: 'Shade', value: 'Cappucino', swatchColor: '#C49E80' }],
        pricePaise: 31900,
        onHand: 20,
        reserved: 0,
        lowStockThreshold: 5,
        active: true,
      },
    ],
    featured: true,
    bestseller: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'prod_matte_lipstick',
    slug: '24hrs-non-transfer-matte-lipstick',
    name: '24 Hrs Non Transfer Matte Lipstick',
    tagline: 'High pigment creamy matte finish that stays up to 24 hours without cracking',
    description: 'Enriched with Vitamin E and Castor Oil for weightless, smudge-proof, transfer-proof lip definition.',
    categoryIds: ['lips'],
    status: 'published',
    pricePaise: 31000,
    compareAtPricePaise: 39000,
    currency: 'INR',
    media: [
      {
        publicId: 'dimsglow/products/matte_lipstick_1',
        secureUrl: '/brand/dimsglow-logo.jpg',
        altText: 'DIMSGLOW 24 Hrs Non Transfer Matte Lipstick',
        isPrimary: true,
      },
    ],
    benefitPill: 'Transfer & Smudge Proof',
    unlockFreeGift: true,
    ratingSummary: { average: 4.8, reviewCount: 42 },
    trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
    variants: [
      {
        id: 'var_red_royale',
        sku: 'DIMS-LP-01',
        title: 'Red Royale',
        options: [{ name: 'Shade', value: 'Red Royale', swatchColor: '#9E1B32' }],
        pricePaise: 31000,
        onHand: 50,
        reserved: 3,
        lowStockThreshold: 5,
        active: true,
      },
      {
        id: 'var_berry_bloom',
        sku: 'DIMS-LP-02',
        title: 'Berry Bloom',
        options: [{ name: 'Shade', value: 'Berry Bloom', swatchColor: '#7A1C43' }],
        pricePaise: 31000,
        onHand: 45,
        reserved: 1,
        lowStockThreshold: 5,
        active: true,
      },
      {
        id: 'var_nude_crush',
        sku: 'DIMS-LP-03',
        title: 'Nude Crush',
        options: [{ name: 'Shade', value: 'Nude Crush', swatchColor: '#B36D67' }],
        pricePaise: 31000,
        onHand: 30,
        reserved: 0,
        lowStockThreshold: 5,
        active: true,
      },
    ],
    featured: true,
    bestseller: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'prod_strobe_cream',
    slug: 'instant-glass-skin-strobe-cream',
    name: 'Instant Glass Skin Strobe Cream',
    tagline: 'Infused with Hyaluronic Acid & Panthenol for a radiant lit-from-within glow',
    description: 'A multi-use highlighting cream that boosts hydration and adds an instant glass-skin radiance.',
    categoryIds: ['face'],
    status: 'published',
    pricePaise: 39900,
    compareAtPricePaise: 49900,
    currency: 'INR',
    media: [
      {
        publicId: 'dimsglow/products/strobe_cream_1',
        secureUrl: '/brand/dimsglow-logo.jpg',
        altText: 'DIMSGLOW Strobe Cream',
        isPrimary: true,
      },
    ],
    benefitPill: 'Natural Radiant Glow',
    unlockFreeGift: true,
    ratingSummary: { average: 4.9, reviewCount: 26 },
    trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
    variants: [
      {
        id: 'var_pink_topaz',
        sku: 'DIMS-SC-01',
        title: 'Pink Topaz',
        options: [{ name: 'Shade', value: 'Pink Topaz', swatchColor: '#F2D5D9' }],
        pricePaise: 39900,
        onHand: 30,
        reserved: 0,
        lowStockThreshold: 5,
        active: true,
      },
      {
        id: 'var_gold_champagne',
        sku: 'DIMS-SC-02',
        title: 'Gold Champagne',
        options: [{ name: 'Shade', value: 'Gold Champagne', swatchColor: '#F5E2C8' }],
        pricePaise: 39900,
        onHand: 25,
        reserved: 1,
        lowStockThreshold: 5,
        active: true,
      },
    ],
    featured: true,
    bestseller: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'prod_setting_spray',
    slug: 'super-lock-makeup-setting-spray',
    name: 'Super Lock Makeup Setting Spray',
    tagline: 'High-performing with Witch Hazel & Aloe Vera for 24-hour shine control',
    description: 'Locks foundation, blush, and contour in place with a refreshing micro-mist finish.',
    categoryIds: ['face'],
    status: 'published',
    pricePaise: 24000,
    compareAtPricePaise: 31000,
    currency: 'INR',
    media: [
      {
        publicId: 'dimsglow/products/setting_spray_1',
        secureUrl: '/brand/dimsglow-logo.jpg',
        altText: 'DIMSGLOW Setting Spray',
        isPrimary: true,
      },
    ],
    benefitPill: 'Smudge-Proof & Long Lasting',
    unlockFreeGift: true,
    ratingSummary: { average: 4.7, reviewCount: 38 },
    trustBadges: ['Toxic Free', 'Dermatologically Tested', 'Vegan'],
    variants: [
      {
        id: 'var_default_spray',
        sku: 'DIMS-SS-100',
        title: '100ml Matte Lock',
        options: [{ name: 'Size', value: '100ml' }],
        pricePaise: 24000,
        onHand: 60,
        reserved: 4,
        lowStockThreshold: 5,
        active: true,
      },
    ],
    featured: true,
    bestseller: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const HERO_SLIDES = [
  {
    id: 1,
    tagline: 'NEW LAUNCH • TRANSFER-PROOF COLLECTION',
    title: 'LOCK THE SHINE',
    subtitle: 'Flawless Vinyl Lip Color with Zero Touch-ups Required',
    ctaText: 'EXPLORE LIP LUXURY',
    ctaLink: '/collections/lips',
    bgGradient: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
    accentColor: '#B83B63',
  },
  {
    id: 2,
    tagline: 'HIGH-PERFORMING SKINCARE ESSENTIAL',
    title: 'SUPER LOCK SETTING MIST',
    subtitle: 'Infused with Witch Hazel & Aloe Vera for 24-Hour Flawless Freshness',
    ctaText: 'SHOP SETTING SPRAY',
    ctaLink: '/products/super-lock-makeup-setting-spray',
    bgGradient: 'from-[#0C2D3E] via-[#104D6B] to-[#0A1A24]',
    accentColor: '#18794E',
  },
  {
    id: 3,
    tagline: 'EXCLUSIVE WEBSITE OFFER',
    title: 'FREE LIP OIL & LIPSTICK',
    subtitle: 'Complimentary full-size beauty gift on all orders above ₹699',
    ctaText: 'UNLOCK FREE GIFT',
    ctaLink: '/collections/combos',
    bgGradient: 'from-[#3A1C0E] via-[#6B3210] to-[#1A0B05]',
    accentColor: '#D4AF37',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <StorefrontShell>
      {/* 1. Hero Carousel */}
      <section className="relative overflow-hidden">
        <div
          className={`w-full min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] bg-gradient-to-r ${HERO_SLIDES[currentSlide].bgGradient} text-white flex items-center transition-all duration-700 ease-in-out`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <span className="inline-block text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
                {HERO_SLIDES[currentSlide].tagline}
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif-brand tracking-tight leading-tight">
                {HERO_SLIDES[currentSlide].title}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>
              <div className="pt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href={HERO_SLIDES[currentSlide].ctaLink}>
                  <Button variant="primary" size="lg" className="shadow-lg">
                    {HERO_SLIDES[currentSlide].ctaText} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/collections/all">
                  <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    VIEW ALL PRODUCTS
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Emblem Display */}
            <div className="flex justify-center items-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-[#D4AF37]/40 p-4 shadow-2xl flex items-center justify-center bg-black/20 backdrop-blur-xs">
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-inner">
                  <Image
                    src="/brand/dimsglow-logo.jpg"
                    alt="DIMSGLOW Luxury Brand Feature"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Nav Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-xs transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. Category Quick Browse Circles */}
      <section className="py-10 border-b border-[#E8E2E7] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
            {[
              { name: 'Face', href: '/collections/face', tag: 'Foundations & Primer' },
              { name: 'Eyes', href: '/collections/eyes', tag: 'Kajal & Mascara' },
              { name: 'Lips', href: '/collections/lips', tag: 'Matte & Gloss' },
              { name: 'Nails', href: '/collections/nails', tag: 'Toxic-Free Color' },
              { name: 'Skin Care', href: '/collections/skin-care', tag: 'Active Serums' },
              { name: 'Perfumes', href: '/collections/perfumes', tag: 'Eau De Parfum' },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group flex flex-col items-center space-y-2 p-2 transition-transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FAF8FA] border-2 border-[#E8E2E7] group-hover:border-[#B83B63] overflow-hidden flex items-center justify-center transition-colors shadow-xs">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/brand/dimsglow-logo.jpg"
                      alt={cat.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#19161A] group-hover:text-[#B83B63] transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-[#6D6670] hidden sm:block">{cat.tag}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bestsellers Showcase */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2E7] pb-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#B83B63]">
                Customer Favorites
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
                BEST SELLERS
              </h2>
            </div>
            <Link
              href="/collections/all?tag=bestseller"
              className="text-xs font-bold text-[#B83B63] hover:text-[#982D50] flex items-center gap-1 group"
            >
              VIEW ALL BESTSELLERS <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {SAMPLE_BESTSELLERS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Editorial Highlight Banner: 95% Reduction in Dark Spots */}
      <section className="py-12 bg-[#FBEAF0] border-y border-[#F5D8E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
                CLINICALLY PROVEN FORMULATION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-serif-brand text-[#19161A]">
                <span className="text-[#B83B63] text-5xl">95%</span> Reduction in Dark Spots
              </h2>
              <p className="text-xs sm:text-sm text-[#6D6670] leading-relaxed">
                Reduces blemishes, provides radiant glow, improves skin elasticity, and refines hyperpigmentation with active Niacinamide, Arbutin, and 2.5% Glutathione.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['Arbutin', '2.5% Glutathione', 'Vitamin C', 'Amino Acid'].map((ing) => (
                  <span
                    key={ing}
                    className="text-xs bg-white text-[#B83B63] border border-[#B83B63]/20 font-bold px-3 py-1 rounded-full shadow-2xs"
                  >
                    ✓ {ing}
                  </span>
                ))}
              </div>
              <div className="pt-2">
                <Link href="/collections/skin-care">
                  <Button variant="primary" size="md">
                    SHOP RADIANCE SERUM
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative w-72 h-72 sm:w-88 sm:h-88 rounded-[16px] bg-white border border-[#E8E2E7] shadow-lg p-6 flex flex-col justify-center items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-[#D4AF37]/50 shadow-sm relative">
                  <Image
                    src="/brand/dimsglow-logo.jpg"
                    alt="Active Serum"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#19161A]">Youthful Glow Face Serum</h4>
                  <p className="text-xs text-[#18794E] font-semibold">★ 4.9 (14 Reviews)</p>
                  <p className="text-sm font-bold text-[#19161A]">₹299.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "Get The Look!" Editorial Grid */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              Get The Look!
            </h2>
            <p className="text-xs text-[#6D6670]">
              Curated beauty routines designed for day, night, festive, and red carpet elegance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'EVERYDAY GLOW', href: '/collections/face', desc: 'Natural skin tints & dewy cheeks' },
              { title: 'ROMANTIC GLAM', href: '/collections/lips', desc: 'Soft rose lips & shimmering eyelids' },
              { title: 'BOLD & BEAUTIFUL', href: '/collections/eyes', desc: 'Winged drama & smokey depth' },
              { title: 'FESTIVE GLOW', href: '/collections/combos', desc: 'Full coverage radiance & golden accents' },
            ].map((look) => (
              <Link
                key={look.title}
                href={look.href}
                className="group relative rounded-[10px] overflow-hidden aspect-[3/4] bg-[#F7F5F7] border border-[#E8E2E7] flex flex-col justify-end p-4 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
                <div className="relative z-20 space-y-1 text-white">
                  <h3 className="text-xs sm:text-sm font-bold tracking-wider group-hover:text-[#D4AF37] transition-colors">
                    {look.title}
                  </h3>
                  <p className="text-[10px] text-white/80 line-clamp-1">{look.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. "Our Promise" Trust Grid */}
      <section className="py-14 bg-[#FAF8FA] border-y border-[#E8E2E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              Our Promise
            </h2>
            <p className="text-xs text-[#6D6670] leading-relaxed">
              At DIMSGLOW, we believe beauty should be safe, accessible, and empowering. Every product is developed with quality ingredients, strict safety standards, and ethical practices so you can enjoy makeup that looks great and feels confident on your skin.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: ShieldCheck, title: 'Dermatologically Tested', desc: 'Clinically verified safety' },
              { icon: Leaf, title: '100% Vegan', desc: 'No animal ingredients' },
              { icon: Heart, title: 'Cruelty Free', desc: 'PETA Certified' },
              { icon: Award, title: 'Paraben Free', desc: 'Clean beauty formulation' },
              { icon: CheckCircle2, title: 'Safe-Cert Verified', desc: 'Bureau Veritas certified' },
            ].map((promise) => {
              const Icon = promise.icon;
              return (
                <div
                  key={promise.title}
                  className="p-5 rounded-[10px] bg-white border border-[#E8E2E7] text-center space-y-2 shadow-xs"
                >
                  <Icon className="w-8 h-8 mx-auto text-[#B83B63]" />
                  <h4 className="text-xs font-bold text-[#19161A]">{promise.title}</h4>
                  <p className="text-[10px] text-[#6D6670]">{promise.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. "Hear It Directly From Our Customers" Testimonials */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
              Hear It Directly From Our Customers
            </h2>
            <p className="text-xs text-[#6D6670]">Real reviews from verified DIMSGLOW customers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                author: 'Mrugaya Thakur',
                rating: 5,
                review: 'I just tried the trending Skin Tint and I am honestly loving it! The shade match is spot-on and it gives a smooth, radiant glow all day long without any creasing.',
                productName: 'Skin Tint 5 In 1',
                productLink: '/products/skin-tint-5-in-1',
              },
              {
                author: 'Anjali Jaiswal',
                rating: 5,
                review: 'I absolutely love the 24 Hrs Non Transfer Matte Lipstick. It does not smudge even after meals, and it does not dry out my lips at all. Will definitely restock!',
                productName: '24 Hrs Matte Lipstick',
                productLink: '/products/24hrs-non-transfer-matte-lipstick',
              },
              {
                author: 'Roselin Poojary',
                rating: 5,
                review: 'The Strobe Cream gives that coveted Korean glass skin effect! Lightweight, second-skin feel, and blends like butter over my daily moisturizer.',
                productName: 'Glass Skin Strobe Cream',
                productLink: '/products/instant-glass-skin-strobe-cream',
              },
              {
                author: 'Anjana Jaiswar',
                rating: 5,
                review: 'The Super Lock Setting Spray kept my wedding makeup flawless through 12 hours of dancing and heat. 10/10 recommend to every makeup lover.',
                productName: 'Super Lock Setting Spray',
                productLink: '/products/super-lock-makeup-setting-spray',
              },
            ].map((rev) => (
              <div
                key={rev.author}
                className="p-5 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#19161A]">{rev.author}</h4>
                      <span className="text-[10px] text-[#18794E] font-medium">✓ Verified buyer</span>
                    </div>
                    <div className="flex text-[#D4AF37]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#6D6670] leading-relaxed italic">
                    "{rev.review}"
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E2E7] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#19161A]">{rev.productName}</span>
                  <Link href={rev.productLink} className="text-[10px] font-bold text-[#B83B63] hover:underline">
                    View product →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Trust Banner Marquee */}
      <section className="bg-[#141215] text-white py-6 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <p className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
              Better standards, because you deserve the best.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-white/80 font-semibold tracking-wider uppercase">
            <span className="flex items-center gap-1.5">✓ DERMATOLOGICALLY TESTED</span>
            <span className="flex items-center gap-1.5">✓ 100% CLEAN INGREDIENTS</span>
            <span className="flex items-center gap-1.5">✓ PETA CERTIFIED CRUELTY FREE</span>
            <span className="flex items-center gap-1.5">✓ CASH ON DELIVERY AVAILABLE</span>
            <span className="flex items-center gap-1.5">✓ MADE IN INDIA</span>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
