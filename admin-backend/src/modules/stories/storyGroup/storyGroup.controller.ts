// src/modules/stories/storyGroup/storyGroup.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as storyGroupService from './storyGroup.service';
import {
  storyGroupListQuerySchema,
  storyGroupIdParamSchema,
  createStoryGroupSchema,
  updateStoryGroupSchema,
  updateStoryGroupStatusSchema,
  uploadStoryGroupCoverSchema,
} from './storyGroup.validation';

// GET /story-groups
export async function getStoryGroups(req: Request, res: Response) {
  const query = storyGroupListQuerySchema.parse(req.query);
  const result = await storyGroupService.listStoryGroups(query);
  return sendPaginated(res, result.items, result.pagination, 'Story groups fetched successfully');
}

// GET /story-groups/:id
export async function getStoryGroupById(req: Request, res: Response) {
  const { id } = storyGroupIdParamSchema.parse(req.params);
  const group = await storyGroupService.getStoryGroupById(id);
  return sendSuccess(res, group, 'Story group fetched successfully');
}

export async function createStoryGroup(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createStoryGroupSchema.parse(req.body);

  if (!req.file) {
    throw ApiError.badRequest('Cover file is required (expected field name "cover")');
  }

  try {
    const group = await storyGroupService.createStoryGroup(input, req.auth.id, req.file.filename);
    return sendSuccess(res, group, 'Story group created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('story-groups', req.file.filename));
    }
    throw err;
  }
}

export async function updateStoryGroup(req: Request, res: Response) {
  const { id } = storyGroupIdParamSchema.parse(req.params);
  const input = updateStoryGroupSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const group = await storyGroupService.updateStoryGroup(id, input, req.auth.id);
  return sendSuccess(res, group, 'Story group updated successfully');
}


export async function updateStoryGroupStatus(req: Request, res: Response) {
  const { id } = storyGroupIdParamSchema.parse(req.params);
  const { isActive } = updateStoryGroupStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const group = await storyGroupService.updateStoryGroupStatus(id, isActive, req.auth.id);
  return sendSuccess(res, group, 'Story group status updated successfully');
}

export async function uploadStoryGroupCover(req: Request, res: Response) {
  const { id } = storyGroupIdParamSchema.parse(req.params);
  const { coverMediaType } = uploadStoryGroupCoverSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No cover file received (expected field name "cover")');
  }

  const group = await storyGroupService.uploadStoryGroupCover(id, coverMediaType, req.file.filename, req.auth.id);
  return sendSuccess(res, group, 'Story group cover updated successfully');
}

// DELETE /story-groups/:id
export async function deleteStoryGroup(req: Request, res: Response) {
  const { id } = storyGroupIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await storyGroupService.deleteStoryGroup(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}

export async function incrementStoryGroupViewCount(req: Request, res: Response) {
  const { id } = storyGroupIdParamSchema.parse(req.params);
  const group = await storyGroupService.incrementStoryGroupViewCount(id);
  return sendSuccess(res, group, 'View recorded');
}
