// src/pages/AdminLogs/adminLog.api.ts

import { api } from "../../../store/baseApi";

export interface AdminLogRecord {
  id: string; // BigInt serialized as string by the backend
  adminId: number;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAdminLogsParams {
  page?: number;
  limit?: number;
  adminId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortOrder?: "asc" | "desc";
}

interface AdminLogListRawResponse {
  success: true;
  data: AdminLogRecord[];
  pagination: Pagination;
}

export interface AdminLogListResult {
  data: AdminLogRecord[];
  pagination: Pagination;
}

const ADMIN_LOG_LIST_TAG = { type: "AdminLog" as const, id: "LIST" };

export const adminLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminLogs: builder.query<AdminLogListResult, ListAdminLogsParams>({
      query: (params) => ({ url: "/admin-users/admin-logs", method: "GET", params }),
      transformResponse: (res: AdminLogListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((log) => ({ type: "AdminLog" as const, id: log.id })),
              ADMIN_LOG_LIST_TAG,
            ]
          : [ADMIN_LOG_LIST_TAG],
    }),
  }),
});

export const { useGetAdminLogsQuery } = adminLogApi;