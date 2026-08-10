// src/modules/public/seo/seoRedirect/seoRedirect.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as seoRedirectService from './seoRedirect.service';

// GET /api/public/v1/seo/redirects
export async function getActiveRedirects(_req: Request, res: Response) {
  const redirects = await seoRedirectService.listActiveRedirects();
  return sendSuccess(res, redirects, 'Redirects fetched successfully');
}
