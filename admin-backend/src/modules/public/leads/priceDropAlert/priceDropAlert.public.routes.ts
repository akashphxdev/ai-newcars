// src/modules/public/leads/priceDropAlert/priceDropAlert.public.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { createPriceDropAlertLead } from './priceDropAlert.public.controller';

const router = Router();
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/', leadSubmitLimiter, optionalAuth(), asyncHandler(createPriceDropAlertLead));

export default router;
