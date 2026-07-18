// src/modules/newCars/faq/faq.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as faqService from './faq.service';
import {
  faqListQuerySchema,
  faqIdParamSchema,
  createFaqSchema,
  updateFaqSchema,
  updateFaqStatusSchema,
} from './faq.validation';

// GET /faqs
export async function getFaqs(req: Request, res: Response) {
  const query = faqListQuerySchema.parse(req.query);
  const result = await faqService.listFaqs(query);
  return sendPaginated(res, result.items, result.pagination, 'FAQs fetched successfully');
}

// GET /faqs/:id
export async function getFaqById(req: Request, res: Response) {
  const { id } = faqIdParamSchema.parse(req.params);
  const faq = await faqService.getFaqById(id);
  return sendSuccess(res, faq, 'FAQ fetched successfully');
}

// POST /faqs
export async function createFaq(req: Request, res: Response) {
  const input = createFaqSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await faqService.createFaq(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'FAQ created successfully', 201);
}

// PATCH /faqs/:id
// NOTE: unlike Brand/CarModel's partial update, updateFaqSchema requires
// every field — the frontend always submits the full form, on both Add
// and Edit (same convention as variant.controller.ts).
export async function updateFaq(req: Request, res: Response) {
  const { id } = faqIdParamSchema.parse(req.params);
  const input = updateFaqSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await faqService.updateFaq(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'FAQ updated successfully');
}

// PATCH /faqs/:id/status
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
export async function updateFaqStatus(req: Request, res: Response) {
  const { id } = faqIdParamSchema.parse(req.params);
  const { isActive } = updateFaqStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await faqService.updateFaqStatus(id, isActive, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'FAQ status updated successfully');
}

// DELETE /faqs/:id
export async function deleteFaq(req: Request, res: Response) {
  const { id } = faqIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await faqService.deleteFaq(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}