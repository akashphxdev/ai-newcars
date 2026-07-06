// src/modules/newCars/offer/offer.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as offerService from './offer.service';
import {
  offerListQuerySchema,
  offerIdParamSchema,
  createOfferSchema,
  updateOfferSchema,
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
export async function createOffer(req: Request, res: Response) {
  const input = createOfferSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const offer = await offerService.createOffer(input, req.auth.id);
  return sendSuccess(res, offer, 'Offer created successfully', 201);
}

// PATCH /offers/:id
// NOTE: unlike Brand/CarModel's partial update, updateOfferSchema
// requires the full shape — the frontend always submits the complete
// form, on both Add and Edit (same convention as faq/variant).
export async function updateOffer(req: Request, res: Response) {
  const { id } = offerIdParamSchema.parse(req.params);
  const input = updateOfferSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const offer = await offerService.updateOffer(id, input, req.auth.id);
  return sendSuccess(res, offer, 'Offer updated successfully');
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