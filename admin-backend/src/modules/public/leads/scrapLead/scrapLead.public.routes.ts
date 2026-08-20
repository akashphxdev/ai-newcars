// src/modules/public/leads/scrapLead/scrapLead.public.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '@/core/middleware/auth';
import { requireTurnstile } from '@/core/middleware/turnstile.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { createScrapLead } from './scrapLead.public.controller';

const router = Router();
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

// Turnstile stands in for the OTP step the other lead forms have. It
// runs before the handler so a failed challenge costs no database work.
router.post('/', leadSubmitLimiter, requireTurnstile, optionalAuth(), asyncHandler(createScrapLead));

export default router;
