// src/routes/public/wishlist.ts
import { Router } from 'express';
import WishlistRoute from '@/modules/public/wishlist/wishlist.routes';

const router = Router();

router.use('/', WishlistRoute);

export default router;
