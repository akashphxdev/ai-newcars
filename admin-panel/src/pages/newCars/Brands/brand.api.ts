// src/pages/Brands/brand.api.ts
//
// RTK Query version, same pattern as country.api.ts / city.api.ts.

import { api } from "../../../store/baseApi";

export interface BrandRecord {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  countryOriginId: number | null;
  isActive: boolean;
  createdAt: string;
  countryOrigin: { id: number; name: string } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListBrandsParams {
  page?: number;
  limit?: number;
  search?: string;
  countryOriginId?: number;
  isActive?: boolean;
  sortBy?: "name" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  countryOriginId: number;
  isActive?: boolean;
  // Required on create — same as CreateCityInput's logo.
  logo: File;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  // Explicit `null` clears the country-of-origin, `undefined`/omitted
  // leaves it untouched — mirrors the backend's updateBrandSchema.
  countryOriginId?: number | null;
  isActive?: boolean;
}

interface BrandListRawResponse {
  success: true;
  data: BrandRecord[];
  pagination: Pagination;
}

interface BrandSingleRawResponse {
  success: true;
  data: BrandRecord;
}

export interface BrandOption {
  id: number;
  name: string;
}

export interface ListBrandOptionsParams {
  isActive?: boolean;
}

interface BrandOptionsRawResponse {
  success: true;
  data: BrandOption[];
}

export interface BrandListResult {
  data: BrandRecord[];
  pagination: Pagination;
}

const BRAND_LIST_TAG = { type: "Brand" as const, id: "LIST" };

export const brandApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query<BrandListResult, ListBrandsParams | void>({
      query: (params) => ({ url: "/new-cars/brands", method: "GET", params: params ?? {} }),
      transformResponse: (res: BrandListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((b) => ({ type: "Brand" as const, id: b.id })), BRAND_LIST_TAG]
          : [BRAND_LIST_TAG],
    }),

    // Dropdown-only source — every brand in one shot, no pagination. Use
    // this (not getBrands) wherever Brand is just a <select>:
    // CarModel/Variant/Powertrain/Article forms & filters.
    getBrandOptions: builder.query<BrandOption[], ListBrandOptionsParams | void>({
      query: (params) => ({ url: "/new-cars/brands/options", method: "GET", params: params ?? {} }),
      transformResponse: (res: BrandOptionsRawResponse) => res.data,
      providesTags: [BRAND_LIST_TAG],
    }),

    getBrandById: builder.query<BrandRecord, number>({
      query: (id) => ({ url: `/new-cars/brands/${id}`, method: "GET" }),
      transformResponse: (res: BrandSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Brand", id }],
    }),

    createBrand: builder.mutation<BrandRecord, CreateBrandInput>({
      query: ({ logo, ...fields }) => {
        const formData = new FormData();
        formData.append("name", fields.name);
        if (fields.slug) formData.append("slug", fields.slug);
        formData.append("countryOriginId", String(fields.countryOriginId));
        formData.append("isActive", String(fields.isActive ?? true));
        formData.append("logo", logo);
        return { url: "/new-cars/brands", method: "POST", data: formData };
      },
      transformResponse: (res: BrandSingleRawResponse) => res.data,
      invalidatesTags: [BRAND_LIST_TAG],
    }),

    updateBrand: builder.mutation<BrandRecord, { id: number; input: UpdateBrandInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/brands/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: BrandSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Brand", id }, BRAND_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — separate from the
    // full edit mutation so flipping the switch doesn't need the whole
    // edit form's payload.
    updateBrandStatus: builder.mutation<BrandRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/new-cars/brands/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: BrandSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Brand", id }, BRAND_LIST_TAG],
    }),

    uploadBrandLogo: builder.mutation<{ id: number; logoUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("logo", file);
        return { url: `/new-cars/brands/${id}/logo`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; logoUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Brand", id }, BRAND_LIST_TAG],
    }),

    deleteBrand: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/brands/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Brand", id }, BRAND_LIST_TAG],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useGetBrandOptionsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useUpdateBrandStatusMutation,
  useUploadBrandLogoMutation,
  useDeleteBrandMutation,
} = brandApi;