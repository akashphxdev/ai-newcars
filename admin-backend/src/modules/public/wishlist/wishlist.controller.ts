// src/modules/public/wishlist/wishlist.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as wishlistService from './wishlist.service';
import { addWishlistSchema, wishlistModelIdParamSchema } from './wishlist.validation';

export async function getMyWishlist(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const items = await wishlistService.listMyWishlist(req.auth.id);
  return sendSuccess(res, items, 'Wishlist fetched successfully');
}

export async function addWishlistItem(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const input = addWishlistSchema.parse(req.body);
  const result = await wishlistService.addToWishlist(req.auth.id, input.modelId);
  return sendSuccess(res, result, 'Added to wishlist', 201);
}

export async function removeWishlistItem(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const { modelId } = wishlistModelIdParamSchema.parse(req.params);
  await wishlistService.removeFromWishlist(req.auth.id, modelId);
  return sendSuccess(res, null, 'Removed from wishlist');
}
