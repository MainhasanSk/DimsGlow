'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { ROLE_DEFAULT_PERMISSIONS, type UserRole } from '@/lib/auth/roles';

const MAX_FAILED_ATTEMPTS = 6;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes (120 seconds)

function generateCaptchaCode(): { code: string; display: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { code: result, display: result.split('').join(' ') };
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

  // Form Fields: ONLY email, password, captcha, and forgot password option
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState<{ code: string; display: string }>({ code: '', display: '' });

  // Rate Limiting & Lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(0);
  const isLocked = lockoutRemainingSec > 0;

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  // Initialize or regenerate Captcha
  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptchaCode());
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  // Load rate limiting state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedLockout = localStorage.getItem('dg_admin_lockout_until');
      const storedAttempts = localStorage.getItem('dg_admin_failed_attempts');

      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10) || 0);
      }

      if (storedLockout) {
        const lockoutUntil = parseInt(storedLockout, 10);
        const now = Date.now();
        if (lockoutUntil > now) {
          setLockoutRemainingSec(Math.ceil((lockoutUntil - now) / 1000));
        } else {
          localStorage.removeItem('dg_admin_lockout_until');
        }
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            localStorage.removeItem('dg_admin_lockout_until');
            localStorage.setItem('dg_admin_failed_attempts', '0');
          } catch {}
          setFailedAttempts(0);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemainingSec]);

  // Record a failed attempt and trigger 2-minute lockout on 6th failure
  const recordFailedAttempt = (reason: string) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    refreshCaptcha();

    if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      try {
        localStorage.setItem('dg_admin_lockout_until', lockUntil.toString());
        localStorage.setItem('dg_admin_failed_attempts', nextAttempts.toString());
      } catch {}
      setLockoutRemainingSec(120);
      setErrorMessage(
        'Security Lockout: 6 failed authorization attempts reached. Access blocked for 2 minutes.'
      );
    } else {
      try {
        localStorage.setItem('dg_admin_failed_attempts', nextAttempts.toString());
      } catch {}
      setErrorMessage(
        `${reason} (${nextAttempts}/${MAX_FAILED_ATTEMPTS} attempts before 2-minute lockout)`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isLocked) {
      return;
    }

    // 1. Verify Captcha
    if (!captchaInput.trim() || captchaInput.trim().toUpperCase() !== captcha.code.toUpperCase()) {
      recordFailedAttempt('Security Captcha code verification failed. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Authenticate directly with Firebase Authentication credentials
      // Firebase Auth checks if the user exists and verifies the password in real time.
      // If deleted from Firebase Auth or wrong password, it fails here immediately.
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;

      // 3. Verify that this is not an ordinary customer account
      const customerDoc = await getDoc(doc(db, 'customers', uid));
      const accessDocRef = doc(db, 'userAccess', uid);
      const accessDoc = await getDoc(accessDocRef);

      // If registered as customer and has no staff override, block from admin panel immediately
      if (customerDoc.exists() && (!accessDoc.exists() || accessDoc.data()?.role === 'customer')) {
        await signOut(auth);
        recordFailedAttempt(
          'Access Denied: Customer accounts are not permitted to access the administrative console.'
        );
        setIsLoading(false);
        return;
      }

      // If staff access record exists, ensure it is active
      if (accessDoc.exists() && accessDoc.data()?.status !== 'active') {
        await signOut(auth);
        recordFailedAttempt(
          'Access Denied: This administrative account has been deactivated or suspended.'
        );
        setIsLoading(false);
        return;
      }

      // If this is an administrative account added in Firebase Authentication and no userAccess doc exists yet,
      // dynamically provision the owner/admin userAccess record
      if (!accessDoc.exists()) {
        await setDoc(
          accessDocRef,
          {
            uid,
            email: userCred.user.email,
            role: 'owner',
            status: 'active',
            permissions: ROLE_DEFAULT_PERMISSIONS.owner,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }

      // Success: Clear failed attempts
      try {
        localStorage.removeItem('dg_admin_failed_attempts');
        localStorage.removeItem('dg_admin_lockout_until');
      } catch {}

      // Route directly to Admin Operations Console
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      let msg = 'Invalid admin email address or security password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid admin email or password. Only registered admin credentials can access.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Firebase rate limit exceeded. Please wait before retrying.';
      } else if (err.message) {
        msg = err.message;
      }
      recordFailedAttempt(msg);
      setIsLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setResetErrorMessage('Please enter your registered admin email address.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccessMessage(
        `Password reset link has been dispatched to ${targetEmail}. Please check your inbox or spam folder to reset your admin password.`
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetErrorMessage('No registered admin user was found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setResetErrorMessage('Please provide a valid email address.');
      } else {
        setResetErrorMessage(err.message || 'Failed to dispatch password reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5">
      {/* Lockout Warning Banner */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 text-xs space-y-2 animate-pulse">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-bold text-rose-300 text-sm">
              Account Temporarily Locked
            </span>
          </div>
          <p className="text-[11px] text-rose-200/90 leading-relaxed">
            Rate limit exceeded (6 failed attempts). For security, admin login is blocked for{' '}
            <strong className="text-white font-mono text-xs">{formatTimer(lockoutRemainingSec)}</strong>.
          </p>
          <div className="w-full bg-rose-950/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(lockoutRemainingSec / 120) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {!isLocked && errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Admin Login Form: ONLY Email, Password, Captcha, Forgot Password */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Email */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
            Admin Email Address
          </label>
          <Input
            type="email"
            placeholder="admin@dimsglow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLocked || isLoading}
            required
            autoComplete="email"
            className="bg-[#1F1B22] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-0 disabled:opacity-50"
          />
        </div>

        {/* 2. Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider">
              Security Password
            </label>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetSuccessMessage(null);
                setResetErrorMessage(null);
                setShowForgotModal(true);
              }}
              className="text-[11px] text-[#D4AF37] hover:text-amber-300 font-semibold transition-colors underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLocked || isLoading}
            required
            autoComplete="current-password"
            className="bg-[#1F1B22] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-0 disabled:opacity-50"
          />
        </div>

        {/* 3. Captcha Challenge */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
            Security Captcha
          </label>
          <div className="flex items-center gap-2 mb-2">
            {/* Visual Captcha Display */}
            <div className="flex-1 bg-black/60 border border-[#D4AF37]/40 rounded-lg py-2 px-4 flex items-center justify-center select-none shadow-inner">
              <span className="font-mono text-base font-black tracking-[0.35em] text-[#D4AF37] line-through decoration-[#B83B63] decoration-2">
                {captcha.display || '•••••'}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshCaptcha}
              disabled={isLocked || isLoading}
              title="Refresh Captcha"
              className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <Input
            type="text"
            placeholder="Enter captcha text shown above"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            disabled={isLocked || isLoading}
            required
            autoComplete="off"
            className="bg-[#1F1B22] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-0 uppercase font-mono tracking-widest disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLocked || isLoading}
          className="w-full mt-2 bg-linear-to-r from-[#5B132B] to-[#781838] hover:from-[#781838] hover:to-[#932048] text-white border border-[#D4AF37]/30 font-bold tracking-wider text-xs uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={isLoading}
        >
          {isLocked ? (
            <>
              <Clock className="w-3.5 h-3.5 mr-2" />
              Locked ({formatTimer(lockoutRemainingSec)})
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-2" />
              Authorize Admin Session
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </>
          )}
        </Button>
      </form>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18141B] border border-white/15 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-white relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-brand text-white">Reset Admin Password</h3>
                <p className="text-[11px] text-white/60">
                  Password reset link will be sent to the registered admin email
                </p>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{resetSuccessMessage}</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full bg-[#D4AF37] hover:bg-[#c29d2b] text-black font-bold text-xs"
                >
                  Return to Admin Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
                {resetErrorMessage && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{resetErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5 uppercase tracking-wider">
                    Registered Admin Email
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@dimsglow.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="bg-[#1F1B22] border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={resetLoading}
                    className="flex-1 bg-linear-to-r from-[#5B132B] to-[#781838] hover:from-[#781838] hover:to-[#932048] text-white font-bold text-xs"
                    isLoading={resetLoading}
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLoginPage() {
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
            Privileged administrative sign-in. Only accounts registered in Firebase Authentication can access.
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
            Administrative access is strictly restricted, monitored, and audited.
          </p>
          <p className="text-[10px] text-white/30">
            Rate limit of 6 attempts enforced with 2-minute lockout protection.
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

export default AdminLoginPage;
