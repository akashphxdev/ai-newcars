// src/modules/public/leads/newCarLead/newCarLead.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createBuyNewCarLeadSchema } from './newCarLead.public.validation';
import { createBuyNewCarLeadPublic } from './newCarLead.public.service';

export async function createBuyNewCarLead(req: Request, res: Response) {
  const input = createBuyNewCarLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createBuyNewCarLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Lead submitted successfully', data: result });
}
