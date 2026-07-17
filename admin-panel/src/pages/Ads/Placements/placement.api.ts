// src/pages/Ads/Placements/placement.api.ts
//
// RTK Query version, same pattern as articleCategory.api.ts / country.api.ts.
// pageType/adType are numeric codes — see PAGE_TYPE_OPTIONS/AD_TYPE_OPTIONS
// in lib/lookups.ts for the code -> label mapping (mirrors the backend's
// PAGE_TYPE_CODES/AD_TYPE_CODES in adPlacement.validation.ts).

import { api } from "../../../store/baseApi";

export interface AdPlacementRecord {
  id: number;
  name: string;
  slug: string;
  pageType: number;
  adType: number;
  dimensions: string;
  isActive: boolean;
  campaignCount: number;
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

export interface ListAdPlacementsParams {
  page?: number;
  limit?: number;
  search?: string;
  pageType?: number;
  adType?: number;
  isActive?: boolean;
  sortBy?: "id" | "name" | "slug";
  sortOrder?: "asc" | "desc";
}

export interface CreateAdPlacementInput {
  name: string;
  slug: string;
  pageType: number;
  adType: number;
  dimensions: string;
  isActive?: boolean;
}

export interface UpdateAdPlacementInput {
  name: string;
  slug: string;
  pageType: number;
  adType: number;
  dimensions: string;
  isActive: boolean;
}

interface AdPlacementListRawResponse {
  success: true;
  data: AdPlacementRecord[];
  pagination: Pagination;
}

interface AdPlacementSingleRawResponse {
  success: true;
  data: AdPlacementRecord;
}

export interface AdPlacementListResult {
  data: AdPlacementRecord[];
  pagination: Pagination;
}

const AD_PLACEMENT_LIST_TAG = { type: "AdPlacement" as const, id: "LIST" };

export const adPlacementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdPlacements: builder.query<AdPlacementListResult, ListAdPlacementsParams | void>({
      query: (params) => ({ url: "/ads/placements", method: "GET", params: params ?? {} }),
      transformResponse: (res: AdPlacementListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: "AdPlacement" as const, id: p.id })),
              AD_PLACEMENT_LIST_TAG,
            ]
          : [AD_PLACEMENT_LIST_TAG],
    }),

    getAdPlacementById: builder.query<AdPlacementRecord, number>({
      query: (id) => ({ url: `/ads/placements/${id}`, method: "GET" }),
      transformResponse: (res: AdPlacementSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "AdPlacement", id }],
    }),

    createAdPlacement: builder.mutation<AdPlacementRecord, CreateAdPlacementInput>({
      query: (body) => ({ url: "/ads/placements", method: "POST", data: body }),
      transformResponse: (res: AdPlacementSingleRawResponse) => res.data,
      invalidatesTags: [AD_PLACEMENT_LIST_TAG],
    }),

    updateAdPlacement: builder.mutation<AdPlacementRecord, { id: number; input: UpdateAdPlacementInput }>({
      query: ({ id, input }) => ({ url: `/ads/placements/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AdPlacementSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdPlacement", id }, AD_PLACEMENT_LIST_TAG],
    }),

    updateAdPlacementStatus: builder.mutation<AdPlacementRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/ads/placements/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: AdPlacementSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdPlacement", id }, AD_PLACEMENT_LIST_TAG],
    }),

    deleteAdPlacement: builder.mutation<void, number>({
      query: (id) => ({ url: `/ads/placements/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdPlacement", id }, AD_PLACEMENT_LIST_TAG],
    }),
  }),
});

export const {
  useGetAdPlacementsQuery,
  useGetAdPlacementByIdQuery,
  useCreateAdPlacementMutation,
  useUpdateAdPlacementMutation,
  useUpdateAdPlacementStatusMutation,
  useDeleteAdPlacementMutation,
} = adPlacementApi;
