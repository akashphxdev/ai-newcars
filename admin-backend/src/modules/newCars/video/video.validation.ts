// src/modules/newCars/video/video.validation.ts

import { z } from 'zod';
export const VIDEO_TYPES = ['review', 'teaser', 'walkaround', 'comparison', 'launch', 'other'] as const;

export const videoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  videoType: z.string().trim().optional(),
  sortBy: z.enum(['title', 'id', 'viewCount', 'publishedAt', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const videoIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const videoShape = {
  modelId: z.coerce.number().int().positive('modelId is required'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  videoType: z.string().trim().max(30).nullable().optional(),
  videoUrl: z.string().trim().url('Video URL must be a valid URL').max(255),
  thumbnailUrl: z.string().trim().url('Thumbnail URL must be a valid URL').max(255).nullable().optional(),
  durationSeconds: z.coerce.number().int().positive().nullable().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
};

export const createVideoSchema = z.object(videoShape);

export const updateVideoSchema = createVideoSchema;

export type VideoListQueryParsed = z.infer<typeof videoListQuerySchema>;
export type CreateVideoParsed = z.infer<typeof createVideoSchema>;
export type UpdateVideoParsed = z.infer<typeof updateVideoSchema>;
export type VideoTypeValue = (typeof VIDEO_TYPES)[number];