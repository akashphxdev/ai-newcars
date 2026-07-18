// src/modules/ai/imagePool/imagePool.types.ts

import type { AiFeatureCode } from '../ai.constants';

export interface AiImagePoolUploaderSummary {
  id: number;
  name: string;
}

export interface AiImagePoolRecord {
  id: number;
  featureKey: AiFeatureCode;
  imageUrl: string;
  originalFilename: string | null;
  isUsed: boolean;
  usedForId: number | null;
  usedAt: Date | null;
  uploadedBy: number | null;
  uploadedByAdmin: AiImagePoolUploaderSummary | null;
  createdAt: Date;
}