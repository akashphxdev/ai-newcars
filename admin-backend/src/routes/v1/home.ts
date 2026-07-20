// src/routes/v1/home.ts
import { Router } from 'express';
import bannerRoute from '@/modules/home/banner/banner.routes';
import testimonialRoute from '@/modules/home/testimonial/testimonial.routes';

const router = Router();

router.use('/banners', bannerRoute);
router.use('/testimonials', testimonialRoute);

export default router;
