import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string(), // `${productId}_${variantId || 'default'}`
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(10),
  addedAt: z.number(),
  updatedAt: z.number(),
});

export const FavoriteItemSchema = z.object({
  productId: z.string(),
  addedAt: z.number(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type FavoriteItem = z.infer<typeof FavoriteItemSchema>;
