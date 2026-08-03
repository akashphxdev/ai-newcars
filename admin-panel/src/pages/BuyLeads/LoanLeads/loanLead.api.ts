// src/pages/BuyLeads/LoanLeads/loanLead.api.ts
//
// RTK Query, same pattern as BuyLeads/InsuranceLeads/insuranceLead.api.ts.

import { api } from "../../../store/baseApi";
import type { LeadActivityRecord } from "../NewCarLeads/buyNewCarLead.api";

export type LoanLeadStatus = "new" | "contacted" | "qualified" | "converted" | "junk";

export interface LoanLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  name: string | null;
  mobile: string;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string } | null;
  variantId: number | null;
  variant: { id: number; variantName: string } | null;
  lenderId: number | null;
  lender: { id: number; name: string; logoUrl: string | null } | null;
  loanAmount: string | null;
  tenureYears: number | null;
  interestRate: string | null;
  monthlyIncome: string | null;
  status: LoanLeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoanLeadDetailRecord extends LoanLeadRecord {
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

export interface ListLoanLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LoanLeadStatus;
  brandId?: number;
  modelId?: number;
  lenderId?: number;
  sortBy?: "id" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdateLoanLeadStatusInput {
  status: LoanLeadStatus;
  note?: string;
}

interface LoanLeadListRawResponse {
  success: true;
  data: LoanLeadRecord[];
  pagination: Pagination;
}

interface LoanLeadDetailRawResponse {
  success: true;
  data: LoanLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface LoanLeadListResult {
  data: LoanLeadRecord[];
  pagination: Pagination;
}

export interface LoanLeadStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  converted: number;
}

interface LoanLeadStatsRawResponse {
  success: true;
  data: LoanLeadStats;
}

const LOAN_LEAD_LIST_TAG = { type: "LoanLead" as const, id: "LIST" };

export const loanLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLoanLeads: builder.query<LoanLeadListResult, ListLoanLeadsParams | void>({
      query: (params) => ({ url: "/leads/buy/loan", method: "GET", params: params ?? {} }),
      transformResponse: (res: LoanLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result ? [...result.data.map((r) => ({ type: "LoanLead" as const, id: r.id })), LOAN_LEAD_LIST_TAG] : [LOAN_LEAD_LIST_TAG],
    }),

    getLoanLeadStats: builder.query<LoanLeadStats, void>({
      query: () => ({ url: "/leads/buy/loan/stats", method: "GET" }),
      transformResponse: (res: LoanLeadStatsRawResponse) => res.data,
      providesTags: [LOAN_LEAD_LIST_TAG],
    }),

    getLoanLeadById: builder.query<LoanLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/buy/loan/${id}`, method: "GET" }),
      transformResponse: (res: LoanLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "LoanLead", id }],
    }),

    updateLoanLeadStatus: builder.mutation<void, { id: number; input: UpdateLoanLeadStatusInput }>({
      query: ({ id, input }) => ({ url: `/leads/buy/loan/${id}/status`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "LoanLead", id }, LOAN_LEAD_LIST_TAG],
    }),

    addLoanLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/buy/loan/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "LoanLead", id }],
    }),
  }),
});

export const {
  useGetLoanLeadsQuery,
  useGetLoanLeadStatsQuery,
  useGetLoanLeadByIdQuery,
  useUpdateLoanLeadStatusMutation,
  useAddLoanLeadActivityMutation,
} = loanLeadApi;
