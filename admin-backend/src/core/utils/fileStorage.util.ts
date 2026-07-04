// src/core/utils/fileStorage.util.ts
import fs from 'fs';
import path from 'path';
import { logger } from '@/core/utils/logger';

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

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