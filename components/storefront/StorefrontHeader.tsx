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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart/CartContext';
import { useStoreSettings } from '@/lib/settings/settingsService';

export function StorefrontHeader() {
  const { user, profile } = useAuth();
  const { totalItemCount, setIsCartDrawerOpen, favoritesCount } = useCart();
  const { settings } = useStoreSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* 1. Main Clean Luxury Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E2E7] shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Mobile Hamburger & Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-[#19161A] hover:bg-[#F7F5F7] cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
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
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-black font-serif-brand tracking-[0.16em] text-[#19161A] group-hover:text-[#B83B63] transition-colors leading-none">
                    DIMSGLOW
                  </span>
                  <span className="text-[9px] tracking-[0.28em] uppercase text-[#AA771C] font-bold mt-0.5">
                    Skincare Redefined
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Clean, Focused Navigation for Hero Product */}
            <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-wider text-[#19161A]">
              <Link
                href="/products/tinted-sunscreen-spf50"
                className="hover:text-[#B83B63] transition-colors flex items-center gap-1.5"
              >
                <span>THE SUNSCREEN</span>
                <span className="bg-[#B83B63]/10 text-[#B83B63] text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
                  SPF 50+
                </span>
              </Link>
              <Link
                href="/#results"
                className="hover:text-[#B83B63] transition-colors"
              >
                BEFORE & AFTER
              </Link>
            </nav>

            {/* Right: Actions (Search, Account, Bag & Quick Buy CTA) */}
            <div className="flex items-center gap-2 sm:gap-3.5">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-[#19161A] hover:text-[#B83B63] hover:bg-[#F7F5F7] rounded-full transition-colors cursor-pointer"
                aria-label="Search"
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
                  <span className="absolute top-1 right-1 bg-[#B83B63] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {totalItemCount}
                  </span>
                )}
              </button>

              {/* Direct Quick Purchase CTA */}
              <Link
                href="/products/tinted-sunscreen-spf50"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-linear-to-r from-[#B83B63] to-[#881337] text-white text-xs font-bold tracking-wider hover:brightness-110 shadow-sm transition-all"
              >
                <span>ORDER NOW</span>
                <span className="text-[11px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded">
                  ₹999
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Search DIMSGLOW"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="search-catalog"
              placeholder="Search sunscreen, dark spots, SPF 50..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            <Search className="w-5 h-5 absolute left-3 top-3.5 text-[#6D6670]" />
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-[#6D6670] uppercase tracking-wider mb-2">
              Popular Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Tinted Sunscreen SPF 50+',
                'Fade Dark Spots',
                'Anti-Ageing Care',
                'Hydrating Finish',
                'Twin Pack Offer',
              ].map((term) => (
                <Link
                  key={term}
                  href="/products/tinted-sunscreen-spf50"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#FAF8FA] border border-[#E8E2E7] hover:border-[#B83B63] hover:text-[#B83B63] transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Product Result Card */}
          <div className="border-t border-[#E8E2E7] pt-4">
            <h4 className="text-xs font-bold text-[#19161A] uppercase tracking-wider mb-2">
              Featured Flagship Product
            </h4>
            <Link
              href="/products/tinted-sunscreen-spf50"
              onClick={() => setIsSearchOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E2E7] bg-[#FAF8FA] hover:border-[#B83B63] transition-colors"
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-[#E8E2E7]">
                <Image
                  src="/product/sunscreen-bottle-offer.jpg"
                  alt="DIMSGLOW Tinted Sunscreen SPF 50+"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-bold text-[#19161A] truncate">
                  DIMSGLOW Tinted Sunscreen SPF 50+ PA++++
                </h5>
                <p className="text-xs text-[#6D6670] truncate">
                  Fade Dark Spots. Reveal Your Glow. Broad Spectrum UVA/UVB
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-[#B83B63]">₹999</span>
                  <span className="text-xs line-through text-[#9A939E]">₹1,299</span>
                  <span className="text-[10px] font-bold bg-[#B83B63]/10 text-[#B83B63] px-1.5 py-0.5 rounded">
                    23% OFF
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#B83B63] shrink-0" />
            </Link>
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]">
                    <Image
                      src="/brand/dimsglow-logo.jpg"
                      alt="DIMSGLOW"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-serif-brand font-black text-lg tracking-wider text-[#19161A]">
                    DIMSGLOW
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-[#6D6670] hover:text-[#19161A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Featured Product Mobile Spotlight */}
              <Link
                href="/products/tinted-sunscreen-spf50"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-xl bg-linear-to-r from-[#FFF5F8] to-[#FFF0F4] border border-[#F5D8E4]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0">
                    <Image
                      src="/product/sunscreen-bottle-offer.jpg"
                      alt="Sunscreen"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#B83B63] uppercase tracking-wider">
                      Flagship Product
                    </span>
                    <h4 className="text-xs font-bold text-[#19161A] line-clamp-1">
                      Tinted Sunscreen SPF 50+
                    </h4>
                    <span className="text-xs font-extrabold text-[#B83B63]">
                      ₹999 <span className="line-through text-[10px] text-[#9A939E]">₹1,299</span>
                    </span>
                  </div>
                </div>
              </Link>

              <nav className="space-y-3 pt-2">
                <Link
                  href="/products/tinted-sunscreen-spf50"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm font-bold text-[#19161A] hover:text-[#B83B63] border-b border-[#F0EBF0]"
                >
                  <span>The Sunscreen SPF 50+</span>
                  <span className="text-[10px] bg-[#B83B63] text-white px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                </Link>
                <Link
                  href="/#results"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-[#19161A] hover:text-[#B83B63] border-b border-[#F0EBF0]"
                >
                  Before & After Results
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-[#6D6670] hover:text-[#19161A]"
                >
                  Customer Support
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E8E2E7] space-y-3">
              <Link
                href="/products/tinted-sunscreen-spf50"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-3 text-center text-xs font-bold text-white bg-linear-to-r from-[#B83B63] to-[#881337] rounded-xl shadow-sm"
              >
                ORDER NOW • ₹999
              </Link>
              <Link
                href={user ? '/account' : '/sign-in'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-xs font-bold text-[#19161A] bg-[#FAF8FA] rounded-xl border border-[#E8E2E7]"
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
