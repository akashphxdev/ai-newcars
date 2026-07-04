// src/core/middleware/upload.middleware.ts

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { ApiError } from '@/core/errors/ApiError';
import { UPLOAD_ROOT } from '@/core/utils/fileStorage.util';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}

export function imageUploader(folder: string) {
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
      cb(null, `${unique}${extensionFor(file.mimetype)}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(ApiError.badRequest('Only JPG, PNG, or WEBP images are allowed'));
      }
      cb(null, true);
    },
  });
}