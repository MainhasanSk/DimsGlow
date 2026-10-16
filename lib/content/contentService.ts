import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type {
  HomepageContent,
  CategoryHero,
  HeroSlide,
  PromoClinical,
  RoutineLook,
  Testimonial,
  FaqItem,
} from '@/lib/schemas/content';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_1',
    tagline: 'NEW LAUNCH • TRANSFER-PROOF COLLECTION',
    title: 'LOCK THE SHINE',
    subtitle: 'Flawless Vinyl Lip Color with Zero Touch-ups Required for 24 Hours',
    ctaText: 'EXPLORE LIP LUXURY',
    ctaLink: '/collections/lips',
    imageUrl: '/brand/dimsglow-logo.jpg',
    bgGradient: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
    accentColor: '#B83B63',
    active: true,
    order: 1,
  },
  {
    id: 'slide_2',
    tagline: 'HIGH-PERFORMING SKINCARE ESSENTIAL',
    title: 'SUPER LOCK SETTING MIST',
    subtitle: 'Infused with Witch Hazel & Aloe Vera for 24-Hour Flawless Freshness',
    ctaText: 'SHOP SETTING SPRAY',
    ctaLink: '/products/super-lock-makeup-setting-spray',
    imageUrl: '/brand/dimsglow-logo.jpg',
    bgGradient: 'from-[#0C2D3E] via-[#104D6B] to-[#0A1A24]',
    accentColor: '#18794E',
    active: true,
    order: 2,
  },
  {
    id: 'slide_3',
    tagline: 'EXCLUSIVE WEBSITE OFFER',
    title: 'FREE LIP OIL & LIPSTICK',
    subtitle: 'Complimentary full-size beauty gift on all orders above ₹699',
    ctaText: 'UNLOCK FREE GIFT',
    ctaLink: '/collections/combos',
    imageUrl: '/brand/dimsglow-logo.jpg',
    bgGradient: 'from-[#3A1C0E] via-[#6B3210] to-[#1A0B05]',
    accentColor: '#D4AF37',
    active: true,
    order: 3,
  },
  {
    id: 'slide_4',
    tagline: 'INSTANT GLASS SKIN RADIANCE',
    title: 'STROBE & GLOW ILLUMINATOR',
    subtitle: 'Ultra-refined pearl micro-pigments with Hyaluronic Acid for a lit-from-within glow',
    ctaText: 'EXPLORE STROBE CREAM',
    ctaLink: '/products/instant-glass-skin-strobe-cream',
    imageUrl: '/brand/dimsglow-logo.jpg',
    bgGradient: 'from-[#331422] via-[#5C233E] to-[#1C0913]',
    accentColor: '#E8B4B8',
    active: true,
    order: 4,
  },
];

export const DEFAULT_PROMO_CLINICAL: PromoClinical = {
  statNumber: '95%',
  statLabel: 'Reduction in Dark Spots',
  headline: 'CLINICALLY PROVEN FORMULATION',
  description:
    'Reduces blemishes, provides radiant glow, improves skin elasticity, and refines hyperpigmentation with active Niacinamide, Arbutin, and 2.5% Glutathione.',
  activeIngredients: ['Arbutin', '2.5% Glutathione', 'Vitamin C', 'Amino Acid'],
  ctaText: 'SHOP RADIANCE SERUM',
  ctaLink: '/collections/skin-care',
  featuredProductName: 'Youthful Glow Face Serum',
  featuredProductPrice: '₹299.00',
  featuredProductRating: '★ 4.9 (14 Reviews)',
  imageUrl: '/brand/dimsglow-logo.jpg',
  active: true,
};

export const DEFAULT_ROUTINE_LOOKS: RoutineLook[] = [
  {
    id: 'look_1',
    title: 'EVERYDAY GLOW',
    desc: 'Natural skin tints & dewy cheeks',
    href: '/collections/face',
    imageUrl: '/brand/dimsglow-logo.jpg',
    badge: 'Trending',
    active: true,
  },
  {
    id: 'look_2',
    title: 'ROMANTIC GLAM',
    desc: 'Soft rose lips & shimmering eyelids',
    href: '/collections/lips',
    imageUrl: '/brand/dimsglow-logo.jpg',
    badge: 'Popular',
    active: true,
  },
  {
    id: 'look_3',
    title: 'BOLD & BEAUTIFUL',
    desc: 'Winged drama & smokey depth',
    href: '/collections/eyes',
    imageUrl: '/brand/dimsglow-logo.jpg',
    badge: 'Evening',
    active: true,
  },
  {
    id: 'look_4',
    title: 'FESTIVE GLOW',
    desc: 'Full coverage radiance & golden accents',
    href: '/collections/combos',
    imageUrl: '/brand/dimsglow-logo.jpg',
    badge: 'Celebration',
    active: true,
  },
];

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test_1',
    author: 'Mrugaya Thakur',
    rating: 5,
    review:
      'I just tried the trending Skin Tint and I am honestly loving it! The shade match is spot-on and it gives a smooth, radiant glow all day long without any creasing.',
    productName: 'Skin Tint 5 In 1',
    productLink: '/products/skin-tint-5-in-1',
    active: true,
  },
  {
    id: 'test_2',
    author: 'Anjali Jaiswal',
    rating: 5,
    review:
      'I absolutely love the 24 Hrs Non Transfer Matte Lipstick. It does not smudge even after meals, and it does not dry out my lips at all. Will definitely restock!',
    productName: '24 Hrs Matte Lipstick',
    productLink: '/products/24hrs-non-transfer-matte-lipstick',
    active: true,
  },
  {
    id: 'test_3',
    author: 'Roselin Poojary',
    rating: 5,
    review:
      'The Strobe Cream gives that coveted Korean glass skin effect! Lightweight, second-skin feel, and blends like butter over my daily moisturizer.',
    productName: 'Glass Skin Strobe Cream',
    productLink: '/products/instant-glass-skin-strobe-cream',
    active: true,
  },
  {
    id: 'test_4',
    author: 'Anjana Jaiswar',
    rating: 5,
    review:
      'The Super Lock Setting Spray kept my wedding makeup flawless through 12 hours of dancing and heat. 10/10 recommend to every makeup lover.',
    productName: 'Super Lock Setting Spray',
    productLink: '/products/super-lock-makeup-setting-spray',
    active: true,
  },
];

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq_1',
    question: 'Are DIMSGLOW cosmetic and skincare products safe and toxic-free?',
    answer:
      'Yes, 100%. All DIMSGLOW formulas are dermatologically tested, paraben-free, 100% vegan, cruelty-free, and certified safe by Bureau Veritas standards.',
    category: 'Formulation',
    order: 1,
  },
  {
    id: 'faq_2',
    question: 'How do I unlock the complimentary Free Gift on my order?',
    answer:
      'Any shopping bag containing eligible items or reaching ₹699 automatically qualifies for a complimentary full-size Free Gift (such as our Peptide Lip Oil or Mini Lipstick) added at checkout.',
    category: 'Offers',
    order: 2,
  },
  {
    id: 'faq_3',
    question: 'What are the delivery timelines and shipping charges across India?',
    answer:
      'We provide fast express shipping nationwide. Standard delivery takes 3-5 business days. Prepaid orders above ₹499 enjoy Free Express Delivery. Cash on Delivery is available across serviceable pin codes.',
    category: 'Shipping',
    order: 3,
  },
  {
    id: 'faq_4',
    question: 'Can I exchange or return a shade if it does not match?',
    answer:
      'Yes, we offer a 7-day hassle-free replacement policy for unopened cosmetic products and damaged shipments. Reach our concierge support team via WhatsApp or email.',
    category: 'Returns',
    order: 4,
  },
];

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroSlides: DEFAULT_HERO_SLIDES,
  promoClinical: DEFAULT_PROMO_CLINICAL,
  routineLooks: DEFAULT_ROUTINE_LOOKS,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
  sectionsVisibility: {
    heroCarousel: true,
    categoryCircles: true,
    bestsellers: true,
    promoClinical: true,
    routineLooks: true,
    combosBox: true,
    beforeAfter: true,
    ourPromise: true,
    testimonials: true,
    faqs: true,
    trustMarquee: true,
  },
  updatedAt: Date.now(),
  updatedBy: 'system_default',
};

export const DEFAULT_CATEGORY_HEROES: Record<string, CategoryHero> = {
  all: {
    id: 'all',
    slug: 'all',
    title: 'All Products',
    tagline: 'COMPLETE LUXURY CATALOG',
    description: 'Explore our complete luxury cosmetic, skincare, and fragrance collections.',
    bannerTitle: 'Explore Complete DIMSGLOW Collection',
    bannerSubtitle: 'High-performance, toxic-free formulations designed for everyday luxury',
    bannerBg: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'ALL CREATIONS',
  },
  bestsellers: {
    id: 'bestsellers',
    slug: 'bestsellers',
    title: 'Best Sellers',
    tagline: 'CUSTOMER LOVED FORMULATIONS',
    description: 'The top-rated, viral beauty formulas adored by thousands of customers.',
    bannerTitle: 'DIMSGLOW BEST SELLERS',
    bannerSubtitle: 'Our most awarded, viral formulas for effortless daily radiance',
    bannerBg: 'from-[#4A0E17] via-[#8B1E3F] to-[#24050D]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'TOP RATED',
  },
  face: {
    id: 'face',
    slug: 'face',
    title: 'Face',
    tagline: 'COMPLEXION PERFECTION',
    description:
      'Foundations, concealers, compact powders, primers and strobing creams for seamless complexion wear.',
    bannerTitle: 'Explore CLASSIC FACE ESSENTIALS',
    bannerSubtitle: 'That always deliver flawless coverage and second-skin natural glow',
    bannerBg: 'from-[#3B1F2B] via-[#632742] to-[#200B15]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'FLAWLESS BASE',
  },
  eyes: {
    id: 'eyes',
    slug: 'eyes',
    title: 'Eyes',
    tagline: 'INTENSE DEFINITION',
    description:
      '24-hour smudge-proof kajal, high-volume mascaras, and intense pigmentation eyeshadow palettes.',
    bannerTitle: 'EXPLORE LASTING EYE MAKEUP',
    bannerSubtitle: 'Essentials for your next restock run and all-day smudge resistance',
    bannerBg: 'from-[#1E293B] via-[#334155] to-[#0F172A]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'SMUDGE PROOF',
  },
  lips: {
    id: 'lips',
    slug: 'lips',
    title: 'Lips',
    tagline: '24HR TRANSFER-PROOF',
    description:
      'Transfer-proof matte lipsticks, peptide lip oils, vinyl glosses, and creamy hydrating crayons.',
    bannerTitle: 'LONG LASTING LIP LUXURY',
    bannerSubtitle: "Must-try formulas for your everyday glam and non-drying all-day wear",
    bannerBg: 'from-[#4C0519] via-[#881337] to-[#2E020E]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'HIGH PIGMENT',
  },
  nails: {
    id: 'nails',
    slug: 'nails',
    title: 'Nails',
    tagline: 'CHIP-RESISTANT GLOSS',
    description:
      'Toxic-free high-shine lacquers, fast-dry pastel enamels, and acetone-free remover wipes.',
    bannerTitle: 'BOLD NAILS, BIG ENERGY',
    bannerSubtitle: 'Grab your favourite safe, chip-resistant nail colors now',
    bannerBg: 'from-[#701A75] via-[#A21CAF] to-[#4A044E]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'TOXIC FREE',
  },
  'skin-care': {
    id: 'skin-care',
    slug: 'skin-care',
    title: 'Skin Care',
    tagline: 'ACTIVE DERMA RADIANCE',
    description:
      'Dermatologist-formulated active serums, clarifying toners, and Korean rice water mask sheets.',
    bannerTitle: 'Effective Skincare Essentials',
    bannerSubtitle:
      'Powered by active Niacinamide, Rice Water & Hyaluronic Acid for a better you',
    bannerBg: 'from-[#064E3B] via-[#047857] to-[#022C22]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'CLINICAL GRADE',
  },
  perfumes: {
    id: 'perfumes',
    slug: 'perfumes',
    title: 'Perfumes',
    tagline: 'EAU DE PARFUM LUXE',
    description:
      'Luxurious Eau De Parfum editions and curated fragrance combos lasting up to 18 hours.',
    bannerTitle: 'Everyday Fragrances',
    bannerSubtitle: 'That stay all day long with captivating floral, amber, and woody notes',
    bannerBg: 'from-[#3B0764] via-[#6B21A8] to-[#1E0338]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: '18HR LASTING',
  },
  combos: {
    id: 'combos',
    slug: 'combos',
    title: 'Bundles & Combos',
    tagline: 'MAXIMUM VALUE VALUE SETS',
    description:
      'Perfect value bundles, 3-at-₹699 sets, and curated gift boxes for complete glam routines.',
    bannerTitle: 'Your Everyday ESSENTIALS',
    bannerSubtitle: 'Perfectlys BUNDLED for maximum savings and complete routine harmony',
    bannerBg: 'from-[#831843] via-[#BE185D] to-[#500724]',
    bannerImageUrl: '/brand/dimsglow-logo.jpg',
    accentBadge: 'SAVE UP TO 35%',
  },
};

/**
 * Fetch Homepage dynamic content from Firestore with local fallback
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const docRef = doc(db, 'siteContent', 'homepage');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_HOMEPAGE_CONTENT, ...snap.data() } as HomepageContent;
    }
  } catch (err) {
    console.warn('Failed to load homepage from Firestore, using defaults:', err);
  }
  return DEFAULT_HOMEPAGE_CONTENT;
}

/**
 * Save Homepage dynamic content into Firestore
 */
export async function saveHomepageContent(content: HomepageContent): Promise<void> {
  const docRef = doc(db, 'siteContent', 'homepage');
  await setDoc(docRef, { ...content, updatedAt: Date.now() }, { merge: true });
}

/**
 * Fetch Category Hero banners from Firestore with fallback
 */
export async function getCategoryHeroes(): Promise<Record<string, CategoryHero>> {
  try {
    const docRef = doc(db, 'siteContent', 'categories');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return { ...DEFAULT_CATEGORY_HEROES, ...(data.categories || {}) };
    }
  } catch (err) {
    console.warn('Failed to load categories from Firestore, using defaults:', err);
  }
  return DEFAULT_CATEGORY_HEROES;
}

/**
 * Save Category Hero banners into Firestore
 */
export async function saveCategoryHeroes(categories: Record<string, CategoryHero>): Promise<void> {
  const docRef = doc(db, 'siteContent', 'categories');
  await setDoc(docRef, { categories, updatedAt: Date.now() }, { merge: true });
}

/**
 * Seed all default content into Firestore
 */
export async function seedAllContentToFirestore(): Promise<{ success: boolean; message: string }> {
  try {
    await saveHomepageContent(DEFAULT_HOMEPAGE_CONTENT);
    await saveCategoryHeroes(DEFAULT_CATEGORY_HEROES);
    return { success: true, message: 'All luxury content, hero slides & category banners seeded to Firestore!' };
  } catch (err: any) {
    console.error('Failed to seed content to Firestore:', err);
    return { success: false, message: err.message || 'Seeding failed' };
  }
}
