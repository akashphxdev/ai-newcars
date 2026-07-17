// src/pages/Ads/Advertisers/advertiser.api.ts
//
// RTK Query version, same pattern as country.api.ts / articleCategory.api.ts.

import { api } from "../../../store/baseApi";

export interface AdvertiserRecord {
  id: number;
  name: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
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

export interface ListAdvertisersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "id" | "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateAdvertiserInput {
  name: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  isActive?: boolean;
}

export interface UpdateAdvertiserInput {
  name: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  isActive: boolean;
}

interface AdvertiserListRawResponse {
  success: true;
  data: AdvertiserRecord[];
  pagination: Pagination;
}

interface AdvertiserSingleRawResponse {
  success: true;
  data: AdvertiserRecord;
}

export interface AdvertiserListResult {
  data: AdvertiserRecord[];
  pagination: Pagination;
}

const ADVERTISER_LIST_TAG = { type: "Advertiser" as const, id: "LIST" };

export const advertiserApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdvertisers: builder.query<AdvertiserListResult, ListAdvertisersParams | void>({
      query: (params) => ({ url: "/ads/advertisers", method: "GET", params: params ?? {} }),
      transformResponse: (res: AdvertiserListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((a) => ({ type: "Advertiser" as const, id: a.id })),
              ADVERTISER_LIST_TAG,
            ]
          : [ADVERTISER_LIST_TAG],
    }),

    getAdvertiserById: builder.query<AdvertiserRecord, number>({
      query: (id) => ({ url: `/ads/advertisers/${id}`, method: "GET" }),
      transformResponse: (res: AdvertiserSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Advertiser", id }],
    }),

    createAdvertiser: builder.mutation<AdvertiserRecord, CreateAdvertiserInput>({
      query: (body) => ({ url: "/ads/advertisers", method: "POST", data: body }),
      transformResponse: (res: AdvertiserSingleRawResponse) => res.data,
      invalidatesTags: [ADVERTISER_LIST_TAG],
    }),

    updateAdvertiser: builder.mutation<AdvertiserRecord, { id: number; input: UpdateAdvertiserInput }>({
      query: ({ id, input }) => ({ url: `/ads/advertisers/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AdvertiserSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Advertiser", id }, ADVERTISER_LIST_TAG],
    }),

    updateAdvertiserStatus: builder.mutation<AdvertiserRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/ads/advertisers/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: AdvertiserSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Advertiser", id }, ADVERTISER_LIST_TAG],
    }),

    deleteAdvertiser: builder.mutation<void, number>({
      query: (id) => ({ url: `/ads/advertisers/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Advertiser", id }, ADVERTISER_LIST_TAG],
    }),
  }),
});

export const {
  useGetAdvertisersQuery,
  useGetAdvertiserByIdQuery,
  useCreateAdvertiserMutation,
  useUpdateAdvertiserMutation,
  useUpdateAdvertiserStatusMutation,
  useDeleteAdvertiserMutation,
} = advertiserApi;
