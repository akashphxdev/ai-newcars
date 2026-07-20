// src/modules/home/banner/banner.validation.ts

import { z } from 'zod';

// Numeric codes only — labels live on the frontend
// (front/src/lib/lookups.ts's BANNER_MEDIA_TYPE_OPTIONS). Backend just
// needs to know which codes are currently valid. Same convention as
// offer.validation.ts's OFFER_TYPE_CODES.
//   1 = Image, 2 = Video
export const BANNER_MEDIA_TYPE_CODES = [1, 2] as const;

// FormData (multipart, used on create since a media file rides along)
// serializes booleans as the strings "true"/"false" — plain z.boolean()
// rejects those outright. Same fix as brand.validation.ts's `booleanish`.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const bannerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'displayOrder', 'clickCount', 'createdAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const bannerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// mediaUrl (imageUrl/videoUrl) is never client-supplied — it always
// rides along as an uploaded file (create's `media` field / the
// dedicated media-upload route), same convention as storyItem's media.
const bannerShape = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  tagLabel: z.string().trim().min(1, 'Tag label is required').max(100),
  heading: z.string().trim().min(2, 'Heading must be at least 2 characters').max(200),
  highlightText: z.string().trim().min(1, 'Highlight text is required').max(150),
  description: z.string().trim().min(1, 'Description is required').max(300),
  mediaType: z.coerce
    .number()
    .int()
    .refine((v) => (BANNER_MEDIA_TYPE_CODES as readonly number[]).includes(v), 'Invalid mediaType code'),
  ctaText: z.string().trim().min(1, 'CTA text is required').max(50),
  ctaLink: z.string().trim().url('CTA link must be a valid URL').max(255),
  displayOrder: z.coerce.number().int().min(0, 'displayOrder must be 0 or greater').default(0),
  isActive: booleanish,
};

export const createBannerSchema = z.object(bannerShape);

// Full replace on every edit — same convention as offer.validation.ts /
// faq.validation.ts, not a partial PATCH. Media is NOT part of this
// shape — it has its own dedicated route (uploadBannerMedia), same
// split as offer's image.
export const updateBannerSchema = z.object(bannerShape);

// Lightweight row-level Active/Inactive toggle — separate from the full
// edit mutation, same pattern as offer.validation.ts's updateOfferStatusSchema.
export const updateBannerStatusSchema = z.object({
  isActive: booleanish,
});

// Body accompanying the dedicated media-upload route — the caller must
// say what kind of file it's sending since one field/route serves both
// image and video, same convention as storyItem's uploadStoryItemMediaSchema.
export const uploadBannerMediaSchema = z.object({
  mediaType: z.coerce
    .number()
    .int()
    .refine((v) => (BANNER_MEDIA_TYPE_CODES as readonly number[]).includes(v), 'Invalid mediaType code'),
});

export type BannerListQueryParsed = z.infer<typeof bannerListQuerySchema>;
export type CreateBannerParsed = z.infer<typeof createBannerSchema>;
export type UpdateBannerParsed = z.infer<typeof updateBannerSchema>;
export type UpdateBannerStatusParsed = z.infer<typeof updateBannerStatusSchema>;
export type UploadBannerMediaParsed = z.infer<typeof uploadBannerMediaSchema>;
export type BannerMediaTypeCode = (typeof BANNER_MEDIA_TYPE_CODES)[number];
