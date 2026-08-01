// src/modules/public/leads/leadOtp.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { requestLeadOtp } from './leadOtp.controller';

const router = Router();
const leadOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/send', leadOtpLimiter, asyncHandler(requestLeadOtp));

export default router;
