// src/modules/ai/aiArticle/aiArticle.types.ts

import type { AiArticleStatusCode, AiProviderCode } from '../ai.constants';

export interface AiArticleCategorySummary {
  id: number;
  name: string;
  slug: string;
}

export interface AiArticleBrandSummary {
  id: number;
  name: string;
}

export interface AiArticleModelSummary {
  id: number;
  name: string;
}

export interface AiArticleAdminSummary {
  id: number;
  name: string;
}

export interface AiArticleRecord {
  id: number;
  categoryId: number;
  category: AiArticleCategorySummary;
  brandId: number;
  brand: AiArticleBrandSummary;
  modelId: number | null;
  model: AiArticleModelSummary | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  sourceImagePoolId: number;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  status: AiArticleStatusCode;
  aiProvider: AiProviderCode;
  aiModel: string;
  publishedArticleId: number | null;
  reviewedBy: number | null;
  reviewedByAdmin: AiArticleAdminSummary | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}
