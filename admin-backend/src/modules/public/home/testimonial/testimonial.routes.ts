// src/modules/public/home/testimonial/testimonial.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. GET is cached for 2 min; POST
// (visitor-submitted review) is never cached and relies on the global
// rate limiter in app.ts to blunt spam/abuse.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeTestimonials, postHomeTestimonial } from './testimonial.controller';

const router = Router();

router.get('/', publicCache(120), asyncHandler(getHomeTestimonials));
router.post('/', asyncHandler(postHomeTestimonial));

export default router;
