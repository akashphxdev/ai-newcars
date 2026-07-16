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

// coverMediaUrl is never client-supplied — image and video both always
// ride along as an uploaded file (create's `cover` field / the
// dedicated cover-upload route), same convention as image already used
// before.
const storyGroupShape = {
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100),
  coverMediaType: z.enum(MEDIA_TYPES, { required_error: 'coverMediaType is required' }),
  // No .default() — displayOrder is now unique per story group (see
  // @@unique([displayOrder]) on StoryGroup in schema.prisma), so every
  // create/update must supply an explicit value. Omitting it coerces to
  // NaN and fails the int() check below rather than silently landing on 0.
  displayOrder: z.coerce.number({ required_error: 'displayOrder is required' }).int().min(0, 'displayOrder must be 0 or greater'),
  isActive: booleanish,
};

export const createStoryGroupSchema = z.object(storyGroupShape);

export const updateStoryGroupSchema = createStoryGroupSchema;

export const updateStoryGroupStatusSchema = z.object({
  isActive: booleanish,
});

// Body accompanying the dedicated cover-upload route — the caller must
// say what kind of file it's sending since one field/route now serves
// both image and video.
export const uploadStoryGroupCoverSchema = z.object({
  coverMediaType: z.enum(MEDIA_TYPES, { required_error: 'coverMediaType is required' }),
});

export type StoryGroupListQueryParsed = z.infer<typeof storyGroupListQuerySchema>;
export type CreateStoryGroupParsed = z.infer<typeof createStoryGroupSchema>;
export type UpdateStoryGroupParsed = z.infer<typeof updateStoryGroupSchema>;
export type UpdateStoryGroupStatusParsed = z.infer<typeof updateStoryGroupStatusSchema>;
export type UploadStoryGroupCoverParsed = z.infer<typeof uploadStoryGroupCoverSchema>;
export type MediaType = (typeof MEDIA_TYPES)[number];
