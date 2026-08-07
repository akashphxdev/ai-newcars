// src/pages/BuyLeads/LaunchNotify/launchNotifyLead.api.ts
//
// RTK Query, same pattern as BuyLeads/PriceDropAlerts/priceDropAlertLead.api.ts.

import { api } from "../../../store/baseApi";
import type { LeadActivityRecord } from "../NewCarLeads/buyNewCarLead.api";

export interface LaunchNotifyLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  mobile: string;
  email: string | null;
  expectedLaunchDateAtSubscription: string | null;
  brandId: number | null;
  brand: { id: number; name: string } | null;
  modelId: number | null;
  model: { id: number; name: string; launchStatus: string; expectedLaunchDate: string | null } | null;
  isActive: boolean;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchNotifyLeadDetailRecord extends LaunchNotifyLeadRecord {
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

export interface ListLaunchNotifyLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  brandId?: number;
  modelId?: number;
  sortBy?: "id" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface UpdateLaunchNotifyLeadActiveInput {
  isActive: boolean;
  note?: string;
}

interface LaunchNotifyLeadListRawResponse {
  success: true;
  data: LaunchNotifyLeadRecord[];
  pagination: Pagination;
}

interface LaunchNotifyLeadDetailRawResponse {
  success: true;
  data: LaunchNotifyLeadDetailRecord;
}

interface LeadActivityRawResponse {
  success: true;
  data: LeadActivityRecord;
}

export interface LaunchNotifyLeadListResult {
  data: LaunchNotifyLeadRecord[];
  pagination: Pagination;
}

export interface LaunchNotifyLeadStats {
  today: number;
  thisMonth: number;
  active: number;
}

interface LaunchNotifyLeadStatsRawResponse {
  success: true;
  data: LaunchNotifyLeadStats;
}

const LAUNCH_NOTIFY_LEAD_LIST_TAG = { type: "LaunchNotifyLead" as const, id: "LIST" };

export const launchNotifyLeadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLaunchNotifyLeads: builder.query<LaunchNotifyLeadListResult, ListLaunchNotifyLeadsParams | void>({
      query: (params) => ({ url: "/leads/buy/launch-notify", method: "GET", params: params ?? {} }),
      transformResponse: (res: LaunchNotifyLeadListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((r) => ({ type: "LaunchNotifyLead" as const, id: r.id })), LAUNCH_NOTIFY_LEAD_LIST_TAG]
          : [LAUNCH_NOTIFY_LEAD_LIST_TAG],
    }),

    getLaunchNotifyLeadStats: builder.query<LaunchNotifyLeadStats, void>({
      query: () => ({ url: "/leads/buy/launch-notify/stats", method: "GET" }),
      transformResponse: (res: LaunchNotifyLeadStatsRawResponse) => res.data,
      providesTags: [LAUNCH_NOTIFY_LEAD_LIST_TAG],
    }),

    getLaunchNotifyLeadById: builder.query<LaunchNotifyLeadDetailRecord, number>({
      query: (id) => ({ url: `/leads/buy/launch-notify/${id}`, method: "GET" }),
      transformResponse: (res: LaunchNotifyLeadDetailRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "LaunchNotifyLead", id }],
    }),

    updateLaunchNotifyLeadActive: builder.mutation<void, { id: number; input: UpdateLaunchNotifyLeadActiveInput }>({
      query: ({ id, input }) => ({ url: `/leads/buy/launch-notify/${id}/active`, method: "PATCH", data: input }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "LaunchNotifyLead", id }, LAUNCH_NOTIFY_LEAD_LIST_TAG],
    }),

    addLaunchNotifyLeadActivity: builder.mutation<LeadActivityRecord, { id: number; notes: string }>({
      query: ({ id, notes }) => ({ url: `/leads/buy/launch-notify/${id}/activity`, method: "POST", data: { notes } }),
      transformResponse: (res: LeadActivityRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "LaunchNotifyLead", id }],
    }),
  }),
});

export const {
  useGetLaunchNotifyLeadsQuery,
  useGetLaunchNotifyLeadStatsQuery,
  useGetLaunchNotifyLeadByIdQuery,
  useUpdateLaunchNotifyLeadActiveMutation,
  useAddLaunchNotifyLeadActivityMutation,
} = launchNotifyLeadApi;
