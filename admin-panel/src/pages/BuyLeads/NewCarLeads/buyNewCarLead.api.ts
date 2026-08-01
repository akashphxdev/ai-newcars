// src/pages/BuyLeads/NewCarLeads/buyNewCarLead.api.ts
//
// RTK Query, same pattern as Reviews/AllReviews/review.api.ts.

import { api } from "../../../store/baseApi";

export type BuyNewCarLeadStatus = "new" | "contacted" | "qualified" | "converted" | "junk";
export type BuyNewCarLeadInterestType = "enquiry" | "offer_check";

export interface LeadActivityRecord {
  id: number;
  activityType: "status_change" | "note";
  notes: string | null;
  createdAt: string;
  admin: { id: number; name: string };
}

export interface BuyNewCarLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  name: string | null;
  mobile: string;
  email: string | null;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string } | null;
  variantId: number | null;
  variant: { id: number; variantName: string } | null;
  cityId: number | null;
  city: { id: number; name: string } | null;
  interestType: BuyNewCarLeadInterestType | null;
  status: BuyNewCarLeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BuyNewCarLeadDetailRecord extends BuyNewCarLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  activity: LeadActivityRecord[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListBuyNewCarLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BuyNewCarLeadStatus;
  brandId?: number;
  modelId?: number;
  cityId?: number;
  interestType?: BuyNewCarLeadInterestType;
  sortBy?: "id" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdateBuyNewCarLeadStatusInput {
  status: BuyNewCarLeadStatus;
  note?: string;
}

interface BuyNewCarLeadListRawResponse {
  success: true;
  data: BuyNewCarLeadRecord[];
  pagination: Pagination;
}

interface BuyNewCarLeadDetailRawResponse {
  success: true;
  data: BuyNewCarLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface BuyNewCarLeadListResult {
  data: BuyNewCarLeadRecord[];
  pagination: Pagination;
}

export interface BuyNewCarLeadStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  converted: number;
}

interface BuyNewCarLeadStatsRawResponse {
  success: true;
  data: BuyNewCarLeadStats;
}

const BUY_NEW_CAR_LEAD_LIST_TAG = { type: "BuyNewCarLead" as const, id: "LIST" };

export const buyNewCarLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBuyNewCarLeads: builder.query<BuyNewCarLeadListResult, ListBuyNewCarLeadsParams | void>({
      query: (params) => ({ url: "/leads/buy/new-cars", method: "GET", params: params ?? {} }),
      transformResponse: (res: BuyNewCarLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "BuyNewCarLead" as const, id: r.id })), BUY_NEW_CAR_LEAD_LIST_TAG]
          : [BUY_NEW_CAR_LEAD_LIST_TAG],
    }),

    getBuyNewCarLeadStats: builder.query<BuyNewCarLeadStats, void>({
      query: () => ({ url: "/leads/buy/new-cars/stats", method: "GET" }),
      transformResponse: (res: BuyNewCarLeadStatsRawResponse) => res.data,
      providesTags: [BUY_NEW_CAR_LEAD_LIST_TAG],
    }),

    getBuyNewCarLeadById: builder.query<BuyNewCarLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/buy/new-cars/${id}`, method: "GET" }),
      transformResponse: (res: BuyNewCarLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "BuyNewCarLead", id }],
    }),

    updateBuyNewCarLeadStatus: builder.mutation<void, { id: number; input: UpdateBuyNewCarLeadStatusInput }>({
      query: ({ id, input }) => ({ url: `/leads/buy/new-cars/${id}/status`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "BuyNewCarLead", id }, BUY_NEW_CAR_LEAD_LIST_TAG],
    }),

    addBuyNewCarLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/buy/new-cars/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "BuyNewCarLead", id }],
    }),
  }),
});

export const {
  useGetBuyNewCarLeadsQuery,
  useGetBuyNewCarLeadStatsQuery,
  useGetBuyNewCarLeadByIdQuery,
  useUpdateBuyNewCarLeadStatusMutation,
  useAddBuyNewCarLeadActivityMutation,
} = buyNewCarLeadApi;
