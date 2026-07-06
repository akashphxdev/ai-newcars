// src/modules/newCars/video/video.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as videoService from './video.service';
import {
  videoListQuerySchema,
  videoIdParamSchema,
  createVideoSchema,
  updateVideoSchema,
} from './video.validation';

// GET /videos
export async function getVideos(req: Request, res: Response) {
  const query = videoListQuerySchema.parse(req.query);
  const result = await videoService.listVideos(query);
  return sendPaginated(res, result.items, result.pagination, 'Videos fetched successfully');
}

// GET /videos/:id
export async function getVideoById(req: Request, res: Response) {
  const { id } = videoIdParamSchema.parse(req.params);
  const video = await videoService.getVideoById(id);
  return sendSuccess(res, video, 'Video fetched successfully');
}

// POST /videos
export async function createVideo(req: Request, res: Response) {
  const input = createVideoSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const video = await videoService.createVideo(input, req.auth.id);
  return sendSuccess(res, video, 'Video created successfully', 201);
}

// PATCH /videos/:id
export async function updateVideo(req: Request, res: Response) {
  const { id } = videoIdParamSchema.parse(req.params);
  const input = updateVideoSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const video = await videoService.updateVideo(id, input, req.auth.id);
  return sendSuccess(res, video, 'Video updated successfully');
}

// DELETE /videos/:id
export async function deleteVideo(req: Request, res: Response) {
  const { id } = videoIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await videoService.deleteVideo(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}