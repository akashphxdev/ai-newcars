// src/modules/articles/article/article.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  ArticleListQueryParsed,
  CreateArticleParsed,
  UpdateArticleParsed,
  UpdateArticleStatusParsed,
} from './article.validation';
import type { ArticleListItem, ArticleUploadCoverResult } from './article.types';

const ARTICLE_SELECT = {
  id: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
  authorId: true,
  author: { select: { id: true, name: true } },
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  title: true,
  slug: true,
  excerpt: true,
  body: true,
  coverImageUrl: true,
  readTimeMinutes: true,
  status: true,
  isActive: true,
  scheduledAt: true,
  publishedAt: true,
  viewCount: true,
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
  ogImageUrl: true,
  createdAt: true,
  updatedAt: true,
  articleBrands: { select: { brand: { select: { id: true, name: true } } } },
  articleCarModels: { select: { model: { select: { id: true, name: true } } } },
} as const;

function shapeArticle<
  T extends {
    articleBrands: { brand: { id: number; name: string } }[];
    articleCarModels: { model: { id: number; name: string } }[];
  },
>(article: T): Omit<T, 'articleBrands' | 'articleCarModels'> & ArticleListItem {
  const { articleBrands, articleCarModels, ...rest } = article;
  return {
    ...rest,
    brands: articleBrands.map((ab) => ab.brand),
    models: articleCarModels.map((am) => am.model),
  } as Omit<T, 'articleBrands' | 'articleCarModels'> & ArticleListItem;
}

async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.article.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`An article with the slug "${slug}" already exists`);
  }
}

async function assertCategoryExists(categoryId: number) {
  const category = await prisma.articleCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw ApiError.badRequest('Selected category does not exist');
}

async function assertAuthorExists(authorId: number) {
  const author = await prisma.adminUser.findUnique({ where: { id: authorId }, select: { id: true } });
  if (!author) throw ApiError.badRequest('Selected author does not exist');
}

async function assertBrandsExist(brandIds: number[]) {
  if (brandIds.length === 0) return;
  const count = await prisma.brand.count({ where: { id: { in: brandIds } } });
  if (count !== brandIds.length) {
    throw ApiError.badRequest('One or more selected brands do not exist');
  }
}

async function assertModelsExist(modelIds: number[]) {
  if (modelIds.length === 0) return;
  const count = await prisma.carModel.count({ where: { id: { in: modelIds } } });
  if (count !== modelIds.length) {
    throw ApiError.badRequest('One or more selected car models do not exist');
  }
}

function resolvePublishedAt(status: string, existingPublishedAt: Date | null): Date | null {
  if (status === 'published') {
    return existingPublishedAt ?? new Date();
  }
  return existingPublishedAt;
}

export async function listArticles(query: ArticleListQueryParsed) {
  const { page, limit, search, categoryId, brandId, modelId, status, isActive, sortBy, sortOrder } = query;

  const where: Prisma.ArticleWhereInput = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(brandId ? { articleBrands: { some: { brandId } } } : {}),
    ...(modelId ? { articleCarModels: { some: { modelId } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: ARTICLE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: items.map(shapeArticle),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getArticleById(id: number) {
  const article = await prisma.article.findUnique({ where: { id }, select: ARTICLE_SELECT });
  if (!article) {
    throw ApiError.notFound('Article not found');
  }
  return shapeArticle(article);
}

export async function createArticle(
  input: CreateArticleParsed,
  actorId: number,
  coverImageFilename?: string,
  ipAddress?: string | null,
) {
  await assertCategoryExists(input.categoryId);
  await assertAuthorExists(input.authorId);
  await assertBrandsExist(input.brandIds);
  await assertModelsExist(input.modelIds);

  await assertSlugAvailable(input.slug);

  const publishedAt = resolvePublishedAt(input.status, null);

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.article.create({
      data: {
        categoryId: input.categoryId,
        authorId: input.authorId,
        createdBy: actorId,
        updatedBy: actorId,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        body: input.body,
        coverImageUrl: coverImageFilename ? buildPublicPath('articles', coverImageFilename) : null,
        readTimeMinutes: input.readTimeMinutes ?? null,
        status: input.status,
        isActive: input.isActive,
        scheduledAt: input.status === 'scheduled' ? input.scheduledAt : null,
        publishedAt,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        metaKeywords: input.metaKeywords ?? null,
        ogImageUrl: input.ogImageUrl ?? null,
      },
      select: { id: true },
    });

    if (input.brandIds.length > 0) {
      await tx.articleBrand.createMany({
        data: input.brandIds.map((brandId) => ({ articleId: created.id, brandId })),
      });
    }
    if (input.modelIds.length > 0) {
      await tx.articleCarModel.createMany({
        data: input.modelIds.map((modelId) => ({ articleId: created.id, modelId })),
      });
    }

    return tx.article.findUniqueOrThrow({ where: { id: created.id }, select: ARTICLE_SELECT });
  });

  await createLog({
    adminId: actorId,
    description: `Created article "${article.title}" (id ${article.id}, slug "${article.slug}")`,
    ipAddress,
  });

  return shapeArticle(article);
}

export async function updateArticle(
  id: number,
  input: UpdateArticleParsed,
  actorId: number,
  coverImageFilename?: string,
  ipAddress?: string | null,
) {
  const existing = await getArticleById(id);

  await assertCategoryExists(input.categoryId);
  await assertAuthorExists(input.authorId);
  await assertBrandsExist(input.brandIds);
  await assertModelsExist(input.modelIds);

  if (input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const publishedAt = resolvePublishedAt(input.status, existing.publishedAt);
  // Computed up front, applied inside the same transaction as the rest
  // of the fields below — a new cover image (if one rode along) is no
  // longer a separate, non-atomic DB write that could succeed/fail
  // independently of the article's other edits.
  const newCoverImageUrl = coverImageFilename ? buildPublicPath('articles', coverImageFilename) : undefined;

  const article = await prisma.$transaction(async (tx) => {
    await tx.article.update({
      where: { id },
      data: {
        categoryId: input.categoryId,
        authorId: input.authorId,
        updatedBy: actorId,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        body: input.body,
        readTimeMinutes: input.readTimeMinutes ?? null,
        status: input.status,
        isActive: input.isActive,
        scheduledAt: input.status === 'scheduled' ? input.scheduledAt : null,
        publishedAt,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        metaKeywords: input.metaKeywords ?? null,
        ogImageUrl: input.ogImageUrl ?? null,
        ...(newCoverImageUrl ? { coverImageUrl: newCoverImageUrl } : {}),
      },
    });

    // Full-replace the brand/model links to match the submitted sets —
    // simplest way to keep this in sync with a multi-select form that
    // always submits the complete list.
    await tx.articleBrand.deleteMany({ where: { articleId: id } });
    if (input.brandIds.length > 0) {
      await tx.articleBrand.createMany({
        data: input.brandIds.map((brandId) => ({ articleId: id, brandId })),
      });
    }

    await tx.articleCarModel.deleteMany({ where: { articleId: id } });
    if (input.modelIds.length > 0) {
      await tx.articleCarModel.createMany({
        data: input.modelIds.map((modelId) => ({ articleId: id, modelId })),
      });
    }

    return tx.article.findUniqueOrThrow({ where: { id }, select: ARTICLE_SELECT });
  });

  // Old cover file is orphaned only once the transaction above has
  // committed successfully with the new one — clean it up after, same
  // order-of-operations as uploadArticleCoverImage below.
  if (newCoverImageUrl && existing.coverImageUrl) {
    await deleteUploadedFile(existing.coverImageUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Updated article "${article.title}" (id ${article.id})`,
    ipAddress,
  });

  return shapeArticle(article);
}

export async function updateArticleStatus(
  id: number,
  input: UpdateArticleStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getArticleById(id);
  const publishedAt = resolvePublishedAt(input.status, existing.publishedAt);

  const article = await prisma.article.update({
    where: { id },
    data: {
      status: input.status,
      scheduledAt: input.status === 'scheduled' ? input.scheduledAt : null,
      publishedAt,
      updatedBy: actorId,
    },
    select: ARTICLE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Changed status of article "${article.title}" (id ${id}) to "${input.status}"`,
    ipAddress,
  });

  return shapeArticle(article);
}

export async function deleteArticle(id: number, actorId: number, ipAddress?: string | null) {
  const article = await getArticleById(id);

  // Article's FKs from article_brands/article_car_models/article_comments
  // are ON DELETE RESTRICT, so those rows must be cleared first or the
  // delete fails with a P2003 constraint error.
  await prisma.$transaction([
    prisma.articleBrand.deleteMany({ where: { articleId: id } }),
    prisma.articleCarModel.deleteMany({ where: { articleId: id } }),
    prisma.articleComment.deleteMany({ where: { articleId: id } }),
    prisma.article.delete({ where: { id } }),
  ]);

  if (article.coverImageUrl) {
    await deleteUploadedFile(article.coverImageUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Deleted article "${article.title}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Article deleted successfully' };
}

export async function uploadArticleCoverImage(
  id: number,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
): Promise<ArticleUploadCoverResult> {
  const existing = await getArticleById(id);

  const newCoverImageUrl = buildPublicPath('articles', savedFilename);

  const article = await prisma.article.update({
    where: { id },
    data: { coverImageUrl: newCoverImageUrl, updatedBy: actorId },
    select: { id: true, coverImageUrl: true },
  });

  if (existing.coverImageUrl) {
    await deleteUploadedFile(existing.coverImageUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Updated cover image for article "${existing.title}" (id ${id})`,
    ipAddress,
  });

  return article as ArticleUploadCoverResult;
}

export async function publishDueScheduledArticles(): Promise<number> {
  const due = await prisma.article.findMany({
    where: { status: 'scheduled', scheduledAt: { lte: new Date() } },
    select: { id: true, title: true },
  });

  if (due.length === 0) return 0;

  await prisma.article.updateMany({
    where: { id: { in: due.map((a) => a.id) } },
    data: { status: 'published', publishedAt: new Date(), scheduledAt: null },
  });

  return due.length;
}