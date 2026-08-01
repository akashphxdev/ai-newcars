// src/modules/public/leads/leadOtp.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { sendLeadOtp } from './leadOtp.service';
import { sendLeadOtpSchema } from './leadOtp.validation';

export async function requestLeadOtp(req: Request, res: Response) {
  const input = sendLeadOtpSchema.parse(req.body);
  const result = await sendLeadOtp(input, getClientIp(req));
  res.json({ success: true, message: result.message, data: result });
}
