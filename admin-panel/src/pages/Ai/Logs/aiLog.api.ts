// src/pages/Ai/Logs/aiLog.api.ts
//
// Read-only, same pattern as Analytics/SearchLogs/searchLog.api.ts.
// Rows are written by the generator jobs themselves (backend's
// createAiLog.ts), never from the admin panel — so there is no create,
// update, or delete endpoint here.

import { api } from "../../../store/baseApi";

// 1 = success, 2 = failed. Mirrors AI_LOG_STATUS in the backend's
// aiFaq.service.ts, the only writer today.
export const AI_LOG_STATUS = {
  SUCCESS: 1,
  FAILED: 2,
} as const;

export const AI_LOG_STATUS_OPTIONS = [
  { value: AI_LOG_STATUS.SUCCESS, label: "Success" },
  { value: AI_LOG_STATUS.FAILED, label: "Failed" },
];

export interface AiLogRecord {
  id: number;
  // See AI_FEATURE_OPTIONS in lib/aiLookups.ts.
  featureKey: number;
  action: string;
  status: number;
  message: string;
  // Free-form context the job attached to this entry — shape varies by
  // feature, so it is rendered as JSON rather than typed per field.
  meta: Record<string, unknown> | null;
  durationMs: number | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAiLogsParams {
  page?: number;
  limit?: number;
  featureKey?: number;
  status?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortOrder?: "asc" | "desc";
}

interface AiLogListRawResponse {
  success: true;
  data: AiLogRecord[];
  pagination: Pagination;
}

export interface AiLogListResult {
  data: AiLogRecord[];
  pagination: Pagination;
}

const AI_LOG_LIST_TAG = { type: "AiLog" as const, id: "LIST" };

export const aiLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiLogs: builder.query<AiLogListResult, ListAiLogsParams | void>({
      query: (params) => ({ url: "/ai/logs", method: "GET", params: params ?? {} }),
      transformResponse: (res: AiLogListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((l) => ({ type: "AiLog" as const, id: l.id })), AI_LOG_LIST_TAG]
          : [AI_LOG_LIST_TAG],
    }),
  }),
});

export const { useGetAiLogsQuery } = aiLogApi;
