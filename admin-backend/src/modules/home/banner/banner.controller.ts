// src/modules/home/banner/banner.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import { createLog } from '@/core/utils/createLog';
import { getClientIp } from '@/core/utils/getClientIp';
import * as bannerService from './banner.service';
import {
  bannerListQuerySchema,
  bannerIdParamSchema,
  createBannerSchema,
  updateBannerSchema,
  updateBannerStatusSchema,
  uploadBannerMediaSchema,
} from './banner.validation';

// GET /banners
export async function getBanners(req: Request, res: Response) {
  const query = bannerListQuerySchema.parse(req.query);
  const result = await bannerService.listBanners(query);
  return sendPaginated(res, result.items, result.pagination, 'Banners fetched successfully');
}

// GET /banners/:id
export async function getBannerById(req: Request, res: Response) {
  const { id } = bannerIdParamSchema.parse(req.params);
  const banner = await bannerService.getBannerById(id);

  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Viewed banner "${banner.name}" (id ${id})`,
      ipAddress: getClientIp(req),
    });
  }

  return sendSuccess(res, banner, 'Banner fetched successfully');
}

// POST /banners
// Multipart (media rides along with the rest of the form, field name
// "media") — same shape as storyItem.controller.ts's createStoryItem.
export async function createBanner(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('Banner media is required (expected field name "media")');
  }

  try {
    const input = createBannerSchema.parse(req.body);
    const banner = await bannerService.createBanner(input, req.auth.id, req.file.filename, getClientIp(req));
    return sendSuccess(res, banner, 'Banner created successfully', 201);
  } catch (err) {
    await deleteUploadedFile(buildPublicPath('banners', req.file.filename));
    throw err;
  }
}

// PATCH /banners/:id
// NOTE: requires the full shape — the frontend always submits the
// complete form, on both Add and Edit (same convention as offer/faq).
// Media is not part of this route — see uploadBannerMedia below.
export async function updateBanner(req: Request, res: Response) {
  const { id } = bannerIdParamSchema.parse(req.params);
  const input = updateBannerSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const banner = await bannerService.updateBanner(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, banner, 'Banner updated successfully');
}

// PATCH /banners/:id/status
// Dedicated quick status-toggle route (Active/Inactive) for the
// row-level switch — same pattern as offer.controller.ts's updateOfferStatus.
export async function updateBannerStatus(req: Request, res: Response) {
  const { id } = bannerIdParamSchema.parse(req.params);
  const { isActive } = updateBannerStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const banner = await bannerService.updateBannerStatus(id, isActive, req.auth.id, getClientIp(req));
  return sendSuccess(res, banner, 'Banner status updated successfully');
}

// PATCH /banners/:id/media
// Dedicated media-replace route — same pattern as
// storyItem.controller.ts's uploadStoryItemMedia.
export async function uploadBannerMedia(req: Request, res: Response) {
  const { id } = bannerIdParamSchema.parse(req.params);
  const { mediaType } = uploadBannerMediaSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No media file received (expected field name "media")');
  }

  const banner = await bannerService.uploadBannerMedia(
    id,
    mediaType,
    req.file.filename,
    req.auth.id,
    getClientIp(req),
  );
  return sendSuccess(res, banner, 'Banner media updated successfully');
}

// DELETE /banners/:id
export async function deleteBanner(req: Request, res: Response) {
  const { id } = bannerIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await bannerService.deleteBanner(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
