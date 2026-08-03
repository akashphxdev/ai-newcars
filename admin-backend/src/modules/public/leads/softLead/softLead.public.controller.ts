// src/modules/public/leads/softLead/softLead.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createSoftLeadSchema } from './softLead.public.validation';
import { createSoftLeadPublic } from './softLead.public.service';

export async function createSoftLead(req: Request, res: Response) {
  const input = createSoftLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createSoftLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Lead submitted successfully', data: result });
}
