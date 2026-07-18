// src/modules/ai/aiFaq/aiFaq.types.ts

import type { AiFaqStatusCode, AiProviderCode } from '../ai.constants';

export interface AiFaqModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface AiFaqAdminSummary {
  id: number;
  name: string;
}

export interface AiFaqRecord {
  id: number;
  modelId: number;
  model: AiFaqModelSummary;
  question: string;
  answer: string;
  status: AiFaqStatusCode;
  aiProvider: AiProviderCode;
  aiModel: string;
  publishedFaqId: number | null;
  reviewedBy: number | null;
  reviewedByAdmin: AiFaqAdminSummary | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}