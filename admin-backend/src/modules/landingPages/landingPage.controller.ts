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
  await service.ensureLandingPage(slug);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest('No files uploaded');

  // A multipart filename cannot carry a directory: busboy keeps only the
  // last segment, so a folder upload would flatten "css/site.css" to
  // "site.css" and every relative href in the page would 404. The client
  // therefore sends the paths separately, in the same order as the files.
  let paths: string[] = [];
  const rawPaths = req.body?.paths;
  if (typeof rawPaths === 'string' && rawPaths.trim()) {
    try {
      const parsed = JSON.parse(rawPaths);
      if (Array.isArray(parsed)) paths = parsed.map((p) => String(p));
    } catch {
      throw ApiError.badRequest('paths must be a JSON array');
    }
  }

  for (const [i, file] of files.entries()) {
    // Kept under the name the designer used so the page's relative src
    // still resolves — see landingAssetUploader for why that is not
    // automatic.
    await service.saveLandingAsset(slug, paths[i] || file.originalname, file.buffer);
  }

  const page = await service.getLandingPage(slug);
  return sendSuccess(res, page, 'Assets uploaded', 201);
}

// GET /api/v1/landing-pages/:slug/files
export async function getLandingFiles(req: Request, res: Response) {
  const { slug } = landingPageSlugSchema.parse(req.params);
  await service.getLandingPage(slug);
  const files = await service.listLandingFiles(slug);
  return sendSuccess(res, files, 'Files fetched successfully');
}

// DELETE /api/v1/landing-pages/:slug/files?name=<relative path>
export async function deleteLandingFile(req: Request, res: Response) {
  const { slug } = landingPageSlugSchema.parse(req.params);
  const name = String(req.query.name ?? '');
  if (!name) throw ApiError.badRequest('name is required');
  await service.deleteLandingFile(slug, name);
  return sendSuccess(res, null, 'File deleted');
}

// DELETE /api/v1/landing-pages/:slug
export async function deleteLandingPage(req: Request, res: Response) {
  const { slug } = landingPageSlugSchema.parse(req.params);
  await service.deleteLandingPage(slug);
  return sendSuccess(res, null, 'Landing page deleted');
}
