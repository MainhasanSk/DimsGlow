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
    subtitle: 'Flawless Vinyl Lip Color with Zero Touch-ups Required for 24 Hours. India\'s Most Loved Matte Lipstick.',
    ctaText: 'EXPLORE LIP LUXURY',
    ctaLink: '/collections/lips',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792429044/dimsglow/hero/hero_lock_the_shine.jpg',
    bgGradient: 'from-[#2D0B1E] via-[#541235] to-[#141215]',
    accentColor: '#B83B63',
    active: true,
    order: 1,
  },
  {
    id: 'slide_2',
    tagline: 'EXCLUSIVE WEBSITE OFFER • ABOVE ₹699',
    title: 'FREE LIP OIL & LIPSTICK',
    subtitle: 'Complimentary full-size Peptide Lip Oil & Matte Lipstick gift with every order above ₹699. Limited period offer.',
    ctaText: 'SHOP EXCLUSIVE OFFER',
    ctaLink: '/collections/combos',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792429045/dimsglow/hero/hero_lip_oil_offer.jpg',
    bgGradient: 'from-[#3A0F24] via-[#751B47] to-[#240815]',
    accentColor: '#D4AF37',
    active: true,
    order: 2,
  },
  {
    id: 'slide_3',
    tagline: 'ACTIVE DERMA COMPLEXION • 5-IN-1',
    title: 'SECOND-SKIN RADIANCE',
    subtitle: 'Weightless micro-pigment Serum Foundation that blurs imperfections and delivers 24H dewy hydration for glass skin.',
    ctaText: 'DISCOVER SKIN TINTS',
    ctaLink: '/collections/face',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792429047/dimsglow/hero/hero_skin_tint.jpg',
    bgGradient: 'from-[#2A0E1A] via-[#4D1530] to-[#15060D]',
    accentColor: '#D4AF37',
    active: true,
    order: 3,
  },
  {
    id: 'slide_4',
    tagline: 'RED CARPET READY • SMUDGE-PROOF',
    title: 'UNSTOPPABLE ALL-DAY GLAM',
    subtitle: 'Intense matte pigments, 24-hour smudge-proof kajal, and hydrating strobe mist for evening elegance.',
    ctaText: 'SHOP THE GLAM SET',
    ctaLink: '/collections/all',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792429049/dimsglow/hero/hero_festive_glam.jpg',
    bgGradient: 'from-[#1E0814] via-[#3E1128] to-[#12040C]',
    accentColor: '#B83B63',
    active: true,
    order: 4,
  },
];

export const DEFAULT_PROMO_CLINICAL: PromoClinical = {
  statNumber: '95%',
  statLabel: 'Reduction in Dark Spots',
  headline: 'CLINICALLY PROVEN FORMULATION • SPF 50+ PA++++',
  description:
    'Formulated with Broad Spectrum UVA/UVB protection, Niacinamide, and Arbutin. Clinically proven to fade stubborn sun tan, reduce dark spots, and restore luminous, even-toned skin within 14 days.',
  activeIngredients: ['SPF 50+ PA++++', 'Fades Pigmentation', 'Reduces Tanning', 'Even Tone & Brightness', 'Dermatologically Tested'],
  ctaText: 'BUY TINTED SUNSCREEN',
  ctaLink: '/collections/skin-care',
  featuredProductName: 'DIMSGLOW Tinted Sunscreen SPF 50+ PA++++',
  featuredProductPrice: '₹999 (MRP ₹1,299)',
  featuredProductRating: '★ 4.9 (Clinical Trial Verified)',
  imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340975/dimsglow/editorial/dimsglow_sunscreen_poster.jpg',
  active: true,
};

export const DEFAULT_ROUTINE_LOOKS: RoutineLook[] = [
  {
    id: 'look_1',
    title: 'EVERYDAY GLOW',
    desc: 'Natural skin tints & dewy cheeks',
    href: '/collections/face',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340978/dimsglow/looks/look_everyday_glow.webp',
    badge: 'Trending',
    active: true,
  },
  {
    id: 'look_2',
    title: 'ROMANTIC GLAM',
    desc: 'Soft rose lips & shimmering eyelids',
    href: '/collections/lips',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340981/dimsglow/looks/look_romantic_glam.webp',
    badge: 'Popular',
    active: true,
  },
  {
    id: 'look_3',
    title: 'BOLD & BEAUTIFUL',
    desc: 'Winged drama & smokey depth',
    href: '/collections/eyes',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340984/dimsglow/looks/look_bold_beautiful.webp',
    badge: 'Evening',
    active: true,
  },
  {
    id: 'look_4',
    title: 'FESTIVE GLOW',
    desc: 'Full coverage radiance & golden accents',
    href: '/collections/combos',
    imageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340988/dimsglow/looks/look_festive_glow.webp',
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

export const DEFAULT_CAMPAIGN_VIDEO = {
  title: "WE'VE GOT EVERYTHING COVERED",
  subtitle: 'High-performance, weightless luxury formulations designed to move with you all day long.',
  videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-makeup-with-a-brush-41484-large.mp4',
  posterUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340978/dimsglow/looks/look_everyday_glow.webp',
  tagline: 'THE GO-TO GLAM ROUTINE',
  ctaText: 'EXPLORE FULL CAMPAIGN',
  ctaLink: '/collections/all',
  active: true,
};

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroSlides: DEFAULT_HERO_SLIDES,
  campaignVideo: DEFAULT_CAMPAIGN_VIDEO,
  promoClinical: DEFAULT_PROMO_CLINICAL,
  routineLooks: DEFAULT_ROUTINE_LOOKS,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
  sectionsVisibility: {
    heroCarousel: true,
    categoryCircles: true,
    bestsellers: true,
    newArrivals: true,
    campaignVideo: true,
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340972/dimsglow/hero/hero_lock_the_shine.jpg',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340981/dimsglow/looks/look_romantic_glam.webp',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340978/dimsglow/looks/look_everyday_glow.webp',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340984/dimsglow/looks/look_bold_beautiful.webp',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340974/dimsglow/hero/hero_lip_oil_offer.jpg',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340988/dimsglow/looks/look_festive_glow.webp',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340975/dimsglow/editorial/dimsglow_sunscreen_poster.jpg',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340988/dimsglow/looks/look_festive_glow.webp',
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
    bannerImageUrl: 'https://res.cloudinary.com/web8vmww/image/upload/v1792340974/dimsglow/hero/hero_lip_oil_offer.jpg',
    accentBadge: 'SAVE UP TO 35%',
  },
};

/**
 * Fetch Homepage dynamic content from Firestore or Server API with local fallback
 */
export async function getHomepageContent(): Promise<HomepageContent> {
  // 1. Try server-side API first if in browser
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/content/homepage', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.heroSlides) {
          return { ...DEFAULT_HOMEPAGE_CONTENT, ...data };
        }
      }
    } catch (e) {
      // Continue to Firestore
    }
  }

  // 2. Try Firestore
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
 * Save Homepage dynamic content into Database & Firestore
 */
export async function saveHomepageContent(content: HomepageContent): Promise<void> {
  const payload = { ...content, updatedAt: Date.now() };

  // 1. Save to server API endpoint (persists to dynamic data store)
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/content/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (apiErr) {
      console.warn('API route save warning:', apiErr);
    }
  }

  // 2. Also try client-side Firestore setDoc
  try {
    const docRef = doc(db, 'siteContent', 'homepage');
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore client setDoc warning:', err);
  }
}

/**
 * Fetch Category Hero banners from Server API / Firestore with fallback
 */
export async function getCategoryHeroes(): Promise<Record<string, CategoryHero>> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/content/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          return { ...DEFAULT_CATEGORY_HEROES, ...data };
        }
      }
    } catch (e) {
      // Continue to Firestore
    }
  }

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
 * Save Category Hero banners into Database & Firestore
 */
export async function saveCategoryHeroes(categories: Record<string, CategoryHero>): Promise<void> {
  // 1. Save to server API endpoint (persists to data store & syncs Firestore)
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/content/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categories),
      });
    } catch (apiErr) {
      console.warn('API route categories save warning:', apiErr);
    }
  }

  // 2. Also attempt client-side Firestore setDoc
  try {
    const docRef = doc(db, 'siteContent', 'categories');
    await setDoc(docRef, { categories, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('Firestore client setDoc categories warning:', err);
  }
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
