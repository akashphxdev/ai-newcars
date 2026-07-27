// src/modules/public/auth/auth.controller.ts

import { Request, Response } from 'express';
import { userAuthService } from './auth.service';
import { getClientIp } from '@/core/utils/getClientIp';
import { ApiError } from '@/core/errors/ApiError';
import {
  signupRequestOtpSchema,
  signupVerifyOtpSchema,
  loginRequestOtpSchema,
  loginVerifyOtpSchema,
  resendOtpSchema,
} from './auth.validation';

export const userAuthController = {
  async signupRequestOtp(req: Request, res: Response) {
    const input = signupRequestOtpSchema.parse(req.body);
    const result = await userAuthService.signupRequestOtp(input, getClientIp(req));
    res.json({ success: true, message: 'OTP sent', data: result });
  },

  async signupVerifyOtp(req: Request, res: Response) {
    const input = signupVerifyOtpSchema.parse(req.body);
    const result = await userAuthService.signupVerifyOtp(input, getClientIp(req));
    res.json({ success: true, message: 'Signup successful', data: result });
  },

  async loginRequestOtp(req: Request, res: Response) {
    const input = loginRequestOtpSchema.parse(req.body);
    const result = await userAuthService.loginRequestOtp(input, getClientIp(req));
    res.json({ success: true, message: 'OTP sent', data: result });
  },

  async loginVerifyOtp(req: Request, res: Response) {
    const input = loginVerifyOtpSchema.parse(req.body);
    const result = await userAuthService.loginVerifyOtp(input, getClientIp(req));
    res.json({ success: true, message: 'Login successful', data: result });
  },

  async resendOtp(req: Request, res: Response) {
    const input = resendOtpSchema.parse(req.body);
    const result = await userAuthService.resendOtp(input, getClientIp(req));
    res.json({ success: true, message: result.message, data: result });
  },

  async me(req: Request, res: Response) {
    if (!req.auth) throw ApiError.unauthorized();
    const user = await userAuthService.me(req.auth.id);
    res.json({ success: true, message: 'Profile fetched', data: user });
  },
};
