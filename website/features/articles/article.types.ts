// features/articles/article.types.ts
//
// Mirrors admin-backend's PublicHomeArticleRecord (modules/public/home/article).

export interface HomeArticle {
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

// Mirrors admin-backend's PublicArticleDetail (modules/public/articles/article).
export interface ArticleDetail {
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
