import { z } from 'zod';

export const HeroSlideSchema = z.object({
  id: z.string(),
  tagline: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  ctaText: z.string().min(1),
  ctaLink: z.string().min(1),
  imageUrl: z.string().default('/brand/dimsglow-logo.jpg'),
  bgGradient: z.string().default('from-[#2D0B1E] via-[#541235] to-[#141215]'),
  accentColor: z.string().default('#B83B63'),
  active: z.boolean().default(true),
  order: z.number().default(0),
});

export type HeroSlide = z.infer<typeof HeroSlideSchema>;

export const CategoryHeroSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  bannerTitle: z.string(),
  bannerSubtitle: z.string(),
  bannerBg: z.string(),
  bannerImageUrl: z.string().default('/brand/dimsglow-logo.jpg'),
  accentBadge: z.string().default('DIMSGLOW EXCLUSIVE'),
});

export type CategoryHero = z.infer<typeof CategoryHeroSchema>;

export const PromoClinicalSchema = z.object({
  statNumber: z.string().default('95%'),
  statLabel: z.string().default('Reduction in Dark Spots'),
  headline: z.string().default('CLINICALLY PROVEN FORMULATION'),
  description: z.string().default('Reduces blemishes, provides radiant glow, improves skin elasticity, and refines hyperpigmentation with active Niacinamide, Arbutin, and 2.5% Glutathione.'),
  activeIngredients: z.array(z.string()).default(['Arbutin', '2.5% Glutathione', 'Vitamin C', 'Amino Acid']),
  ctaText: z.string().default('SHOP RADIANCE SERUM'),
  ctaLink: z.string().default('/collections/skin-care'),
  featuredProductName: z.string().default('Youthful Glow Face Serum'),
  featuredProductPrice: z.string().default('₹299.00'),
  featuredProductRating: z.string().default('★ 4.9 (14 Reviews)'),
  imageUrl: z.string().default('/brand/dimsglow-logo.jpg'),
  active: z.boolean().default(true),
});

export type PromoClinical = z.infer<typeof PromoClinicalSchema>;

export const RoutineLookSchema = z.object({
  id: z.string(),
  title: z.string(),
  desc: z.string(),
  href: z.string(),
  imageUrl: z.string().default('/brand/dimsglow-logo.jpg'),
  badge: z.string().optional(),
  active: z.boolean().default(true),
});

export type RoutineLook = z.infer<typeof RoutineLookSchema>;

export const TestimonialSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().min(1).max(5).default(5),
  review: z.string(),
  productName: z.string(),
  productLink: z.string(),
  active: z.boolean().default(true),
});

export type Testimonial = z.infer<typeof TestimonialSchema>;

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string().default('General'),
  order: z.number().default(0),
});

export type FaqItem = z.infer<typeof FaqItemSchema>;

export const CampaignVideoSchema = z.object({
  title: z.string().default("WE'VE GOT EVERYTHING COVERED"),
  subtitle: z.string().default('High-performance, weightless luxury formulations designed to move with you all day long.'),
  videoUrl: z.string().default('https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-makeup-with-a-brush-41484-large.mp4'),
  posterUrl: z.string().default('/brand/dimsglow-logo.jpg'),
  tagline: z.string().default('THE GO-TO GLAM ROUTINE'),
  ctaText: z.string().default('EXPLORE FULL CAMPAIGN'),
  ctaLink: z.string().default('/collections/all'),
  active: z.boolean().default(true),
});

export type CampaignVideo = z.infer<typeof CampaignVideoSchema>;

export const HomepageContentSchema = z.object({
  heroSlides: z.array(HeroSlideSchema),
  campaignVideo: CampaignVideoSchema.default({
    title: "WE'VE GOT EVERYTHING COVERED",
    subtitle: 'High-performance, weightless luxury formulations designed to move with you all day long.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-applying-makeup-with-a-brush-41484-large.mp4',
    posterUrl: '/brand/dimsglow-logo.jpg',
    tagline: 'THE GO-TO GLAM ROUTINE',
    ctaText: 'EXPLORE FULL CAMPAIGN',
    ctaLink: '/collections/all',
    active: true,
  }),
  promoClinical: PromoClinicalSchema,
  routineLooks: z.array(RoutineLookSchema),
  testimonials: z.array(TestimonialSchema),
  faqs: z.array(FaqItemSchema).default([]),
  sectionsVisibility: z.object({
    heroCarousel: z.boolean().default(true),
    categoryCircles: z.boolean().default(true),
    bestsellers: z.boolean().default(true),
    newArrivals: z.boolean().default(true),
    campaignVideo: z.boolean().default(true),
    promoClinical: z.boolean().default(true),
    routineLooks: z.boolean().default(true),
    combosBox: z.boolean().default(true),
    beforeAfter: z.boolean().default(true),
    ourPromise: z.boolean().default(true),
    testimonials: z.boolean().default(true),
    faqs: z.boolean().default(true),
    trustMarquee: z.boolean().default(true),
  }),
  updatedAt: z.number(),
  updatedBy: z.string().optional(),
});

export type HomepageContent = z.infer<typeof HomepageContentSchema>;
