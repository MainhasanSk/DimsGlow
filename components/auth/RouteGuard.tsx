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
  const { user, role, permissions, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F7F5F7] text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B83B63]" />
        <p className="text-xs text-[#6D6670] tracking-wide">Authorizing administrative credentials...</p>
      </div>
    );
  }

  if (!user) return null;

  const isStaff = role !== 'customer';
  const hasPermission =
    role === 'owner' || (!requiredPermission || permissions.includes(requiredPermission));

  if (!isStaff || !hasPermission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F7F5F7] text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-[12px] border border-[#E8E2E7] shadow-lg space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FCE8E6] flex items-center justify-center text-[#B42318]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif-brand text-[#19161A]">Access Denied</h2>
          <p className="text-xs text-[#6D6670] leading-relaxed">
            Your authenticated account does not possess active staff authorization for this module.
            All privileged operations are verified server-side.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                Storefront
              </Button>
            </Link>
            <Link href="/account" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                Customer Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
