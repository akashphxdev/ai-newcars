// src/modules/public/home/article/article.service.ts

import { prisma } from '@/prisma/client';
import type { HomeArticleListQueryParsed } from './article.validation';
import type { PublicHomeArticleRecord } from './article.types';

const HOME_ARTICLE_SELECT = {
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

// Only "published" + isActive articles are public — draft/scheduled
// pieces stay invisible even though they already exist in the table.
export async function listHomeArticles(query: HomeArticleListQueryParsed): Promise<PublicHomeArticleRecord[]> {
  const { limit } = query;

  const articles = await prisma.article.findMany({
    where: { status: 'published', isActive: true },
    select: HOME_ARTICLE_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  return articles.map((article) => ({
    ...article,
    publishedAt: article.publishedAt?.toISOString() ?? null,
  }));
}
