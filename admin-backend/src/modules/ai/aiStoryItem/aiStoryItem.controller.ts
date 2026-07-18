// src/modules/ai/aiStoryItem/aiStoryItem.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as aiStoryItemService from './aiStoryItem.service';
import { aiStoryItemListQuerySchema, aiStoryItemIdParamSchema, updateAiStoryItemSchema } from './aiStoryItem.validation';

// GET /ai/story-items
export async function getAiStoryItems(req: Request, res: Response) {
  const query = aiStoryItemListQuerySchema.parse(req.query);
  const result = await aiStoryItemService.listAiStoryItems(query);
  return sendPaginated(res, result.items, result.pagination, 'AI story items fetched successfully');
}

// GET /ai/story-items/:id
export async function getAiStoryItemById(req: Request, res: Response) {
  const { id } = aiStoryItemIdParamSchema.parse(req.params);
  const item = await aiStoryItemService.getAiStoryItemById(id);
  return sendSuccess(res, item, 'AI story item fetched successfully');
}

// PATCH /ai/story-items/:id
export async function updateAiStoryItem(req: Request, res: Response) {
  const { id } = aiStoryItemIdParamSchema.parse(req.params);
  const input = updateAiStoryItemSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const item = await aiStoryItemService.updateAiStoryItem(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, item, 'AI story item updated successfully');
}

// PATCH /ai/story-items/:id/approve
export async function approveAiStoryItem(req: Request, res: Response) {
  const { id } = aiStoryItemIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const item = await aiStoryItemService.approveAiStoryItem(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, item, 'AI story item approved successfully');
}

// PATCH /ai/story-items/:id/reject
export async function rejectAiStoryItem(req: Request, res: Response) {
  const { id } = aiStoryItemIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const item = await aiStoryItemService.rejectAiStoryItem(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, item, 'AI story item rejected successfully');
}

// PATCH /ai/story-items/:id/publish
export async function publishAiStoryItem(req: Request, res: Response) {
  const { id } = aiStoryItemIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const item = await aiStoryItemService.publishAiStoryItem(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, item, 'AI story item published successfully');
}

// DELETE /ai/story-items/:id
export async function deleteAiStoryItem(req: Request, res: Response) {
  const { id } = aiStoryItemIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await aiStoryItemService.deleteAiStoryItem(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
