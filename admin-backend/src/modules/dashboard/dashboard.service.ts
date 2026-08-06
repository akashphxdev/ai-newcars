// src/modules/dashboard/dashboard.service.ts
//
// Read-only aggregation for the main admin dashboard — every number here
// comes from a count()/groupBy() against existing tables, no writes.
// AI Studio numbers are reused from ai/dashboard's own summary instead of
// re-querying the same tables a second time (see getAiSnapshot below).

import { prisma } from '@/prisma/client';
import { getDashboardSummary as getAiDashboardSummary } from '../ai/dashboard/dashboard.service';
import { SEO_PAGE_TYPE_CODES, STATIC_PAGE_TYPE } from '../seo/seoMeta/seoMeta.validation';
import { startOfToday, toLocalDateKey } from '@/core/utils/dateRanges';
import type {
  DashboardSummary,
  DashboardTraffic,
  DashboardTrendPoint,
  LeadTypeCount,
  SeoPageTypeCount,
} from './dashboard.types';

const TREND_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 15;
const REVIEW_STATUS_PENDING = 'pending';
const ARTICLE_STATUS_PUBLISHED = 'published';
const ARTICLE_STATUS_DRAFT = 'draft';
const AD_CAMPAIGN_STATUS_ACTIVE = 'active';

async function getKpis() {
  const [totalBrands, totalModels, totalVariants, totalUsedCarListings, totalUsers, totalAdmins] = await Promise.all([
    prisma.brand.count(),
    prisma.carModel.count(),
    prisma.carVariant.count(),
    prisma.usedCarListing.count(),
    prisma.user.count(),
    prisma.adminUser.count(),
  ]);

  return { totalBrands, totalModels, totalVariants, totalUsedCarListings, totalUsers, totalAdmins };
}

// Every lead table has its own `createdAt` — queried independently (they
// aren't a shared parent table) and merged in JS, same convention as
// ai/dashboard/dashboard.service.ts's trend bucketing.
async function getLeads(trendStart: Date) {
  const [
    sellCarCount, buyNewCarCount, buyUsedCarCount, insuranceCount, loanCount, softLeadCount, priceDropCount,
    sellCarDates, buyNewCarDates, buyUsedCarDates, insuranceDates, loanDates, softLeadDates, priceDropDates,
  ] = await Promise.all([
    prisma.sellCarLead.count(),
    prisma.buyNewCarLead.count(),
    prisma.buyUsedCarLead.count(),
    prisma.insuranceLead.count(),
    prisma.loanLead.count(),
    prisma.softLead.count(),
    prisma.priceDropAlertLead.count(),
    prisma.sellCarLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.buyNewCarLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.buyUsedCarLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.insuranceLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.loanLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.softLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.priceDropAlertLead.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
  ]);

  const byType: LeadTypeCount[] = [
    { type: 'sellCar', count: sellCarCount },
    { type: 'buyNewCar', count: buyNewCarCount },
    { type: 'buyUsedCar', count: buyUsedCarCount },
    { type: 'insurance', count: insuranceCount },
    { type: 'loan', count: loanCount },
    { type: 'softLead', count: softLeadCount },
    { type: 'priceDropAlert', count: priceDropCount },
  ];

  const trendMap = new Map<string, number>();
  const since = startOfToday();
  for (let i = 0; i < TREND_DAYS; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() - (TREND_DAYS - 1 - i));
    trendMap.set(toLocalDateKey(d), 0);
  }
  for (const rows of [sellCarDates, buyNewCarDates, buyUsedCarDates, insuranceDates, loanDates, softLeadDates, priceDropDates]) {
    for (const row of rows) {
      const key = toLocalDateKey(row.createdAt);
      if (!trendMap.has(key)) continue;
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
  }
  const trend: DashboardTrendPoint[] = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  return {
    byType,
    total: byType.reduce((sum, t) => sum + t.count, 0),
    trend,
  };
}

// PageViewDailyStat is already bucketed by day (one row per page per
// day — see modules/public/analytics/pageView/pageView.public.service.ts's
// upsert), so a native groupBy+sum gets the daily total directly instead
// of the per-record JS bucketing getLeads needs above (lead tables have
// one row per lead, not pre-aggregated).
async function getTraffic(trendStart: Date): Promise<DashboardTraffic> {
  const [totalAgg, rows] = await Promise.all([
    prisma.pageViewDailyStat.aggregate({ _sum: { viewCount: true } }),
    prisma.pageViewDailyStat.groupBy({
      by: ['viewDate'],
      where: { viewDate: { gte: trendStart } },
      _sum: { viewCount: true },
    }),
  ]);

  const trendMap = new Map<string, number>();
  const since = startOfToday();
  for (let i = 0; i < TREND_DAYS; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() - (TREND_DAYS - 1 - i));
    trendMap.set(toLocalDateKey(d), 0);
  }
  for (const row of rows) {
    const key = toLocalDateKey(row.viewDate);
    if (!trendMap.has(key)) continue;
    trendMap.set(key, (trendMap.get(key) ?? 0) + (row._sum.viewCount ?? 0));
  }
  const trend: DashboardTrendPoint[] = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  return { total: totalAgg._sum.viewCount ?? 0, trend };
}

async function getContent() {
  const [totalArticles, publishedArticles, draftArticles, totalStoryGroups, totalReviews, pendingReviews, totalFaqs] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: ARTICLE_STATUS_PUBLISHED } }),
      prisma.article.count({ where: { status: ARTICLE_STATUS_DRAFT } }),
      prisma.storyGroup.count(),
      prisma.review.count(),
      prisma.review.count({ where: { status: REVIEW_STATUS_PENDING } }),
      prisma.carFaq.count(),
    ]);

  return { totalArticles, publishedArticles, draftArticles, totalStoryGroups, totalReviews, pendingReviews, totalFaqs };
}

async function getAds(since: Date) {
  const [activeCampaigns, activePlacements, impressionsToday, clicksToday] = await Promise.all([
    prisma.adCampaign.count({ where: { status: AD_CAMPAIGN_STATUS_ACTIVE } }),
    prisma.adPlacement.count({ where: { isActive: true } }),
    prisma.adImpression.count({ where: { viewedAt: { gte: since } } }),
    prisma.adClick.count({ where: { clickedAt: { gte: since } } }),
  ]);

  return { activeCampaigns, activePlacements, impressionsToday, clicksToday };
}

async function getSeo() {
  const [staticCovered, dynamicGroups] = await Promise.all([
    prisma.seoMeta.count({ where: { pageType: STATIC_PAGE_TYPE } }),
    prisma.seoMeta.groupBy({
      by: ['pageType'],
      where: { pageType: { not: STATIC_PAGE_TYPE } },
      _count: { _all: true },
    }),
  ]);

  const dynamicByType: SeoPageTypeCount[] = SEO_PAGE_TYPE_CODES.filter((code) => code !== STATIC_PAGE_TYPE).map(
    (pageType) => ({
      pageType,
      count: dynamicGroups.find((g) => g.pageType === pageType)?._count._all ?? 0,
    }),
  );

  return { staticCovered, dynamicByType };
}

async function getAiSnapshot() {
  const ai = await getAiDashboardSummary();
  return {
    activeAutomations: ai.activeAutomations,
    totalFeatures: ai.totalFeatures,
    pendingReviewTotal: ai.pendingReviewTotal,
  };
}

async function getRecentActivity() {
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: RECENT_ACTIVITY_LIMIT,
    select: { id: true, description: true, createdAt: true, admin: { select: { name: true } } },
  });

  return logs.map((log) => ({
    id: log.id.toString(),
    adminName: log.admin.name,
    description: log.description,
    createdAt: log.createdAt,
  }));
}

async function getPendingActions() {
  const reviewsPending = await prisma.review.count({ where: { status: REVIEW_STATUS_PENDING } });

  return { reviewsPending };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const since = startOfToday();
  const trendStart = new Date(since);
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));

  const [kpis, leads, traffic, content, ads, seo, ai, recentActivity, pendingActions] = await Promise.all([
    getKpis(),
    getLeads(trendStart),
    getTraffic(trendStart),
    getContent(),
    getAds(since),
    getSeo(),
    getAiSnapshot(),
    getRecentActivity(),
    getPendingActions(),
  ]);

  return { kpis, leads, traffic, content, ads, seo, ai, recentActivity, pendingActions };
}
