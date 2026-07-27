// src/modules/public/auth/auth.routes.ts
//
// Website (public) user auth — signup/login are unauthenticated by
// nature (that's the point), only /me needs a token.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { userAuthController } from './auth.controller';
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

router.post('/signup/send-otp', authLimiter, asyncHandler(userAuthController.signupRequestOtp));
router.post('/signup/verify-otp', authLimiter, asyncHandler(userAuthController.signupVerifyOtp));
router.post('/login/send-otp', authLimiter, asyncHandler(userAuthController.loginRequestOtp));
router.post('/login/verify-otp', authLimiter, asyncHandler(userAuthController.loginVerifyOtp));
router.post('/resend-otp', authLimiter, asyncHandler(userAuthController.resendOtp));
router.get('/me', requireAuth(['user']), asyncHandler(userAuthController.me));

export default router;
