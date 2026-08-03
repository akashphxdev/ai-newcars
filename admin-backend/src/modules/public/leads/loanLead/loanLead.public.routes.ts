// src/modules/public/leads/loanLead/loanLead.public.routes.ts
//
// Guests and logged-in users both hit this same POST — optionalAuth
// attaches req.auth when a valid user token is present but never
// rejects the request, so the service itself decides whether an OTP is
// required (see loanLead.public.service.ts).

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { createLoanLead } from './loanLead.public.controller';

const router = Router();
const loanLeadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/', loanLeadSubmitLimiter, optionalAuth(), asyncHandler(createLoanLead));

export default router;
