// src/modules/assets/asset.validation.ts

import { z } from 'zod';

// Every folder the generic endpoint may write to. This is an allowlist,
// not a format check, and that is the point: `folder` arrives from the
// request and is concatenated into a filesystem path, so anything other
// than an exact match against a known value risks a traversal out of the
// storage root.
//
// The first sixteen mirror the folders the per-module uploaders already
// use (see buildPublicPath call sites); the rest are for the generic
// endpoint's own use.
export const ASSET_FOLDERS = [
  'ad-campaigns',
  'ai-pool',
  'articles',
  'articles/content',
  'banners',
  'bodytypes',
  'brands',
  'car-images',
  'car-model-covers',
  'cities',
  'colors',
  'lenders',
  'offers',
  'story-groups',
  'story-items',
  'testimonials',
  'brochures',
  'documents',
  'misc',
] as const;

export const uploadAssetSchema = z.object({
  folder: z.enum(ASSET_FOLDERS),
});

export const deleteAssetSchema = z.object({
  path: z.string().trim().min(1, 'path is required'),
});

export type UploadAssetParsed = z.infer<typeof uploadAssetSchema>;
export type DeleteAssetParsed = z.infer<typeof deleteAssetSchema>;
