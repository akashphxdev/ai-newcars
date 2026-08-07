// src/modules/public/wishlist/wishlist.validation.ts

import { z } from 'zod';

export const addWishlistSchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
});

export const wishlistModelIdParamSchema = z.object({
  modelId: z.coerce.number().int().positive(),
});

export type AddWishlistParsed = z.infer<typeof addWishlistSchema>;
