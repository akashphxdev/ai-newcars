// src/modules/public/seo/seoMeta/seoMeta.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { seoMetaQuerySchema } from './seoMeta.validation';
import * as seoMetaService from './seoMeta.service';

// GET /api/public/v1/seo/meta?pageType=&entityId=&staticPageSlug=
export async function getSeoMeta(req: Request, res: Response) {
  const query = seoMetaQuerySchema.parse(req.query);
  const seoMeta = await seoMetaService.getPublicSeoMeta(query);
  return sendSuccess(res, seoMeta, 'SEO meta fetched successfully');
}
