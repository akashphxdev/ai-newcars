// src/pages/newCars/Faqs/faq.api.ts
import { api } from "../../../store/baseApi";

export interface FaqRecord {
  id: number;
  modelId: number;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListFaqsParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  isActive?: boolean;
  sortBy?: "displayOrder" | "id" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Every field is required on both create AND update — this module
// intentionally does NOT follow Brand/CarModel's partial-update pattern.
// The form always submits the full payload, on Add and on Edit.
export interface FaqFormInput {
  modelId: number;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
}

interface FaqListRawResponse {
  success: true;
  data: FaqRecord[];
  pagination: Pagination;
}

interface FaqSingleRawResponse {
  success: true;
  data: FaqRecord;
}

export interface FaqListResult {
  data: FaqRecord[];
  pagination: Pagination;
}

const FAQ_LIST_TAG = { type: "Faq" as const, id: "LIST" };

export const faqApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFaqs: builder.query<FaqListResult, ListFaqsParams | void>({
      query: (params) => ({ url: "/new-cars/faqs", method: "GET", params: params ?? {} }),
      transformResponse: (res: FaqListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((f) => ({ type: "Faq" as const, id: f.id })), FAQ_LIST_TAG]
          : [FAQ_LIST_TAG],
    }),

    getFaqById: builder.query<FaqRecord, number>({
      query: (id) => ({ url: `/new-cars/faqs/${id}`, method: "GET" }),
      transformResponse: (res: FaqSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Faq", id }],
    }),

    createFaq: builder.mutation<FaqRecord, FaqFormInput>({
      query: (body) => ({ url: "/new-cars/faqs", method: "POST", data: body }),
      transformResponse: (res: FaqSingleRawResponse) => res.data,
      invalidatesTags: [FAQ_LIST_TAG],
    }),

    // Full replace on edit too — same FaqFormInput shape as create, per
    // the "every field required" rule for this module.
    updateFaq: builder.mutation<FaqRecord, { id: number; input: FaqFormInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/faqs/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: FaqSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Faq", id }, FAQ_LIST_TAG],
    }),

    deleteFaq: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/faqs/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Faq", id }, FAQ_LIST_TAG],
    }),
  }),
});

export const {
  useGetFaqsQuery,
  useGetFaqByIdQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = faqApi;