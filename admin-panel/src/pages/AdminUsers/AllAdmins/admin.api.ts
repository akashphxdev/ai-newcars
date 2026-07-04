// src/pages/AdminUsers/admin.api.ts

import { api } from "../../../store/baseApi";

export interface AdminRecord {
  id: number;
  name: string;
  email: string;
  mobile: string;
  roleId: number;
  status: "active" | "inactive" | "suspended";
  accessStartDate: string | null;
  accessEndDate: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockType: string | null;
  lockedBy: number | null;
  lockedAt: string | null;
  lockedReason: string | null;
  unlockedBy: number | null;
  unlockedAt: string | null;
  createdBy: number | null;
  createdAt: string;
  role: {
    id: number;
    roleName: string;
  } | null;
  createdByAdmin: {
    id: number;
    name: string;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  status?: string;
  isLocked?: boolean;
  sortBy?: "createdAt" | "name" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateAdminInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
  roleId: number;
  status?: "active" | "inactive" | "suspended";
  accessStartDate?: string;
  accessEndDate?: string;
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  mobile?: string;
  roleId?: number;
  status?: "active" | "inactive" | "suspended";
  accessStartDate?: string;
  accessEndDate?: string;
}

interface AdminListRawResponse {
  success: true;
  data: AdminRecord[];
  pagination: Pagination;
}

interface AdminSingleRawResponse {
  success: true;
  data: AdminRecord;
}

export interface AdminListResult {
  data: AdminRecord[];
  pagination: Pagination;
}

const ADMIN_LIST_TAG = { type: "Admin" as const, id: "LIST" };

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<AdminListResult, ListAdminsParams>({
      query: (params) => ({ url: "/admin-users/admins", method: "GET", params }),
      transformResponse: (res: AdminListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((a) => ({ type: "Admin" as const, id: a.id })),
              ADMIN_LIST_TAG,
            ]
          : [ADMIN_LIST_TAG],
    }),

    getAdminById: builder.query<AdminRecord, number>({
      query: (id) => ({ url: `/admin-users/admins/${id}`, method: "GET" }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Admin", id }],
    }),

    createAdmin: builder.mutation<AdminRecord, CreateAdminInput>({
      query: (body) => ({ url: "/admin-users/admins", method: "POST", data: body }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      invalidatesTags: [ADMIN_LIST_TAG],
    }),

    updateAdmin: builder.mutation<AdminRecord, { id: number; input: UpdateAdminInput }>({
      query: ({ id, input }) => ({ url: `/admin-users/admins/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Admin", id }, ADMIN_LIST_TAG],
    }),

    // ADDED (kept from the old admin.api.ts): quick row-level status toggle,
    // lighter than sending the full edit payload.
    updateAdminStatus: builder.mutation<
      AdminRecord,
      { id: number; status: "active" | "inactive" | "suspended" }
    >({
      query: ({ id, status }) => ({ url: `/admin-users/admins/${id}/status`, method: "PATCH", data: { status } }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Admin", id }, ADMIN_LIST_TAG],
    }),

    changeAdminPassword: builder.mutation<{ message: string }, { id: number; newPassword: string }>({
      query: ({ id, newPassword }) => ({
        url: `/admin-users/admins/${id}/password`,
        method: "PATCH",
        data: { newPassword },
      }),
    }),

    lockAdmin: builder.mutation<AdminRecord, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/admin-users/admins/${id}/lock`, method: "PATCH", data: { reason } }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Admin", id }, ADMIN_LIST_TAG],
    }),

    unlockAdmin: builder.mutation<AdminRecord, number>({
      query: (id) => ({ url: `/admin-users/admins/${id}/unlock`, method: "PATCH", data: {} }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "Admin", id }, ADMIN_LIST_TAG],
    }),

    deactivateAdmin: builder.mutation<AdminRecord, number>({
      query: (id) => ({ url: `/admin-users/admins/${id}`, method: "DELETE" }),
      transformResponse: (res: AdminSingleRawResponse) => res.data,
      invalidatesTags: [ADMIN_LIST_TAG],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useGetAdminByIdQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useUpdateAdminStatusMutation,
  useChangeAdminPasswordMutation,
  useLockAdminMutation,
  useUnlockAdminMutation,
  useDeactivateAdminMutation,
} = adminApi;