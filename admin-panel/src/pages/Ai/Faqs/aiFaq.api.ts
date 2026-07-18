// src/pages/Ai/Faqs/aiFaq.api.ts
import { api } from "../../../store/baseApi";

export interface AiFaqModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface AiFaqAdminSummary {
  id: number;
  name: string;
}

export interface AiFaqRecord {
  id: number;
  modelId: number;
  model: AiFaqModelSummary;
  question: string;
  answer: string;
  status: number;
  aiProvider: number;
  aiModel: string;
  publishedFaqId: number | null;
  reviewedBy: number | null;
  reviewedByAdmin: AiFaqAdminSummary | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAiFaqsParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  status?: number;
  sortBy?: "createdAt" | "id";
  sortOrder?: "asc" | "desc";
}

export interface UpdateAiFaqInput {
  question: string;
  answer: string;
}

interface AiFaqListRawResponse {
  success: true;
  data: AiFaqRecord[];
  pagination: Pagination;
}

interface AiFaqSingleRawResponse {
  success: true;
  data: AiFaqRecord;
}

export interface AiFaqListResult {
  data: AiFaqRecord[];
  pagination: Pagination;
}

const AI_FAQ_LIST_TAG = { type: "AiFaq" as const, id: "LIST" };
// The real, live FAQ list (newCars/Faqs/faq.api.ts) needs to refresh
// too once a publish creates a row there — same tag type it already
// provides/invalidates on its own list.
const CAR_FAQ_LIST_TAG = { type: "Faq" as const, id: "LIST" };

export const aiFaqApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiFaqs: builder.query<AiFaqListResult, ListAiFaqsParams | void>({
      query: (params) => ({ url: "/ai/faqs", method: "GET", params: params ?? {} }),
      transformResponse: (res: AiFaqListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((f) => ({ type: "AiFaq" as const, id: f.id })), AI_FAQ_LIST_TAG]
          : [AI_FAQ_LIST_TAG],
    }),

    getAiFaqById: builder.query<AiFaqRecord, number>({
      query: (id) => ({ url: `/ai/faqs/${id}`, method: "GET" }),
      transformResponse: (res: AiFaqSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "AiFaq", id }],
    }),

    updateAiFaq: builder.mutation<AiFaqRecord, { id: number; input: UpdateAiFaqInput }>({
      query: ({ id, input }) => ({ url: `/ai/faqs/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AiFaqSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AiFaq", id }, AI_FAQ_LIST_TAG],
    }),

    approveAiFaq: builder.mutation<AiFaqRecord, number>({
      query: (id) => ({ url: `/ai/faqs/${id}/approve`, method: "PATCH" }),
      transformResponse: (res: AiFaqSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiFaq", id }, AI_FAQ_LIST_TAG],
    }),

    rejectAiFaq: builder.mutation<AiFaqRecord, number>({
      query: (id) => ({ url: `/ai/faqs/${id}/reject`, method: "PATCH" }),
      transformResponse: (res: AiFaqSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiFaq", id }, AI_FAQ_LIST_TAG],
    }),

    publishAiFaq: builder.mutation<AiFaqRecord, number>({
      query: (id) => ({ url: `/ai/faqs/${id}/publish`, method: "PATCH" }),
      transformResponse: (res: AiFaqSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiFaq", id }, AI_FAQ_LIST_TAG, CAR_FAQ_LIST_TAG],
    }),

    deleteAiFaq: builder.mutation<void, number>({
      query: (id) => ({ url: `/ai/faqs/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AiFaq", id }, AI_FAQ_LIST_TAG],
    }),
  }),
});

export const {
  useGetAiFaqsQuery,
  useGetAiFaqByIdQuery,
  useUpdateAiFaqMutation,
  useApproveAiFaqMutation,
  useRejectAiFaqMutation,
  usePublishAiFaqMutation,
  useDeleteAiFaqMutation,
} = aiFaqApi;