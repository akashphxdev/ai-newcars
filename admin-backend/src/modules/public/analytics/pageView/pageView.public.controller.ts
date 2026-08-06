// src/modules/public/analytics/pageView/pageView.public.controller.ts

import { Request, Response } from 'express';
import { recordPageViewSchema } from './pageView.public.validation';
import { recordPageView } from './pageView.public.service';

// POST /api/public/v1/analytics/page-views
export async function createPageView(req: Request, res: Response) {
  const input = recordPageViewSchema.parse(req.body);
  await recordPageView(input);
  res.status(201).json({ success: true, message: 'Page view recorded', data: null });
}
