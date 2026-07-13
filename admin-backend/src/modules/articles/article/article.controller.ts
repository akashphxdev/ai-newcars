// src/modules/articles/article/article.controller.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as articleService from './article.service';
import {
  articleListQuerySchema,
  articleIdParamSchema,
  createArticleSchema,
  updateArticleSchema,
  updateArticleStatusSchema,
} from './article.validation';

export async function getArticles(req: Request, res: Response) {
  const query = articleListQuerySchema.parse(req.query);
  const result = await articleService.listArticles(query);
  return sendPaginated(res, result.items, result.pagination, 'Articles fetched successfully');
}

export async function getArticleById(req: Request, res: Response) {
  const { id } = articleIdParamSchema.parse(req.params);
  const article = await articleService.getArticleById(id);
  return sendSuccess(res, article, 'Article fetched successfully');
}

// Cover image is optional on create — a draft can be saved without one
// and have it added later via the dedicated /:id/cover-image route.
export async function createArticle(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  try {
    const input = createArticleSchema.parse(req.body);
    const article = await articleService.createArticle(input, req.auth.id, req.file?.filename);
    return sendSuccess(res, article, 'Article created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('articles', req.file.filename));
    }
    throw err;
  }
}

export async function updateArticle(req: Request, res: Response) {
  const { id } = articleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  try {
    const input = updateArticleSchema.parse(req.body);
    const article = await articleService.updateArticle(id, input, req.auth.id);

    // If a new cover image rode along with this update, apply it after
    // the main fields save successfully.
    if (req.file) {
      const updated = await articleService.uploadArticleCoverImage(id, req.file.filename, req.auth.id);
      return sendSuccess(res, { ...article, coverImageUrl: updated.coverImageUrl }, 'Article updated successfully');
    }

    return sendSuccess(res, article, 'Article updated successfully');
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('articles', req.file.filename));
    }
    throw err;
  }
}

export async function updateArticleStatus(req: Request, res: Response) {
  const { id } = articleIdParamSchema.parse(req.params);
  const input = updateArticleStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const article = await articleService.updateArticleStatus(id, input, req.auth.id);
  return sendSuccess(res, article, 'Article status updated successfully');
}

export async function uploadArticleCoverImage(req: Request, res: Response) {
  const { id } = articleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "coverImage")');
  }

  const article = await articleService.uploadArticleCoverImage(id, req.file.filename, req.auth.id);
  return sendSuccess(res, article, 'Article cover image updated successfully');
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = articleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await articleService.deleteArticle(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}

// ── Rich-text editor content images ──────────────────────────────────
// These back the embedded Editor component (components/common/Editor) —
// images pasted/dropped/inserted *inside* an article's body, as opposed
// to the one-per-article coverImageUrl handled above. Deliberately not
// tied to a specific article id: the editor can upload an image before
// the article itself has been saved (e.g. while still filling out a
// brand-new draft).
export async function uploadArticleContentImage(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "image")');
  }

  const url = buildPublicPath('articles/content', req.file.filename);
  return sendSuccess(res, { url }, 'Image uploaded successfully', 201);
}

const deleteContentImageSchema = z.object({ path: z.string().trim().min(1) });

export async function deleteArticleContentImage(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const { path } = deleteContentImageSchema.parse(req.body);
  // Best-effort — the editor calls this when an image is removed from
  // the body while drafting; a missing file (already gone, or never
  // actually saved) isn't an error worth surfacing to the admin.
  await deleteUploadedFile(path);
  return sendSuccess(res, null, 'Image deleted successfully');
}