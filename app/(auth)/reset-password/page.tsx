'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      // For security and privacy, avoid revealing if the account exists
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        // Still present generic success or safe notification
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F7F5F7]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
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
            Reset Password
          </h1>
          <p className="text-xs text-[#6D6670]">
            Enter your registered email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-lg border-[#E8E2E7]">
          <CardContent className="p-6 pt-6">
            {isSubmitted ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#18794E]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[#19161A]">Check your inbox</h3>
                  <p className="text-xs text-[#6D6670] leading-relaxed">
                    If an account exists for <span className="font-medium text-[#19161A]">{email}</span>, you will receive password reset instructions shortly.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/sign-in">
                    <Button variant="outline" size="md" className="w-full">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-[#FCE8E6] border border-[#B42318]/20 flex items-start gap-2 text-[#B42318] text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  id="email"
                  type="email"
                  label="Registered email address"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back to sign in */}
        <div className="text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center text-xs font-semibold text-[#6D6670] hover:text-[#B83B63] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
