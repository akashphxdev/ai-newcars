// src/pages/Seo/SeoRedirects/seoRedirect.api.ts
//
// RTK Query version, same pattern as Ads/Placements/placement.api.ts.

import { api } from "../../../store/baseApi";

export type RedirectType = 301 | 302;

export interface SeoRedirectRecord {
  id: number;
  oldPath: string;
  newPath: string;
  redirectType: RedirectType;
  isActive: boolean;
  createdBy: number | null;
  createdByAdmin: { id: number; name: string } | null;
  createdAt: string;
  updatedBy: number | null;
  updatedByAdmin: { id: number; name: string } | null;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListSeoRedirectsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "id" | "oldPath" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateSeoRedirectInput {
  oldPath: string;
  newPath: string;
  redirectType: RedirectType;
  isActive?: boolean;
}

export interface UpdateSeoRedirectInput {
  oldPath: string;
  newPath: string;
  redirectType: RedirectType;
  isActive: boolean;
}

interface SeoRedirectListRawResponse {
  success: true;
  data: SeoRedirectRecord[];
  pagination: Pagination;
}

interface SeoRedirectSingleRawResponse {
  success: true;
  data: SeoRedirectRecord;
}

export interface SeoRedirectListResult {
  data: SeoRedirectRecord[];
  pagination: Pagination;
}

const SEO_REDIRECT_LIST_TAG = { type: "SeoRedirect" as const, id: "LIST" };

export const seoRedirectApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSeoRedirects: builder.query<SeoRedirectListResult, ListSeoRedirectsParams | void>({
      query: (params) => ({ url: "/seo/redirects", method: "GET", params: params ?? {} }),
      transformResponse: (res: SeoRedirectListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "SeoRedirect" as const, id: r.id })), SEO_REDIRECT_LIST_TAG]
          : [SEO_REDIRECT_LIST_TAG],
    }),

    getSeoRedirectById: builder.query<SeoRedirectRecord, number>({
      query: (id) => ({ url: `/seo/redirects/${id}`, method: "GET" }),
      transformResponse: (res: SeoRedirectSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "SeoRedirect", id }],
    }),

    createSeoRedirect: builder.mutation<SeoRedirectRecord, CreateSeoRedirectInput>({
      query: (body) => ({ url: "/seo/redirects", method: "POST", data: body }),
      transformResponse: (res: SeoRedirectSingleRawResponse) => res.data,
      invalidatesTags: [SEO_REDIRECT_LIST_TAG],
    }),

    updateSeoRedirect: builder.mutation<SeoRedirectRecord, { id: number; input: UpdateSeoRedirectInput }>({
      query: ({ id, input }) => ({ url: `/seo/redirects/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: SeoRedirectSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "SeoRedirect", id }, SEO_REDIRECT_LIST_TAG],
    }),

    updateSeoRedirectStatus: builder.mutation<SeoRedirectRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/seo/redirects/${id}/status`, method: "PATCH", data: { isActive } }),
      transformResponse: (res: SeoRedirectSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "SeoRedirect", id }, SEO_REDIRECT_LIST_TAG],
    }),

    deleteSeoRedirect: builder.mutation<void, number>({
      query: (id) => ({ url: `/seo/redirects/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "SeoRedirect", id }, SEO_REDIRECT_LIST_TAG],
    }),
  }),
});

export const {
  useGetSeoRedirectsQuery,
  useGetSeoRedirectByIdQuery,
  useCreateSeoRedirectMutation,
  useUpdateSeoRedirectMutation,
  useUpdateSeoRedirectStatusMutation,
  useDeleteSeoRedirectMutation,
} = seoRedirectApi;
