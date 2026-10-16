import { Suspense } from 'react';
import { ProductDetailClient } from './ProductDetailClient';
import { CATALOG_PRODUCTS } from '@/lib/data/catalog';

export function generateStaticParams() {
  return CATALOG_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#541235] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductDetailClient slug={slug} />
    </Suspense>
  );
}
