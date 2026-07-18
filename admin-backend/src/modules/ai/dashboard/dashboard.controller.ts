// src/modules/ai/dashboard/dashboard.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as dashboardService from './dashboard.service';

// GET /ai/dashboard
export async function getDashboardSummary(_req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary();
  return sendSuccess(res, summary, 'AI dashboard summary fetched successfully');
}
