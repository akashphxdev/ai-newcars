// src/modules/ai/automationRule/automationRule.types.ts

import type { AiFeatureCode } from '../ai.constants';

export interface AiAutomationRuleResponse {
  id: number;
  featureKey: AiFeatureCode;
  enabled: boolean;
  frequencyMinutes: number;
  countPerRun: number;
  imageFolder: string | null;
  autoPickImages: boolean;
  autoDelete: boolean;
  keepLatest: number | null;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}
