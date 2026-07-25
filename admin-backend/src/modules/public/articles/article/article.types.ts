// src/modules/public/articles/article/article.types.ts
//
// Public-safe full-article shape — no status/isActive/scheduledAt/
// createdBy/updatedBy/viewCount, only what the article detail page
// renders (content + SEO meta).

export interface PublicArticleDetail {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number | null;
  publishedAt: string | null;
  category: { id: number; name: string; slug: string };
  author: { id: number; name: string };
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImageUrl: string | null;
}
