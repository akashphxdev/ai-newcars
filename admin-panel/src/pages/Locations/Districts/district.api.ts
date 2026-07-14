// src/pages/Locations/district.api.ts
//
// RTK Query version, same pattern as state.api.ts.

import { api } from "../../../store/baseApi";

export interface DistrictRecord {
  id: number;
  stateId: number;
  name: string;
  state: {
    id: number;
    name: string;
    country: { id: number; name: string } | null;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListDistrictsParams {
  page?: number;
  limit?: number;
  search?: string;
  stateId?: number;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateDistrictInput {
  stateId: number;
  name: string;
}

export interface UpdateDistrictInput {
  stateId: number;
  name: string;
}

interface DistrictListRawResponse {
  success: true;
  data: DistrictRecord[];
  pagination: Pagination;
}

interface DistrictSingleRawResponse {
  success: true;
  data: DistrictRecord;
}

export interface DistrictOption {
  id: number;
  name: string;
  stateId: number;
}

export interface ListDistrictOptionsParams {
  stateId?: number;
}

interface DistrictOptionsRawResponse {
  success: true;
  data: DistrictOption[];
}

export interface DistrictListResult {
  data: DistrictRecord[];
  pagination: Pagination;
}

const DISTRICT_LIST_TAG = { type: "District" as const, id: "LIST" };

export const districtApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDistricts: builder.query<DistrictListResult, ListDistrictsParams | void>({
      query: (params) => ({ url: "/locations/districts", method: "GET", params: params ?? {} }),
      transformResponse: (res: DistrictListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((d) => ({ type: "District" as const, id: d.id })), DISTRICT_LIST_TAG]
          : [DISTRICT_LIST_TAG],
    }),

    // Dropdown-only source — every matching district in one shot, no
    // pagination. Use this (not getDistricts) wherever District is
    // just a <select>: City forms & filters.
    getDistrictOptions: builder.query<DistrictOption[], ListDistrictOptionsParams | void>({
      query: (params) => ({ url: "/locations/districts/options", method: "GET", params: params ?? {} }),
      transformResponse: (res: DistrictOptionsRawResponse) => res.data,
      providesTags: [DISTRICT_LIST_TAG],
    }),

    getDistrictById: builder.query<DistrictRecord, number>({
      query: (id) => ({ url: `/locations/districts/${id}`, method: "GET" }),
      transformResponse: (res: DistrictSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "District", id }],
    }),

    createDistrict: builder.mutation<DistrictRecord, CreateDistrictInput>({
      query: (body) => ({ url: "/locations/districts", method: "POST", data: body }),
      transformResponse: (res: DistrictSingleRawResponse) => res.data,
      invalidatesTags: [DISTRICT_LIST_TAG],
    }),

    updateDistrict: builder.mutation<DistrictRecord, { id: number; input: UpdateDistrictInput }>({
      query: ({ id, input }) => ({ url: `/locations/districts/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: DistrictSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "District", id }, DISTRICT_LIST_TAG],
    }),

    deleteDistrict: builder.mutation<void, number>({
      query: (id) => ({ url: `/locations/districts/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "District", id }, DISTRICT_LIST_TAG],
    }),
  }),
});

export const {
  useGetDistrictsQuery,
  useGetDistrictOptionsQuery,
  useGetDistrictByIdQuery,
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  useDeleteDistrictMutation,
} = districtApi;