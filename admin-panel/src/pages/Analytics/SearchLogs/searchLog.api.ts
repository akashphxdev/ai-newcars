// src/pages/Analytics/SearchLogs/searchLog.api.ts
//
// RTK Query version — read-only analytics log, same pattern as
// Ads/Clicks/adClick.api.ts. No create/update mutation from the admin
// panel; rows are written by the public website's header search hitting
// the public GET /search/cars endpoint directly, not through this
// admin-authenticated slice.

import { api } from "../../../store/baseApi";

export interface SearchLogRecord {
  id: number;
  userId: number | null;
  user: { id: number; name: string } | null;
  searchQuery: string | null;
  resultsCount: number | null;
  pageUrl: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListSearchLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  noResultsOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "id" | "createdAt" | "resultsCount";
  sortOrder?: "asc" | "desc";
}

interface SearchLogListRawResponse {
  success: true;
  data: SearchLogRecord[];
  pagination: Pagination;
}

export interface SearchLogListResult {
  data: SearchLogRecord[];
  pagination: Pagination;
}

const SEARCH_LOG_LIST_TAG = { type: "SearchLog" as const, id: "LIST" };

export const searchLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSearchLogs: builder.query<SearchLogListResult, ListSearchLogsParams | void>({
      query: (params) => ({ url: "/analytics/search-logs", method: "GET", params: params ?? {} }),
      transformResponse: (res: SearchLogListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((l) => ({ type: "SearchLog" as const, id: l.id })), SEARCH_LOG_LIST_TAG]
          : [SEARCH_LOG_LIST_TAG],
    }),

    deleteSearchLog: builder.mutation<void, number>({
      query: (id) => ({ url: `/analytics/search-logs/${id}`, method: "DELETE" }),
      invalidatesTags: [SEARCH_LOG_LIST_TAG],
    }),
  }),
});

export const { useGetSearchLogsQuery, useDeleteSearchLogMutation } = searchLogApi;
