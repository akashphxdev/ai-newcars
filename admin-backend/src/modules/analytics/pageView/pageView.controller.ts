// src/modules/analytics/pageView/pageView.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as pageViewService from './pageView.service';
import { pageViewStatsQuerySchema } from './pageView.validation';

// GET /analytics/page-views/summary
export async function getPageViewSummary(req: Request, res: Response) {
  const query = pageViewStatsQuerySchema.parse(req.query);
  const summary = await pageViewService.getPageViewSummary(query);
  return sendSuccess(res, summary, 'Page view summary fetched successfully');
}
