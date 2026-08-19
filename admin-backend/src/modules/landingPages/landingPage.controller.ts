// src/modules/landingPages/landingPage.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { ApiError } from '@/core/errors/ApiError';
import { landingPageSlugSchema, saveLandingPageSchema } from './landingPage.validation';
import * as service from './landingPage.service';

// GET /api/v1/landing-pages
export async function getLandingPages(_req: Request, res: Response) {
  const pages = await service.listLandingPages();
  return sendSuccess(res, pages, 'Landing pages fetched successfully');
}

// GET /api/v1/landing-pages/:slug
export async function getLandingPage(req: Request, res: Response) {
  const { slug } = landingPageSlugSchema.parse(req.params);
  const page = await service.getLandingPage(slug);
  const html = await service.readLandingPageHtml(slug).catch(() => '');
  return sendSuccess(res, { ...page, html }, 'Landing page fetched successfully');
}

// POST /api/v1/landing-pages — create or replace, keyed by slug.
export async function saveLandingPage(req: Request, res: Response) {
  const { slug, html } = saveLandingPageSchema.parse(req.body);
  const page = await service.saveLandingPageHtml(slug, html);
  return sendSuccess(res, page, 'Landing page saved', 201);
}

// POST /api/v1/landing-pages/:slug/assets
export async function uploadLandingAssets(req: Request, res: Response) {
  const { slug } = landingPageSlugSchema.parse(req.params);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest('No files uploaded');

  for (const file of files) {
    // Kept under its original name so the page's relative src still
    // resolves — see landingAssetUploader for why that is not automatic.
    await service.saveLandingAsset(slug, file.originalname, file.buffer);
  }

  const page = await service.getLandingPage(slug);
  return sendSuccess(res, page, 'Assets uploaded', 201);
}

// DELETE /api/v1/landing-pages/:slug
export async function deleteLandingPage(req: Request, res: Response) {
  const { slug } = landingPageSlugSchema.parse(req.params);
  await service.deleteLandingPage(slug);
  return sendSuccess(res, null, 'Landing page deleted');
}
