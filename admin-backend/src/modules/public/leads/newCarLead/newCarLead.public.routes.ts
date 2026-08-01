// src/modules/public/leads/newCarLead/newCarLead.public.routes.ts
//
// Guests and logged-in users both hit this same POST — optionalAuth
// attaches req.auth when a valid user token is present but never
// rejects the request, so the service itself decides whether an OTP is
// required (see newCarLead.public.service.ts).

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { createBuyNewCarLead } from './newCarLead.public.controller';

const router = Router();
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/', leadSubmitLimiter, optionalAuth(), asyncHandler(createBuyNewCarLead));

export default router;
