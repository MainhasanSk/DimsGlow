import React from 'react';
import Image from 'next/image';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { Sparkles, Shield, Heart, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <StorefrontShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-md">
            <Image
              src="/brand/dimsglow-logo.jpg"
              alt="DIMSGLOW Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-brand text-[#19161A] tracking-tight">
            The DIMSGLOW Story
          </h1>
          <p className="text-sm text-[#6D6670] leading-relaxed">
            Elevating everyday beauty with luxurious, dermatologically tested, high-performance formulations crafted for all skin tones.
          </p>
        </div>

        {/* Brand Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <Shield className="w-7 h-7 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">100% Toxic-Free</h3>
            <p className="text-xs text-[#6D6670]">Free from harmful parabens, sulfates, and heavy metals.</p>
          </div>
          <div className="p-6 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <Heart className="w-7 h-7 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">PETA Certified</h3>
            <p className="text-xs text-[#6D6670]">Completely cruelty-free and vegan formulations.</p>
          </div>
          <div className="p-6 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <Award className="w-7 h-7 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Dermatologist Approved</h3>
            <p className="text-xs text-[#6D6670]">Clinical testing to ensure complete safety across all skin types.</p>
          </div>
          <div className="p-6 rounded-[10px] bg-[#F7F5F7] border border-[#E8E2E7] text-center space-y-2">
            <Sparkles className="w-7 h-7 mx-auto text-[#B83B63]" />
            <h3 className="font-bold text-sm text-[#19161A]">Made for You</h3>
            <p className="text-xs text-[#6D6670]">Tailored shade ranges and formulations suited for Indian climates.</p>
          </div>
        </div>

        {/* Narrative */}
        <div className="prose prose-sm text-xs text-[#19161A] leading-relaxed max-w-3xl mx-auto space-y-4">
          <p>
            At DIMSGLOW, we believe beauty is an empowering form of personal expression. Founded with the mission to redefine luxury cosmetics, our formulations blend pure active botanicals like Rice Water, Niacinamide, and Aloe Vera with world-class cosmetic pigments.
          </p>
          <p>
            Every product in our collection undergoes rigorous quality control to ensure effortless blendability, rich color payoff, and long-lasting wear without compromising skin health.
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}
