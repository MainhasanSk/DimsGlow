'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  href: string;
}

const TABS: TabItem[] = [
  { id: 'essentials', label: 'DIMSGLOW MAKE-UP ESSENTIALS', href: '/collections/all' },
  { id: 'professional', label: 'PROFESSIONAL', href: '/collections/professional' },
  { id: 'skincare', label: 'SKIN CARE', href: '/collections/skin-care' },
];

export function BrandCategoryTabs() {
  const [activeTab, setActiveTab] = useState('essentials');

  return (
    <nav
      aria-label="Sub-brand collections"
      className="bg-[#FAF8FA] border-b border-[#E8E2E7] hidden sm:block"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center gap-1 sm:gap-6 text-xs font-semibold tracking-wider text-[#6D6670]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'py-2 px-3 sm:px-4 text-[11px] sm:text-xs transition-colors relative border-b-2',
                  isActive
                    ? 'border-[#B83B63] text-[#B83B63] font-bold bg-white/70'
                    : 'border-transparent hover:text-[#19161A] hover:border-[#E8E2E7]'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
