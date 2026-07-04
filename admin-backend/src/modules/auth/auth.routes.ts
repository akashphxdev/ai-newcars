// src/modules/auth/auth.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminAuthController } from './auth.controller';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { requireAuth } from '@/core/middleware/auth';

const router = Router();

// FIXED: the only rate limit that existed before was the global one in
// app.ts (1000 req / 15 min) — same allowance for /health as for
// /auth/login and /auth/verify-otp. That's far too loose for
// password-guessing or 6-digit-OTP-guessing attempts, so these three
// endpoints now get their own much tighter limiter, keyed per-IP.
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