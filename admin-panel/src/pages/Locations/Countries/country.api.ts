// src/pages/Locations/country.api.ts

import { api } from "../../../store/baseApi";

export type DistanceUnit = "KM" | "Miles";
export type FuelUnit = "Liter" | "Gallon";

export interface CountryRecord {
  id: number;
  name: string;
  code: string;
  currency: string | null;
  currencySymbol: string | null;
  currencyCode: string | null;
  exchangeRate: string | null;
  distanceUnit: DistanceUnit | null;
  fuelUnit: FuelUnit | null;
  isActive: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCountriesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateCountryInput {
  name: string;
  code: string;
  currency?: string;
  currencySymbol?: string;
  currencyCode?: string;
  exchangeRate?: number;
  distanceUnit?: DistanceUnit;
  fuelUnit?: FuelUnit;
  isActive?: boolean;
}

export interface UpdateCountryInput {
  name?: string;
  code?: string;
  currency?: string;
  currencySymbol?: string;
  currencyCode?: string;
  exchangeRate?: number;
  distanceUnit?: DistanceUnit;
  fuelUnit?: FuelUnit;
  isActive?: boolean;
}

interface CountryListRawResponse {
  success: true;
  data: CountryRecord[];
  pagination: Pagination;
}

interface CountrySingleRawResponse {
  success: true;
  data: CountryRecord;
}

export interface CountryOption {
  id: number;
  name: string;
  code: string;
}

export interface ListCountryOptionsParams {
  isActive?: boolean;
}

interface CountryOptionsRawResponse {
  success: true;
  data: CountryOption[];
}

export interface CountryListResult {
  data: CountryRecord[];
  pagination: Pagination;
}

const COUNTRY_LIST_TAG = { type: "Country" as const, id: "LIST" };

export const countryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCountries: builder.query<CountryListResult, ListCountriesParams | void>({
      query: (params) => ({ url: "/locations/countries", method: "GET", params: params ?? {} }),
      transformResponse: (res: CountryListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((c) => ({ type: "Country" as const, id: c.id })),
              COUNTRY_LIST_TAG,
            ]
          : [COUNTRY_LIST_TAG],
    }),

    // Dropdown-only source — every country in one shot, no pagination.
    // Use this (not getCountries) wherever Country is just a <select>:
    // State/District/City/Brand forms & filters.
    getCountryOptions: builder.query<CountryOption[], ListCountryOptionsParams | void>({
      query: (params) => ({ url: "/locations/countries/options", method: "GET", params: params ?? {} }),
      transformResponse: (res: CountryOptionsRawResponse) => res.data,
      providesTags: [COUNTRY_LIST_TAG],
    }),

    getCountryById: builder.query<CountryRecord, number>({
      query: (id) => ({ url: `/locations/countries/${id}`, method: "GET" }),
      transformResponse: (res: CountrySingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Country", id }],
    }),

    createCountry: builder.mutation<CountryRecord, CreateCountryInput>({
      query: (body) => ({ url: "/locations/countries", method: "POST", data: body }),
      transformResponse: (res: CountrySingleRawResponse) => res.data,
      invalidatesTags: [COUNTRY_LIST_TAG],
    }),

    updateCountry: builder.mutation<CountryRecord, { id: number; input: UpdateCountryInput }>({
      query: ({ id, input }) => ({ url: `/locations/countries/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: CountrySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Country", id }, COUNTRY_LIST_TAG],
    }),

    updateCountryStatus: builder.mutation<CountryRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/locations/countries/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: CountrySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Country", id }, COUNTRY_LIST_TAG],
    }),

    deleteCountry: builder.mutation<void, number>({
      query: (id) => ({ url: `/locations/countries/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Country", id }, COUNTRY_LIST_TAG],
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useGetCountryOptionsQuery,
  useGetCountryByIdQuery,
  useCreateCountryMutation,
  useUpdateCountryMutation,
  useUpdateCountryStatusMutation,
  useDeleteCountryMutation,
} = countryApi;