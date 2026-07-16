// src/core/middleware/upload.middleware.ts

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { ApiError } from '@/core/errors/ApiError';
import { UPLOAD_ROOT } from '@/core/utils/fileStorage.util';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
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

export function imageUploader(folder: string) {
  return buildUploader(
    folder,
    IMAGE_EXTENSIONS,
    IMAGE_MAX_FILE_SIZE_BYTES,
    'Only JPG, PNG, or WEBP images are allowed',
  );
}

// Accepts either an image or a video in the same field — for modules
// where the admin picks a media type (image/video) and one file field
// covers both, e.g. story items' media and story groups' cover. Any
// future "image or video" field should reuse this instead of adding
// another multer config.
export function mediaUploader(folder: string) {
  return buildUploader(
    folder,
    { ...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS },
    MEDIA_MAX_FILE_SIZE_BYTES,
    'Only JPG, PNG, WEBP images or MP4, WEBM, MOV videos are allowed',
  );
}
