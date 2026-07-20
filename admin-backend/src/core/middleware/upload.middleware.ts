// src/core/middleware/upload.middleware.ts

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import { RequestHandler } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { logger } from '@/core/utils/logger';
import { UPLOAD_ROOT } from '@/core/utils/fileStorage.util';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const IMAGE_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MEDIA_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB — covers video

// Shared multer factory — builds a disk-storage uploader scoped to
// `folder` under UPLOAD_ROOT, restricted to `extensionsByMime`'s keys
// and `maxFileSizeBytes`. imageUploader/mediaUploader below are just
// this with a different mime allowlist/size cap, so any future media
// kind reuses this instead of a hand-rolled multer config.
function buildUploader(
  folder: string,
  extensionsByMime: Record<string, string>,
  maxFileSizeBytes: number,
  rejectMessage: string,
) {
  const destination = path.join(UPLOAD_ROOT, folder);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      // Created lazily on first upload — same idea as the rest of this
      // codebase not requiring manual setup steps before a feature works.
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      cb(null, `${unique}${extensionsByMime[file.mimetype] ?? ''}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSizeBytes },
    fileFilter: (_req, file, cb) => {
      if (!extensionsByMime[file.mimetype]) {
        return cb(ApiError.badRequest(rejectMessage));
      }
      cb(null, true);
    },
  });
}

const AVIF_QUALITY = 65;

// Runs after multer has already saved the file(s) to disk — re-encodes
// every just-uploaded IMAGE (videos from mediaUploader are left alone)
// to AVIF in place, then rewrites req.file/req.files' filename/path/
// mimetype to point at the new .avif file. Every module's controller/
// service only ever reads `req.file.filename` (via buildPublicPath) to
// build the DB URL, so this makes every image upload across the whole
// project serve as AVIF automatically, with zero changes needed in any
// individual module.
const convertUploadedImagesToAvif: RequestHandler = async (req, _res, next) => {
  const files: Express.Multer.File[] = req.file
    ? [req.file]
    : Array.isArray(req.files)
      ? req.files
      : [];

  for (const file of files) {
    // Already AVIF, or not an image at all (video from mediaUploader) —
    // nothing to convert.
    if (!file.mimetype.startsWith('image/') || file.mimetype === 'image/avif') {
      continue;
    }

    const avifFilename = file.filename.replace(path.extname(file.filename), '.avif');
    const avifPath = path.join(path.dirname(file.path), avifFilename);

    try {
      await sharp(file.path).avif({ quality: AVIF_QUALITY }).toFile(avifPath);
      await fs.promises.unlink(file.path);
      file.filename = avifFilename;
      file.path = avifPath;
      file.mimetype = 'image/avif';
    } catch (err) {
      // Conversion failed — fall back to the original upload rather
      // than blocking the request; the admin still gets a working
      // (just unoptimized) image instead of a hard failure.
      logger.error(
        `[upload.middleware] AVIF conversion failed for ${file.filename}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      await fs.promises.unlink(avifPath).catch(() => {});
    }
  }

  next();
};

// Thin wrapper so every imageUploader/mediaUploader call site keeps
// working unchanged (`.single('field')` / `.array('field', max)`) while
// also running the AVIF conversion step right after multer saves the
// file — Express flattens middleware arrays automatically, so returning
// [multerHandler, convertUploadedImagesToAvif] here needs no route-file
// changes anywhere.
function withAvifConversion(uploader: multer.Multer) {
  return {
    single: (fieldName: string): RequestHandler[] => [
      uploader.single(fieldName),
      convertUploadedImagesToAvif,
    ],
    array: (fieldName: string, maxCount?: number): RequestHandler[] => [
      uploader.array(fieldName, maxCount),
      convertUploadedImagesToAvif,
    ],
  };
}

export function imageUploader(folder: string) {
  return withAvifConversion(
    buildUploader(folder, IMAGE_EXTENSIONS, IMAGE_MAX_FILE_SIZE_BYTES, 'Only JPG, PNG, WEBP, or AVIF images are allowed'),
  );
}

// Accepts either an image or a video in the same field — for modules
// where the admin picks a media type (image/video) and one file field
// covers both, e.g. story items' media and story groups' cover. Any
// future "image or video" field should reuse this instead of adding
// another multer config.
export function mediaUploader(folder: string) {
  return withAvifConversion(
    buildUploader(
      folder,
      { ...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS },
      MEDIA_MAX_FILE_SIZE_BYTES,
      'Only JPG, PNG, WEBP, AVIF images or MP4, WEBM, MOV videos are allowed',
    ),
  );
}
