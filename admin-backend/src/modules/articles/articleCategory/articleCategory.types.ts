// src/modules/articles/articleCategory/articleCategory.types.ts

export interface ArticleCategoryListItem {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByAdmin: { id: number; name: string } | null;
  updatedByAdmin: { id: number; name: string } | null;
  articleCount: number;
}