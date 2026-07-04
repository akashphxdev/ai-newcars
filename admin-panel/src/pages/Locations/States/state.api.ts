// src/pages/Locations/state.api.ts
//
// RTK Query version, same pattern as country.api.ts.

import { api } from "../../../store/baseApi";

export interface StateRecord {
  id: number;
  countryId: number;
  name: string;
  code: string | null;
  country: { id: number; name: string; code: string } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListStatesParams {
  page?: number;
  limit?: number;
  search?: string;
  countryId?: number;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateStateInput {
  countryId: number;
  name: string;
  code: string;
}

export interface UpdateStateInput {
  countryId: number;
  name: string;
  code: string;
}

interface StateListRawResponse {
  success: true;
  data: StateRecord[];
  pagination: Pagination;
}

interface StateSingleRawResponse {
  success: true;
  data: StateRecord;
}

export interface StateListResult {
  data: StateRecord[];
  pagination: Pagination;
}

const STATE_LIST_TAG = { type: "State" as const, id: "LIST" };

export const stateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<StateListResult, ListStatesParams | void>({
      query: (params) => ({ url: "/locations/states", method: "GET", params: params ?? {} }),
      transformResponse: (res: StateListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((s) => ({ type: "State" as const, id: s.id })), STATE_LIST_TAG]
          : [STATE_LIST_TAG],
    }),

    getStateById: builder.query<StateRecord, number>({
      query: (id) => ({ url: `/locations/states/${id}`, method: "GET" }),
      transformResponse: (res: StateSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "State", id }],
    }),

    createState: builder.mutation<StateRecord, CreateStateInput>({
      query: (body) => ({ url: "/locations/states", method: "POST", data: body }),
      transformResponse: (res: StateSingleRawResponse) => res.data,
      invalidatesTags: [STATE_LIST_TAG],
    }),

    updateState: builder.mutation<StateRecord, { id: number; input: UpdateStateInput }>({
      query: ({ id, input }) => ({ url: `/locations/states/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: StateSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "State", id }, STATE_LIST_TAG],
    }),

    deleteState: builder.mutation<void, number>({
      query: (id) => ({ url: `/locations/states/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "State", id }, STATE_LIST_TAG],
    }),
  }),
});

export const {
  useGetStatesQuery,
  useGetStateByIdQuery,
  useCreateStateMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} = stateApi;