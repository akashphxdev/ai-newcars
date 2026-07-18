// src/modules/admin-auth/auth.controller.ts

import { Request, Response } from 'express';
import { adminAuthService } from './auth.service';
import { getClientIp } from '@/core/utils/getClientIp';
import {
  adminLoginSchema,
  adminVerifyOtpSchema,
  adminResendOtpSchema,
} from './auth.validation';
import { ApiError } from '@/core/errors/ApiError';

export const adminAuthController = {
  async login(req: Request, res: Response) {
    const input = adminLoginSchema.parse(req.body);

    const result = await adminAuthService.login(input, getClientIp(req));
    res.json({ success: true, message: 'OTP sent', data: result });
  },

  async verifyOtp(req: Request, res: Response) {
    const { adminId, otp } = adminVerifyOtpSchema.parse(req.body);
    const result = await adminAuthService.verifyOtp(adminId, otp, getClientIp(req));
    res.json({ success: true, message: 'Login successful', data: result });
  },

  async resendOtp(req: Request, res: Response) {
    const { adminId } = adminResendOtpSchema.parse(req.body);
    const result = await adminAuthService.resendOtp(adminId, getClientIp(req));
    res.json({ success: true, message: result.message, data: result });
  },

  async me(req: Request, res: Response) {
    if (!req.auth) throw ApiError.unauthorized();
    const admin = await adminAuthService.me(req.auth.id);
    res.json({ success: true, message: 'Profile fetched', data: admin });
  },

  async logout(req: Request, res: Response) {
    if (!req.auth) throw ApiError.unauthorized();
    const result = await adminAuthService.logout(req.auth.id, getClientIp(req));
    res.json({ success: true, message: result.message, data: null });
  },
};