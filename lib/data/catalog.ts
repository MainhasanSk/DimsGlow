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
    "id": "prod_skin_tint",
    "slug": "skin-tint-5-in-1",
    "name": "Skin Tint 5 In 1 Multifunctional Serum Foundation",
    "tagline": "Lightweight formula with Niacinamide & Rice Water for a natural, hydrated glow",
    "description": "A revolutionary 5-in-1 powerhouse effortlessly blending primer, foundation, sunscreen, and moisturizer in one step. Enriched with Niacinamide and rice water for breathable, buildable coverage with SPF 20 PA++++ protection.",
    "categoryIds": [
      "face",
      "professional",
      "offers",
      "all"
    ],
    "status": "published",
    "pricePaise": 31900,
    "compareAtPricePaise": 39900,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/featured_skin_tint",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614527/dimsglow/products/featured_skin_tint.jpg",
        "altText": "DIMSGLOW Skin Tint 5 In 1 Serum Foundation",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/category_face_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614529/dimsglow/products/category_face_luxury.webp",
        "altText": "Natural Dewy Skin Coverage & Formula Finish",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/category_skincare_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614530/dimsglow/products/category_skincare_luxury.webp",
        "altText": "Active Niacinamide & Rice Water Infusion",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/category_combos_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614531/dimsglow/products/category_combos_luxury.webp",
        "altText": "Studio Swatch Shades & Texture",
        "isPrimary": false
      }
    ],
    "benefitPill": "Natural Glow, Dewy Finish",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 5,
      "reviewCount": 17
    },
    "trustBadges": [
      "Toxic Free",
      "Dermatologically Tested",
      "Vegan",
      "SPF 20 PA++++"
    ],
    "variants": [
      {
        "id": "var_whipped_cream",
        "sku": "DIMS-ST-01",
        "title": "Whipped Cream",
        "options": [
          {
            "name": "Shade",
            "value": "Whipped Cream",
            "swatchColor": "#F3E5DC"
          }
        ],
        "pricePaise": 31900,
        "onHand": 45,
        "reserved": 2,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_creamy_vanilla",
        "sku": "DIMS-ST-02",
        "title": "Creamy Vanilla",
        "options": [
          {
            "name": "Shade",
            "value": "Creamy Vanilla",
            "swatchColor": "#EED9C4"
          }
        ],
        "pricePaise": 31900,
        "onHand": 60,
        "reserved": 5,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_golden_honey",
        "sku": "DIMS-ST-03",
        "title": "Golden Honey",
        "options": [
          {
            "name": "Shade",
            "value": "Golden Honey",
            "swatchColor": "#D8B38E"
          }
        ],
        "pricePaise": 31900,
        "onHand": 40,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_warm_caramel",
        "sku": "DIMS-ST-04",
        "title": "Warm Caramel",
        "options": [
          {
            "name": "Shade",
            "value": "Warm Caramel",
            "swatchColor": "#C49666"
          }
        ],
        "pricePaise": 31900,
        "onHand": 25,
        "reserved": 1,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_deep_toffee",
        "sku": "DIMS-ST-05",
        "title": "Deep Toffee",
        "options": [
          {
            "name": "Shade",
            "value": "Deep Toffee",
            "swatchColor": "#A27046"
          }
        ],
        "pricePaise": 31900,
        "onHand": 20,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_rich_cocoa",
        "sku": "DIMS-ST-06",
        "title": "Rich Cocoa",
        "options": [
          {
            "name": "Shade",
            "value": "Rich Cocoa",
            "swatchColor": "#754B2F"
          }
        ],
        "pricePaise": 31900,
        "onHand": 15,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      }
    ],
    "featured": true,
    "bestseller": true,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522918
  },
  {
    "id": "prod_matte_lipstick",
    "slug": "24hrs-non-transfer-matte-lipstick",
    "name": "24 Hrs Non Transfer Matte Lipstick",
    "tagline": "Waterproof, smudge-proof formulation with rich matte payoff that lasts through the day",
    "description": "Ultra-pigmented velvet matte liquid lipstick that glides effortlessly and sets in 60 seconds without cracking or drying your lips. 100% transfer-proof formulation infused with Vitamin E.",
    "categoryIds": [
      "lips",
      "bestsellers",
      "all"
    ],
    "status": "published",
    "pricePaise": 31000,
    "compareAtPricePaise": 39000,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/category_lips_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614540/dimsglow/products/category_lips_luxury.webp",
        "altText": "DIMSGLOW 24 Hrs Matte Lipstick",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/category_face_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614529/dimsglow/products/category_face_luxury.webp",
        "altText": "Matte Finish Texture & Application",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/category_combos_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614531/dimsglow/products/category_combos_luxury.webp",
        "altText": "Curated Matte Lip Palette Swatches",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/featured_skin_tint",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614527/dimsglow/products/featured_skin_tint.jpg",
        "altText": "Transfer-proof Packaging & Bullet",
        "isPrimary": false
      }
    ],
    "benefitPill": "Transfer & Smudge Proof",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.8,
      "reviewCount": 42
    },
    "trustBadges": [
      "Toxic Free",
      "Dermatologically Tested",
      "Vegan"
    ],
    "variants": [
      {
        "id": "var_red_royale",
        "sku": "DIMS-LP-01",
        "title": "Red Royale",
        "options": [
          {
            "name": "Shade",
            "value": "Red Royale",
            "swatchColor": "#9E1B32"
          }
        ],
        "pricePaise": 31000,
        "onHand": 50,
        "reserved": 3,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_berry_bloom",
        "sku": "DIMS-LP-02",
        "title": "Berry Bloom",
        "options": [
          {
            "name": "Shade",
            "value": "Berry Bloom",
            "swatchColor": "#7A1C43"
          }
        ],
        "pricePaise": 31000,
        "onHand": 45,
        "reserved": 1,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_nude_crush",
        "sku": "DIMS-LP-03",
        "title": "Nude Crush",
        "options": [
          {
            "name": "Shade",
            "value": "Nude Crush",
            "swatchColor": "#B36D67"
          }
        ],
        "pricePaise": 31000,
        "onHand": 30,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_rose_wine",
        "sku": "DIMS-LP-04",
        "title": "Rose Wine",
        "options": [
          {
            "name": "Shade",
            "value": "Rose Wine",
            "swatchColor": "#8C3D52"
          }
        ],
        "pricePaise": 31000,
        "onHand": 35,
        "reserved": 2,
        "lowStockThreshold": 5,
        "active": true
      }
    ],
    "featured": true,
    "bestseller": true,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522918
  },
  {
    "id": "prod_strobe_cream",
    "slug": "creamy-to-matte-stick-foundation",
    "name": "Creamy-to-Matte Stick Foundation",
    "tagline": "Multi-use foundation stick with buildable coverage and velvet soft-focus finish",
    "description": "Versatile stick formulation that melts into skin for flawless contouring, spot concealing, or all-over coverage. Infused with Hyaluronic Acid and SPF 50 PA++++ for all-day skin nourishment.",
    "categoryIds": [
      "face",
      "bestsellers",
      "all"
    ],
    "status": "published",
    "pricePaise": 34900,
    "compareAtPricePaise": 44900,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/category_face_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614529/dimsglow/products/category_face_luxury.webp",
        "altText": "Creamy-to-Matte Stick Foundation",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/featured_skin_tint",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614527/dimsglow/products/featured_skin_tint.jpg",
        "altText": "Velvet Application & Swatch",
        "isPrimary": false
      },
      {
        "publicId": "dimsglow/products/category_combos_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614531/dimsglow/products/category_combos_luxury.webp",
        "altText": "Contour & Conceal Stick Detail",
        "isPrimary": false
      }
    ],
    "benefitPill": "Natural Radiant Glow",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.9,
      "reviewCount": 26
    },
    "trustBadges": [
      "Toxic Free",
      "Dermatologically Tested",
      "Vegan"
    ],
    "variants": [
      {
        "id": "var_porcelain_glow",
        "sku": "DIMS-SF-01",
        "title": "Porcelain Glow",
        "options": [
          {
            "name": "Shade",
            "value": "Porcelain Glow",
            "swatchColor": "#F5E4D7"
          }
        ],
        "pricePaise": 34900,
        "onHand": 35,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_biscuit_beige",
        "sku": "DIMS-SF-02",
        "title": "Biscuit Beige",
        "options": [
          {
            "name": "Shade",
            "value": "Biscuit Beige",
            "swatchColor": "#E2BF9E"
          }
        ],
        "pricePaise": 34900,
        "onHand": 40,
        "reserved": 2,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_amber_tan",
        "sku": "DIMS-SF-03",
        "title": "Amber Tan",
        "options": [
          {
            "name": "Shade",
            "value": "Amber Tan",
            "swatchColor": "#B68255"
          }
        ],
        "pricePaise": 34900,
        "onHand": 28,
        "reserved": 1,
        "lowStockThreshold": 5,
        "active": true
      }
    ],
    "featured": true,
    "bestseller": true,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522918
  },
  {
    "id": "prod_setting_spray",
    "slug": "super-lock-makeup-setting-spray",
    "name": "Super Lock Makeup Setting Spray",
    "tagline": "Micro-fine mist lock with Green Tea extract keeping makeup fresh up to 16 hours",
    "description": "Weightless micro-mist setting spray that locks foundation, eyeshadow, and blush in place for up to 16 hours. Controls shine without drying skin.",
    "categoryIds": [
      "face",
      "all"
    ],
    "status": "published",
    "pricePaise": 29900,
    "compareAtPricePaise": 38000,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/brand_dimsglow_emblem",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614560/dimsglow/products/brand_dimsglow_emblem.jpg",
        "altText": "Super Lock Makeup Setting Spray",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/category_face_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614529/dimsglow/products/category_face_luxury.webp",
        "altText": "Micro-mist Nozzle & Green Tea Formula",
        "isPrimary": false
      }
    ],
    "benefitPill": "Smudge-Proof & Long Lasting",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.7,
      "reviewCount": 38
    },
    "trustBadges": [
      "Toxic Free",
      "Dermatologically Tested",
      "Vegan"
    ],
    "variants": [
      {
        "id": "var_matte_finish",
        "sku": "DIMS-SS-01",
        "title": "Matte Finish 100ml",
        "options": [
          {
            "name": "Finish",
            "value": "Matte",
            "swatchColor": "#2B2B2B"
          }
        ],
        "pricePaise": 29900,
        "onHand": 40,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_dewy_finish",
        "sku": "DIMS-SS-02",
        "title": "Dewy Glow 100ml",
        "options": [
          {
            "name": "Finish",
            "value": "Dewy Glow",
            "swatchColor": "#E8A598"
          }
        ],
        "pricePaise": 29900,
        "onHand": 35,
        "reserved": 1,
        "lowStockThreshold": 5,
        "active": true
      }
    ],
    "featured": true,
    "bestseller": false,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522918
  },
  {
    "id": "prod_studio_kajal",
    "slug": "studio-kajal-24hrs",
    "name": "Studio Kajal 24 Hours Smudge-Proof",
    "tagline": "One-stroke intense black kajal enriched with Almond Oil & Vitamin E",
    "description": "Intense jet black kohl pencil with waterproof and smudge-proof formula tested to stay put for 24 hours. Safe for waterline and contact lens wearers.",
    "categoryIds": [
      "eyes",
      "all"
    ],
    "status": "published",
    "pricePaise": 19900,
    "compareAtPricePaise": 25000,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/category_eyes_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614542/dimsglow/products/category_eyes_luxury.webp",
        "altText": "DIMSGLOW Studio Kajal 24 Hours",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/brand_dimsglow_emblem",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614560/dimsglow/products/brand_dimsglow_emblem.jpg",
        "altText": "Intense Black Pigment & Smooth Glide",
        "isPrimary": false
      }
    ],
    "benefitPill": "24 HRS Smudge-Proof",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.8,
      "reviewCount": 56
    },
    "trustBadges": [
      "Ophthalmologically Tested",
      "Toxic Free",
      "Vegan"
    ],
    "variants": [
      {
        "id": "var_jet_black",
        "sku": "DIMS-KJ-01",
        "title": "Jet Black 0.35g",
        "options": [
          {
            "name": "Shade",
            "value": "Jet Black",
            "swatchColor": "#0A0A0A"
          }
        ],
        "pricePaise": 19900,
        "onHand": 70,
        "reserved": 4,
        "lowStockThreshold": 10,
        "active": true
      }
    ],
    "featured": false,
    "bestseller": false,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522919
  },
  {
    "id": "prod_nail_polish",
    "slug": "one-coat-high-shine-nail-polish",
    "name": "One Coat High Shine Nail Polish",
    "tagline": "Chip-resistant, non-yellowing formula with salon gel-like gloss in one stroke",
    "description": "Revolutionary 10-toxic free nail lacquer delivering high-gloss salon shine in a single coat. Infused with Calcium and Biotin to strengthen brittle nails.",
    "categoryIds": [
      "nails",
      "all"
    ],
    "status": "published",
    "pricePaise": 14900,
    "compareAtPricePaise": 19900,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/category_nails_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614543/dimsglow/products/category_nails_luxury.webp",
        "altText": "One Coat High Shine Nail Polish",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/category_combos_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614531/dimsglow/products/category_combos_luxury.webp",
        "altText": "High Gloss Nail Swatches & Brush",
        "isPrimary": false
      }
    ],
    "benefitPill": "10-Toxic Free Formula",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.7,
      "reviewCount": 31
    },
    "trustBadges": [
      "Toxic Free",
      "Safe-Cert",
      "Vegan"
    ],
    "variants": [
      {
        "id": "var_crimson_gloss",
        "sku": "DIMS-NP-01",
        "title": "Crimson Gloss",
        "options": [
          {
            "name": "Shade",
            "value": "Crimson Gloss",
            "swatchColor": "#A81C2E"
          }
        ],
        "pricePaise": 14900,
        "onHand": 30,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_rose_petal",
        "sku": "DIMS-NP-02",
        "title": "Rose Petal",
        "options": [
          {
            "name": "Shade",
            "value": "Rose Petal",
            "swatchColor": "#D9899A"
          }
        ],
        "pricePaise": 14900,
        "onHand": 25,
        "reserved": 1,
        "lowStockThreshold": 5,
        "active": true
      },
      {
        "id": "var_golden_nude",
        "sku": "DIMS-NP-03",
        "title": "Golden Nude",
        "options": [
          {
            "name": "Shade",
            "value": "Golden Nude",
            "swatchColor": "#CBB295"
          }
        ],
        "pricePaise": 14900,
        "onHand": 35,
        "reserved": 0,
        "lowStockThreshold": 5,
        "active": true
      }
    ],
    "featured": false,
    "bestseller": false,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522919
  },
  {
    "id": "prod_perfume_combo",
    "slug": "eau-de-parfum-set-pack-of-4",
    "name": "Eau De Parfum Luxury Discovery Set - Pack of 4",
    "tagline": "Four artisanal fragrances crafted in Grasse with long-lasting sensual notes",
    "description": "A curated discovery wardrobe of four 15ml artisanal EDP perfumes: Velvet Oud, Rose Royale, Vanilla Smoke, and Citrus Breeze. Formulated with IFRA-certified fine fragrance oils.",
    "categoryIds": [
      "perfumes",
      "combos",
      "all"
    ],
    "status": "published",
    "pricePaise": 99900,
    "compareAtPricePaise": 149900,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/category_perfumes_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614557/dimsglow/products/category_perfumes_luxury.webp",
        "altText": "Eau De Parfum Luxury Discovery Set",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/brand_dimsglow_emblem",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614560/dimsglow/products/brand_dimsglow_emblem.jpg",
        "altText": "Artisanal Perfume Bottles Presentation",
        "isPrimary": false
      }
    ],
    "benefitPill": "Fragrance Lasts Upto 18Hrs",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.9,
      "reviewCount": 20
    },
    "trustBadges": [
      "Cruelty Free",
      "Long Lasting 18h",
      "Luxury Blend"
    ],
    "variants": [
      {
        "id": "var_discovery_set",
        "sku": "DIMS-PF-SET",
        "title": "Set of 4 x 15ml",
        "options": [
          {
            "name": "Size",
            "value": "4 x 15ml",
            "swatchColor": "#AA771C"
          }
        ],
        "pricePaise": 99900,
        "onHand": 25,
        "reserved": 2,
        "lowStockThreshold": 5,
        "active": true
      }
    ],
    "featured": true,
    "bestseller": false,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522919
  },
  {
    "id": "prod_sheet_mask",
    "slug": "rice-water-face-mask-sheet",
    "name": "Rice Water Glow Face Mask Sheet (Pack of 5)",
    "tagline": "Infused with fermented Rice Water, Ceramides and Hyaluronic Acid for instant glass skin radiance",
    "description": "Biodegradable cellulose sheet masks packed with 25ml of concentrated fermented rice water serum per sheet. Plumps fine lines, replenishes moisture barrier, and evens out tone in 15 minutes.",
    "categoryIds": [
      "skin-care",
      "offers",
      "all"
    ],
    "status": "published",
    "pricePaise": 39900,
    "compareAtPricePaise": 59900,
    "currency": "INR",
    "media": [
      {
        "publicId": "dimsglow/products/category_skincare_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614530/dimsglow/products/category_skincare_luxury.webp",
        "altText": "Rice Water Glow Face Mask Sheet Pack of 5",
        "isPrimary": true
      },
      {
        "publicId": "dimsglow/products/category_face_luxury",
        "secureUrl": "https://res.cloudinary.com/web8vmww/image/upload/v1792614529/dimsglow/products/category_face_luxury.webp",
        "altText": "Fermented Rice Water Glass Skin Treatment",
        "isPrimary": false
      }
    ],
    "benefitPill": "Deep Detox & Intense Hydration",
    "unlockFreeGift": false,
    "ratingSummary": {
      "average": 4.8,
      "reviewCount": 39
    },
    "trustBadges": [
      "Biodegradable",
      "Dermatologically Tested",
      "Vegan"
    ],
    "variants": [
      {
        "id": "var_pack_of_5",
        "sku": "DIMS-SM-05",
        "title": "Pack of 5 Sheets",
        "options": [
          {
            "name": "Pack",
            "value": "5 Sheets",
            "swatchColor": "#E6DCD4"
          }
        ],
        "pricePaise": 39900,
        "onHand": 60,
        "reserved": 3,
        "lowStockThreshold": 10,
        "active": true
      }
    ],
    "featured": false,
    "bestseller": false,
    "createdAt": 1773000000000,
    "updatedAt": 1792614522919
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
