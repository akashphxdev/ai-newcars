// src/pages/Ads/Clicks/adClick.api.ts
//
// RTK Query version — read-only analytics log, same pattern as
// adImpression.api.ts. No create/update mutation from the admin panel;
// clicks are recorded by the live site hitting the public
// POST /ads/clicks endpoint directly, not through this
// admin-authenticated slice.

import { api } from "../../../store/baseApi";

export interface AdClickRecord {
  id: number;
  campaignId: number;
  campaign: { id: number; name: string };
  placementId: number | null;
  placement: { id: number; name: string } | null;
  impressionId: number | null;
  userId: number | null;
  user: { id: number; name: string } | null;
  pageUrl: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  referrerUrl: string | null;
  userAgent: string | null;
  clickedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAdClicksParams {
  page?: number;
  limit?: number;
  campaignId?: number;
  placementId?: number;
  sortBy?: "id" | "clickedAt";
  sortOrder?: "asc" | "desc";
}

interface AdClickListRawResponse {
  success: true;
  data: AdClickRecord[];
  pagination: Pagination;
}

export interface AdClickListResult {
  data: AdClickRecord[];
  pagination: Pagination;
}

const AD_CLICK_LIST_TAG = { type: "AdClick" as const, id: "LIST" };

export const adClickApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdClicks: builder.query<AdClickListResult, ListAdClicksParams | void>({
      query: (params) => ({ url: "/ads/clicks", method: "GET", params: params ?? {} }),
      transformResponse: (res: AdClickListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c) => ({ type: "AdClick" as const, id: c.id })), AD_CLICK_LIST_TAG]
          : [AD_CLICK_LIST_TAG],
    }),

    deleteAdClick: builder.mutation<void, number>({
      query: (id) => ({ url: `/ads/clicks/${id}`, method: "DELETE" }),
      invalidatesTags: [AD_CLICK_LIST_TAG],
    }),
  }),
});

export const { useGetAdClicksQuery, useDeleteAdClickMutation } = adClickApi;
