// src/modules/ai/log/aiLog.types.ts

import type { AiFeatureCode } from '../ai.constants';

// Mirrors createAiLog.ts's caller-defined status convention —
// 1 = success, 2 = failed (see AI_LOG_STATUS in aiFaq.service.ts,
// the only writer today).
export type AiLogStatusCode = 1 | 2;

export interface AiLogAdminSummary {
  id: number;
  name: string;
}

export interface AiLogRecord {
  id: number;
  featureKey: AiFeatureCode;
  action: string;
  status: AiLogStatusCode;
  message: string;
  meta: Record<string, unknown> | null;
  durationMs: number | null;
  createdBy: number | null;
  createdByAdmin: AiLogAdminSummary | null;
  createdAt: Date;
}