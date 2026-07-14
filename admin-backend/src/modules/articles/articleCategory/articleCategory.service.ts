// src/modules/articles/articleCategory/articleCategory.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  ArticleCategoryListQueryParsed,
  CreateArticleCategoryParsed,
  UpdateArticleCategoryParsed,
} from './articleCategory.validation';

const ARTICLE_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: { select: { id: true, name: true } },
  updatedByAdmin: { select: { id: true, name: true } },
  _count: { select: { articles: true } },
} as const;

function shapeCategory<T extends { _count: { articles: number } }>(category: T) {
  const { _count, ...rest } = category;
  return { ...rest, articleCount: _count.articles };
}

async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.articleCategory.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`An article category with the slug "${slug}" already exists`);
  }
}

export async function listArticleCategories(query: ArticleCategoryListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.ArticleCategoryWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.articleCategory.findMany({
      where,
      select: ARTICLE_CATEGORY_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.articleCategory.count({ where }),
  ]);

  return {
    items: items.map(shapeCategory),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getArticleCategoryById(id: number) {
  const category = await prisma.articleCategory.findUnique({
    where: { id },
    select: ARTICLE_CATEGORY_SELECT,
  });

  if (!category) {
    throw ApiError.notFound('Article category not found');
  }

  return shapeCategory(category);
}

export async function createArticleCategory(input: CreateArticleCategoryParsed, actorId: number) {
  await assertSlugAvailable(input.slug);

  const category = await prisma.articleCategory.create({
    data: {
      name: input.name,
      slug: input.slug,
      isActive: input.isActive,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: ARTICLE_CATEGORY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created article category "${category.name}" (id ${category.id}, slug "${category.slug}")`,
  });

  return shapeCategory(category);
}

export async function updateArticleCategory(
  id: number,
  input: UpdateArticleCategoryParsed,
  actorId: number,
) {
  const existing = await getArticleCategoryById(id);

  if (input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const category = await prisma.articleCategory.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      isActive: input.isActive,
      updatedBy: actorId,
    },
    select: ARTICLE_CATEGORY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated article category "${category.name}" (id ${category.id})`,
  });

  return shapeCategory(category);
}

export async function updateArticleCategoryStatus(id: number, isActive: boolean, actorId: number) {
  const existing = await getArticleCategoryById(id);

  const category = await prisma.articleCategory.update({
    where: { id },
    data: { isActive, updatedBy: actorId },
    select: ARTICLE_CATEGORY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} article category "${existing.name}" (id ${id})`,
  });

  return shapeCategory(category);
}

export async function deleteArticleCategory(id: number, actorId: number) {
  const category = await getArticleCategoryById(id);

  const articleCount = await prisma.article.count({ where: { categoryId: id } });
  if (articleCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this category — ${articleCount} article(s) are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.articleCategory.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted article category "${category.name}" (id ${id})`,
  });

  return { message: 'Article category deleted successfully' };
}