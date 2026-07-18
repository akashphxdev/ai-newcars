// backend/src/modules/stories/storyItem/storyItem.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import { getClientIp } from '@/core/utils/getClientIp';
import * as storyItemService from './storyItem.service';
import {
  storyItemListQuerySchema,
  storyItemIdParamSchema,
  createStoryItemSchema,
  updateStoryItemSchema,
  updateStoryItemStatusSchema,
  uploadStoryItemMediaSchema,
} from './storyItem.validation';

export async function getStoryItems(req: Request, res: Response) {
  const query = storyItemListQuerySchema.parse(req.query);
  const result = await storyItemService.listStoryItems(query);
  return sendPaginated(res, result.items, result.pagination, 'Story items fetched successfully');
}

export async function getStoryItemById(req: Request, res: Response) {
  const { id } = storyItemIdParamSchema.parse(req.params);
  const item = await storyItemService.getStoryItemById(id);
  return sendSuccess(res, item, 'Story item fetched successfully');
}

export async function createStoryItem(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createStoryItemSchema.parse(req.body);

  if (!req.file) {
    throw ApiError.badRequest('Media file is required (expected field name "media")');
  }

  try {
    const item = await storyItemService.createStoryItem(input, req.auth.id, req.file.filename, getClientIp(req));
    return sendSuccess(res, item, 'Story item created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('story-items', req.file.filename));
    }
    throw err;
  }
}

export async function updateStoryItem(req: Request, res: Response) {
  const { id } = storyItemIdParamSchema.parse(req.params);
  const input = updateStoryItemSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const item = await storyItemService.updateStoryItem(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, item, 'Story item updated successfully');
}

export async function updateStoryItemStatus(req: Request, res: Response) {
  const { id } = storyItemIdParamSchema.parse(req.params);
  const { status, startAt, endAt } = updateStoryItemStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const item = await storyItemService.updateStoryItemStatus(id, status, req.auth.id, startAt, endAt, getClientIp(req));
  return sendSuccess(res, item, 'Story item status updated successfully');
}

export async function uploadStoryItemMedia(req: Request, res: Response) {
  const { id } = storyItemIdParamSchema.parse(req.params);
  const { mediaType } = uploadStoryItemMediaSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No media file received (expected field name "media")');
  }

  const item = await storyItemService.uploadStoryItemMedia(id, mediaType, req.file.filename, req.auth.id, getClientIp(req));
  return sendSuccess(res, item, 'Story item media updated successfully');
}

export async function deleteStoryItem(req: Request, res: Response) {
  const { id } = storyItemIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await storyItemService.deleteStoryItem(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}

export async function incrementStoryItemViewCount(req: Request, res: Response) {
  const { id } = storyItemIdParamSchema.parse(req.params);
  const item = await storyItemService.incrementStoryItemViewCount(id);
  return sendSuccess(res, item, 'View recorded');
}
