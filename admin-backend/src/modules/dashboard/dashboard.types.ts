// src/modules/dashboard/dashboard.types.ts

export interface DashboardKpis {
  totalBrands: number;
  totalModels: number;
  totalVariants: number;
  totalUsedCarListings: number;
  totalUsers: number;
  totalAdmins: number;
}

export interface LeadTypeCount {
  type: 'sellCar' | 'buyNewCar' | 'buyUsedCar' | 'insurance' | 'loan' | 'softLead' | 'priceDropAlert';
  count: number;
}

export interface DashboardTrendPoint {
  date: string; // YYYY-MM-DD, oldest first
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
  id: string; // AdminLog.id is a BigInt — stringified for JSON transport
  adminName: string;
  description: string | null;
  createdAt: Date;
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
