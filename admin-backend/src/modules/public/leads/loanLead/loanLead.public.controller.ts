// src/modules/public/leads/loanLead/loanLead.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createLoanLeadSchema } from './loanLead.public.validation';
import { createLoanLeadPublic } from './loanLead.public.service';

export async function createLoanLead(req: Request, res: Response) {
  const input = createLoanLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createLoanLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Lead submitted successfully', data: result });
}
