'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { CustomerRouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCart } from '@/lib/cart/CartContext';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Star,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/account', icon: User },
  { label: 'My Orders', href: '/account/orders', icon: ShoppingBag },
  { label: 'Saved Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'My Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'My Reviews', href: '/account/reviews', icon: Star },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { favoritesCount } = useCart();

  const displayName = profile?.displayName || user?.displayName || 'Valued Customer';
  const email = profile?.email || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <CustomerRouteGuard>
      <StorefrontShell>
        {/* Breadcrumb */}
        <div className="bg-[#FAF8FA] border-b border-[#E8E2E7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#6D6670] flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#B83B63] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/account" className="hover:text-[#B83B63] transition-colors">My Account</Link>
            {pathname !== '/account' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[#19161A] font-semibold capitalize">
                  {pathname.split('/').pop()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar (4 cols) */}
            <aside className="lg:col-span-4 bg-white rounded-xl border border-[#E8E2E7] overflow-hidden shadow-xs static lg:sticky lg:top-24 z-10">
              {/* User Header Profile */}
              <div className="p-6 bg-linear-to-br from-[#FAF4F7] to-[#FAF8FA] border-b border-[#E8E2E7] flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#B83B63] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-serif font-bold text-[#19161A] truncate">
                    {displayName}
                  </h2>
                  <p className="text-xs text-[#6D6670] truncate">{email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-[#18794E] bg-[#E6F4EA] px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Verified Member
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#B83B63] text-white shadow-xs'
                          : 'text-[#19161A] hover:bg-[#FAF8FA] hover:text-[#B83B63]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8C8490]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.label === 'My Wishlist' && favoritesCount > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white text-[#B83B63]' : 'bg-[#FAF4F7] text-[#B83B63]'
                          }`}
                        >
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Sign Out Action */}
                <div className="pt-2 border-t border-[#E8E2E7] mt-2">
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#EF4444]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Main Content Area (8 cols) */}
            <main className="lg:col-span-8 min-h-125">
              {children}
            </main>
          </div>
        </div>
      </StorefrontShell>
    </CustomerRouteGuard>
  );
}
