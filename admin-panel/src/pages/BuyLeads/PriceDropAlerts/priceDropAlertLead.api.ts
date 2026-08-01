// src/pages/BuyLeads/PriceDropAlerts/priceDropAlertLead.api.ts
//
// RTK Query, same pattern as BuyLeads/NewCarLeads/buyNewCarLead.api.ts.

import { api } from "../../../store/baseApi";
import type { LeadActivityRecord } from "../NewCarLeads/buyNewCarLead.api";

export type PriceDropAlertType = "email" | "sms" | "whatsapp" | "push";

export interface PriceDropAlertLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  mobile: string;
  email: string | null;
  priceAtSubscription: string | null;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string; priceMin: string | null } | null;
  alertType: PriceDropAlertType | null;
  isActive: boolean;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceDropAlertLeadDetailRecord extends PriceDropAlertLeadRecord {
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

export interface ListPriceDropAlertLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  brandId?: number;
  modelId?: number;
  alertType?: PriceDropAlertType;
  sortBy?: "id" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface UpdatePriceDropAlertLeadActiveInput {
  isActive: boolean;
  note?: string;
}

interface PriceDropAlertLeadListRawResponse {
  success: true;
  data: PriceDropAlertLeadRecord[];
  pagination: Pagination;
}

interface PriceDropAlertLeadDetailRawResponse {
  success: true;
  data: PriceDropAlertLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface PriceDropAlertLeadListResult {
  data: PriceDropAlertLeadRecord[];
  pagination: Pagination;
}

export interface PriceDropAlertLeadStats {
  today: number;
  thisMonth: number;
  active: number;
}

interface PriceDropAlertLeadStatsRawResponse {
  success: true;
  data: PriceDropAlertLeadStats;
}

const PRICE_DROP_ALERT_LEAD_LIST_TAG = { type: "PriceDropAlertLead" as const, id: "LIST" };

export const priceDropAlertLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPriceDropAlertLeads: builder.query<PriceDropAlertLeadListResult, ListPriceDropAlertLeadsParams | void>({
      query: (params) => ({ url: "/leads/buy/price-drop", method: "GET", params: params ?? {} }),
      transformResponse: (res: PriceDropAlertLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "PriceDropAlertLead" as const, id: r.id })), PRICE_DROP_ALERT_LEAD_LIST_TAG]
          : [PRICE_DROP_ALERT_LEAD_LIST_TAG],
    }),

    getPriceDropAlertLeadStats: builder.query<PriceDropAlertLeadStats, void>({
      query: () => ({ url: "/leads/buy/price-drop/stats", method: "GET" }),
      transformResponse: (res: PriceDropAlertLeadStatsRawResponse) => res.data,
      providesTags: [PRICE_DROP_ALERT_LEAD_LIST_TAG],
    }),

    getPriceDropAlertLeadById: builder.query<PriceDropAlertLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/buy/price-drop/${id}`, method: "GET" }),
      transformResponse: (res: PriceDropAlertLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "PriceDropAlertLead", id }],
    }),

    updatePriceDropAlertLeadActive: builder.mutation<void, { id: number; input: UpdatePriceDropAlertLeadActiveInput }>({
      query: ({ id, input }) => ({ url: `/leads/buy/price-drop/${id}/active`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "PriceDropAlertLead", id }, PRICE_DROP_ALERT_LEAD_LIST_TAG],
    }),

    addPriceDropAlertLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/buy/price-drop/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "PriceDropAlertLead", id }],
    }),
  }),
});

export const {
  useGetPriceDropAlertLeadsQuery,
  useGetPriceDropAlertLeadStatsQuery,
  useGetPriceDropAlertLeadByIdQuery,
  useUpdatePriceDropAlertLeadActiveMutation,
  useAddPriceDropAlertLeadActivityMutation,
} = priceDropAlertLeadApi;
