// src/pages/Ads/Impressions/adImpression.api.ts
//
// RTK Query version — read-only analytics log, same list pattern as
// admin-log.api.ts. No create/update mutation from the admin panel;
// impressions are recorded by the live site hitting the public
// POST /ads/impressions endpoint directly, not through this
// admin-authenticated slice.

import { api } from "../../../store/baseApi";

export interface AdImpressionRecord {
  id: number;
  campaignId: number;
  campaign: { id: number; name: string };
  placementId: number | null;
  placement: { id: number; name: string } | null;
  userId: number | null;
  user: { id: number; name: string } | null;
  pageUrl: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  referrerUrl: string | null;
  userAgent: string | null;
  viewedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAdImpressionsParams {
  page?: number;
  limit?: number;
  campaignId?: number;
  placementId?: number;
  sortBy?: "id" | "viewedAt";
  sortOrder?: "asc" | "desc";
}

interface AdImpressionListRawResponse {
  success: true;
  data: AdImpressionRecord[];
  pagination: Pagination;
}

export interface AdImpressionListResult {
  data: AdImpressionRecord[];
  pagination: Pagination;
}

const AD_IMPRESSION_LIST_TAG = { type: "AdImpression" as const, id: "LIST" };

export const adImpressionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdImpressions: builder.query<AdImpressionListResult, ListAdImpressionsParams | void>({
      query: (params) => ({ url: "/ads/impressions", method: "GET", params: params ?? {} }),
      transformResponse: (res: AdImpressionListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((i) => ({ type: "AdImpression" as const, id: i.id })), AD_IMPRESSION_LIST_TAG]
          : [AD_IMPRESSION_LIST_TAG],
    }),

    deleteAdImpression: builder.mutation<void, number>({
      query: (id) => ({ url: `/ads/impressions/${id}`, method: "DELETE" }),
      invalidatesTags: [AD_IMPRESSION_LIST_TAG],
    }),
  }),
});

export const { useGetAdImpressionsQuery, useDeleteAdImpressionMutation } = adImpressionApi;
