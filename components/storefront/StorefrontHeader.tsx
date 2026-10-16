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
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart/CartContext';

export function StorefrontHeader() {
  const { user, profile } = useAuth();
  const { totalItemCount, setIsCartDrawerOpen, favoritesCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navLinks = [
    {
      title: 'SHOP ALL',
      href: '/collections/all',
      dropdownItems: [
        { label: 'Face Essentials', href: '/collections/face' },
        { label: 'Eye Makeup', href: '/collections/eyes' },
        { label: 'Lip Luxury', href: '/collections/lips' },
        { label: 'Nail Lacquers', href: '/collections/nails' },
        { label: 'Skin Radiance', href: '/collections/skin-care' },
        { label: 'Luxury Fragrance', href: '/collections/perfumes' },
      ],
    },
    {
      title: 'COMBOS',
      href: '/collections/combos',
      dropdownItems: [
        { label: 'Everyday Essentials Bundle', href: '/collections/combos' },
        { label: 'Glam Restock Kit', href: '/collections/combos' },
        { label: 'Buy 3 at ₹699 Set', href: '/collections/combos' },
      ],
    },
    {
      title: 'COLLECTIONS',
      href: '/collections',
      dropdownItems: [
        { label: 'Bestsellers', href: '/collections/all?tag=bestseller' },
        { label: 'New Launches', href: '/collections/all?tag=new' },
        { label: 'Toxic-Free Clean Series', href: '/collections/all?tag=clean' },
      ],
    },
  ];

  return (
    <>
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
                {navLinks.map((item) => (
                  <div
                    key={item.title}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(item.title)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-1.5 py-2 hover:text-[#B83B63] transition-colors"
                    >
                      {item.title}
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </Link>

                    {/* Dropdown Menu */}
                    {activeDropdown === item.title && (
                      <div className="absolute left-0 top-full w-56 bg-white border border-[#E8E2E7] rounded-[8px] shadow-lg py-2 z-50 animate-in fade-in duration-150">
                        {item.dropdownItems.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="block px-4 py-2 text-xs text-[#19161A] hover:bg-[#FBEAF0] hover:text-[#B83B63] font-medium transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-wider uppercase text-[#6D6670]">
              Trending Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Skin Tint 5 In 1',
                'Matte Lipstick',
                'Crème Highlighter',
                'Rice Water Mask',
                'Eau De Parfum',
                'Make Up Fixer Spray',
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchQuery(term)}
                  className="text-xs bg-[#F7F5F7] hover:bg-[#FBEAF0] hover:text-[#B83B63] text-[#19161A] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8E2E7] flex justify-end">
            <Link
              href={`/collections/all?q=${encodeURIComponent(searchQuery)}`}
              onClick={() => setIsSearchOpen(false)}
            >
              <Button variant="primary" size="md">
                Search Catalog <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex lg:hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2E7]">
                <div className="flex items-center gap-2">
                  <Image
                    src="/brand/dimsglow-logo.jpg"
                    alt="DIMSGLOW Logo"
                    width={32}
                    height={32}
                    className="rounded-full border border-[#D4AF37]/50"
                  />
                  <span className="font-serif-brand font-bold text-lg tracking-wider text-[#19161A]">
                    DIMSGLOW
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full text-[#6D6670] hover:text-[#19161A] hover:bg-[#F7F5F7]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-4">
                <Link
                  href="/collections/all"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm font-bold text-[#19161A] hover:text-[#B83B63]"
                >
                  SHOP ALL PRODUCTS
                </Link>
                <div className="pl-3 space-y-2 border-l-2 border-[#E8E2E7]">
                  <Link
                    href="/collections/face"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-[#6D6670] hover:text-[#B83B63]"
                  >
                    Face Essentials
                  </Link>
                  <Link
                    href="/collections/eyes"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-[#6D6670] hover:text-[#B83B63]"
                  >
                    Eye Makeup
                  </Link>
                  <Link
                    href="/collections/lips"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-[#6D6670] hover:text-[#B83B63]"
                  >
                    Lip Color & Balms
                  </Link>
                  <Link
                    href="/collections/skin-care"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-[#6D6670] hover:text-[#B83B63]"
                  >
                    Skincare Essentials
                  </Link>
                  <Link
                    href="/collections/perfumes"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-[#6D6670] hover:text-[#B83B63]"
                  >
                    Everyday Perfumes
                  </Link>
                </div>

                <Link
                  href="/collections/combos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm font-bold text-[#19161A] hover:text-[#B83B63]"
                >
                  CURATED COMBOS
                </Link>
                <Link
                  href="/collections/all?tag=bestseller"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm font-bold text-[#19161A] hover:text-[#B83B63]"
                >
                  BESTSELLERS
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E8E2E7] space-y-3">
              {user ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#19161A] truncate">
                    Hi, {profile?.displayName || user.email}
                  </p>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-xs text-[#B83B63] font-semibold hover:underline"
                  >
                    Open Dashboard →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
