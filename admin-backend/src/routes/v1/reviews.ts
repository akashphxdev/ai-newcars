// src/routes/v1/reviews.ts
import { Router } from 'express';
import reviewRoute from '@/modules/reviews/review/review.routes';

const router = Router();

router.use('/', reviewRoute);

export default router;
