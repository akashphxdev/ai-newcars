// src/modules/public/leads/scrapLead/scrapLead.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createScrapLeadSchema } from './scrapLead.public.validation';
import { createScrapLeadPublic } from './scrapLead.public.service';

export async function createScrapLead(req: Request, res: Response) {
  const input = createScrapLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createScrapLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Lead submitted successfully', data: result });
}
