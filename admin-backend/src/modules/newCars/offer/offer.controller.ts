// src/modules/newCars/offer/offer.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as offerService from './offer.service';
import {
  offerListQuerySchema,
  offerIdParamSchema,
  createOfferSchema,
  updateOfferSchema,
  updateOfferStatusSchema,
} from './offer.validation';

// GET /offers
export async function getOffers(req: Request, res: Response) {
  const query = offerListQuerySchema.parse(req.query);
  const result = await offerService.listOffers(query);
  return sendPaginated(res, result.items, result.pagination, 'Offers fetched successfully');
}

// GET /offers/:id
export async function getOfferById(req: Request, res: Response) {
  const { id } = offerIdParamSchema.parse(req.params);
  const offer = await offerService.getOfferById(id);
  return sendSuccess(res, offer, 'Offer fetched successfully');
}

// POST /offers
// Multipart (image rides along with the rest of the form, field name
// "image") — same shape as brand.controller.ts's createBrand.
export async function createOffer(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('Offer image is required (expected field name "image")');
  }

  try {
    const input = createOfferSchema.parse(req.body);
    const offer = await offerService.createOffer(input, req.auth.id, req.file.filename);
    return sendSuccess(res, offer, 'Offer created successfully', 201);
  } catch (err) {
    await deleteUploadedFile(buildPublicPath('offers', req.file.filename));
    throw err;
  }
}

// PATCH /offers/:id
// NOTE: unlike Brand/CarModel's partial update, updateOfferSchema
// requires the full shape — the frontend always submits the complete
// form, on both Add and Edit (same convention as faq/variant). Image is
// not part of this route — see uploadOfferImage below.
export async function updateOffer(req: Request, res: Response) {
  const { id } = offerIdParamSchema.parse(req.params);
  const input = updateOfferSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const offer = await offerService.updateOffer(id, input, req.auth.id);
  return sendSuccess(res, offer, 'Offer updated successfully');
}

// PATCH /offers/:id/status
// Dedicated quick status-toggle route (Active/Inactive) for the
// row-level switch — same pattern as brand.controller.ts's
// updateBrandStatus.
export async function updateOfferStatus(req: Request, res: Response) {
  const { id } = offerIdParamSchema.parse(req.params);
  const { isActive } = updateOfferStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const offer = await offerService.updateOfferStatus(id, isActive, req.auth.id);
  return sendSuccess(res, offer, 'Offer status updated successfully');
}

// PATCH /offers/:id/image
// Dedicated image-replace route — same pattern as
// brand.controller.ts's uploadBrandLogo.
export async function uploadOfferImage(req: Request, res: Response) {
  const { id } = offerIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "image")');
  }

  const offer = await offerService.uploadOfferImage(id, req.file.filename, req.auth.id);
  return sendSuccess(res, offer, 'Offer image updated successfully');
}

// DELETE /offers/:id
export async function deleteOffer(req: Request, res: Response) {
  const { id } = offerIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await offerService.deleteOffer(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}