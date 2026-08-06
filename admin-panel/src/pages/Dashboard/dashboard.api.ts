// src/pages/Dashboard/dashboard.api.ts
import { api } from "../../store/baseApi";

export interface DashboardKpis {
  totalBrands: number;
  totalModels: number;
  totalVariants: number;
  totalUsedCarListings: number;
  totalUsers: number;
  totalAdmins: number;
}

export type LeadTypeKey = "sellCar" | "buyNewCar" | "buyUsedCar" | "insurance" | "loan" | "softLead" | "priceDropAlert";

export interface LeadTypeCount {
  type: LeadTypeKey;
  count: number;
}

export interface DashboardTrendPoint {
  date: string;
  count: number;
}

export interface DashboardLeads {
  byType: LeadTypeCount[];
  total: number;
  trend: DashboardTrendPoint[];
}

export interface DashboardContent {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalStoryGroups: number;
  totalReviews: number;
  pendingReviews: number;
  totalFaqs: number;
}

export interface DashboardAds {
  activeCampaigns: number;
  activePlacements: number;
  impressionsToday: number;
  clicksToday: number;
}

export interface SeoPageTypeCount {
  pageType: number;
  count: number;
}

export interface DashboardSeo {
  staticCovered: number;
  dynamicByType: SeoPageTypeCount[];
}

export interface DashboardAiSnapshot {
  activeAutomations: number;
  totalFeatures: number;
  pendingReviewTotal: number;
}

export interface DashboardActivityItem {
  id: string;
  adminName: string;
  description: string | null;
  createdAt: string;
}

export interface DashboardPendingActions {
  reviewsPending: number;
  articleCommentsFlagged: number;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  leads: DashboardLeads;
  content: DashboardContent;
  ads: DashboardAds;
  seo: DashboardSeo;
  ai: DashboardAiSnapshot;
  recentActivity: DashboardActivityItem[];
  pendingActions: DashboardPendingActions;
}

interface DashboardRawResponse {
  success: true;
  data: DashboardSummary;
}

// Polled at a relaxed interval — this is an overview screen, not a live
// scheduler monitor like ai/dashboard (which polls every 20s), so a
// minute is plenty to feel "fresh" without hammering ~20 count queries.
const POLL_INTERVAL_MS = 60_000;

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => ({ url: "/dashboard", method: "GET" }),
      transformResponse: (res: DashboardRawResponse) => res.data,
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
export { POLL_INTERVAL_MS };
