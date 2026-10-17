'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Percent,
  Gift,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart/CartContext';

export function StorefrontHeader() {
  const { user, profile, role } = useAuth();
  const { totalItemCount, setIsCartDrawerOpen, favoritesCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeDepartment, setActiveDepartment] = useState<'essentials' | 'professional' | 'skincare'>('essentials');

  return (
    <>
      {/* 1. Top Announcement Strip */}
      <div className="bg-linear-to-r from-[#FF7E9C] via-[#FF8EA3] to-[#FFA7A6] text-white text-center py-2 px-4 text-xs font-bold tracking-wider flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" /> FREE SHIPPING ON ORDERS ABOVE ₹399
        </span>
        <span className="hidden sm:inline-block opacity-60">•</span>
        <span className="hidden sm:flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" /> EXTRA 5% OFF ON PREPAID ORDERS
        </span>
        <span className="hidden md:inline-block opacity-60">•</span>
        <span className="hidden md:flex items-center gap-1.5 text-black">
          <Gift className="w-3.5 h-3.5" /> FREE GIFT WITH CODE: <span className="bg-black text-white px-2 py-0.5 rounded text-[10px]">GLOW10</span>
        </span>
      </div>

      {/* 2. Top Department Tabs (From Reference Site Screenshots 3, 4, 5) */}
      <div className="bg-[#FAF8FA] border-b border-[#E8E2E7] hidden md:block">
        <div className="max-w-7xl mx-auto flex items-stretch text-xs font-black tracking-widest uppercase">
          <Link
            href="/collections/all"
            onClick={() => setActiveDepartment('essentials')}
            className={`flex-1 py-2.5 px-4 text-center transition-all flex items-center justify-center gap-2 ${
              activeDepartment === 'essentials'
                ? 'bg-black text-white'
                : 'bg-[#19161A] text-white/80 hover:bg-black hover:text-white'
            }`}
          >
            <span>DIMSGLOW MAKE-UP ESSENTIALS</span>
          </Link>
          <Link
            href="/collections/professional"
            onClick={() => setActiveDepartment('professional')}
            className={`flex-1 py-2.5 px-4 text-center transition-all flex items-center justify-center gap-2 ${
              activeDepartment === 'professional'
                ? 'bg-[#E8D5B5] text-[#19161A] ring-1 ring-[#D4AF37]/50'
                : 'bg-[#DEC8A4] text-[#19161A]/90 hover:bg-[#E8D5B5] hover:text-[#19161A]'
            }`}
          >
            <span>PROFESSIONAL STUDIO RANGE</span>
          </Link>
          <Link
            href="/collections/skin-care"
            onClick={() => setActiveDepartment('skincare')}
            className={`flex-1 py-2.5 px-4 text-center transition-all flex items-center justify-center gap-2 ${
              activeDepartment === 'skincare'
                ? 'bg-[#B5D5E8] text-[#19161A] ring-1 ring-blue-300'
                : 'bg-[#A8CADF] text-[#19161A]/90 hover:bg-[#B5D5E8] hover:text-[#19161A]'
            }`}
          >
            <span>ACTIVE SKIN CARE</span>
          </Link>
        </div>
      </div>

      {/* 3. Main Brand Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8E2E7] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Mobile Hamburger & Desktop Left Navigation */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-[#19161A] hover:bg-[#F7F5F7] cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <nav className="hidden lg:flex items-center gap-7 text-[13px] font-bold tracking-wider text-[#19161A]">
                {/* 1. SHOP ALL with MEGA-MENU */}
                <div
                  className="relative"
                  onMouseEnter={() => setActiveDropdown('SHOP ALL')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href="/collections/all"
                    className="flex items-center gap-1.5 py-3 hover:text-[#B83B63] transition-colors"
                  >
                    SHOP ALL
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Link>

                  {/* MEGA MENU: SHOP ALL */}
                  {activeDropdown === 'SHOP ALL' && (
                    <div className="fixed left-0 right-0 top-auto w-full bg-white border-b border-[#E8E2E7] shadow-2xl py-8 z-50 animate-in fade-in duration-150">
                      <div className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-8">
                        {/* Categories Columns */}
                        <div className="col-span-8 grid grid-cols-3 gap-6">
                          <div>
                            <h3 className="text-sm font-bold font-serif-brand text-[#19161A] mb-2 border-b border-[#E8E2E7] pb-1">
                              All Categories
                            </h3>
                            <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider mb-2">
                              Face
                            </h4>
                            <ul className="space-y-1.5 text-xs text-[#6D6670]">
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">Blusher</Link></li>
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">Primer & Prep</Link></li>
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">Highlighter & Strobe</Link></li>
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">Makeup Fixer Mist</Link></li>
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">Compact Face Powder</Link></li>
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">Concealer Serum</Link></li>
                              <li><Link href="/collections/face" className="hover:text-[#B83B63]">5-in-1 Skin Tint Foundation</Link></li>
                              <li className="pt-1">
                                <Link href="/collections/face" className="font-bold text-[#B83B63] hover:underline">
                                  View all Face →
                                </Link>
                              </li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider mb-2 mt-7">
                              Eyes
                            </h4>
                            <ul className="space-y-1.5 text-xs text-[#6D6670]">
                              <li><Link href="/collections/eyes" className="hover:text-[#B83B63]">24HR Smudge-Proof Kajal</Link></li>
                              <li><Link href="/collections/eyes" className="hover:text-[#B83B63]">Waterproof Eyeliner</Link></li>
                              <li><Link href="/collections/eyes" className="hover:text-[#B83B63]">High-Volume Mascara</Link></li>
                              <li><Link href="/collections/eyes" className="hover:text-[#B83B63]">Winged Eyes Palette</Link></li>
                              <li className="pt-1">
                                <Link href="/collections/eyes" className="font-bold text-[#B83B63] hover:underline">
                                  View all Eyes →
                                </Link>
                              </li>
                            </ul>

                            <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider mb-2 mt-4">
                              Nails
                            </h4>
                            <ul className="space-y-1.5 text-xs text-[#6D6670]">
                              <li><Link href="/collections/nails" className="hover:text-[#B83B63]">Toxic-Free Nail Lacquers</Link></li>
                              <li><Link href="/collections/nails" className="hover:text-[#B83B63]">Pastel Matte Polish</Link></li>
                              <li><Link href="/collections/nails" className="hover:text-[#B83B63]">Remover Wipes</Link></li>
                              <li className="pt-1">
                                <Link href="/collections/nails" className="font-bold text-[#B83B63] hover:underline">
                                  View all Nails →
                                </Link>
                              </li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider mb-2 mt-7">
                              Lips
                            </h4>
                            <ul className="space-y-1.5 text-xs text-[#6D6670]">
                              <li><Link href="/collections/lips" className="hover:text-[#B83B63]">24Hrs Non-Transfer Matte</Link></li>
                              <li><Link href="/collections/lips" className="hover:text-[#B83B63]">Peptide Infused Lip Oil</Link></li>
                              <li><Link href="/collections/lips" className="hover:text-[#B83B63]">High-Shine Vinyl Lip Gloss</Link></li>
                              <li className="pt-1">
                                <Link href="/collections/lips" className="font-bold text-[#B83B63] hover:underline">
                                  View all Lips →
                                </Link>
                              </li>
                            </ul>

                            <h4 className="text-xs font-bold text-[#B83B63] uppercase tracking-wider mb-2 mt-4">
                              Skin Care & Fragrance
                            </h4>
                            <ul className="space-y-1.5 text-xs text-[#6D6670]">
                              <li><Link href="/collections/skin-care" className="hover:text-[#B83B63]">Active Niacinamide Serum</Link></li>
                              <li><Link href="/collections/perfumes" className="hover:text-[#B83B63]">18HR Eau De Parfum Luxe</Link></li>
                              <li className="pt-1">
                                <Link href="/collections/skin-care" className="font-bold text-[#B83B63] hover:underline">
                                  View all Skincare →
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Right Side 3 Visual Product Cards (From Screenshot 3) */}
                        <div className="col-span-4 grid grid-cols-3 gap-3">
                          <Link
                            href="/products/skin-tint-5-in-1"
                            className="group/card rounded-lg overflow-hidden border border-[#E8E2E7] bg-[#FAF8FA] p-2 flex flex-col justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="relative aspect-3/4 w-full bg-white rounded overflow-hidden">
                              <Image
                                src="/products/featured-product.jpeg"
                                alt="5-in-1 Skin Tint Foundation"
                                fill
                                className="object-contain p-1 group-hover/card:scale-105 transition-transform"
                              />
                            </div>
                            <div className="pt-2">
                              <h5 className="text-[11px] font-bold text-[#19161A] line-clamp-2 leading-tight">
                                5-in-1 Skin Tint
                              </h5>
                              <p className="text-[10px] text-[#6D6670] mt-0.5">Hydrated Natural Glow</p>
                              <span className="text-[11px] font-bold text-[#B83B63]">₹319.00</span>
                            </div>
                          </Link>

                          <Link
                            href="/collections/eyes"
                            className="group/card rounded-lg overflow-hidden border border-[#E8E2E7] bg-[#FAF8FA] p-2 flex flex-col justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="relative aspect-3/4 w-full bg-white rounded overflow-hidden">
                              <Image
                                src="/categories/eyes.jpg"
                                alt="Winged Eyes Eyeshadow Palette"
                                fill
                                className="object-contain p-1 group-hover/card:scale-105 transition-transform"
                              />
                            </div>
                            <div className="pt-2">
                              <h5 className="text-[11px] font-bold text-[#19161A] line-clamp-2 leading-tight">
                                Winged Eyes Palette
                              </h5>
                              <p className="text-[10px] text-[#6D6670] mt-0.5">Highly Pigmented Matte</p>
                              <span className="text-[11px] font-bold text-[#B83B63]">₹449.00</span>
                            </div>
                          </Link>

                          <Link
                            href="/products/24hrs-non-transfer-matte-lipstick"
                            className="group/card rounded-lg overflow-hidden border border-[#E8E2E7] bg-[#FAF8FA] p-2 flex flex-col justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="relative aspect-3/4 w-full bg-white rounded overflow-hidden">
                              <Image
                                src="/categories/lips.jpg"
                                alt="Super Stay 24HR Matte Lipstick"
                                fill
                                className="object-contain p-1 group-hover/card:scale-105 transition-transform"
                              />
                            </div>
                            <div className="pt-2">
                              <h5 className="text-[11px] font-bold text-[#19161A] line-clamp-2 leading-tight">
                                24HR Matte Lipstick
                              </h5>
                              <p className="text-[10px] text-[#6D6670] mt-0.5">Transfer-Proof Finish</p>
                              <span className="text-[11px] font-bold text-[#B83B63]">₹310.00</span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. COMBOS with MEGA-MENU */}
                <div
                  className="relative"
                  onMouseEnter={() => setActiveDropdown('COMBOS')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href="/collections/combos"
                    className="flex items-center gap-1.5 py-3 hover:text-[#B83B63] transition-colors"
                  >
                    COMBOS
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Link>

                  {/* MEGA MENU: COMBOS */}
                  {activeDropdown === 'COMBOS' && (
                    <div className="fixed left-0 right-0 top-auto w-full bg-white border-b border-[#E8E2E7] shadow-2xl py-8 z-50 animate-in fade-in duration-150">
                      <div className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-8 items-center">
                        <div className="col-span-5 space-y-3">
                          <h3 className="text-sm font-bold font-serif-brand text-[#19161A] border-b border-[#E8E2E7] pb-2">
                            Curated Beauty Bundles
                          </h3>
                          <ul className="space-y-2 text-xs font-semibold text-[#19161A]">
                            <li>
                              <Link href="/collections/combos" className="block hover:text-[#B83B63]">
                                Back To Basics Everyday Glam Kit
                              </Link>
                            </li>
                            <li>
                              <Link href="/collections/combos" className="block hover:text-[#B83B63]">
                                Buy 3 at ₹699 Value Combo
                              </Link>
                            </li>
                            <li>
                              <Link href="/collections/combos" className="block hover:text-[#B83B63]">
                                Glass Skin Radiance Restock Box
                              </Link>
                            </li>
                            <li>
                              <Link href="/collections/combos" className="block font-bold text-[#B83B63] pt-2">
                                View all Combos →
                              </Link>
                            </li>
                          </ul>
                        </div>

                        <div className="col-span-7">
                          <Link
                            href="/collections/combos"
                            className="block relative h-48 w-full rounded-xl overflow-hidden bg-linear-to-r from-[#200B15] to-[#4A0E2A] text-white p-6 shadow-md"
                          >
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#D4AF37] text-black uppercase">
                              SAVE UP TO 35%
                            </span>
                            <h4 className="text-2xl font-bold font-serif-brand mt-2 text-white">
                              BUY ANY 3 AT ₹699
                            </h4>
                            <p className="text-xs text-white/80 max-w-sm mt-1">
                              Customizable beauty kit with lipstick, foundation, and mist.
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37]">
                              SHOP BUNDLES NOW <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. COLLECTIONS with MEGA-MENU (Matching Screenshot 5) */}
                <div
                  className="relative"
                  onMouseEnter={() => setActiveDropdown('COLLECTIONS')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href="/collections"
                    className="flex items-center gap-1.5 py-3 hover:text-[#B83B63] transition-colors"
                  >
                    COLLECTIONS
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Link>

                  {/* MEGA MENU: COLLECTIONS */}
                  {activeDropdown === 'COLLECTIONS' && (
                    <div className="fixed left-0 right-0 top-auto w-full bg-white border-b border-[#E8E2E7] shadow-2xl py-8 z-50 animate-in fade-in duration-150">
                      <div className="max-w-7xl mx-auto px-6 grid grid-cols-12 gap-8 items-center">
                        {/* Left List */}
                        <div className="col-span-4 space-y-2.5 border-r border-[#E8E2E7] pr-6">
                          <h3 className="text-sm font-bold font-serif-brand text-[#19161A] mb-3">
                            Featured Collections
                          </h3>
                          <Link
                            href="/collections/bestsellers"
                            className="block text-xs font-bold text-[#19161A] hover:text-[#B83B63] transition-colors"
                          >
                            ★ Best Seller
                          </Link>
                          <Link
                            href="/collections/all?tag=new"
                            className="block text-xs font-semibold text-[#19161A] hover:text-[#B83B63] transition-colors"
                          >
                            New Launches
                          </Link>
                          <Link
                            href="/collections/combos"
                            className="block text-xs font-semibold text-[#19161A] hover:text-[#B83B63] transition-colors"
                          >
                            Bundles & Gift Boxes
                          </Link>
                          <Link
                            href="/collections"
                            className="block text-xs font-bold text-[#B83B63] pt-2 hover:underline"
                          >
                            View All Collections →
                          </Link>
                        </div>

                        {/* Right Circular Icons using User's exact Images */}
                        <div className="col-span-8 grid grid-cols-6 gap-4 text-center">
                          {[
                            { name: 'Face', href: '/collections/face', img: '/categories/face.jpg' },
                            { name: 'Eyes', href: '/collections/eyes', img: '/categories/eyes.jpg' },
                            { name: 'Lips', href: '/collections/lips', img: '/categories/lips.jpg' },
                            { name: 'Nails', href: '/collections/nails', img: '/categories/nails.jpg' },
                            { name: 'Bundles', href: '/collections/combos', img: '/categories/combos.jpg' },
                            { name: 'Perfumes', href: '/collections/perfumes', img: '/categories/perfumes.jpg' },
                          ].map((cat) => (
                            <Link
                              key={cat.name}
                              href={cat.href}
                              className="group flex flex-col items-center space-y-2 p-1 hover:-translate-y-1 transition-transform"
                            >
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E8E2E7] group-hover:border-[#B83B63] relative bg-[#FAF8FA] shadow-xs">
                                <Image
                                  src={cat.img}
                                  alt={cat.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-xs font-bold text-[#19161A] group-hover:text-[#B83B63] transition-colors">
                                {cat.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Centered Brand Emblem & Wordmark */}
            <div className="flex-1 flex justify-center lg:flex-initial">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-[#D4AF37]/60 shadow-xs group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src="/brand/dimsglow-logo.jpg"
                    alt="DIMSGLOW Logo"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-xl sm:text-2xl font-black font-serif-brand tracking-[0.18em] text-[#19161A] group-hover:text-[#B83B63] transition-colors">
                    DIMSGLOW
                  </span>
                  <span className="text-[8px] tracking-[0.3em] uppercase text-[#AA771C] font-semibold -mt-1 hidden sm:block">
                    Luxury Cosmetics
                  </span>
                </div>
              </Link>
            </div>

            {/* Right Utility Icons (Search, Account, Wishlist, Bag) */}
            <div className="flex items-center gap-3 sm:gap-4">

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#19161A] hover:text-[#B83B63] hover:bg-[#F7F5F7] rounded-full transition-colors cursor-pointer"
                aria-label="Search products"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                href={user ? '/account' : '/sign-in'}
                className="p-2 text-[#19161A] hover:text-[#B83B63] hover:bg-[#F7F5F7] rounded-full transition-colors hidden sm:inline-flex"
                aria-label={user ? 'Customer dashboard' : 'Sign in'}
                title={user ? `Signed in as ${profile?.displayName || 'Customer'}` : 'Sign in'}
              >
                <User className="w-5 h-5" />
              </Link>

              <Link
                href="/account/wishlist"
                className="relative p-2 text-[#19161A] hover:text-[#B83B63] hover:bg-[#F7F5F7] rounded-full transition-colors hidden sm:inline-flex"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#AA771C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2 text-[#19161A] hover:text-[#B83B63] hover:bg-[#F7F5F7] rounded-full transition-colors cursor-pointer"
                aria-label={`Shopping bag with ${totalItemCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#B83B63] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Search DIMSGLOW Beauty"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="search-catalog"
              placeholder="Search foundation, serum, lipstick, perfume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            <Search className="w-5 h-5 absolute left-3 top-3.5 text-[#6D6670]" />
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-[#6D6670] uppercase tracking-wider mb-2">
              Trending Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Skin Tint 5 in 1', 'Matte Lipstick', 'Glass Skin Strobe', 'Super Lock Mist', 'Fragrance'].map(
                (term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchQuery(term)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#FAF8FA] border border-[#E8E2E7] hover:border-[#B83B63] hover:text-[#B83B63] transition-colors"
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2E7]">
                <span className="font-serif-brand font-black text-lg tracking-wider text-[#19161A]">
                  DIMSGLOW MENU
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-[#6D6670] hover:text-[#19161A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Department Selector in Mobile */}
              <div className="grid grid-cols-1 gap-1 text-center font-bold text-xs uppercase">
                <Link
                  href="/collections/all"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 rounded bg-black text-white"
                >
                  MAKE-UP ESSENTIALS
                </Link>
                <Link
                  href="/collections/face?line=professional"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 rounded bg-[#E8D5B5] text-[#19161A]"
                >
                  PROFESSIONAL STUDIO
                </Link>
                <Link
                  href="/collections/skin-care"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 rounded bg-[#B5D5E8] text-[#19161A]"
                >
                  ACTIVE SKIN CARE
                </Link>
              </div>

              <nav className="space-y-2 pt-2">
                <Link
                  href="/collections/all"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold text-[#19161A] hover:text-[#B83B63]"
                >
                  Shop All Products
                </Link>
                <Link
                  href="/collections/bestsellers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold text-[#B83B63]"
                >
                  ★ Best Sellers
                </Link>
                <Link
                  href="/collections/combos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm font-bold text-[#19161A] hover:text-[#B83B63]"
                >
                  Bundles & Combos (Buy 3 at ₹699)
                </Link>
                <Link
                  href="/collections/face"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 pl-3 text-xs text-[#6D6670] hover:text-[#B83B63]"
                >
                  • Face Collection
                </Link>
                <Link
                  href="/collections/eyes"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 pl-3 text-xs text-[#6D6670] hover:text-[#B83B63]"
                >
                  • Eye Makeup
                </Link>
                <Link
                  href="/collections/lips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 pl-3 text-xs text-[#6D6670] hover:text-[#B83B63]"
                >
                  • Lip Luxury
                </Link>
                <Link
                  href="/collections/nails"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 pl-3 text-xs text-[#6D6670] hover:text-[#B83B63]"
                >
                  • Nails
                </Link>
                <Link
                  href="/collections/skin-care"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 pl-3 text-xs text-[#6D6670] hover:text-[#B83B63]"
                >
                  • Skincare
                </Link>
                <Link
                  href="/collections/perfumes"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-1.5 pl-3 text-xs text-[#6D6670] hover:text-[#B83B63]"
                >
                  • Luxury Perfumes
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E8E2E7] space-y-2">
              <Link
                href={user ? '/account' : '/sign-in'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-xs font-bold text-[#19161A] bg-[#FAF8FA] rounded-md"
              >
                {user ? 'My Account' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
