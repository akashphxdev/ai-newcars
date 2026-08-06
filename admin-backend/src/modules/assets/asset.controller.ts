// src/modules/assets/asset.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile, toPublicUrl } from '@/core/utils/fileStorage.util';
import { createLog } from '@/core/utils/createLog';
import { getClientIp } from '@/core/utils/getClientIp';
import { deleteAssetSchema } from './asset.validation';

// Shape returned for every uploaded file.
//
// `path` is the canonical value and the only one that belongs in a
// database column — it stays host-relative so the CDN hostname is never
// baked into stored data. `url` is the same path resolved against
// ASSET_PUBLIC_BASE_URL, provided so the admin panel can preview an
// upload immediately without rebuilding it client-side.
function describeFile(file: Express.Multer.File, folder: string) {
  const path = buildPublicPath(folder, file.filename);
  return {
    path,
    url: toPublicUrl(path),
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  };
}

// POST /assets/:folder
export async function uploadAssets(req: Request, res: Response) {
  const folder = req.params.folder;
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];

  if (files.length === 0) {
    throw ApiError.badRequest('No file uploaded — send one or more files in the "files" field');
  }

  const assets = files.map((file) => describeFile(file, folder));

  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Uploaded ${assets.length} asset(s) to "${folder}": ${assets
        .map((a) => a.filename)
        .join(', ')}`,
      ipAddress: getClientIp(req),
    });
  }

  return sendSuccess(res, assets, 'Asset(s) uploaded successfully', 201);
}

// DELETE /assets
//
// Takes the stored path rather than an id because assets are not a table
// — they are referenced by whatever column happens to hold the path. The
// caller is responsible for clearing that column first; deleteUploadedFile
// refuses anything outside the storage root and treats an
// already-missing file as success.
export async function deleteAsset(req: Request, res: Response) {
  const { path } = deleteAssetSchema.parse(req.body);

  await deleteUploadedFile(path);

  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Deleted asset "${path}"`,
      ipAddress: getClientIp(req),
    });
  }

  return sendSuccess(res, { path }, 'Asset deleted successfully');
}
