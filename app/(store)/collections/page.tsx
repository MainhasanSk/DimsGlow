'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StorefrontShell } from '@/components/storefront/StorefrontShell';
import { CATEGORIES } from '@/lib/data/catalog';
import { ArrowRight } from 'lucide-react';

export default function CollectionListPage() {
  const collections = [
    {
      id: 'bestsellers',
      slug: 'bestsellers',
      title: '★ Best Sellers',
      description: 'Our most awarded, viral formulas for effortless daily radiance and 24-hour non-drying wear.',
      bannerBg: 'from-[#4A0E17] via-[#8B1E3F] to-[#24050D]',
    },
    ...Object.values(CATEGORIES),
  ];

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="text-center space-y-2 border-b border-[#E8E2E7] pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif-brand text-[#19161A]">
            Collection List
          </h1>
          <p className="text-xs text-[#6D6670]">
            Browse our complete range of curated luxury beauty, complexion, skincare, and fragrance collections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group relative rounded-[12px] overflow-hidden border border-[#E8E2E7] bg-white shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className={`h-40 w-full bg-gradient-to-r ${col.bannerBg} p-6 flex flex-col justify-end text-white relative overflow-hidden`}>
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full overflow-hidden border border-white/20 opacity-80 group-hover:scale-110 transition-transform">
                  <Image
                    src="/brand/dimsglow-logo.jpg"
                    alt={col.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold font-serif-brand tracking-tight group-hover:text-[#D4AF37] transition-colors">
                  {col.title}
                </h3>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-[#6D6670] leading-relaxed line-clamp-2">
                  {col.description}
                </p>
                <div className="flex items-center text-xs font-bold text-[#B83B63] group-hover:text-[#982D50] pt-2 border-t border-[#F7F5F7]">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </StorefrontShell>
  );
}
