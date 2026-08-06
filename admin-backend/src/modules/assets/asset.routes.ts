// src/modules/assets/asset.routes.ts

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { assetUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { ApiError } from '@/core/errors/ApiError';
import { uploadAssets, deleteAsset } from './asset.controller';
import { ASSET_FOLDERS, uploadAssetSchema } from './asset.validation';

const router = Router();

router.use(requireAuth(['admin']));

const MAX_FILES_PER_REQUEST = 20;

// multer decides the destination directory before any body field is
// parsed, so the target folder has to arrive in the query string rather
// than the multipart body. One uploader is built per allowed folder at
// startup instead of per request — constructing multer on every upload
// would allocate a new disk-storage engine each time for no benefit.
const uploadersByFolder = new Map<string, RequestHandler[]>(
  ASSET_FOLDERS.map((folder) => [folder, assetUploader(folder).array('files', MAX_FILES_PER_REQUEST)]),
);

// Validates ?folder= against the allowlist, then hands off to that
// folder's uploader. Rejecting here means an unknown folder never
// reaches multer, so no file is written before the check.
const dispatchUploader = (req: Request, res: Response, next: NextFunction) => {
  const parsed = uploadAssetSchema.safeParse({ folder: req.query.folder });
  if (!parsed.success) {
    return next(
      ApiError.badRequest(
        `Invalid or missing "folder" query parameter. Allowed: ${ASSET_FOLDERS.join(', ')}`,
      ),
    );
  }

  // The controller reads the folder from params; the request never had
  // one, so it is set here now that the value is known to be safe.
  req.params.folder = parsed.data.folder;

  const handlers = uploadersByFolder.get(parsed.data.folder)!;
  let i = 0;
  const runNext = (err?: unknown): void => {
    if (err) return next(err);
    if (i >= handlers.length) return next();
    const handler = handlers[i++];
    handler(req, res, runNext);
  };
  runNext();
};

// POST /assets?folder=brands — accepts images, video, and documents in a
// "files" field, one or many.
router.post('/', requirePermission('assets.create'), dispatchUploader, asyncHandler(uploadAssets));

router.delete('/', requirePermission('assets.delete'), asyncHandler(deleteAsset));

export default router;
