// src/modules/articles/article/article.types.ts

export interface ArticleTagRef {
  id: number;
  name: string;
}

export interface ArticleListItem {
  id: number;
  categoryId: number;
  category: { id: number; name: string; slug: string };
  authorId: number;
  author: { id: number; name: string };
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number | null;
  status: string;
  isActive: boolean;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  brands: ArticleTagRef[];
  models: ArticleTagRef[];
}

export interface ArticleUploadCoverResult {
  id: number;
  coverImageUrl: string;
}