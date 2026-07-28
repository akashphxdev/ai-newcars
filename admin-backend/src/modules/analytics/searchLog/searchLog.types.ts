// src/modules/analytics/searchLog/searchLog.types.ts

export interface SearchLogUserSummary {
  id: number;
  name: string;
}

export interface SearchLogRecord {
  id: number;
  userId: number | null;
  user: SearchLogUserSummary | null;
  searchQuery: string | null;
  resultsCount: number | null;
  pageUrl: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  userAgent: string | null;
  createdAt: Date;
}
