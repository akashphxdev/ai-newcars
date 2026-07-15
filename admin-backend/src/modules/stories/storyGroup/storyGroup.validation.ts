// src/modules/stories/storyGroup/storyGroup.validation.ts

import { z } from 'zod';

export const MEDIA_TYPES = ['image', 'video'] as const;

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const storyGroupListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'title', 'displayOrder', 'viewCount', 'createdAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const storyGroupIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const storyGroupShape = {
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100),
  coverMediaType: z.enum(MEDIA_TYPES, { required_error: 'coverMediaType is required' }),
  coverMediaUrl: z.string().trim().url('coverMediaUrl must be a valid URL').max(255).optional(),
  // No .default() — displayOrder is now unique per story group (see
  // @@unique([displayOrder]) on StoryGroup in schema.prisma), so every
  // create/update must supply an explicit value. Omitting it coerces to
  // NaN and fails the int() check below rather than silently landing on 0.
  displayOrder: z.coerce.number({ required_error: 'displayOrder is required' }).int().min(0, 'displayOrder must be 0 or greater'),
  isActive: booleanish,
};

export const createStoryGroupSchema = z
  .object(storyGroupShape)
  .refine((data) => data.coverMediaType !== 'video' || !!data.coverMediaUrl, {
    message: 'coverMediaUrl (a valid URL) is required when coverMediaType is video',
    path: ['coverMediaUrl'],
  });

export const updateStoryGroupSchema = createStoryGroupSchema;

export const updateStoryGroupStatusSchema = z.object({
  isActive: booleanish,
});

export type StoryGroupListQueryParsed = z.infer<typeof storyGroupListQuerySchema>;
export type CreateStoryGroupParsed = z.infer<typeof createStoryGroupSchema>;
export type UpdateStoryGroupParsed = z.infer<typeof updateStoryGroupSchema>;
export type UpdateStoryGroupStatusParsed = z.infer<typeof updateStoryGroupStatusSchema>;
export type MediaType = (typeof MEDIA_TYPES)[number];