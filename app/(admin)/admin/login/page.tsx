'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Building,
  ArrowLeft,
  UserX,
} from 'lucide-react';
import type { UserRole } from '@/lib/auth/roles';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomerNotice, setIsCustomerNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCustomerNotice(false);
    setIsLoading(true);

    try {
      // 1. Authenticate credentials with Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;

      // 2. Verify active staff role in userAccess/{uid}
      const accessDoc = await getDoc(doc(db, 'userAccess', uid));
      const role: UserRole = accessDoc.exists() ? (accessDoc.data().role as UserRole) : 'customer';

      if (role === 'customer') {
        // Authenticated user exists, but has only customer privileges
        setIsCustomerNotice(true);
        setIsLoading(false);
        return;
      }

      // 3. Authorized staff member -> Route directly into the administrative operations console
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid staff email address or authorization password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed authorization attempts. Please wait before retrying.');
      } else {
        setError(err.message || 'Authorization failed. Please contact the system administrator.');
      }
      setIsLoading(false);
    }
  };

  const handleSignOutCustomer = async () => {
    await signOut(auth);
    setIsCustomerNotice(false);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="space-y-5">
      {isCustomerNotice && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <UserX className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Staff Credentials Required</p>
              <p className="mt-1 text-[11px] text-amber-200/80 leading-relaxed">
                The account <strong className="text-white">{email}</strong> is registered as a customer shopping account and lacks operations console permissions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOutCustomer}
              className="text-[11px] h-7 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Sign In With Different Account
            </Button>
            <Link href="/account">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="text-[11px] h-7 bg-[#5B132B] hover:bg-[#781838]"
              >
                Go to Customer Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
            Staff Email Address
          </label>
          <Input
            type="email"
            placeholder="staff@dimsglow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-[#1F1B22] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
            Security Password
          </label>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-[#1F1B22] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-0"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4 bg-gradient-to-r from-[#5B132B] to-[#781838] hover:from-[#781838] hover:to-[#932048] text-white border border-[#D4AF37]/30 font-bold tracking-wider text-xs uppercase shadow-lg"
          isLoading={isLoading}
        >
          <Lock className="w-3.5 h-3.5 mr-2" />
          Authorize Session
          <ArrowRight className="w-3.5 h-3.5 ml-2" />
        </Button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#0D0B0E] text-white flex flex-col justify-between items-center p-4 sm:p-8 selection:bg-[#5B132B] selection:text-white">
      {/* Top Bar with Return to Storefront */}
      <div className="w-full max-w-5xl flex items-center justify-between py-4">
        <Link
          href="/"
          className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Storefront
        </Link>
        <div className="flex items-center gap-2 text-[11px] text-[#D4AF37] font-semibold tracking-widest uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          Restricted Portal
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md my-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-xl p-0.5 bg-black/40">
            <Image
              src="/brand/dimsglow-logo.jpg"
              alt="DIMSGLOW Logo"
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37] font-bold">
              DIMSGLOW COSMETICS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-brand tracking-tight text-white mt-0.5">
              Operations Console
            </h1>
          </div>
          <p className="text-xs text-white/50 max-w-xs mx-auto">
            Privileged administrative sign-in for order fulfillment, inventory control, and financial operations.
          </p>
        </div>

        <Card className="bg-[#141117] border-white/10 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 sm:p-8">
            <Suspense
              fallback={
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                </div>
              }
            >
              <AdminLoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-white/40">
            Staff access is monitored and immutably audited.
          </p>
          <p className="text-[10px] text-white/30">
            Staff accounts are provisioned by the store owner. Customer accounts cannot access this console.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl py-4 text-center text-[10px] text-white/30 border-t border-white/5">
        DIMSGLOW COSMETICS PRIVATE LIMITED © 2026. Internal Operations System.
      </div>
    </div>
  );
}
