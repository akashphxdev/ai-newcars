// src/modules/public/wishlist/wishlist.routes.ts
//
// Every route needs a logged-in user (there's no guest/OTP path here,
// unlike the lead-capture modules — wishlisting only makes sense tied to
// an account so it can be viewed later from the profile page).

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getMyWishlist, addWishlistItem, removeWishlistItem } from './wishlist.controller';

const router = Router();

router.use(requireAuth(['user']));

router.get('/', asyncHandler(getMyWishlist));
router.post('/', asyncHandler(addWishlistItem));
router.delete('/:modelId', asyncHandler(removeWishlistItem));

export default router;
