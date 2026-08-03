// src/modules/public/leads/softLead/softLead.public.routes.ts
//
// Guests and logged-in users both hit this same POST — optionalAuth
// attaches req.auth when a valid user token is present but never
// rejects the request. No OTP gate here (see softLead.public.service.ts).

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { createSoftLead } from './softLead.public.controller';

const router = Router();
const softLeadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/', softLeadSubmitLimiter, optionalAuth(), asyncHandler(createSoftLead));

export default router;
