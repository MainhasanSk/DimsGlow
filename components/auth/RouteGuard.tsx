'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Permission } from '@/lib/auth/roles';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AdminLoginPage } from '@/app/(admin)/admin/login/page';

interface CustomerRouteGuardProps {
  children: React.ReactNode;
}

export function CustomerRouteGuard({ children }: CustomerRouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B83B63]" />
        <p className="text-xs text-[#6D6670] tracking-wide">Verifying account access...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export function AdminRouteGuard({ children, requiredPermission }: AdminRouteGuardProps) {
  const { user, role, permissions, isLoading, signOut } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Failsafe timer: After 500ms, if still loading, unblock and show the login form immediately
    const timer = setTimeout(() => {
      setAuthReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Only show brief loader for the first 500ms while checking session
  if (isLoading && !authReady && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0D0B0E] text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs text-white/60 tracking-wide">Loading Operations Console...</p>
      </div>
    );
  }

  // If unauthenticated, render the Admin Login page and form directly!
  // This guarantees the login form is always accessible at /admin with zero stuck states.
  if (!user) {
    return <AdminLoginPage />;
  }

  const isStaff = role !== 'customer';
  const hasPermission =
    role === 'owner' || (!requiredPermission || permissions.includes(requiredPermission));

  if (!isStaff || !hasPermission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0D0B0E] text-center">
        <div className="max-w-md w-full bg-[#18141B] p-8 rounded-2xl border border-white/10 shadow-2xl space-y-5 text-white">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-brand text-white">
              Administrative Access Denied
            </h2>
            <p className="text-xs text-white/60 mt-2 leading-relaxed">
              You are signed in as <strong className="text-white">{user.email}</strong>, which does not have staff or administrator privileges. Only administrative accounts configured by the system owner in Firebase are allowed.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={async () => {
                await signOut();
                router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
              }}
              className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10 text-xs font-medium cursor-pointer"
            >
              Sign In with Authorized Admin Account
            </Button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full text-xs text-white/80 border-white/10 hover:bg-white/5">
                  Storefront
                </Button>
              </Link>
              <Link href="/account">
                <Button variant="outline" size="sm" className="w-full text-xs text-white/80 border-white/10 hover:bg-white/5">
                  Customer Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
