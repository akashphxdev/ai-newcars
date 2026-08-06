// src/core/utils/fileStorage.util.ts
import fs from 'fs';
import path from 'path';
import { env } from '@/config/env';
import { logger } from '@/core/utils/logger';

// Where files physically land. ASSET_STORAGE_ROOT points this at the
// volume nginx publishes as static.timesauto.net; unset, it falls back
// to ./uploads so local development needs no configuration.
//
// The public path written to the database is NOT affected by this — it
// stays "/uploads/<folder>/<file>" regardless of where the bytes live,
// so moving storage never requires rewriting existing rows.
export const UPLOAD_ROOT = env.assetStorageRoot
  ? path.resolve(env.assetStorageRoot)
  : path.join(process.cwd(), 'uploads');

// Resolves a stored path to the absolute URL a browser should request.
// Returns the path unchanged when no CDN origin is configured, which is
// what keeps local development working against the API's own /uploads
// static mount.
export function toPublicUrl(publicPath: string): string {
  if (!env.assetPublicBaseUrl || /^https?:\/\//i.test(publicPath)) {
    return publicPath;
  }
  return `${env.assetPublicBaseUrl}${publicPath.startsWith('/') ? publicPath : `/${publicPath}`}`;
}

function resolveUploadPath(publicPath: string): string | null {
  const relative = publicPath.replace(/^\/?uploads\//, '');
  const absolute = path.resolve(UPLOAD_ROOT, relative);

  if (!absolute.startsWith(UPLOAD_ROOT + path.sep)) {
    return null;
  }
  return absolute;
}

export function buildPublicPath(folder: string, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}

// Duplicates an already-uploaded file into a different folder under
// uploads/ and returns its new public path — used when AI-generated
// content moves from the shared ai-pool staging folder into the same
// folder a manually-created record's file would live in (e.g. on
// publish). Copy-then-caller-deletes-the-old-one (not a bare rename)
// so a failure between this call and the DB write that references the
// new path leaves the original file intact — same "update DB first,
// clean up the old file only after it succeeds" ordering already used
// by uploadArticleCoverImage/uploadCityLogo/uploadBrandLogo.
export async function copyUploadedFile(publicPath: string, newFolder: string): Promise<string> {
  const absoluteOld = resolveUploadPath(publicPath);
  if (!absoluteOld) {
    throw new Error(`Cannot copy file — path outside uploads root: ${publicPath}`);
  }
  const filename = path.basename(absoluteOld);
  const newDir = path.join(UPLOAD_ROOT, newFolder);
  await fs.promises.mkdir(newDir, { recursive: true });
  const absoluteNew = path.join(newDir, filename);
  await fs.promises.copyFile(absoluteOld, absoluteNew);
  return buildPublicPath(newFolder, filename);
}

export async function deleteUploadedFile(publicPath?: string | null): Promise<void> {
  if (!publicPath) return;

  if (!publicPath.startsWith('/uploads/') && !publicPath.startsWith('uploads/')) {
    return;
  }

  const absolutePath = resolveUploadPath(publicPath);
  if (!absolutePath) {
    logger.warn(`[fileStorage] Refused to delete path outside uploads root: ${publicPath}`);
    return;
  }

  try {
    await fs.promises.unlink(absolutePath);
  } catch (err) {
    // ENOENT = file already gone — not an error worth surfacing.
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      logger.error(`[fileStorage] Failed to delete file "${absolutePath}": ${
        err instanceof Error ? err.message : String(err)
      }`);
    }
  }
}