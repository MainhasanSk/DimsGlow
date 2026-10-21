import { z } from 'zod';

export const VariantOptionSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  swatchColor: z.string().optional(), // Hex color for color dots e.g. '#E0A899'
});

export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string().min(1),
  title: z.string().min(1),
  options: z.array(VariantOptionSchema),
  pricePaise: z.number().int().nonnegative(), // Price in integer paise
  compareAtPricePaise: z.number().int().nonnegative().optional(),
  onHand: z.number().int().nonnegative().default(0),
  reserved: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  imageUrl: z.string().url().optional(),
  active: z.boolean().default(true),
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().min(1),
  categoryIds: z.array(z.string()).min(1),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  pricePaise: z.number().int().nonnegative(),
  compareAtPricePaise: z.number().int().nonnegative().optional(),
  currency: z.literal('INR').default('INR'),
  media: z.array(
    z.object({
      publicId: z.string(),
      secureUrl: z.string().url(),
      altText: z.string().default('DIMSGLOW cosmetic product packaging'),
      isPrimary: z.boolean().default(false),
    })
  ).min(1),
  benefitPill: z.string().optional(), // e.g. "Crème Highlighter Formula", "Infused with Aloe Vera & Vitamin E"
  unlockFreeGift: z.boolean().default(false),
  ratingSummary: z.object({
    average: z.number().min(0).max(5).default(5.0),
    reviewCount: z.number().int().nonnegative().default(0),
  }),
  trustBadges: z.array(z.string()).default(['Toxic Free', 'Dermatologically Tested', 'Vegan']),
  variants: z.array(ProductVariantSchema).default([]),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type VariantOption = z.infer<typeof VariantOptionSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type Product = z.infer<typeof ProductSchema>;
