// src/modules/public/home/article/article.types.ts
//
// Public-safe shape — no draft/scheduled fields, no createdBy/updatedBy
// audit trail, no SEO meta. Only what the website's Articles section
// needs to render a card.

export interface PublicHomeArticleRecord {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number | null;
  publishedAt: string | null;
  category: { id: number; name: string; slug: string };
  author: { id: number; name: string };
}
