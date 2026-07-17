// src/pages/Ads/Campaigns/adCampaign.api.ts
//
// RTK Query version, same pattern as article.api.ts (FormData upload +
// status field).

import { api } from "../../../store/baseApi";

export type CampaignStatus = "active" | "paused" | "expired";

export interface AdCampaignRecord {
  id: number;
  placementId: number;
  placement: { id: number; name: string; slug: string };
  advertiserId: number | null;
  advertiser: { id: number; name: string } | null;
  name: string;
  creativeImageUrl: string;
  targetUrl: string;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  status: CampaignStatus;
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

export interface ListAdCampaignsParams {
  page?: number;
  limit?: number;
  search?: string;
  placementId?: number;
  advertiserId?: number;
  status?: CampaignStatus;
  sortBy?: "id" | "name" | "priority" | "startDate" | "endDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Shared shape for create/update — full-replace on edit too, same
// convention as article.api.ts's ArticleFormInput. creativeImage rides
// along as a file — required on create, optional (only when replacing)
// on update.
export interface AdCampaignFormInput {
  placementId: number;
  advertiserId?: number;
  name: string;
  targetUrl: string;
  priority: number;
  startDate?: string | null;
  endDate?: string | null;
  status: CampaignStatus;
}

export interface CreateAdCampaignInput extends AdCampaignFormInput {
  creativeImage: File;
}

export interface UpdateAdCampaignInput extends AdCampaignFormInput {
  creativeImage?: File;
}

interface AdCampaignListRawResponse {
  success: true;
  data: AdCampaignRecord[];
  pagination: Pagination;
}

interface AdCampaignSingleRawResponse {
  success: true;
  data: AdCampaignRecord;
}

export interface AdCampaignListResult {
  data: AdCampaignRecord[];
  pagination: Pagination;
}

const AD_CAMPAIGN_LIST_TAG = { type: "AdCampaign" as const, id: "LIST" };

function buildFormData(input: CreateAdCampaignInput | UpdateAdCampaignInput): FormData {
  const formData = new FormData();
  formData.append("placementId", String(input.placementId));
  if (input.advertiserId) formData.append("advertiserId", String(input.advertiserId));
  formData.append("name", input.name);
  formData.append("targetUrl", input.targetUrl);
  formData.append("priority", String(input.priority));
  if (input.startDate) formData.append("startDate", input.startDate);
  if (input.endDate) formData.append("endDate", input.endDate);
  formData.append("status", input.status);
  if (input.creativeImage) formData.append("creativeImage", input.creativeImage);
  return formData;
}

export const adCampaignApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdCampaigns: builder.query<AdCampaignListResult, ListAdCampaignsParams | void>({
      query: (params) => ({ url: "/ads/campaigns", method: "GET", params: params ?? {} }),
      transformResponse: (res: AdCampaignListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c) => ({ type: "AdCampaign" as const, id: c.id })), AD_CAMPAIGN_LIST_TAG]
          : [AD_CAMPAIGN_LIST_TAG],
    }),

    getAdCampaignById: builder.query<AdCampaignRecord, number>({
      query: (id) => ({ url: `/ads/campaigns/${id}`, method: "GET" }),
      transformResponse: (res: AdCampaignSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "AdCampaign", id }],
    }),

    createAdCampaign: builder.mutation<AdCampaignRecord, CreateAdCampaignInput>({
      query: (input) => ({ url: "/ads/campaigns", method: "POST", data: buildFormData(input) }),
      transformResponse: (res: AdCampaignSingleRawResponse) => res.data,
      invalidatesTags: [AD_CAMPAIGN_LIST_TAG],
    }),

    updateAdCampaign: builder.mutation<AdCampaignRecord, { id: number; input: UpdateAdCampaignInput }>({
      query: ({ id, input }) => ({ url: `/ads/campaigns/${id}`, method: "PATCH", data: buildFormData(input) }),
      transformResponse: (res: AdCampaignSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdCampaign", id }, AD_CAMPAIGN_LIST_TAG],
    }),

    updateAdCampaignStatus: builder.mutation<AdCampaignRecord, { id: number; status: CampaignStatus }>({
      query: ({ id, status }) => ({ url: `/ads/campaigns/${id}/status`, method: "PATCH", data: { status } }),
      transformResponse: (res: AdCampaignSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AdCampaign", id }, AD_CAMPAIGN_LIST_TAG],
    }),

    deleteAdCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/ads/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AdCampaign", id }, AD_CAMPAIGN_LIST_TAG],
    }),
  }),
});

export const {
  useGetAdCampaignsQuery,
  useGetAdCampaignByIdQuery,
  useCreateAdCampaignMutation,
  useUpdateAdCampaignMutation,
  useUpdateAdCampaignStatusMutation,
  useDeleteAdCampaignMutation,
} = adCampaignApi;
