// src/modules/ai/dashboard/dashboard.types.ts

import type { AiFeatureCode } from '../ai.constants';

export interface AiDashboardFeatureStatus {
  featureKey: AiFeatureCode;
  built: boolean; // false only for SEO Generator (3) today — no module exists yet
  enabled: boolean;
  frequencyMinutes: number | null;
  countPerRun: number | null;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  isError: boolean; // true when this feature's most recent AiLog row is a FAILED one
  lastLogMessage: string | null;
  lastLogAt: Date | null;
  generatedToday: number;
  pendingReview: number;
}

export interface AiDashboardActivityItem {
  id: string; // AiLog.id is a BigInt — stringified for JSON transport
  featureKey: AiFeatureCode;
  action: string;
  status: number;
  message: string;
  createdAt: Date;
}

export interface AiDashboardTrendPoint {
  date: string; // YYYY-MM-DD, oldest first
  count: number;
}

export interface AiDashboardSummary {
  activeAutomations: number;
  totalFeatures: number;
  generatedToday: number;
  pendingReviewTotal: number;
  imagesUnusedInPool: number;
  autoDeletedToday: number;
  features: AiDashboardFeatureStatus[];
  recentActivity: AiDashboardActivityItem[];
  trend: AiDashboardTrendPoint[];
}
