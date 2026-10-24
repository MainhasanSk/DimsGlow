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
  // Hidden while single product is featured; easily re-enabled when multi-product collections expand
  return null;
}

