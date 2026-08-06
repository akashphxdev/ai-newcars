// src/modules/public/leads/launchNotify/launchNotify.public.controller.ts

import { Request, Response } from 'express';
import { getClientIp } from '@/core/utils/getClientIp';
import { createLaunchNotifyLeadSchema } from './launchNotify.public.validation';
import { createLaunchNotifyLeadPublic } from './launchNotify.public.service';

export async function createLaunchNotifyLead(req: Request, res: Response) {
  const input = createLaunchNotifyLeadSchema.parse(req.body);
  const userId = req.auth?.type === 'user' ? req.auth.id : null;
  const result = await createLaunchNotifyLeadPublic(input, userId, getClientIp(req));
  res.status(201).json({ success: true, message: 'Subscribed to launch notification', data: result });
}
