'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';
import {
  getHomepageContent,
  DEFAULT_HOMEPAGE_CONTENT,
} from '@/lib/content/contentService';
import type { HomepageContent, HeroSlide } from '@/lib/schemas/content';
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
  Package,
  Gift,
  HelpCircle,
  Plus,
  Minus,
  Mail,
  SlidersHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadianceComparisonSlider } from '@/components/storefront/RadianceComparisonSlider';

export default function HomePage() {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [bestsellerCategory, setBestsellerCategory] = useState<'all' | 'face' | 'lips' | 'eyes' | 'skin-care'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Campaign Video Player State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };

  // Fetch dynamic content from Firestore
  useEffect(() => {
    async function fetchContent() {
      try {
        const data = await getHomepageContent();
        setContent(data);
      } catch (err) {
        console.warn('Using default content:', err);
      }
    }
    fetchContent();
  }, []);

  const activeSlides = useMemo(() => {
    const list = (content.heroSlides || []).filter((s) => s.active);
    return list.length > 0 ? list : DEFAULT_HOMEPAGE_CONTENT.heroSlides;
  }, [content.heroSlides]);

  // Auto-advance hero carousel timer (every 5 seconds, pauses on hover)
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, activeSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  const curSlideData: HeroSlide = activeSlides[currentSlide] || activeSlides[0];

  // Dynamic Bestsellers Filtering
  const allBestsellers = useMemo(() => {
    return CATALOG_PRODUCTS.filter((p) => p.bestseller === true);
  }, []);

  const displayedBestsellers = useMemo(() => {
    if (bestsellerCategory === 'all') return allBestsellers;
    return allBestsellers.filter((p) => p.categoryIds.includes(bestsellerCategory));
  }, [allBestsellers, bestsellerCategory]);

  const visibility = content.sectionsVisibility || DEFAULT_HOMEPAGE_CONTENT.sectionsVisibility;

  return (
    <StorefrontShell>
      {/* 1. Dynamic Auto-Moving Hero Carousel (Flawless Parity across Mobile, Tablet, and Desktop) */}
      {visibility.heroCarousel && (
        <section
          className="relative w-full overflow-hidden select-none bg-[#14050E]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* 16:9 Aspect Ratio on all devices ensures 100% full banner visibility with zero top, bottom, or side cropping */}
          <Link
            href={curSlideData.ctaLink || '/collections/all'}
            className="relative block w-full aspect-[16/9] cursor-pointer"
          >
            <Image
              src={curSlideData.imageUrl || 'https://res.cloudinary.com/web8vmww/image/upload/v1792429948/dimsglow/hero/hero_lock_the_shine_banner.jpg'}
              alt={curSlideData.title || 'DIMSGLOW Luxury Hero Banner'}
              fill
              className="object-cover object-center transition-transform duration-1000 ease-out"
              priority
              sizes="100vw"
            />
          </Link>

          {/* Carousel Nav Arrows */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-1.5 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer opacity-85 hover:opacity-100 z-20 shadow-lg"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-1.5 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer opacity-85 hover:opacity-100 z-20 shadow-lg"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-1.5 sm:bottom-3 lg:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer shadow-md ${
                  currentSlide === idx ? 'w-5 sm:w-7 lg:w-9 h-1.5 sm:h-2 lg:h-2.5 bg-[#D4AF37]' : 'w-1.5 sm:w-2 lg:w-2.5 h-1.5 sm:h-2 lg:h-2.5 bg-white/50 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Category Quick Browse Circles */}
      {visibility.categoryCircles && (
        <section className="py-12 border-b border-[#E8E2E7] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6 text-center">
              {[
                { name: 'Face', href: '/collections/face', tag: 'Base & Primers', image: '/categories/face.jpg' },
                { name: 'Eyes', href: '/collections/eyes', tag: 'Kajal & Mascara', image: '/categories/eyes.jpg' },
                { name: 'Lips', href: '/collections/lips', tag: 'Matte & Gloss', image: '/categories/lips.jpg' },
                { name: 'Nails', href: '/collections/nails', tag: 'Toxic-Free Color', image: '/categories/nails.jpg' },
                { name: 'Skin Care', href: '/collections/skin-care', tag: 'Active Serums', image: '/categories/skin-care.jpg' },
                { name: 'Perfumes', href: '/collections/perfumes', tag: 'Eau De Parfum', image: '/categories/perfumes.jpg' },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="group flex flex-col items-center space-y-2.5 p-2 transition-transform hover:-translate-y-1.5"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#E8E2E7] group-hover:border-[#B83B63] overflow-hidden transition-all shadow-sm group-hover:shadow-md bg-[#FAF8FA]">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#19161A] group-hover:text-[#B83B63] transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-[10px] text-[#6D6670] hidden sm:block font-medium">{cat.tag}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Bestsellers Showcase with Interactive Category Switcher */}
      {visibility.bestsellers && (
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

              {/* Category Filter Pills on Homepage */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Bestsellers' },
                  { id: 'face', label: 'Face' },
                  { id: 'lips', label: 'Lips' },
                  { id: 'eyes', label: 'Eyes' },
                  { id: 'skin-care', label: 'Skincare' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBestsellerCategory(tab.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      bestsellerCategory === tab.id
                        ? 'bg-[#5B132B] text-white shadow-xs'
                        : 'bg-[#FAF8FA] text-[#6D6670] hover:text-[#19161A] border border-[#E8E2E7]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Link
                href="/collections/bestsellers"
                className="text-xs font-bold text-[#B83B63] hover:text-[#982D50] flex items-center gap-1 group whitespace-nowrap"
              >
                VIEW ALL BESTSELLERS{' '}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {displayedBestsellers.length === 0 ? (
              <div className="text-center py-12 bg-[#FAF8FA] rounded-[10px] border border-[#E8E2E7]">
                <p className="text-sm font-semibold text-[#19161A]">No bestsellers in this category yet</p>
                <button
                  type="button"
                  onClick={() => setBestsellerCategory('all')}
                  className="mt-2 text-xs text-[#B83B63] underline font-bold cursor-pointer"
                >
                  View all bestsellers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {displayedBestsellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* NEW ARRIVALS Section */}
      {visibility.newArrivals !== false && (
        <section className="py-14 bg-[#FAF8FA] border-b border-[#E8E2E7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2E7] pb-4">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#B83B63] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> JUST DROPPED
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
                  NEW ARRIVALS
                </h2>
                <p className="text-xs text-[#6D6670] mt-0.5">
                  The latest trending additions to your makeup & skincare vanity
                </p>
              </div>

              <Link
                href="/collections/new-arrivals"
                className="text-xs font-bold text-[#B83B63] hover:text-[#982D50] flex items-center gap-1 group whitespace-nowrap"
              >
                VIEW ALL NEW ARRIVALS{' '}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {CATALOG_PRODUCTS.slice(0, 4).map((product) => (
                <ProductCard key={`new_${product.id}`} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Routine Combos & "Buy 3 for ₹699" Value Spotlight (From Reference PDF) */}
      {visibility.combosBox && (
        <section className="py-14 bg-linear-to-r from-[#200B15] via-[#4A0E2A] to-[#14060E] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
              <div className="space-y-4">
                <span className="text-xs font-bold tracking-[0.25em] text-[#D4AF37] uppercase flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-[#D4AF37]" /> SPECIAL VALUE BUNDLES
                </span>
                <h2 className="text-3xl sm:text-5xl font-black font-serif-brand leading-tight">
                  BUY ANY 3 PRODUCTS AT <span className="text-[#D4AF37]">₹699</span>
                </h2>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                  Mix and match your choice of 24HR Matte Lipstick, Smudge-Proof Eye Kajal, and Hydrating Strobe Cream. Handcrafted luxury routine kits at unbeatable direct-to-consumer savings.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link href="/collections/combos">
                    <Button variant="primary" size="lg" className="bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-bold">
                      BUILD YOUR 3-PIECE SET <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link href="/collections/all?tag=gift">
                    <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                      EXPLORE GIFT COMBOS
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Value Cards Showcase */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Everyday Glow Trio', price: '₹699', was: '₹958', save: 'Save 27%' },
                  { title: 'Glam Restock Kit', price: '₹799', was: '₹1,099', save: 'Save 30%' },
                  { title: 'Transfer-Proof Set', price: '₹699', was: '₹920', save: 'Save 24%' },
                  { title: 'Glass Skin Routine', price: '₹899', was: '₹1,218', save: 'Save 35%' },
                ].map((set) => (
                  <div
                    key={set.title}
                    className="p-5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xs space-y-2 hover:bg-white/15 transition-all"
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-black uppercase">
                      {set.save}
                    </span>
                    <h4 className="text-sm font-bold text-white pt-1">{set.title}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-white">{set.price}</span>
                      <span className="text-xs text-white/50 line-through">{set.was}</span>
                    </div>
                    <Link
                      href="/collections/combos"
                      className="block text-[11px] font-bold text-[#D4AF37] hover:underline pt-1"
                    >
                      Shop bundle →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Campaign Video Player Section (Screenshot 2: "WE'VE GOT EVERYTHING COVERED") */}
      {visibility.campaignVideo !== false && (
        <section className="relative overflow-hidden bg-linear-to-r from-[#200B15] via-[#4A0E2A] to-[#14060E] text-white py-14 lg:py-20 border-b border-[#3B2C3A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
                <span className="inline-block text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
                  {content.campaignVideo?.tagline || 'THE GO-TO GLAM ROUTINE'}
                </span>
                <h2 className="text-3xl sm:text-5xl font-black font-serif-brand leading-tight">
                  {content.campaignVideo?.title || "WE'VE GOT EVERYTHING COVERED"}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                  {content.campaignVideo?.subtitle ||
                    'High-performing, weightless luxury formulations designed to move with you all day long.'}
                </p>
                <div className="pt-2 flex flex-wrap gap-3 justify-center lg:justify-start">
                  <Link href={content.campaignVideo?.ctaLink || '/collections/all'}>
                    <Button variant="primary" size="lg" className="bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-bold">
                      {content.campaignVideo?.ctaText || 'EXPLORE FULL CAMPAIGN'} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link href="/collections/bestsellers">
                    <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                      BEST SELLERS
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Video Player Box with Controls */}
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/30 aspect-video bg-black/60 group/video">
                  <video
                    src={content.campaignVideo?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-makeup-with-a-brush-41484-large.mp4'}
                    poster={content.campaignVideo?.posterUrl || '/categories/face.jpg'}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    className="w-full h-full object-cover"
                    ref={videoRef}
                  />

                  {/* Gradient Overlay for Cinematic Effect */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Video Controls */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 z-20">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-1 text-white/90 hover:text-white transition-colors cursor-pointer"
                      title={isVideoPlaying ? 'Pause' : 'Play'}
                      aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <span className="w-px h-3 bg-white/20" />
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1 text-white/90 hover:text-white transition-colors cursor-pointer"
                      title={isVideoMuted ? 'Unmute' : 'Mute'}
                      aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Editorial Highlight Banner: 95% Reduction in Dark Spots (Firestore & Cloudinary Managed) */}
      {visibility.promoClinical && (
        <section className="py-10 sm:py-14 bg-[#FBEAF0] border-y border-[#F5D8E4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Same Row on Mobile and Desktop: grid-cols-2 */}
            <div className="grid grid-cols-2 items-center gap-3 sm:gap-8 lg:gap-10">
              <div className="space-y-2 sm:space-y-4">
                <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#B83B63] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37]" />
                  {content.promoClinical.headline || 'CLINICALLY PROVEN • SPF 50+'}
                </span>
                <h2 className="text-lg sm:text-3xl lg:text-4xl font-black font-serif-brand text-[#19161A] leading-tight">
                  <span className="text-[#B83B63] text-xl sm:text-4xl lg:text-5xl">{content.promoClinical.statNumber}</span>{' '}
                  {content.promoClinical.statLabel}
                </h2>
                <p className="text-[10px] sm:text-xs lg:text-sm text-[#6D6670] leading-snug line-clamp-3 sm:line-clamp-none">
                  {content.promoClinical.description}
                </p>
                <div className="flex flex-wrap gap-1 sm:gap-2 pt-1">
                  {(content.promoClinical.activeIngredients || []).slice(0, 3).map((ing) => (
                    <span
                      key={ing}
                      className="text-[9px] sm:text-xs bg-white text-[#B83B63] border border-[#B83B63]/25 font-bold px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap"
                    >
                      ✓ {ing}
                    </span>
                  ))}
                </div>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Link href={content.promoClinical.ctaLink || '/collections/skin-care'}>
                    <Button variant="primary" size="sm" className="shadow-md bg-[#5B132B] hover:bg-[#781838] text-[10px] sm:text-xs px-3 py-1.5 h-auto">
                      {content.promoClinical.ctaText || 'BUY NOW'}
                    </Button>
                  </Link>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-base font-black text-[#5B132B]">
                      {content.promoClinical.featuredProductPrice || '₹999'}
                    </span>
                    <span className="text-[10px] sm:text-xs line-through text-[#6D6670]">₹1,299</span>
                    <span className="text-[8px] sm:text-[10px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                      23% OFF
                    </span>
                  </div>
                </div>
              </div>

              {/* Exact User Provided Clinical Sunscreen Poster (Cloudinary Loaded - Height Reduced by 25%) */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-[210px] sm:max-w-xs md:max-w-sm aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-xl bg-[#FAF8FA] group p-1.5 sm:p-2">
                  <Image
                    src={content.promoClinical.imageUrl || 'https://res.cloudinary.com/web8vmww/image/upload/v1792340975/dimsglow/editorial/dimsglow_sunscreen_poster.jpg'}
                    alt="DIMSGLOW Tinted Sunscreen SPF 50+ Clinical Dark Spot Fading Proof"
                    fill
                    className="object-contain"
                    priority
                  />
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#5B132B]/90 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#D4AF37]/40 text-white text-[8px] sm:text-xs font-bold shadow-md">
                    ★ CLINICAL TRIAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Interactive Before & After Formulation Radiance Slider (Positioned in Same Row with Text for Each Device) */}
      {visibility.beforeAfter && (
        <section className="py-10 sm:py-14 bg-white border-b border-[#E8E2E7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 items-center gap-3 sm:gap-8 lg:gap-12">
              {/* Left Column: Text, Information & Metrics */}
              <div className="space-y-2 sm:space-y-4">
                <span className="text-[9px] sm:text-xs font-bold tracking-widest uppercase text-[#B83B63] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37]" /> Visible Clinical Results
                </span>
                <h2 className="text-lg sm:text-3xl lg:text-4xl font-bold font-serif-brand text-[#19161A] leading-tight">
                  Day 1 vs Day 14 Radiance Transformation
                </h2>
                <p className="text-[10px] sm:text-xs lg:text-sm text-[#6D6670] leading-snug line-clamp-3 sm:line-clamp-none">
                  Drag the interactive slider to inspect visible clinical reduction in dark spots, sun tan, and skin texture restoration in 14 days.
                </p>

                {/* Clinical Verification Metrics */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-1 text-center">
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#FAF8FA] border border-[#E8E2E7]">
                    <p className="text-sm sm:text-xl font-black text-[#B83B63]">95%</p>
                    <p className="text-[8px] sm:text-[11px] text-[#6D6670] font-semibold">Dark Spots</p>
                  </div>
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#FAF8FA] border border-[#E8E2E7]">
                    <p className="text-sm sm:text-xl font-black text-[#B83B63]">98%</p>
                    <p className="text-[8px] sm:text-[11px] text-[#6D6670] font-semibold">Radiance</p>
                  </div>
                  <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#FAF8FA] border border-[#E8E2E7]">
                    <p className="text-sm sm:text-xl font-black text-[#B83B63]">24H</p>
                    <p className="text-[8px] sm:text-[11px] text-[#6D6670] font-semibold">SPF 50+</p>
                  </div>
                </div>

                <div className="pt-1 hidden sm:block">
                  <Link href="/collections/skin-care">
                    <Button variant="primary" size="sm" className="shadow-md bg-[#5B132B] hover:bg-[#781838] text-xs px-4 py-2">
                      EXPLORE SKINCARE
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Interactive Face Comparison Slider (Clean Images With Draggable Arrow Handle) */}
              <RadianceComparisonSlider
                beforeImage="https://res.cloudinary.com/web8vmww/image/upload/v1792431841/dimsglow/editorial/day1_before_clean_radiance.jpg"
                afterImage="https://res.cloudinary.com/web8vmww/image/upload/v1792431843/dimsglow/editorial/day14_after_clean_radiance.jpg"
                beforeAlt="Day 1 Clinical Face Before Radiance Treatment"
                afterAlt="Day 14 Radiant Glass Skin Clinical Transformation"
              />
            </div>
          </div>
        </section>
      )}

      {/* 7. "Get The Look!" Editorial Grid */}
      {visibility.routineLooks && (
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
              {(content.routineLooks || []).map((look) => (
                <Link
                  key={look.id || look.title}
                  href={look.href}
                  className="group relative rounded-[12px] overflow-hidden aspect-3/4 bg-[#14050E] border border-[#E8E2E7] flex flex-col justify-end p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {look.imageUrl && (
                    <Image
                      src={look.imageUrl}
                      alt={look.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-108"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  )}
                  {/* Subtle luxury gradient for readable text */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-transparent z-10 transition-opacity group-hover:opacity-95" />
                  <div className="relative z-20 space-y-1.5 text-white">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-black uppercase tracking-wider inline-block shadow-xs">
                      {look.badge || 'ROUTINE'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold tracking-wider group-hover:text-[#D4AF37] transition-colors drop-shadow-xs">
                      {look.title}
                    </h3>
                    <p className="text-[10px] text-white/80 line-clamp-1">{look.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. "Our Promise" Trust Grid */}
      {visibility.ourPromise && (
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
      )}

      {/* 9. Verified Customer Testimonials */}
      {visibility.testimonials && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
                Hear It Directly From Our Customers
              </h2>
              <p className="text-xs text-[#6D6670]">Real reviews from verified DIMSGLOW customers</p>
            </div>

            {/* Desktop / Tablet Grid View */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(content.testimonials || []).map((rev) => (
                <div
                  key={rev.id || rev.author}
                  className="p-5 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#19161A]">{rev.author}</h4>
                        <span className="text-[10px] text-[#18794E] font-medium">✓ Verified buyer</span>
                      </div>
                      <div className="flex text-[#D4AF37]">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#6D6670] leading-relaxed italic">&ldquo;{rev.review}&rdquo;</p>
                  </div>

                  <div className="pt-2 border-t border-[#E8E2E7] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#19161A] truncate max-w-37.5">
                      {rev.productName}
                    </span>
                    <Link href={rev.productLink} className="text-[10px] font-bold text-[#B83B63] hover:underline">
                      View product →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View: Single Row Continuous Loop (Moving Left to Right) */}
            <div className="block md:hidden relative w-full overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-white to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-white to-transparent z-10" />

              <div className="animate-marquee-ltr flex items-stretch gap-4 py-1">
                {[...(content.testimonials || []), ...(content.testimonials || [])].map((rev, idx) => (
                  <div
                    key={`${rev.id || rev.author}-${idx}`}
                    className="w-[280px] shrink-0 whitespace-normal p-5 rounded-[10px] bg-[#FAF8FA] border border-[#E8E2E7] flex flex-col justify-between space-y-3 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#19161A]">{rev.author}</h4>
                          <span className="text-[10px] text-[#18794E] font-medium">✓ Verified buyer</span>
                        </div>
                        <div className="flex text-[#D4AF37]">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#6D6670] leading-relaxed italic">&ldquo;{rev.review}&rdquo;</p>
                    </div>

                    <div className="pt-2 border-t border-[#E8E2E7] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#19161A] truncate max-w-36">
                        {rev.productName}
                      </span>
                      <Link href={rev.productLink} className="text-[10px] font-bold text-[#B83B63] hover:underline">
                        View product →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Infinite Moving Trust Marquee Ticker: 'Better standards, because you deserve the best.' */}
      {visibility.trustMarquee && (
        <section className="bg-[#141215] text-white py-5 overflow-hidden border-y border-[#3B2C3A]">
          <div className="text-center mb-2.5">
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
              Better standards, because you deserve the best.
            </p>
          </div>
          <div className="relative w-full overflow-hidden whitespace-nowrap">
            <div className="animate-marquee flex items-center gap-10 text-xs text-white/80 font-bold tracking-wider uppercase">
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> DERMATOLOGICALLY TESTED</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> 100% VEGAN & CLEAN</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PETA CERTIFIED CRUELTY FREE</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PARABEN & TOXIC FREE</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> SAFE-CERT VERIFIED</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> CASH ON DELIVERY AVAILABLE</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> 7-DAY HASSLE-FREE RETURNS</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PROUDLY MADE IN INDIA</span>
              {/* Seamless repeating loop elements */}
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> DERMATOLOGICALLY TESTED</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> 100% VEGAN & CLEAN</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PETA CERTIFIED CRUELTY FREE</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PARABEN & TOXIC FREE</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> SAFE-CERT VERIFIED</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> CASH ON DELIVERY AVAILABLE</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> 7-DAY HASSLE-FREE RETURNS</span>
              <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PROUDLY MADE IN INDIA</span>
            </div>
          </div>
        </section>
      )}

      {/* 10. Storefront FAQ Section */}
      {visibility.faqs && (content.faqs || []).length > 0 && (
        <section className="py-14 bg-[#FAF8FA] border-t border-[#E8E2E7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B83B63]">
                Got Questions?
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-brand text-[#19161A]">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-[#6D6670]">
                Everything you need to know about our formulations, orders, and free gifts
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {content.faqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-[#E8E2E7] rounded-[10px] bg-white overflow-hidden shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FDFBF7] transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-bold text-[#19161A]">
                        {faq.question}
                      </span>
                      <span className="text-[#B83B63] shrink-0">
                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-[#6D6670] leading-relaxed border-t border-[#F5F2F5] animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 11. VIP Newsletter & Discount Code Club */}
      <section className="py-12 bg-[#5B132B] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
            JOIN THE DIMSGLOW CLUB
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-serif-brand">
            Unlock 10% Off Your First Order
          </h2>
          <p className="text-xs text-white/80 max-w-xl mx-auto leading-relaxed">
            Subscribe for exclusive launch access, secret flash deals, and beauty masterclasses.
          </p>

          {newsletterSubscribed ? (
            <div className="p-4 rounded-xl bg-white/10 border border-[#D4AF37]/50 max-w-md mx-auto text-center space-y-1">
              <p className="text-xs font-bold text-[#D4AF37]">🎉 Welcome to the Club!</p>
              <p className="text-xs text-white">Use code <strong className="font-mono text-[#D4AF37]">GLOW10</strong> at checkout for 10% off!</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail) setNewsletterSubscribed(true);
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-2"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-xs bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-bold whitespace-nowrap"
              >
                Claim 10% Off
              </Button>
            </form>
          )}
        </div>
      </section>
    </StorefrontShell>
  );
}
