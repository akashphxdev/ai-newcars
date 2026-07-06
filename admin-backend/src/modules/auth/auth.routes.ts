// src/modules/auth/auth.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminAuthController } from './auth.controller';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { requireAuth } from '@/core/middleware/auth';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
});

router.post('/login', authLimiter, asyncHandler(adminAuthController.login));
router.post('/verify-otp', authLimiter, asyncHandler(adminAuthController.verifyOtp));
router.post('/resend-otp', authLimiter, asyncHandler(adminAuthController.resendOtp));
router.get('/me', requireAuth(['admin']), asyncHandler(adminAuthController.me));
router.post('/logout', requireAuth(['admin']), asyncHandler(adminAuthController.logout));

export default router;