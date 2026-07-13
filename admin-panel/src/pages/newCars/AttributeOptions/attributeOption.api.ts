// src/pages/newCars/AttributeOptions/attributeOption.api.ts
import { api } from "../../../store/baseApi";

export type AttributeOptionCategory = "transmission" | "drivetrain";

export interface AttributeOptionRecord {
  id: number;
  category: string;
  name: string;
  slug: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAttributeOptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: AttributeOptionCategory;
  sortBy?: "name" | "id" | "category";
  sortOrder?: "asc" | "desc";
}

export interface CreateAttributeOptionInput {
  category: AttributeOptionCategory;
  name: string;
  slug: string;
}

export interface UpdateAttributeOptionInput {
  category: AttributeOptionCategory;
  name: string;
  slug: string;
}

export type AttributeOptionsGrouped = Record<string, AttributeOptionRecord[]>;

interface AttributeOptionListRawResponse {
  success: true;
  data: AttributeOptionRecord[];
  pagination: Pagination;
}

interface AttributeOptionSingleRawResponse {
  success: true;
  data: AttributeOptionRecord;
}

interface AttributeOptionsGroupedRawResponse {
  success: true;
  data: AttributeOptionsGrouped;
}

export interface AttributeOptionListResult {
  data: AttributeOptionRecord[];
  pagination: Pagination;
}

const ATTRIBUTE_OPTION_LIST_TAG = { type: "AttributeOption" as const, id: "LIST" };

export const attributeOptionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAttributeOptions: builder.query<AttributeOptionListResult, ListAttributeOptionsParams | void>({
      query: (params) => ({ url: "/new-cars/attribute-options", method: "GET", params: params ?? {} }),
      transformResponse: (res: AttributeOptionListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((o) => ({ type: "AttributeOption" as const, id: o.id })),
              ATTRIBUTE_OPTION_LIST_TAG,
            ]
          : [ATTRIBUTE_OPTION_LIST_TAG],
    }),

    getAttributeOptionsGrouped: builder.query<AttributeOptionsGrouped, void>({
      query: () => ({ url: "/new-cars/attribute-options/grouped", method: "GET" }),
      transformResponse: (res: AttributeOptionsGroupedRawResponse) => res.data,
      providesTags: [ATTRIBUTE_OPTION_LIST_TAG],
    }),

    getAttributeOptionById: builder.query<AttributeOptionRecord, number>({
      query: (id) => ({ url: `/new-cars/attribute-options/${id}`, method: "GET" }),
      transformResponse: (res: AttributeOptionSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "AttributeOption", id }],
    }),

    createAttributeOption: builder.mutation<AttributeOptionRecord, CreateAttributeOptionInput>({
      query: (input) => ({ url: "/new-cars/attribute-options", method: "POST", data: input }),
      transformResponse: (res: AttributeOptionSingleRawResponse) => res.data,
      invalidatesTags: [ATTRIBUTE_OPTION_LIST_TAG],
    }),

    updateAttributeOption: builder.mutation<AttributeOptionRecord, { id: number; input: UpdateAttributeOptionInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/attribute-options/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AttributeOptionSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AttributeOption", id }, ATTRIBUTE_OPTION_LIST_TAG],
    }),

    deleteAttributeOption: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/attribute-options/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AttributeOption", id }, ATTRIBUTE_OPTION_LIST_TAG],
    }),
  }),
});

export const {
  useGetAttributeOptionsQuery,
  useGetAttributeOptionsGroupedQuery,
  useGetAttributeOptionByIdQuery,
  useCreateAttributeOptionMutation,
  useUpdateAttributeOptionMutation,
  useDeleteAttributeOptionMutation,
} = attributeOptionApi;