import { Suspense } from 'react';
import { CollectionClient } from './CollectionClient';
import { CATEGORIES } from '@/lib/data/catalog';

export function generateStaticParams() {
  return [
    { slug: 'all' },
    { slug: 'bestsellers' },
    { slug: 'bestseller' },
    { slug: 'new-arrivals' },
    { slug: 'offers' },
    { slug: 'professional' },
    ...Object.keys(CATEGORIES).map((key) => ({ slug: key })),
  ];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#541235] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CollectionClient slug={slug} />
    </Suspense>
  );
}
