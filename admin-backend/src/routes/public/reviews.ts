// src/routes/public/reviews.ts
import { Router } from 'express';
import ReviewRoute from '@/modules/public/reviews/review/review.routes';

const router = Router();

router.use('/', ReviewRoute);

export default router;
