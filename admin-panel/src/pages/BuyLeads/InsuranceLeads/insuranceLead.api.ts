// src/pages/BuyLeads/InsuranceLeads/insuranceLead.api.ts
//
// RTK Query, same pattern as BuyLeads/NewCarLeads/buyNewCarLead.api.ts.

import { api } from "../../../store/baseApi";
import type { LeadActivityRecord } from "../NewCarLeads/buyNewCarLead.api";

export type InsuranceLeadStatus = "new" | "contacted" | "qualified" | "converted" | "junk";

export interface InsuranceLeadRecord {
  id: number;
  name: string | null;
  mobile: string;
  registrationNumber: string | null;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string } | null;
  cityId: number | null;
  city: { id: number; name: string } | null;
  status: InsuranceLeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceLeadDetailRecord extends InsuranceLeadRecord {
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

export interface ListInsuranceLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InsuranceLeadStatus;
  brandId?: number;
  modelId?: number;
  cityId?: number;
  sortBy?: "id" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdateInsuranceLeadStatusInput {
  status: InsuranceLeadStatus;
  note?: string;
}

interface InsuranceLeadListRawResponse {
  success: true;
  data: InsuranceLeadRecord[];
  pagination: Pagination;
}

interface InsuranceLeadDetailRawResponse {
  success: true;
  data: InsuranceLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface InsuranceLeadListResult {
  data: InsuranceLeadRecord[];
  pagination: Pagination;
}

const INSURANCE_LEAD_LIST_TAG = { type: "InsuranceLead" as const, id: "LIST" };

export const insuranceLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInsuranceLeads: builder.query<InsuranceLeadListResult, ListInsuranceLeadsParams | void>({
      query: (params) => ({ url: "/leads/buy/insurance", method: "GET", params: params ?? {} }),
      transformResponse: (res: InsuranceLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "InsuranceLead" as const, id: r.id })), INSURANCE_LEAD_LIST_TAG]
          : [INSURANCE_LEAD_LIST_TAG],
    }),

    getInsuranceLeadById: builder.query<InsuranceLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/buy/insurance/${id}`, method: "GET" }),
      transformResponse: (res: InsuranceLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "InsuranceLead", id }],
    }),

    updateInsuranceLeadStatus: builder.mutation<void, { id: number; input: UpdateInsuranceLeadStatusInput }>({
      query: ({ id, input }) => ({ url: `/leads/buy/insurance/${id}/status`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "InsuranceLead", id }, INSURANCE_LEAD_LIST_TAG],
    }),

    addInsuranceLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/buy/insurance/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "InsuranceLead", id }],
    }),
  }),
});

export const {
  useGetInsuranceLeadsQuery,
  useGetInsuranceLeadByIdQuery,
  useUpdateInsuranceLeadStatusMutation,
  useAddInsuranceLeadActivityMutation,
} = insuranceLeadApi;
