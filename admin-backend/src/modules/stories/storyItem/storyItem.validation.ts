// backend/src/modules/stories/storyItem/storyItem.validation.ts

import { z } from 'zod';

export const MEDIA_TYPES = ['image', 'video'] as const;

export const STORY_ITEM_STATUSES = ['draft', 'published', 'scheduled'] as const;

export const storyItemListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  groupId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(STORY_ITEM_STATUSES).optional(),
  sortBy: z.enum(['id', 'displayOrder', 'viewCount', 'createdAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const storyItemIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// mediaUrl is never client-supplied — image and video both always ride
// along as an uploaded file (create's `media` field / the dedicated
// media-upload route), same convention as image already used before.
const storyItemShape = {
  groupId: z.coerce.number().int().positive('groupId is required'),
  mediaType: z.enum(MEDIA_TYPES, { required_error: 'mediaType is required' }),
  description: z.string().trim().max(300).nullable().optional(),
  link: z.string().trim().url('link must be a valid URL').max(255).nullable().optional(),
  status: z.enum(STORY_ITEM_STATUSES, { required_error: 'status is required' }).default('draft'),
  startAt: z.coerce.date().nullable().optional(),
  endAt: z.coerce.date().nullable().optional(),
  displayOrder: z.coerce.number({ required_error: 'displayOrder is required' }).int().min(0, 'displayOrder must be 0 or greater'),
};

export const createStoryItemSchema = z
  .object(storyItemShape)
  .refine((data) => !data.startAt || !data.endAt || data.startAt <= data.endAt, {
    message: 'startAt must be on or before endAt',
    path: ['endAt'],
  })
  .refine((data) => data.status !== 'scheduled' || !!data.startAt, {
    message: 'startAt is required when status is scheduled',
    path: ['startAt'],
  });

export const updateStoryItemSchema = createStoryItemSchema;

export const updateStoryItemStatusSchema = z
  .object({
    status: z.enum(STORY_ITEM_STATUSES, { required_error: 'status is required' }),
    startAt: z.coerce.date().nullable().optional(),
    endAt: z.coerce.date().nullable().optional(),
  })
  .refine((data) => !data.startAt || !data.endAt || data.startAt <= data.endAt, {
    message: 'startAt must be on or before endAt',
    path: ['endAt'],
  })
  .refine((data) => data.status !== 'scheduled' || !!data.startAt, {
    message: 'startAt is required when status is scheduled',
    path: ['startAt'],
  });

// Body accompanying the dedicated media-upload route — the caller must
// say what kind of file it's sending since one field/route now serves
// both image and video.
export const uploadStoryItemMediaSchema = z.object({
  mediaType: z.enum(MEDIA_TYPES, { required_error: 'mediaType is required' }),
});

export type StoryItemListQueryParsed = z.infer<typeof storyItemListQuerySchema>;
export type CreateStoryItemParsed = z.infer<typeof createStoryItemSchema>;
export type UpdateStoryItemParsed = z.infer<typeof updateStoryItemSchema>;
export type UpdateStoryItemStatusParsed = z.infer<typeof updateStoryItemStatusSchema>;
export type UploadStoryItemMediaParsed = z.infer<typeof uploadStoryItemMediaSchema>;
export type MediaType = (typeof MEDIA_TYPES)[number];
export type StoryItemStatus = (typeof STORY_ITEM_STATUSES)[number];
