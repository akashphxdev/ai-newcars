// src/modules/public/articles/article/article.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { PublicArticleDetail, PublicArticleCategory } from './article.types';
import type { PublicHomeArticleRecord } from '@/modules/public/home/article/article.types';
import type { RelatedArticlesQueryParsed } from './article.validation';

export interface PaginatedArticles {
  items: PublicHomeArticleRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const PUBLIC_ARTICLE_SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  readTimeMinutes: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
} as const;

const PUBLIC_ARTICLE_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  body: true,
  coverImageUrl: true,
  readTimeMinutes: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
  ogImageUrl: true,
} as const;

// Powers the News nav dropdown — every active category, alphabetical.
export async function listArticleCategories(): Promise<PublicArticleCategory[]> {
  return prisma.articleCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
}

// Matches only when ALL of these hold: the article itself is
// published+active, AND its category is active — a de-activated category
// hides every article under it from the public site even if the article
// row itself is still "published".
export async function getPublicArticleBySlug(
  categorySlug: string,
  articleSlug: string,
): Promise<PublicArticleDetail> {
  const article = await prisma.article.findFirst({
    where: {
      slug: articleSlug,
      status: 'published',
      isActive: true,
      category: { slug: categorySlug, isActive: true },
    },
    select: PUBLIC_ARTICLE_DETAIL_SELECT,
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  return { ...article, publishedAt: article.publishedAt?.toISOString() ?? null };
}

// "More from this category" widget AND the /news/[categorySlug] listing
// page both go through here — same category, active, published, and
// (when reading a specific article) excludes that one via its slug.
// Page-based pagination (skip/take + a total count) so the listing page
// can offer "Load more" without ever pulling the whole category at once.
export async function listRelatedArticles(categorySlug: string, query: RelatedArticlesQueryParsed): Promise<PaginatedArticles> {
  const { exclude, limit, page } = query;

  const where: Prisma.ArticleWhereInput = {
    status: 'published',
    isActive: true,
    category: { slug: categorySlug, isActive: true },
    ...(exclude ? { slug: { not: exclude } } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: PUBLIC_ARTICLE_SUMMARY_SELECT,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    items: articles.map((article) => ({ ...article, publishedAt: article.publishedAt?.toISOString() ?? null })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}
