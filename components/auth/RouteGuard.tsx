'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Permission } from '@/lib/auth/roles';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#120F13] text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs text-white/60 tracking-wide">Authorizing administrative credentials...</p>
      </div>
    );
  }

  if (!user) return null;

  const isStaff = role !== 'customer';
  const hasPermission =
    role === 'owner' || (!requiredPermission || permissions.includes(requiredPermission));

  if (!isStaff || !hasPermission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0D0B0E] text-center">
        <div className="max-w-md w-full bg-[#18141B] p-8 rounded-[16px] border border-white/10 shadow-2xl space-y-5 text-white">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-brand text-white">
              Staff Authorization Required
            </h2>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              You are currently signed in as <strong className="text-white">{user.email}</strong> (Customer Account). Administrative operations require active staff authorization.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="primary"
              size="md"
              onClick={async () => {
                await signOut();
                router.push('/admin/login');
              }}
              className="w-full bg-[#5B132B] hover:bg-[#781838] text-white border border-[#D4AF37]/30 text-xs font-bold"
            >
              Sign In with Staff Account
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full text-xs text-white/80 border-white/10 hover:bg-white/5">
                  Storefront
                </Button>
              </Link>
              <Link href="/account">
                <Button variant="outline" size="sm" className="w-full text-xs text-white/80 border-white/10 hover:bg-white/5">
                  My Orders
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
