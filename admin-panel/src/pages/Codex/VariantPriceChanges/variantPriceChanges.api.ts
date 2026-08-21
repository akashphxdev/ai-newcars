import { api } from "../../../store/baseApi";
import type { Pagination } from "../Approvals/codexApprovals.api";

export type PriceChangeStatus = "pending" | "rejected";

export interface CodexVariantPriceChange {
  id: number;
  runId?: string | number | null;
  variantId: number;
  brandName: string;
  modelName: string;
  variantName: string;
  oldPrice: string | number;
  newPrice: string | number;
  priceDifference?: string | number | null;
  currency: string;
  priceContext?: string | null;
  cityId?: number | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  detectedAt: string;
  confidenceScore?: string | number | null;
  notes?: string | null;
  proposalStatus: PriceChangeStatus;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ListRawResponse<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

interface SingleRawResponse<T> {
  success: true;
  data: T;
}

export interface ListVariantPriceChangesParams {
  page?: number;
  limit?: number;
  status?: PriceChangeStatus;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export interface VariantPriceChangesResult {
  data: CodexVariantPriceChange[];
  pagination: Pagination;
}

export const codexVariantPriceChangesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCodexVariantPriceChanges: builder.query<VariantPriceChangesResult, ListVariantPriceChangesParams>({
      query: (params) => ({ url: "/codex/variant-price-changes", method: "GET", params }),
      transformResponse: (res: ListRawResponse<CodexVariantPriceChange>) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: [{ type: "CodexProposal", id: "VARIANT_PRICE_CHANGES" }],
    }),
    approveCodexVariantPriceChange: builder.mutation<Record<string, unknown>, number>({
      query: (id) => ({ url: `/codex/variant-price-changes/${id}/approve`, method: "PATCH" }),
      transformResponse: (res: SingleRawResponse<Record<string, unknown>>) => res.data,
      invalidatesTags: [{ type: "CodexProposal", id: "VARIANT_PRICE_CHANGES" }],
    }),
    rejectCodexVariantPriceChange: builder.mutation<CodexVariantPriceChange, number>({
      query: (id) => ({ url: `/codex/variant-price-changes/${id}/reject`, method: "PATCH" }),
      transformResponse: (res: SingleRawResponse<CodexVariantPriceChange>) => res.data,
      invalidatesTags: [{ type: "CodexProposal", id: "VARIANT_PRICE_CHANGES" }],
    }),
  }),
});

export const {
  useApproveCodexVariantPriceChangeMutation,
  useGetCodexVariantPriceChangesQuery,
  useRejectCodexVariantPriceChangeMutation,
} = codexVariantPriceChangesApi;
