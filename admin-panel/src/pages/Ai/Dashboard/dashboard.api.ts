// src/pages/Ai/Dashboard/dashboard.api.ts
import { api } from "../../../store/baseApi";

export interface AiDashboardFeatureStatus {
  featureKey: number;
  built: boolean;
  enabled: boolean;
  frequencyMinutes: number | null;
  countPerRun: number | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  isError: boolean;
  lastLogMessage: string | null;
  lastLogAt: string | null;
  generatedToday: number;
  pendingReview: number;
}

export interface AiDashboardActivityItem {
  id: string;
  featureKey: number;
  action: string;
  status: number;
  message: string;
  createdAt: string;
}

export interface AiDashboardTrendPoint {
  date: string;
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

interface AiDashboardRawResponse {
  success: true;
  data: AiDashboardSummary;
}

// Polled rather than tag-invalidated — this reads live scheduler/log
// state that other mutations (approve/reject/publish elsewhere) have
// no reason to know about, so a short interval is simpler than wiring
// a cache tag into every AI module just for this one screen.
const POLL_INTERVAL_MS = 20_000;

export const aiDashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiDashboard: builder.query<AiDashboardSummary, void>({
      query: () => ({ url: "/ai/dashboard", method: "GET" }),
      transformResponse: (res: AiDashboardRawResponse) => res.data,
    }),
  }),
});

export const { useGetAiDashboardQuery } = aiDashboardApi;
export { POLL_INTERVAL_MS };
