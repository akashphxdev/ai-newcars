// src/pages/BuyLeads/SoftLeads/softLead.api.ts
//
// RTK Query, same pattern as BuyLeads/NewCarLeads/buyNewCarLead.api.ts.

import { api } from "../../../store/baseApi";
import type { LeadActivityRecord } from "../NewCarLeads/buyNewCarLead.api";

export const SOFT_LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "junk"] as const;
export type SoftLeadStatus = (typeof SOFT_LEAD_STATUSES)[number];

export const SOFT_LEAD_CALCULATOR_TYPES = [
  "emi",
  "mileage",
  "down_payment",
  "affordability",
  "ev_charging",
  "fuel_comparison",
] as const;
export type SoftLeadCalculatorType = (typeof SOFT_LEAD_CALCULATOR_TYPES)[number];

export const SOFT_LEAD_CALCULATOR_LABELS: Record<SoftLeadCalculatorType, string> = {
  emi: "EMI Calculator",
  mileage: "Mileage Calculator",
  down_payment: "Down Payment Calculator",
  affordability: "Car Affordability Calculator",
  ev_charging: "EV Charging Time Calculator",
  fuel_comparison: "Fuel Comparison Calculator",
};

export interface SoftLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (no OTP for soft leads, unlike the hard
  // lead tables).
  userId: number | null;
  mobile: string | null;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string } | null;
  calculatorType: SoftLeadCalculatorType | null;
  inputSummary: string | null;
  status: SoftLeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SoftLeadDetailRecord extends SoftLeadRecord {
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

export interface ListSoftLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SoftLeadStatus;
  brandId?: number;
  modelId?: number;
  calculatorType?: SoftLeadCalculatorType;
  sortBy?: "id" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdateSoftLeadStatusInput {
  status: SoftLeadStatus;
  note?: string;
}

interface SoftLeadListRawResponse {
  success: true;
  data: SoftLeadRecord[];
  pagination: Pagination;
}

interface SoftLeadDetailRawResponse {
  success: true;
  data: SoftLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface SoftLeadListResult {
  data: SoftLeadRecord[];
  pagination: Pagination;
}

export interface SoftLeadStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  converted: number;
}

interface SoftLeadStatsRawResponse {
  success: true;
  data: SoftLeadStats;
}

const SOFT_LEAD_LIST_TAG = { type: "SoftLead" as const, id: "LIST" };

export const softLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSoftLeads: builder.query<SoftLeadListResult, ListSoftLeadsParams | void>({
      query: (params) => ({ url: "/leads/buy/soft", method: "GET", params: params ?? {} }),
      transformResponse: (res: SoftLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result ? [...result.data.map((r) => ({ type: "SoftLead" as const, id: r.id })), SOFT_LEAD_LIST_TAG] : [SOFT_LEAD_LIST_TAG],
    }),

    getSoftLeadStats: builder.query<SoftLeadStats, void>({
      query: () => ({ url: "/leads/buy/soft/stats", method: "GET" }),
      transformResponse: (res: SoftLeadStatsRawResponse) => res.data,
      providesTags: [SOFT_LEAD_LIST_TAG],
    }),

    getSoftLeadById: builder.query<SoftLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/buy/soft/${id}`, method: "GET" }),
      transformResponse: (res: SoftLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "SoftLead", id }],
    }),

    updateSoftLeadStatus: builder.mutation<void, { id: number; input: UpdateSoftLeadStatusInput }>({
      query: ({ id, input }) => ({ url: `/leads/buy/soft/${id}/status`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "SoftLead", id }, SOFT_LEAD_LIST_TAG],
    }),

    addSoftLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/buy/soft/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "SoftLead", id }],
    }),
  }),
});

export const {
  useGetSoftLeadsQuery,
  useGetSoftLeadStatsQuery,
  useGetSoftLeadByIdQuery,
  useUpdateSoftLeadStatusMutation,
  useAddSoftLeadActivityMutation,
} = softLeadApi;
