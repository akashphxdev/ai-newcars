// src/modules/ai/aiStoryItem/aiStoryItem.types.ts

import type { AiStoryItemStatusCode, AiProviderCode } from '../ai.constants';

export interface AiStoryItemGroupSummary {
  id: number;
  title: string;
}

export interface AiStoryItemAdminSummary {
  id: number;
  name: string;
}

export interface AiStoryItemRecord {
  id: number;
  groupId: number;
  group: AiStoryItemGroupSummary;
  sourceImagePoolId: number;
  mediaType: string;
  mediaUrl: string;
  description: string;
  link: string | null;
  status: AiStoryItemStatusCode;
  aiProvider: AiProviderCode;
  aiModel: string;
  publishedStoryItemId: number | null;
  reviewedBy: number | null;
  reviewedByAdmin: AiStoryItemAdminSummary | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}
