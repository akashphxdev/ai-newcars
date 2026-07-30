// src/pages/newCars/FeatureCategories/featureCategory.api.ts
import { api } from "../../../store/baseApi";

export interface FeatureCategoryRecord {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListFeatureCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateFeatureCategoryInput {
  name: string;
  sortOrder?: number;
}

export interface UpdateFeatureCategoryInput {
  name?: string;
  sortOrder?: number;
}

interface FeatureCategoryListRawResponse {
  success: true;
  data: FeatureCategoryRecord[];
  pagination: Pagination;
}

interface FeatureCategorySingleRawResponse {
  success: true;
  data: FeatureCategoryRecord;
}

export interface FeatureCategoryOption {
  id: number;
  name: string;
}

interface FeatureCategoryOptionsRawResponse {
  success: true;
  data: FeatureCategoryOption[];
}

export interface FeatureCategoryListResult {
  data: FeatureCategoryRecord[];
  pagination: Pagination;
}

const FEATURE_CATEGORY_LIST_TAG = { type: "FeatureCategory" as const, id: "LIST" };

export const featureCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFeatureCategories: builder.query<FeatureCategoryListResult, ListFeatureCategoriesParams | void>({
      query: (params) => ({ url: "/new-cars/feature-categories", method: "GET", params: params ?? {} }),
      transformResponse: (res: FeatureCategoryListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c) => ({ type: "FeatureCategory" as const, id: c.id })), FEATURE_CATEGORY_LIST_TAG]
          : [FEATURE_CATEGORY_LIST_TAG],
    }),

    // Dropdown-only source — every category in one shot, no pagination.
    // Use this (not getFeatureCategories) wherever it's just a <select>:
    // the Feature add/edit form.
    getFeatureCategoryOptions: builder.query<FeatureCategoryOption[], void>({
      query: () => ({ url: "/new-cars/feature-categories/options", method: "GET" }),
      transformResponse: (res: FeatureCategoryOptionsRawResponse) => res.data,
      providesTags: [FEATURE_CATEGORY_LIST_TAG],
    }),

    createFeatureCategory: builder.mutation<FeatureCategoryRecord, CreateFeatureCategoryInput>({
      query: (input) => ({ url: "/new-cars/feature-categories", method: "POST", data: input }),
      transformResponse: (res: FeatureCategorySingleRawResponse) => res.data,
      invalidatesTags: [FEATURE_CATEGORY_LIST_TAG],
    }),

    updateFeatureCategory: builder.mutation<FeatureCategoryRecord, { id: number; input: UpdateFeatureCategoryInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/feature-categories/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: FeatureCategorySingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeatureCategory", id }, FEATURE_CATEGORY_LIST_TAG],
    }),

    // Deleting a category sets categoryId to NULL on any features that
    // referenced it (DB-level ON DELETE SET NULL) — invalidate the
    // Feature list too so their category column refreshes.
    deleteFeatureCategory: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/feature-categories/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "FeatureCategory", id },
        FEATURE_CATEGORY_LIST_TAG,
        { type: "Feature", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetFeatureCategoriesQuery,
  useGetFeatureCategoryOptionsQuery,
  useCreateFeatureCategoryMutation,
  useUpdateFeatureCategoryMutation,
  useDeleteFeatureCategoryMutation,
} = featureCategoryApi;
