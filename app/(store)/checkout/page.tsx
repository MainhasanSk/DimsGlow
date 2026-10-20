'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCart } from '@/lib/cart/CartContext';
import { auth, db } from '@/lib/firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import type { SavedAddress } from '@/app/(customer)/account/addresses/page';
import { formatPricePaise } from '@/lib/utils';
import {
  ShieldCheck,
  Truck,
  MapPin,
  CreditCard,
  ChevronRight,
  Plus,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Banknote,
  Gift,
  UserCheck,
  UserPlus,
  LogIn,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FREE_SHIPPING_THRESHOLD_PAISE = 39900;
const STANDARD_SHIPPING_FEE_PAISE = 4900;
const GIFT_WRAP_FEE_PAISE = 9900;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { items, totalItemCount, subtotalPaise, clearCart } = useCart();

  // Auth Gate state for guest users (required before placing order)
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Address Management
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Inline Add Address Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Assam');
  const [postalCode, setPostalCode] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Checkout Addons & Submission
  const [includeGiftWrap, setIncludeGiftWrap] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (!user) {
      setLoadingAddresses(false);
      return;
    }
    const uid = user.uid;

    async function loadAddresses() {
      try {
        const snap = await getDocs(
          collection(db, 'addresses', uid, 'savedAddresses')
        );
        const list: SavedAddress[] = [];
        snap.forEach((d) => list.push(d.data() as SavedAddress));
        list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        setSavedAddresses(list);
        if (list.length > 0) {
          setSelectedAddressId(list[0].id);
        } else {
          setShowAddressForm(true);
        }
      } catch (err) {
        console.warn('Failed to fetch addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadAddresses();
  }, [user]);

  // Calculations
  const isFreeShipping = subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE;
  const shippingFeePaise = isFreeShipping || items.length === 0 ? 0 : STANDARD_SHIPPING_FEE_PAISE;
  const giftWrapFeePaise = includeGiftWrap ? GIFT_WRAP_FEE_PAISE : 0;
  const grandTotalPaise = subtotalPaise + shippingFeePaise + giftWrapFeePaise;

  // Handle In-Checkout Account Registration
  const handleCheckoutRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authFullName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please fill in your full name, email, and password.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (authPhone.trim() && !/^\d{10}$/.test(authPhone.trim())) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setAuthLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      await updateProfile(userCred.user, { displayName: authFullName.trim() });

      const uid = userCred.user.uid;
      const timestamp = Date.now();

      // Create Customer profile in customers/{uid} and users/{uid}
      const customerRecord = {
        uid,
        email: authEmail.trim(),
        displayName: authFullName.trim(),
        phone: authPhone.trim() || null,
        role: 'customer',
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await setDoc(doc(db, 'customers', uid), customerRecord, { merge: true });
      await setDoc(doc(db, 'users', uid), customerRecord, { merge: true });

      // Pre-populate address form with customer name and phone
      setFullName(authFullName.trim());
      if (authPhone.trim()) setPhone(authPhone.trim());
      setShowAddressForm(true);
    } catch (err: any) {
      console.error('Checkout registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please switch to Sign In tab.');
      } else {
        setAuthError(err.message || 'Failed to create account.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle In-Checkout Sign In
  const handleCheckoutLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter your email and password.');
      return;
    }

    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
    } catch (err: any) {
      console.error('Checkout sign in error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(err.message || 'Failed to sign in.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddressError(null);

    if (!fullName.trim() || !addressLine1.trim() || !city.trim() || !postalCode.trim()) {
      setAddressError('Please fill in all mandatory address fields');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setAddressError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!/^\d{6}$/.test(postalCode.trim())) {
      setAddressError('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    const newId = `addr_${Date.now()}`;
    const newAddress: SavedAddress = {
      id: newId,
      fullName: fullName.trim(),
      phoneNumber: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state,
      postalCode: postalCode.trim(),
      country: 'India',
      isDefault: savedAddresses.length === 0,
      createdAt: Date.now(),
    };

    const uid = user.uid;
    try {
      await setDoc(doc(db, 'addresses', uid, 'savedAddresses', newId), newAddress);
      setSavedAddresses((prev) => [newAddress, ...prev]);
      setSelectedAddressId(newId);
      setShowAddressForm(false);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    // Rule: Customer profile must exist before placing an order
    if (!user) {
      setOrderError('Account required: Please create a customer account or sign in above to place your order.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (items.length === 0) {
      setOrderError('Your cart is empty');
      return;
    }

    const chosenAddress = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!chosenAddress) {
      setOrderError('Please select or add a delivery shipping address');
      return;
    }

    setPlacingOrder(true);
    try {
      const idToken = await user.getIdToken();
      const idempotencyKey = crypto.randomUUID();

      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          shippingAddress: {
            fullName: chosenAddress.fullName,
            phone: chosenAddress.phoneNumber,
            addressLine1: chosenAddress.addressLine1,
            addressLine2: chosenAddress.addressLine2,
            city: chosenAddress.city,
            state: chosenAddress.state,
            postalCode: chosenAddress.postalCode,
            country: 'India',
          },
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          includeGiftWrap,
          orderNote: orderNote.trim() || undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      await clearCart();

      const successParams = new URLSearchParams({
        orderId: data.order.id,
        orderNumber: data.order.orderNumber,
      });

      if (data.adminWhatsappUrl) {
        successParams.set('whatsappUrl', data.adminWhatsappUrl);
      }

      router.push(`/checkout/success?${successParams.toString()}`);
    } catch (err: any) {
      console.error('Error placing order:', err);
      setOrderError(err.message || 'An unexpected error occurred while placing your order.');
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <StorefrontShell>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-serif font-bold text-[#19161A] mb-2">Your Bag is Empty</h1>
          <p className="text-xs text-[#6D6670] mb-6">You need to have items in your bag before proceeding to checkout.</p>
          <Link href="/collections/all">
            <Button variant="primary" size="lg" className="text-xs font-bold uppercase tracking-wider">
              Explore Luxury Catalog
            </Button>
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      {/* Breadcrumb */}
      <div className="bg-[#FAF8FA] border-b border-[#E8E2E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#6D6670] flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#B83B63] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href="/cart" className="hover:text-[#B83B63] transition-colors">Bag</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[#19161A] font-semibold">Express Checkout</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#E8E2E7]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#19161A]">
              Secure Checkout
            </h1>
            <p className="text-xs text-[#6D6670] mt-0.5">
              Review your shipping destination and pay securely upon delivery.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#18794E] font-semibold bg-[#E6F4EA] px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          {/* Left Column (7 cols): Checkout Steps */}
          <div className="lg:col-span-7 space-y-6">

            {/* MANDATORY STEP: Customer Profile / Account Authentication */}
            <div className="bg-white rounded-xl border border-[#E8E2E7] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E2E7] pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${user ? 'bg-[#18794E]' : 'bg-[#B83B63]'}`}>
                    {user ? '✓' : '1'}
                  </div>
                  <h2 className="text-base font-serif font-bold text-[#19161A]">
                    Customer Account
                  </h2>
                </div>
                {user && (
                  <span className="text-xs font-semibold text-[#18794E] flex items-center gap-1 bg-[#E6F4EA] px-2.5 py-0.5 rounded-full">
                    <UserCheck className="w-3.5 h-3.5" /> Verified Customer
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#FAF8FA] rounded-lg border border-[#E8E2E7] text-xs">
                  <div>
                    <p className="font-bold text-[#19161A]">
                      {user.displayName || 'Customer'}
                    </p>
                    <p className="text-[#6D6670] mt-0.5">{user.email}</p>
                  </div>
                  <Link href="/account">
                    <Button variant="outline" size="sm" className="text-[11px] h-7 border-[#E8E2E7]">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-[#FAF4F7] border border-[#B83B63]/30 rounded-lg text-xs text-[#6D6670] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#B83B63] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#B83B63]">Account Required:</strong> A verified customer account is required to place an order, access order tracking, and receive tax invoices. Please create an account or sign in below.
                    </span>
                  </div>

                  {/* Tabs: Create Account vs Sign In */}
                  <div className="flex border-b border-[#E8E2E7]">
                    <button
                      type="button"
                      onClick={() => setAuthTab('register')}
                      className={`pb-2.5 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                        authTab === 'register'
                          ? 'border-[#B83B63] text-[#B83B63]'
                          : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Create Account (New Customer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className={`pb-2.5 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                        authTab === 'login'
                          ? 'border-[#B83B63] text-[#B83B63]'
                          : 'border-transparent text-[#6D6670] hover:text-[#19161A]'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" /> Sign In (Existing Member)
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authTab === 'register' ? (
                    <form onSubmit={handleCheckoutRegister} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            Full Name *
                          </label>
                          <Input
                            type="text"
                            placeholder="Ananya Sharma"
                            value={authFullName}
                            onChange={(e) => setAuthFullName(e.target.value)}
                            required
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            Mobile Phone (10 digits) *
                          </label>
                          <Input
                            type="tel"
                            placeholder="9876543210"
                            maxLength={10}
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            placeholder="ananya@example.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            Create Password (min 6 chars) *
                          </label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={authLoading}
                        className="w-full text-xs font-bold uppercase tracking-wider py-2.5 bg-[#B83B63] hover:bg-[#9B2C4F]"
                      >
                        {authLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Create Account & Proceed to Address'
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleCheckoutLogin} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#19161A] mb-1">
                          Registered Email Address *
                        </label>
                        <Input
                          type="email"
                          placeholder="ananya@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#19161A] mb-1">
                          Account Password *
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          required
                          className="text-xs"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={authLoading}
                        className="w-full text-xs font-bold uppercase tracking-wider py-2.5 bg-[#B83B63] hover:bg-[#9B2C4F]"
                      >
                        {authLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Sign In & Proceed to Address'
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Delivery Address */}
            <div className={`bg-white rounded-xl border border-[#E8E2E7] p-6 shadow-xs space-y-4 ${!user ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between border-b border-[#E8E2E7] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#B83B63] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h2 className="text-base font-serif font-bold text-[#19161A]">
                    Delivery Address
                  </h2>
                </div>
                {user && savedAddresses.length > 0 && !showAddressForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="text-xs font-semibold text-[#B83B63] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div className="py-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Saved Address Cards */}
                  {!showAddressForm && savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <label
                        key={addr.id}
                        className={`p-4 rounded-[10px] border flex items-start gap-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#B83B63] bg-[#FAF4F7]/40 ring-1 ring-[#B83B63]'
                            : 'border-[#E8E2E7] bg-white hover:border-[#B83B63]/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 w-4 h-4 text-[#B83B63] focus:ring-[#B83B63] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[#19161A]">{addr.fullName}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-extrabold uppercase text-[#B83B63] bg-[#FBEAF0] px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[#6D6670] leading-relaxed">
                            {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}
                            {addr.city}, {addr.state} — {addr.postalCode}
                          </p>
                          <p className="text-[#19161A] font-medium mt-1">
                            Mobile: +91 {addr.phoneNumber}
                          </p>
                        </div>
                      </label>
                    );
                  })}

                  {/* Inline Address Form */}
                  {(showAddressForm || savedAddresses.length === 0) && (
                    <form onSubmit={handleSaveInlineAddress} className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#19161A]">
                        Enter Delivery Address
                      </h4>
                      {addressError && (
                        <p className="text-xs text-[#EF4444]">{addressError}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            Recipient Name *
                          </label>
                          <Input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            10-Digit Mobile Number *
                          </label>
                          <Input
                            type="tel"
                            placeholder="9876543210"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#19161A] mb-1">
                          Street Address / House No. *
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g. Flat 402, Royal Palms, Christian Basti"
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          required
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#19161A] mb-1">
                          Apartment, Suite, Landmark (Optional)
                        </label>
                        <Input
                          type="text"
                          placeholder="Near Apollo Hospital"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            City *
                          </label>
                          <Input
                            type="text"
                            placeholder="Guwahati"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            State *
                          </label>
                          <Input
                            type="text"
                            placeholder="Assam"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            required
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#19161A] mb-1">
                            PIN Code (6 digits) *
                          </label>
                          <Input
                            type="text"
                            placeholder="781005"
                            maxLength={6}
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" variant="primary" size="sm" className="text-xs font-bold bg-[#B83B63]">
                          Save Address
                        </Button>
                        {savedAddresses.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressForm(false)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Payment Method */}
            <div className={`bg-white rounded-xl border border-[#E8E2E7] p-6 shadow-xs space-y-4 ${!user ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 border-b border-[#E8E2E7] pb-3">
                <div className="w-6 h-6 rounded-full bg-[#B83B63] text-white text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <h2 className="text-base font-serif font-bold text-[#19161A]">
                  Payment Method
                </h2>
              </div>

              <div className="p-4 rounded-[10px] border border-[#B83B63] bg-[#FAF4F7]/40 flex items-start gap-3">
                <Banknote className="w-5 h-5 text-[#B83B63] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#19161A] block">
                    Cash on Delivery (COD) / UPI at Doorstep
                  </span>
                  <p className="text-[#6D6670] mt-1 leading-relaxed">
                    Pay securely using Cash or UPI (Google Pay, PhonePe, Paytm) upon receipt of your package.
                  </p>
                </div>
              </div>

              {/* Delivery instructions */}
              <div className="pt-2">
                <label htmlFor="checkout-instructions" className="block text-xs font-semibold text-[#19161A] mb-1">
                  Delivery Notes / Landmarks (Optional)
                </label>
                <textarea
                  id="checkout-instructions"
                  rows={2}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="e.g. Leave with security guard, call before delivery"
                  className="w-full text-xs p-3 border border-[#E8E2E7] rounded-md focus:outline-none focus:border-[#B83B63] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Order Summary */}
          <div className="lg:col-span-5 space-y-4 sticky top-24">
            <div className="bg-white rounded-xl border border-[#E8E2E7] p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-base font-serif font-bold text-[#19161A] pb-3 border-b border-[#E8E2E7]">
                Order Summary ({totalItemCount})
              </h3>

              {/* Line items thumbnail list */}
              <div className="max-h-60 overflow-y-auto divide-y divide-[#F2EFF2] pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-md bg-[#FAF8FA] border border-[#E8E2E7] overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl || '/brand/dimsglow-logo.jpg'}
                        alt={item.productName}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-semibold text-[#19161A] truncate">{item.productName}</h4>
                      {item.variantTitle && (
                        <p className="text-[10px] text-[#6D6670]">Shade: {item.variantTitle}</p>
                      )}
                      <p className="text-[11px] text-[#8C8490] mt-0.5">
                        Qty: {item.quantity} × {formatPricePaise(item.unitPricePaise)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#19161A] shrink-0 font-mono">
                      {formatPricePaise(item.unitPricePaise * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Gift Wrap checkbox */}
              <label className="flex items-center gap-2 pt-2 border-t border-[#E8E2E7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGiftWrap}
                  onChange={(e) => setIncludeGiftWrap(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E8E2E7] text-[#B83B63] focus:ring-[#B83B63]"
                />
                <span className="text-xs text-[#19161A] flex-1">
                  Signature Gift Packaging (+₹99)
                </span>
              </label>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-3 border-t border-[#E8E2E7] text-xs">
                <div className="flex justify-between text-[#6D6670]">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-[#19161A]">{formatPricePaise(subtotalPaise)}</span>
                </div>
                {includeGiftWrap && (
                  <div className="flex justify-between text-[#6D6670]">
                    <span>Gift Packaging</span>
                    <span className="font-semibold text-[#19161A]">{formatPricePaise(GIFT_WRAP_FEE_PAISE)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6D6670]">
                  <span>Express Delivery</span>
                  {shippingFeePaise === 0 ? (
                    <span className="font-bold text-[#047857] uppercase text-[11px]">FREE</span>
                  ) : (
                    <span className="font-semibold text-[#19161A]">{formatPricePaise(shippingFeePaise)}</span>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-[#E8E2E7] flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-[#19161A]">Amount to Pay</span>
                  <p className="text-[10px] text-[#8C8490]">All taxes included</p>
                </div>
                <span className="text-xl font-serif font-bold text-[#19161A]">
                  {formatPricePaise(grandTotalPaise)}
                </span>
              </div>

              {orderError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-md text-xs text-[#EF4444] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Place Order Button */}
              <Button
                variant="primary"
                size="lg"
                disabled={placingOrder || !user}
                onClick={handlePlaceOrder}
                className="w-full text-xs font-bold uppercase tracking-wider py-3.5 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order...
                  </>
                ) : !user ? (
                  <>
                    <Lock className="w-4 h-4" /> Sign In / Create Account to Place Order
                  </>
                ) : (
                  <>
                    Confirm & Place Order <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-[#6D6670]">
                  Order details will be recorded in your customer dashboard and alerted to admin via WhatsApp.
                </p>
              </div>
            </div>

            {/* Guarantee Cards */}
            <div className="bg-[#FAF8FA] rounded-[10px] border border-[#E8E2E7] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#19161A]">
                <ShieldCheck className="w-4 h-4 text-[#18794E]" />
                <span className="font-medium">Direct From Manufacturer Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#19161A]">
                <Truck className="w-4 h-4 text-[#B83B63]" />
                <span className="font-medium">Tamper-Proof Box with Safety Seal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
