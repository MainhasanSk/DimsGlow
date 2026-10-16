'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

const ANNOUNCEMENTS = [
  'FREE Lip Oil & Lipstick on orders above ₹699 • Use Code: GLOW699',
  'FREE Voluminous Mascara on shopping above ₹499 • Use Code: MASCARA',
  '100% Vegan & Cruelty-Free • Free Shipping across India on orders above ₹399',
];

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      aria-label="Promotional announcements"
      className="bg-[#FBEAF0] text-[#B83B63] border-b border-[#F5D8E4] text-[11px] sm:text-xs font-medium py-1.5 px-4 text-center select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 transition-all duration-300">
        <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-[#B83B63]" />
        <span className="truncate">{ANNOUNCEMENTS[currentIndex]}</span>
        <Link
          href="/collections/all"
          className="inline-flex items-center text-[10px] sm:text-xs font-bold underline hover:text-[#982D50] ml-1 shrink-0"
        >
          Shop Now <ArrowRight className="w-3 h-3 ml-0.5 inline" />
        </Link>
      </div>
    </aside>
  );
}
