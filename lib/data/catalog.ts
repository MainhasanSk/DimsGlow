import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/schemas/product';

export interface CategoryInfo {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerBg: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  face: {
    id: 'face',
    slug: 'face',
    title: 'Face',
    description: 'Foundations, concealers, compact powders, primers and strobing creams for seamless complexion wear.',
    bannerTitle: 'Explore CLASSIC FACE ESSENTIALS',
    bannerSubtitle: 'That always deliver flawless coverage and second-skin natural glow',
    bannerBg: 'from-[#3B1F2B] via-[#632742] to-[#200B15]',
  },
  eyes: {
    id: 'eyes',
    slug: 'eyes',
    title: 'Eyes',
    description: '24-hour smudge-proof kajal, high-volume mascaras, and intense pigmentation eyeshadow palettes.',
    bannerTitle: 'EXPLORE LASTING EYE MAKEUP',
    bannerSubtitle: 'Essentials for your next restock run and all-day smudge resistance',
    bannerBg: 'from-[#1E293B] via-[#334155] to-[#0F172A]',
  },
  lips: {
    id: 'lips',
    slug: 'lips',
    title: 'Lips',
    description: 'Transfer-proof matte lipsticks, peptide lip oils, vinyl glosses, and creamy hydrating crayons.',
    bannerTitle: 'LONG LASTING LIP',
    bannerSubtitle: "Must-try's for your everyday glam and non-drying all-day wear",
    bannerBg: 'from-[#4C0519] via-[#881337] to-[#2E020E]',
  },
  nails: {
    id: 'nails',
    slug: 'nails',
    title: 'Nails',
    description: 'Toxic-free high-shine lacquers, fast-dry pastel enamels, and acetone-free remover wipes.',
    bannerTitle: 'BOLD NAILS, BIG ENERGY',
    bannerSubtitle: 'Grab your favourite safe, chip-resistant nail colors now',
    bannerBg: 'from-[#701A75] via-[#A21CAF] to-[#4A044E]',
  },
  'skin-care': {
    id: 'skin-care',
    slug: 'skin-care',
    title: 'Skin Care',
    description: 'Dermatologist-formulated active serums, clarifying toners, and Korean rice water mask sheets.',
    bannerTitle: 'Effective Skincare Essentials',
    bannerSubtitle: 'Powered by active Niacinamide, Rice Water & Hyaluronic Acid for better you',
    bannerBg: 'from-[#064E3B] via-[#047857] to-[#022C22]',
  },
  perfumes: {
    id: 'perfumes',
    slug: 'perfumes',
    title: 'Perfumes',
    description: 'Luxurious Eau De Parfum editions and curated fragrance combos lasting up to 18 hours.',
    bannerTitle: 'Everyday Fragrances',
    bannerSubtitle: 'That stay all day long with captivating floral, amber, and woody notes',
    bannerBg: 'from-[#3B0764] via-[#6B21A8] to-[#1E0338]',
  },
  combos: {
    id: 'combos',
    slug: 'combos',
    title: 'Bundles & Combos',
    description: 'Perfect value bundles, 3-at-₹699 sets, and curated gift boxes for complete glam routines.',
    bannerTitle: 'Your everyday ESSENTIALS',
    bannerSubtitle: 'Perfectlys BUNDLED for maximum savings and complete routine harmony',
    bannerBg: 'from-[#831843] via-[#BE185D] to-[#500724]',
  },
  professional: {
    id: 'professional',
    slug: 'professional',
    title: 'Professional Studio',
    description: 'High-pigment professional makeup artist grade primers, foundations, fixers, and palettes designed for HD studio wear.',
    bannerTitle: 'PROFESSIONAL HD ESSENTIALS',
    bannerSubtitle: 'Studio-grade high definition coverage, setting sprays, and pigments for runway elegance',
    bannerBg: 'from-[#1A1815] via-[#382F24] to-[#120F0A]',
  },
  offers: {
    id: 'offers',
    slug: 'offers',
    title: 'Special Offers & Deals',
    description: 'Exclusive bundle discounts, Buy 3 at ₹699, free gifts on orders above ₹699, and limited-edition flash offers.',
    bannerTitle: 'EXCLUSIVE DEALS & SPECIAL OFFERS',
    bannerSubtitle: 'Save big with complimentary luxury gifts, combo markdowns, and direct-to-consumer savings',
    bannerBg: 'from-[#831843] via-[#BE185D] to-[#4C0519]',
  },
  'new-arrivals': {
    id: 'new-arrivals',
    slug: 'new-arrivals',
    title: 'New Arrivals',
    description: 'Discover the latest formulations, trending lip oils, and viral highlighters freshly added to the DIMSGLOW collection.',
    bannerTitle: 'JUST DROPPED: NEW ARRIVALS',
    bannerSubtitle: 'Be the first to wear the latest trendsetting formulas and seasonal releases',
    bannerBg: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
  },
};

// Curated reference products adhering to all schema rules
export const CATALOG_PRODUCTS: Product[] = [
  {
    "id": "prod_tinted_sunscreen_spf50",
    "slug": "tinted-sunscreen-spf50",
    "name": "DIMSGLOW Tinted Sunscreen SPF 50+ PA++++",
    "tagline": "Fade Dark Spots. Reveal Your Glow. Broad Spectrum UVA/UVB Protection",
    "description": "Your daily glow essential! Advanced broad-spectrum UV protection meets clinical skin tone correction. Formulated with SPF 50+ PA++++, it reduces tanning, fades dark spots and stubborn pigmentation, and defends against harmful blue light. Provides a weightless, hydrating finish with an invisible natural tint that blends seamlessly across all Indian skin tones. Dermatologically tested for all skin types.",
    "categoryIds": [
      "skin-care",
      "face",
      "offers",
      "all"
    ],
    "status": "published",
    "pricePaise": 99900,
    "compareAtPricePaise": 129900,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/sunscreen_bottle_offer",
        "secureUrl": "/product/sunscreen-bottle-offer.jpg",
        "altText": "DIMSGLOW Tinted Sunscreen SPF 50+ Bottle Offer",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/sunscreen_magazine_model",
        "secureUrl": "/product/sunscreen-magazine-model.jpg",
        "altText": "DIMSGLOW Sunscreen Featured on Beauty Today Magazine",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/sunscreen_before_after",
        "secureUrl": "/product/sunscreen-before-after.jpg",
        "altText": "DIMSGLOW Sunscreen Before and After Results",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/sunscreen_split_glow",
        "secureUrl": "/product/sunscreen-split-glow.jpg",
        "altText": "DIMSGLOW Sunscreen Fades Tan and Pigmentation",
        "isPrimary": false
      }
    ],
    "benefitPill": "Fades Tan & Pigmentation • SPF 50+",
    "unlockFreeGift": true,
    "ratingSummary": {
      "average": 4.9,
      "reviewCount": 1420
    },
    "trustBadges": [
      "SPF 50+ PA++++",
      "Fades Darkspots & Pigmentation",
      "Dermatologically Tested",
      "Blue Light Defense",
      "Hydrating Finish"
    ],
    "variants": [
      {
        "id": "var_sunscreen_50ml",
        "sku": "DIMS-SUN-50",
        "title": "Single Bottle (50 ml)",
        "options": [
          {
            "name": "Pack Size",
            "value": "50 ml | 1.69 FL. OZ.",
            "swatchColor": "#E89CAE"
          }
        ],
        "pricePaise": 99900,
        "compareAtPricePaise": 129900,
        "onHand": 350,
        "reserved": 12,
        "lowStockThreshold": 10,
        "active": true
      }
    ],
    "featured": true,
    "bestseller": true,
    "createdAt": 1729000000000,
    "updatedAt": 1729800000000
  }
];

/**
 * Retrieves products filtered by category slug.
 */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    if (typeof window !== 'undefined') {
      const { getProductsByCategorySync } = await import('@/lib/catalog/productStore');
      return getProductsByCategorySync(categorySlug);
    }
    if (categorySlug === 'all') return CATALOG_PRODUCTS;
    return CATALOG_PRODUCTS.filter((p) => p.categoryIds.includes(categorySlug));
  } catch (error) {
    if (categorySlug === 'all') return CATALOG_PRODUCTS;
    return CATALOG_PRODUCTS.filter((p) => p.categoryIds.includes(categorySlug));
  }
}

/**
 * Retrieves single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    if (typeof window !== 'undefined') {
      const { getProductBySlugSync } = await import('@/lib/catalog/productStore');
      const found = getProductBySlugSync(slug);
      if (found) return found;
    }
    const product = CATALOG_PRODUCTS.find((p) => p.slug === slug);
    return product || null;
  } catch (error) {
    const product = CATALOG_PRODUCTS.find((p) => p.slug === slug);
    return product || null;
  }
}
