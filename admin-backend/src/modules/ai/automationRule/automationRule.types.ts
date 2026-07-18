// src/modules/ai/automationRule/automationRule.types.ts

import type { AiFeatureCode } from '../ai.constants';

export interface AiAutomationRuleResponse {
  id: number;
  featureKey: AiFeatureCode;
  enabled: boolean;
  frequencyMinutes: number;
  countPerRun: number;
  language: string;
  autoPublish: boolean;
  maxTotal: number | null;
  imageFolder: string | null;
  autoPickImages: boolean;
  autoDelete: boolean;
  keepLatest: number | null;
  deleteStrategy: string;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}