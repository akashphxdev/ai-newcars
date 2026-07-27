// src/pages/Users/AllUsers/user.api.ts

import { api } from "../../../store/baseApi";

export interface UserRecord {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  cityId: number | null;
  city: { id: number; name: string } | null;
  isVerified: boolean;
  status: "active" | "inactive" | "suspended";
  failedLoginAttempts: number;
  isLocked: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isLocked?: boolean;
  sortBy?: "createdAt" | "name" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

interface UserListRawResponse {
  success: true;
  data: UserRecord[];
  pagination: Pagination;
  newToday: number;
}

interface UserSingleRawResponse {
  success: true;
  data: UserRecord;
}

export interface UserListResult {
  data: UserRecord[];
  pagination: Pagination;
  newToday: number;
}

const USER_LIST_TAG = { type: "User" as const, id: "LIST" };

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserListResult, ListUsersParams>({
      query: (params) => ({ url: "/users", method: "GET", params }),
      transformResponse: (res: UserListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
        newToday: res.newToday,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((u) => ({ type: "User" as const, id: u.id })), USER_LIST_TAG]
          : [USER_LIST_TAG],
    }),

    updateUserStatus: builder.mutation<UserRecord, { id: number; status: "active" | "inactive" | "suspended" }>({
      query: ({ id, status }) => ({ url: `/users/${id}/status`, method: "PATCH", data: { status } }),
      transformResponse: (res: UserSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }, USER_LIST_TAG],
    }),

    lockUser: builder.mutation<UserRecord, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/users/${id}/lock`, method: "PATCH", data: { reason } }),
      transformResponse: (res: UserSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }, USER_LIST_TAG],
    }),

    unlockUser: builder.mutation<UserRecord, number>({
      query: (id) => ({ url: `/users/${id}/unlock`, method: "PATCH", data: {} }),
      transformResponse: (res: UserSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "User", id }, USER_LIST_TAG],
    }),

    deleteUser: builder.mutation<UserRecord, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      transformResponse: (res: UserSingleRawResponse) => res.data,
      invalidatesTags: [USER_LIST_TAG],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  useLockUserMutation,
  useUnlockUserMutation,
  useDeleteUserMutation,
} = userApi;
