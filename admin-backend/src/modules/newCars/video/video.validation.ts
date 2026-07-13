// src/modules/newCars/video/video.validation.ts

import { z } from 'zod';

// Numeric codes only — labels live on the frontend
// (front/src/lib/lookups.ts's VIDEO_TYPE_OPTIONS). Backend just needs
// to know which codes are currently valid. Same convention as
// offer.validation.ts's OFFER_TYPE_CODES.
//   1 = Review, 2 = Teaser, 3 = Walkaround, 4 = Comparison,
//   5 = Launch, 6 = Other
export const VIDEO_TYPE_CODES = [1, 2, 3, 4, 5, 6] as const;

// Create/update arrive as multipart FormData (the thumbnail file rides
// along), which serializes booleans as the strings "true"/"false" —
// plain z.boolean() rejects those outright. Also fixes the list-query
// isActive filter, where plain z.coerce.boolean() incorrectly coerces
// the STRING "false" to `true`. Same fix as brand.validation.ts /
// offer.validation.ts's `booleanish`.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const videoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  videoType: z.coerce.number().int().optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['title', 'id', 'viewCount', 'publishedAt', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const videoIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Every field below is mandatory on BOTH create and update — same
// convention as faq.validation.ts: the frontend always submits the
// complete form, on both Add and Edit. Thumbnail is NOT part of this
// shape — it arrives as req.file via the upload middleware, not as a
// body field (same split as brand.validation.ts's logo).
const videoShape = {
  modelId: z.coerce.number().int().positive('modelId is required'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  videoType: z.coerce
    .number()
    .int()
    .refine((v) => (VIDEO_TYPE_CODES as readonly number[]).includes(v), 'Invalid videoType code'),
  videoUrl: z.string().trim().url('Video URL must be a valid URL').max(255),
  durationSeconds: z.coerce
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be greater than 0'),
  publishedAt: z.coerce.date({
    required_error: 'Publish date is required',
    invalid_type_error: 'Publish date must be a valid date',
  }),
  isActive: booleanish,
};

export const createVideoSchema = z.object(videoShape);

export const updateVideoSchema = z.object(videoShape);

// Lightweight row-level Active/Inactive toggle — separate from the full
// create/update shape so flipping the switch doesn't need the whole form.
export const updateVideoStatusSchema = z.object({
  isActive: booleanish,
});

export type VideoListQueryParsed = z.infer<typeof videoListQuerySchema>;
export type CreateVideoParsed = z.infer<typeof createVideoSchema>;
export type UpdateVideoParsed = z.infer<typeof updateVideoSchema>;
export type UpdateVideoStatusParsed = z.infer<typeof updateVideoStatusSchema>;
export type VideoTypeCode = (typeof VIDEO_TYPE_CODES)[number];