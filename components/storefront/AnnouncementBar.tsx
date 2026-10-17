'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useStoreSettings } from '@/lib/settings/settingsService';

export function AnnouncementBar() {
  const { settings } = useStoreSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements = (settings.announcements && settings.announcements.length > 0)
    ? settings.announcements
    : [
        `FREE SHIPPING ON ORDERS ABOVE ₹${settings.freeDeliveryThresholdRupees || 399}`,
        '100% VEGAN & CRUELTY-FREE • PROUDLY MADE IN INDIA',
        `USE CODE: ${settings.newsletterDiscountCode || 'GLOW10'} FOR 10% OFF`,
      ];

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (settings.announcementEnabled === false) {
    return null;
  }

  const activeText = announcements[currentIndex % announcements.length] || announcements[0];

  return (
    <aside
      aria-label="Promotional announcements"
      className="bg-[#FBEAF0] text-[#B83B63] border-b border-[#F5D8E4] text-[11px] sm:text-xs font-medium py-1.5 px-4 text-center select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 transition-all duration-300">
        <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-[#B83B63]" />
        <span className="truncate">{activeText}</span>
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
