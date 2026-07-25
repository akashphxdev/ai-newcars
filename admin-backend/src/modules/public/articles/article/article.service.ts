// src/modules/public/articles/article/article.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { PublicArticleDetail } from './article.types';
import type { PublicHomeArticleRecord } from '@/modules/public/home/article/article.types';
import type { RelatedArticlesQueryParsed } from './article.validation';

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

// "More from this category" — same category, active, published, and
// (when reading a specific article) excludes that one via its slug.
export async function listRelatedArticles(
  categorySlug: string,
  query: RelatedArticlesQueryParsed,
): Promise<PublicHomeArticleRecord[]> {
  const { exclude, limit } = query;

  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      isActive: true,
      category: { slug: categorySlug, isActive: true },
      ...(exclude ? { slug: { not: exclude } } : {}),
    },
    select: PUBLIC_ARTICLE_SUMMARY_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  return articles.map((article) => ({ ...article, publishedAt: article.publishedAt?.toISOString() ?? null }));
}
