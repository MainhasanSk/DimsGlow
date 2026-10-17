'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please reset your password or try again later.');
      } else {
        setError(err.message || 'An error occurred during sign-in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-md bg-[#FCE8E6] border border-[#B42318]/20 flex items-start gap-2.5 text-[#B42318] text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1">
        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-xs font-semibold text-[#19161A] tracking-wide">
            Password
          </label>
          <Link
            href="/reset-password"
            className="text-xs text-[#B83B63] hover:text-[#982D50] hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2"
        isLoading={isLoading}
      >
        Sign In
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F7F5F7]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden shadow-md border-2 border-[#D4AF37]/50">
              <Image
                src="/brand/dimsglow-logo.jpg"
                alt="DIMSGLOW Logo"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-serif-brand text-[#19161A] tracking-tight">
            Sign In to DIMSGLOW
          </h1>
          <p className="text-xs text-[#6D6670]">
            Access your orders, saved addresses, wishlist, and exclusive beauty offers
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-lg border-[#E8E2E7]">
          <CardContent className="p-6 pt-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#B83B63]" />
                </div>
              }
            >
              <SignInForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Sign up link */}
        <div className="text-center text-xs text-[#6D6670]">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-[#B83B63] font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
