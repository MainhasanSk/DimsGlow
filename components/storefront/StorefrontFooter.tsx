'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Mail,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
  );
}

export function StorefrontFooter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
    }
  };

  return (
    <footer className="bg-[#141215] text-[#D1CBD3] text-xs">
      {/* Newsletter Strip */}
      <div className="border-b border-white/10 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold font-serif-brand text-white tracking-tight">
              Subscribe to our newsletter
            </h3>
            <p className="text-xs text-[#9A939E]">
              Be the first to receive exclusive beauty releases, skincare tips, and private VIP offers.
            </p>
          </div>

          <div className="w-full md:w-auto md:min-w-[420px]">
            {isSubscribed ? (
              <div className="flex items-center gap-2 p-3 bg-white/5 border border-[#D4AF37]/40 rounded-[6px] text-white">
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-xs">Thank you for subscribing to DIMSGLOW updates!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-[#9A939E] focus:border-[#B83B63] focus:ring-0"
                />
                <Button type="submit" variant="primary" size="md" className="shrink-0">
                  SIGN UP
                </Button>
              </form>
            )}
            <p className="text-[10px] text-[#6D6670] mt-1.5 text-center md:text-left">
              By completing this form, you agree to receive promotional emails and can unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37]/50 shadow-xs">
                <Image
                  src="/brand/dimsglow-logo.jpg"
                  alt="DIMSGLOW Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold font-serif-brand text-white tracking-[0.16em]">
                DIMSGLOW
              </span>
            </div>
            <p className="text-xs text-[#9A939E] leading-relaxed">
              DIMSGLOW is a luxury beauty and skincare brand dedicated to safe, empowering, dermatologically-tested formulations tailored for all skin tones.
            </p>
            <div className="flex items-center gap-3 pt-2 text-white/80">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-[#B83B63] hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-[#B83B63] hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-[#B83B63] hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Shop Categories</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/collections/face" className="hover:text-white transition-colors">
                  Face Essentials
                </Link>
              </li>
              <li>
                <Link href="/collections/eyes" className="hover:text-white transition-colors">
                  Eyes & Lashes
                </Link>
              </li>
              <li>
                <Link href="/collections/lips" className="hover:text-white transition-colors">
                  Lipsticks & Tints
                </Link>
              </li>
              <li>
                <Link href="/collections/nails" className="hover:text-white transition-colors">
                  Nails & Lacquers
                </Link>
              </li>
              <li>
                <Link href="/collections/skin-care" className="hover:text-white transition-colors">
                  Skincare Serums
                </Link>
              </li>
              <li>
                <Link href="/collections/perfumes" className="hover:text-white transition-colors">
                  Luxury Perfumes
                </Link>
              </li>
            </ul>
          </div>

          {/* DIMSGLOW */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">DIMSGLOW</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Store Locator & Contact
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/cancellation-refund-policy" className="hover:text-white transition-colors">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#D4AF37] text-white/60 transition-colors">
                  Staff Operations
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Policies</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/cancellation-refund-policy" className="hover:text-white transition-colors">
                  Cancellation & Refund
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact Us</h4>
            <p className="text-[11px] text-[#9A939E] leading-relaxed">
              Questions? We're here for you Monday – Friday (10AM – 6PM IST).
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <a
                href="https://wa.me/913614556830"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                <span>+91 361 455 6830</span>
              </a>
              <a
                href="mailto:support@dimsglow.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#B83B63]" />
                <span>support@dimsglow.com</span>
              </a>
              <div className="flex items-center gap-2 text-[#9A939E]">
                <Clock className="w-3.5 h-3.5" />
                <span>Mon – Fri: 10AM – 6PM IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#6D6670] text-center md:text-left">
            Copyright © 2026, DIMSGLOW. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {['UPI', 'RuPay', 'Visa', 'Mastercard', 'NetBanking', 'Cash on Delivery'].map((badge) => (
              <span
                key={badge}
                className="px-2 py-0.5 rounded-[4px] bg-white/5 border border-white/10 text-[10px] text-white/70 font-medium"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
