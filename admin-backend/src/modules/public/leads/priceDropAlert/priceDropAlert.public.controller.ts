// src/modules/public/leads/priceDropAlert/priceDropAlert.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createPriceDropAlertLeadSchema } from './priceDropAlert.public.validation';
import { createPriceDropAlertLeadPublic } from './priceDropAlert.public.service';

export async function createPriceDropAlertLead(req: Request, res: Response) {
  const input = createPriceDropAlertLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createPriceDropAlertLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Subscribed to price drop alerts', data: result });
}
