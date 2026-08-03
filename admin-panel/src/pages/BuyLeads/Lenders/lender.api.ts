// src/pages/BuyLeads/Lenders/lender.api.ts
//
// RTK Query, same pattern as pages/newCars/Brands/brand.api.ts.

import { api } from "../../../store/baseApi";

export interface LenderAdminSummary {
  id: number;
  name: string;
}

export interface LenderRecord {
  id: number;
  name: string;
  logoUrl: string | null;
  minInterestRate: string | null;
  maxInterestRate: string | null;
  maxLoanAmount: string | null;
  maxTenureYears: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: LenderAdminSummary | null;
  updatedByAdmin: LenderAdminSummary | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListLendersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateLenderInput {
  name: string;
  minInterestRate?: number;
  maxInterestRate?: number;
  maxLoanAmount?: number;
  maxTenureYears?: number;
  isActive?: boolean;
  // Optional on create — unlike Brand's mandatory logo, a lender can be
  // added with just a name and have its logo filled in later.
  logo?: File;
}

export interface UpdateLenderInput {
  name?: string;
  // Explicit `null` clears the field, `undefined`/omitted leaves it
  // untouched — mirrors the backend's updateLenderSchema.
  minInterestRate?: number | null;
  maxInterestRate?: number | null;
  maxLoanAmount?: number | null;
  maxTenureYears?: number | null;
  isActive?: boolean;
}

interface LenderListRawResponse {
  success: true;
  data: LenderRecord[];
  pagination: Pagination;
}

interface LenderSingleRawResponse {
  success: true;
  data: LenderRecord;
}

export interface LenderOption {
  id: number;
  name: string;
}

export interface ListLenderOptionsParams {
  isActive?: boolean;
}

interface LenderOptionsRawResponse {
  success: true;
  data: LenderOption[];
}

export interface LenderListResult {
  data: LenderRecord[];
  pagination: Pagination;
}

const LENDER_LIST_TAG = { type: "Lender" as const, id: "LIST" };

export const lenderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLenders: builder.query<LenderListResult, ListLendersParams | void>({
      query: (params) => ({ url: "/lenders", method: "GET", params: params ?? {} }),
      transformResponse: (res: LenderListRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result ? [...result.data.map((l) => ({ type: "Lender" as const, id: l.id })), LENDER_LIST_TAG] : [LENDER_LIST_TAG],
    }),

    // Dropdown-only source — every lender in one shot, no pagination.
    // Use this wherever Lender is just a <select> (Loan Lead form).
    getLenderOptions: builder.query<LenderOption[], ListLenderOptionsParams | void>({
      query: (params) => ({ url: "/lenders/options", method: "GET", params: params ?? {} }),
      transformResponse: (res: LenderOptionsRawResponse) => res.data,
      providesTags: [LENDER_LIST_TAG],
    }),

    getLenderById: builder.query<LenderRecord, number>({
      query: (id) => ({ url: `/lenders/${id}`, method: "GET" }),
      transformResponse: (res: LenderSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Lender", id }],
    }),

    createLender: builder.mutation<LenderRecord, CreateLenderInput>({
      query: ({ logo, ...fields }) => {
        const formData = new FormData();
        formData.append("name", fields.name);
        if (fields.minInterestRate != null) formData.append("minInterestRate", String(fields.minInterestRate));
        if (fields.maxInterestRate != null) formData.append("maxInterestRate", String(fields.maxInterestRate));
        if (fields.maxLoanAmount != null) formData.append("maxLoanAmount", String(fields.maxLoanAmount));
        if (fields.maxTenureYears != null) formData.append("maxTenureYears", String(fields.maxTenureYears));
        formData.append("isActive", String(fields.isActive ?? true));
        if (logo) formData.append("logo", logo);
        return { url: "/lenders", method: "POST", data: formData };
      },
      transformResponse: (res: LenderSingleRawResponse) => res.data,
      invalidatesTags: [LENDER_LIST_TAG],
    }),

    updateLender: builder.mutation<LenderRecord, { id: number; input: UpdateLenderInput }>({
      query: ({ id, input }) => ({ url: `/lenders/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: LenderSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Lender", id }, LENDER_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — separate from the
    // full edit mutation so flipping the switch doesn't need the whole
    // edit form's payload.
    updateLenderStatus: builder.mutation<LenderRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/lenders/${id}/status`, method: "PATCH", data: { isActive } }),
      transformResponse: (res: LenderSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Lender", id }, LENDER_LIST_TAG],
    }),

    uploadLenderLogo: builder.mutation<{ id: number; logoUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("logo", file);
        return { url: `/lenders/${id}/logo`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; logoUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Lender", id }, LENDER_LIST_TAG],
    }),

    deleteLender: builder.mutation<void, number>({
      query: (id) => ({ url: `/lenders/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Lender", id }, LENDER_LIST_TAG],
    }),
  }),
});

export const {
  useGetLendersQuery,
  useGetLenderOptionsQuery,
  useGetLenderByIdQuery,
  useCreateLenderMutation,
  useUpdateLenderMutation,
  useUpdateLenderStatusMutation,
  useUploadLenderLogoMutation,
  useDeleteLenderMutation,
} = lenderApi;
