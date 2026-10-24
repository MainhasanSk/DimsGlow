'use client';

import React from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { BrandCategoryTabs } from './BrandCategoryTabs';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { WhatsAppButton } from './WhatsAppButton';

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <BrandCategoryTabs />
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <WhatsAppButton />
    </div>
  );
}
