// src/modules/public/leads/insuranceLead/insuranceLead.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createInsuranceLeadSchema } from './insuranceLead.public.validation';
import { createInsuranceLeadPublic } from './insuranceLead.public.service';

export async function createInsuranceLead(req: Request, res: Response) {
  const input = createInsuranceLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createInsuranceLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Lead submitted successfully', data: result });
}
