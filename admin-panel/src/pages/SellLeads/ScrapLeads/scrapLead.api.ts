// src/pages/SellLeads/ScrapLeads/scrapLead.api.ts
//
// RTK Query, same pattern as BuyLeads/InsuranceLeads/insuranceLead.api.ts.

import { api } from "../../../store/baseApi";
import type { LeadActivityRecord } from "../../BuyLeads/NewCarLeads/buyNewCarLead.api";

export type ScrapLeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "pickup_scheduled"
  | "scrapped"
  | "converted"
  | "junk";

export type ScrapVehicleCondition = "running" | "not_running" | "accidental";

export const SCRAP_LEAD_STATUSES: ScrapLeadStatus[] = [
  "new",
  "contacted",
  "quoted",
  "pickup_scheduled",
  "scrapped",
  "converted",
  "junk",
];

export const SCRAP_LEAD_STATUS_LABELS: Record<ScrapLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  pickup_scheduled: "Pick-up scheduled",
  scrapped: "Scrapped",
  converted: "Converted",
  junk: "Junk",
};

export const VEHICLE_CONDITIONS: ScrapVehicleCondition[] = ["running", "not_running", "accidental"];

export const VEHICLE_CONDITION_LABELS: Record<ScrapVehicleCondition, string> = {
  running: "Running",
  not_running: "Not running",
  accidental: "Accidental",
};

export interface ScrapLeadRecord {
  id: number;
  name: string | null;
  mobile: string;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string } | null;
  // What the owner typed when their car was not in the catalogue.
  brandName: string | null;
  modelName: string | null;
  registrationNumber: string | null;
  registrationYear: number | null;
  cityId: number | null;
  city: { id: number; name: string } | null;
  vehicleCondition: ScrapVehicleCondition | null;
  quotedPrice: string | null;
  status: ScrapLeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapLeadDetailRecord extends ScrapLeadRecord {
  email: string | null;
  registrationStateId: number | null;
  registrationState: { id: number; name: string } | null;
  fuelType: string | null;
  hasOriginalRc: boolean | null;
  isHypothecated: boolean | null;
  hasPendingChallan: boolean | null;
  wantsCertificateOfDeposit: boolean | null;
  preferredPickupDate: string | null;
  notes: string | null;
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

export interface ListScrapLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ScrapLeadStatus;
  cityId?: number;
  vehicleCondition?: ScrapVehicleCondition;
  sortBy?: "id" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface UpdateScrapLeadStatusInput {
  status: ScrapLeadStatus;
  note?: string;
}

export interface UpdateScrapLeadQuoteInput {
  quotedPrice: number;
  notes?: string;
}

interface ScrapLeadListRawResponse {
  success: true;
  data: ScrapLeadRecord[];
  pagination: Pagination;
}

interface ScrapLeadDetailRawResponse {
  success: true;
  data: ScrapLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface ScrapLeadListResult {
  data: ScrapLeadRecord[];
  pagination: Pagination;
}

const SCRAP_LEAD_LIST_TAG = { type: "ScrapLead" as const, id: "LIST" };

export const scrapLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getScrapLeads: builder.query<ScrapLeadListResult, ListScrapLeadsParams | void>({
      query: (params) => ({ url: "/leads/sell/scrap", method: "GET", params: params ?? {} }),
      transformResponse: (res: ScrapLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "ScrapLead" as const, id: r.id })), SCRAP_LEAD_LIST_TAG]
          : [SCRAP_LEAD_LIST_TAG],
    }),

    getScrapLeadById: builder.query<ScrapLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/sell/scrap/${id}`, method: "GET" }),
      transformResponse: (res: ScrapLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "ScrapLead", id }],
    }),

    updateScrapLeadStatus: builder.mutation<void, { id: number; input: UpdateScrapLeadStatusInput }>({
      query: ({ id, input }) => ({ url: `/leads/sell/scrap/${id}/status`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "ScrapLead", id }, SCRAP_LEAD_LIST_TAG],
    }),

    updateScrapLeadQuote: builder.mutation<void, { id: number; input: UpdateScrapLeadQuoteInput }>({
      query: ({ id, input }) => ({ url: `/leads/sell/scrap/${id}/quote`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "ScrapLead", id }, SCRAP_LEAD_LIST_TAG],
    }),

    addScrapLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/sell/scrap/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "ScrapLead", id }],
    }),
  }),
});

export const {
  useGetScrapLeadsQuery,
  useGetScrapLeadByIdQuery,
  useUpdateScrapLeadStatusMutation,
  useUpdateScrapLeadQuoteMutation,
  useAddScrapLeadActivityMutation,
} = scrapLeadApi;
