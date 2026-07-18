// src/modules/ai/dashboard/dashboard.service.ts
//
// Read-only aggregation for the AI Studio dashboard — pulls live status
// from AiAutomationRule + AiLog + each feature's own review-queue table,
// no writes happen here.

import { prisma } from '@/prisma/client';
import { AI_FEATURE_CODES, type AiFeatureCode } from '../ai.constants';
import type {
  AiDashboardFeatureStatus,
  AiDashboardSummary,
  AiDashboardTrendPoint,
} from './dashboard.types';

const AI_LOG_STATUS = { SUCCESS: 1, FAILED: 2 } as const;
const AI_ITEM_STATUS_PENDING = 1;

// Only Article (1), Story (2) and FAQ (4) have an actual generator
// module today — SEO (3) has no ai_seo table yet, so it's reported as
// "not built" instead of forced into a fake running/paused state.
const BUILT_FEATURE_KEYS = new Set<number>([1, 2, 4]);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getGeneratedTodayCount(featureKey: number, since: Date): Promise<number> {
  switch (featureKey) {
    case 1:
      return prisma.aiArticle.count({ where: { createdAt: { gte: since } } });
    case 2:
      return prisma.aiStoryItem.count({ where: { createdAt: { gte: since } } });
    case 4:
      return prisma.aiFaq.count({ where: { createdAt: { gte: since } } });
    default:
      return 0;
  }
}

async function getPendingReviewCount(featureKey: number): Promise<number> {
  switch (featureKey) {
    case 1:
      return prisma.aiArticle.count({ where: { status: AI_ITEM_STATUS_PENDING } });
    case 2:
      return prisma.aiStoryItem.count({ where: { status: AI_ITEM_STATUS_PENDING } });
    case 4:
      return prisma.aiFaq.count({ where: { status: AI_ITEM_STATUS_PENDING } });
    default:
      return 0;
  }
}

async function getFeatureStatus(featureKey: AiFeatureCode, since: Date): Promise<AiDashboardFeatureStatus> {
  const built = BUILT_FEATURE_KEYS.has(featureKey);

  const [rule, lastLog, generatedToday, pendingReview] = await Promise.all([
    prisma.aiAutomationRule.findUnique({
      where: { featureKey },
      select: { enabled: true, frequencyMinutes: true, countPerRun: true, nextRunAt: true, lastRunAt: true },
    }),
    prisma.aiLog.findFirst({
      where: { featureKey },
      orderBy: { createdAt: 'desc' },
      select: { message: true, status: true, createdAt: true },
    }),
    built ? getGeneratedTodayCount(featureKey, since) : Promise.resolve(0),
    built ? getPendingReviewCount(featureKey) : Promise.resolve(0),
  ]);

  return {
    featureKey,
    built,
    enabled: rule?.enabled ?? false,
    frequencyMinutes: rule?.frequencyMinutes ?? null,
    countPerRun: rule?.countPerRun ?? null,
    nextRunAt: rule?.nextRunAt ?? null,
    lastRunAt: rule?.lastRunAt ?? null,
    isError: lastLog?.status === AI_LOG_STATUS.FAILED,
    lastLogMessage: lastLog?.message ?? null,
    lastLogAt: lastLog?.createdAt ?? null,
    generatedToday,
    pendingReview,
  };
}

const TREND_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 10;

export async function getDashboardSummary(): Promise<AiDashboardSummary> {
  const since = startOfToday();
  const trendStart = new Date(since);
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1)); // + today = TREND_DAYS total

  const [features, recentLogs, imagesUnusedInPool, autoDeleteLogsToday, trendLogs] = await Promise.all([
    Promise.all(AI_FEATURE_CODES.map((featureKey) => getFeatureStatus(featureKey, since))),
    prisma.aiLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT,
      select: { id: true, featureKey: true, action: true, status: true, message: true, createdAt: true },
    }),
    prisma.aiImagePool.count({ where: { isUsed: false } }),
    prisma.aiLog.findMany({
      where: { action: 'auto-delete', status: AI_LOG_STATUS.SUCCESS, createdAt: { gte: since } },
      select: { meta: true },
    }),
    prisma.aiLog.findMany({
      where: { action: 'generate', status: AI_LOG_STATUS.SUCCESS, createdAt: { gte: trendStart } },
      select: { meta: true, createdAt: true },
    }),
  ]);

  const autoDeletedToday = autoDeleteLogsToday.reduce((sum, row) => {
    const meta = row.meta as { deletedCount?: number } | null;
    return sum + (typeof meta?.deletedCount === 'number' ? meta.deletedCount : 0);
  }, 0);

  // Bucket generate-success logs by day for the trend line — an audit
  // log's volume is small enough that grouping in JS is simpler and
  // safer than a raw-SQL date_trunc query.
  const trendMap = new Map<string, number>();
  for (let i = 0; i < TREND_DAYS; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() - (TREND_DAYS - 1 - i));
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of trendLogs) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (!trendMap.has(key)) continue;
    const meta = row.meta as { count?: number } | null;
    const contribution = typeof meta?.count === 'number' ? meta.count : 1;
    trendMap.set(key, (trendMap.get(key) ?? 0) + contribution);
  }
  const trend: AiDashboardTrendPoint[] = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  return {
    activeAutomations: features.filter((f) => f.enabled).length,
    totalFeatures: AI_FEATURE_CODES.length,
    generatedToday: features.reduce((sum, f) => sum + f.generatedToday, 0),
    pendingReviewTotal: features.reduce((sum, f) => sum + f.pendingReview, 0),
    imagesUnusedInPool,
    autoDeletedToday,
    features,
    recentActivity: recentLogs.map((row) => ({
      id: row.id.toString(),
      featureKey: row.featureKey as AiFeatureCode,
      action: row.action,
      status: row.status,
      message: row.message,
      createdAt: row.createdAt,
    })),
    trend,
  };
}
