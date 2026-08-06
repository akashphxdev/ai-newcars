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

// Documents accepted by the generic /assets endpoint (brochures, price
// lists, spec sheets). Deliberately excludes SVG: an SVG can carry
// inline <script>, and anything served from static.timesauto.net would
// execute it on that origin. If SVG is ever needed, it must be served
// with Content-Disposition: attachment, not inlined.
const DOCUMENT_EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
};

const IMAGE_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MEDIA_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB — covers video
const DOCUMENT_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// Leading bytes for the formats accepted above. multer's fileFilter can
// only see the Content-Type the client claims, which is trivially
// spoofed — a .exe announced as image/png passes it. These signatures
// are checked against the bytes actually written, so the file has to be
// what it says it is.
//
// Container formats are matched on the part that is fixed: MP4/MOV carry
// a 4-byte size prefix before "ftyp", and DOCX/XLSX are ZIP archives.
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],
  'image/avif': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  'video/mp4': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  'video/quicktime': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  'video/webm': [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
  'application/msword': [{ offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] }],
  'application/vnd.ms-excel': [{ offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0] }],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { offset: 0, bytes: [0x50, 0x4b] },
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { offset: 0, bytes: [0x50, 0x4b] },
  ],
  // text/csv has no signature — content validation is not possible, and
  // a mislabelled CSV is inert anyway since it is never executed.
};

async function hasExpectedSignature(filePath: string, mimetype: string): Promise<boolean> {
  const checks = MAGIC_BYTES[mimetype];
  if (!checks) return true;

  const maxEnd = Math.max(...checks.map((c) => c.offset + c.bytes.length));
  const buf = Buffer.alloc(maxEnd);

  const handle = await fs.promises.open(filePath, 'r');
  try {
    const { bytesRead } = await handle.read(buf, 0, maxEnd, 0);
    if (bytesRead < maxEnd) return false;
  } finally {
    await handle.close();
  }

  return checks.every((c) => c.bytes.every((b, i) => buf[c.offset + i] === b));
}

// Runs before the AVIF step so a rejected file never reaches sharp.
const verifyUploadedFileSignatures: RequestHandler = async (req, _res, next) => {
  const files: Express.Multer.File[] = req.file
    ? [req.file]
    : Array.isArray(req.files)
      ? req.files
      : [];

  for (const file of files) {
    if (await hasExpectedSignature(file.path, file.mimetype)) continue;

    // Remove every file from this request, not just the bad one — a
    // partially-accepted multi-file upload would leave orphans on disk
    // that no database row points at.
    await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
    logger.warn(`[upload.middleware] Rejected "${file.originalname}": content does not match ${file.mimetype}`);
    return next(ApiError.badRequest(`File "${file.originalname}" is not a valid ${file.mimetype} file`));
  }

  next();
};

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
      verifyUploadedFileSignatures,
      convertUploadedImagesToAvif,
    ],
    array: (fieldName: string, maxCount?: number): RequestHandler[] => [
      uploader.array(fieldName, maxCount),
      verifyUploadedFileSignatures,
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

// Backs the generic /assets endpoint: every type the project accepts, in
// one uploader, so a caller uploading a brochure does not need its own
// multer config. Images still route through the AVIF conversion; videos
// and documents pass through untouched.
export function assetUploader(folder: string) {
  return withAvifConversion(
    buildUploader(
      folder,
      { ...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS, ...DOCUMENT_EXTENSIONS },
      MEDIA_MAX_FILE_SIZE_BYTES,
      'Unsupported file type — allowed: JPG, PNG, WEBP, AVIF, MP4, WEBM, MOV, PDF, DOC, DOCX, XLS, XLSX, CSV',
    ),
  );
}

export function documentUploader(folder: string) {
  return withAvifConversion(
    buildUploader(
      folder,
      DOCUMENT_EXTENSIONS,
      DOCUMENT_MAX_FILE_SIZE_BYTES,
      'Only PDF, DOC, DOCX, XLS, XLSX, or CSV documents are allowed',
    ),
  );
}
