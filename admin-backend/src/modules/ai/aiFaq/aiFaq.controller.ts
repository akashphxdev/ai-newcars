// src/modules/ai/aiFaq/aiFaq.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as aiFaqService from './aiFaq.service';
import { aiFaqListQuerySchema, aiFaqIdParamSchema, updateAiFaqSchema } from './aiFaq.validation';

// GET /ai/faqs
export async function getAiFaqs(req: Request, res: Response) {
  const query = aiFaqListQuerySchema.parse(req.query);
  const result = await aiFaqService.listAiFaqs(query);
  return sendPaginated(res, result.items, result.pagination, 'AI FAQs fetched successfully');
}

// GET /ai/faqs/:id
export async function getAiFaqById(req: Request, res: Response) {
  const { id } = aiFaqIdParamSchema.parse(req.params);
  const faq = await aiFaqService.getAiFaqById(id);
  return sendSuccess(res, faq, 'AI FAQ fetched successfully');
}

// PATCH /ai/faqs/:id
export async function updateAiFaq(req: Request, res: Response) {
  const { id } = aiFaqIdParamSchema.parse(req.params);
  const input = updateAiFaqSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await aiFaqService.updateAiFaq(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'AI FAQ updated successfully');
}

// PATCH /ai/faqs/:id/approve
export async function approveAiFaq(req: Request, res: Response) {
  const { id } = aiFaqIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await aiFaqService.approveAiFaq(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'AI FAQ approved successfully');
}

// PATCH /ai/faqs/:id/reject
export async function rejectAiFaq(req: Request, res: Response) {
  const { id } = aiFaqIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await aiFaqService.rejectAiFaq(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'AI FAQ rejected successfully');
}

// PATCH /ai/faqs/:id/publish
export async function publishAiFaq(req: Request, res: Response) {
  const { id } = aiFaqIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const faq = await aiFaqService.publishAiFaq(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, faq, 'AI FAQ published successfully');
}

// DELETE /ai/faqs/:id
export async function deleteAiFaq(req: Request, res: Response) {
  const { id } = aiFaqIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await aiFaqService.deleteAiFaq(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
