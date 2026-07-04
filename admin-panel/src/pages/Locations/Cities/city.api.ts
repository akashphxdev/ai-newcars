// src/pages/Locations/city.api.ts
//
// RTK Query version, same pattern as district.api.ts.

import { api } from "../../../store/baseApi";

export interface CityRecord {
  id: number;
  districtId: number;
  name: string;
  slug: string;
  isMetro: boolean;
  isTopCity: boolean;
  isSellCarEnabled: boolean;
  logoUrl: string | null;
  district: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      country: { id: number; name: string } | null;
    } | null;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  districtId?: number;
  stateId?: number;
  isMetro?: boolean;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateCityInput {
  districtId: number;
  name: string;
  slug?: string;
  isMetro?: boolean;
  isTopCity?: boolean;
  isSellCarEnabled?: boolean;
  logo: File;
}

export interface UpdateCityInput {
  districtId?: number;
  name?: string;
  slug?: string;
  isMetro?: boolean;
  isTopCity?: boolean;
  isSellCarEnabled?: boolean;
}

// Body for the lightweight PATCH /cities/:id/flags endpoint used by the
// row-level toggle switches — any subset of the three flags.
export interface UpdateCityFlagsInput {
  isMetro?: boolean;
  isTopCity?: boolean;
  isSellCarEnabled?: boolean;
}

interface CityListRawResponse {
  success: true;
  data: CityRecord[];
  pagination: Pagination;
}

interface CitySingleRawResponse {
  success: true;
  data: CityRecord;
}

export interface CityListResult {
  data: CityRecord[];
  pagination: Pagination;
}

const CITY_LIST_TAG = { type: "City" as const, id: "LIST" };

export const cityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCities: builder.query<CityListResult, ListCitiesParams | void>({
      query: (params) => ({ url: "/locations/cities", method: "GET", params: params ?? {} }),
      transformResponse: (res: CityListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c) => ({ type: "City" as const, id: c.id })), CITY_LIST_TAG]
          : [CITY_LIST_TAG],
    }),

    getCityById: builder.query<CityRecord, number>({
      query: (id) => ({ url: `/locations/cities/${id}`, method: "GET" }),
      transformResponse: (res: CitySingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "City", id }],
    }),
    createCity: builder.mutation<CityRecord, CreateCityInput>({
      query: ({ logo, ...fields }) => {
        const formData = new FormData();
        formData.append("districtId", String(fields.districtId));
        formData.append("name", fields.name);
        if (fields.slug) formData.append("slug", fields.slug);
        formData.append("isMetro", String(fields.isMetro ?? false));
        formData.append("isTopCity", String(fields.isTopCity ?? false));
        formData.append("isSellCarEnabled", String(fields.isSellCarEnabled ?? false));
        formData.append("logo", logo);
        return { url: "/locations/cities", method: "POST", data: formData };
      },
      transformResponse: (res: CitySingleRawResponse) => res.data,
      invalidatesTags: [CITY_LIST_TAG],
    }),

    updateCity: builder.mutation<CityRecord, { id: number; input: UpdateCityInput }>({
      query: ({ id, input }) => ({ url: `/locations/cities/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: CitySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "City", id }, CITY_LIST_TAG],
    }),

    // Row-level toggle switches (Metro / Top city / Sell car enabled)
    // hit this instead of the full updateCity mutation.
    updateCityFlags: builder.mutation<CityRecord, { id: number; flags: UpdateCityFlagsInput }>({
      query: ({ id, flags }) => ({ url: `/locations/cities/${id}/flags`, method: "PATCH", data: flags }),
      transformResponse: (res: CitySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "City", id }, CITY_LIST_TAG],
    }),

    uploadCityLogo: builder.mutation<{ id: number; logoUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("logo", file);
        return { url: `/locations/cities/${id}/logo`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; logoUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "City", id }, CITY_LIST_TAG],
    }),

    deleteCity: builder.mutation<void, number>({
      query: (id) => ({ url: `/locations/cities/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "City", id }, CITY_LIST_TAG],
    }),
  }),
});

export const {
  useGetCitiesQuery,
  useGetCityByIdQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useUpdateCityFlagsMutation,
  useUploadCityLogoMutation,
  useDeleteCityMutation,
} = cityApi;