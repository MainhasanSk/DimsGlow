'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AdminRouteGuard } from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  FileText,
  Users,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  CreditCard,
  Building,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Catalog', href: '/admin/catalog', icon: Package },
  { label: 'Inventory', href: '/admin/inventory', icon: Layers },
  { label: 'Invoices & Tax', href: '/admin/invoices', icon: FileText },
  { label: 'Purchases & Vendors', href: '/admin/purchases', icon: Building },
  { label: 'Expenses', href: '/admin/expenses', icon: Receipt },
  { label: 'Analytics & Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Staff & Roles', href: '/admin/staff', icon: Users },
  { label: 'Audit Security', href: '/admin/audit', icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Admin Staff';
  const roleLabel = role?.replace('_', ' ').toUpperCase() || 'STAFF';

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-[#F4F1F4] flex flex-col">
        {/* Top Operational Bar */}
        <header className="bg-[#1F161E] text-white border-b border-[#3B2C3A] sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-[6px] hover:bg-white/10 lg:hidden text-white/80"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]/80 bg-white">
                <Image
                  src="/brand/dimsglow-logo.jpg"
                  alt="DIMSGLOW Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black font-serif-brand tracking-[0.18em] text-white">
                  DIMSGLOW
                </span>
                <span className="text-[8px] font-bold tracking-[0.25em] uppercase text-[#D4AF37] -mt-1">
                  OPERATIONS CONSOLE
                </span>
              </div>
            </Link>
          </div>

          {/* Right Staff Info & Storefront Link */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors hidden sm:inline-flex"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="h-5 w-px bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-semibold text-white block">{displayName}</span>
                <span className="text-[10px] font-extrabold text-[#D4AF37] tracking-wider block">
                  {roleLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="p-2 text-white/70 hover:text-[#EF4444] hover:bg-white/10 rounded-[6px] transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 flex">
          {/* Desktop Sidebar Navigation */}
          <aside className="w-64 bg-[#281D27] text-white/80 border-r border-[#3B2C3A] hidden lg:flex flex-col justify-between p-4 shrink-0">
            <nav className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#B83B63] text-white shadow-xs font-bold'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10 text-[10px] text-white/40 space-y-1">
              <p>DIMSGLOW Enterprise v1.0.0</p>
              <p className="text-[#D4AF37]/80">Logged as {roleLabel}</p>
            </div>
          </aside>

          {/* Mobile Drawer Navigation */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-64 bg-[#281D27] text-white p-4 flex flex-col justify-between z-10">
                <nav className="space-y-1 mt-12">
                  {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-xs font-semibold ${
                          isActive
                            ? 'bg-[#B83B63] text-white font-bold'
                            : 'text-white/75 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Main Dashboard Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
