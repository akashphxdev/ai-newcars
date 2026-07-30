// src/pages/newCars/Features/feature.api.ts
import { api } from "../../../store/baseApi";

export interface FeatureRecord {
  id: number;
  name: string;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListFeaturesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
}

export interface CreateFeatureInput {
  name: string;
  categoryId: number;
}

export interface UpdateFeatureInput {
  name?: string;
  categoryId?: number;
}

interface FeatureListRawResponse {
  success: true;
  data: FeatureRecord[];
  pagination: Pagination;
}

interface FeatureSingleRawResponse {
  success: true;
  data: FeatureRecord;
}

export interface FeatureOption {
  id: number;
  name: string;
  categoryId: number | null;
}

interface FeatureOptionsRawResponse {
  success: true;
  data: FeatureOption[];
}

export interface FeatureListResult {
  data: FeatureRecord[];
  pagination: Pagination;
}

const FEATURE_LIST_TAG = { type: "Feature" as const, id: "LIST" };

export const featureApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFeatures: builder.query<FeatureListResult, ListFeaturesParams | void>({
      query: (params) => ({ url: "/new-cars/features", method: "GET", params: params ?? {} }),
      transformResponse: (res: FeatureListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((f) => ({ type: "Feature" as const, id: f.id })), FEATURE_LIST_TAG]
          : [FEATURE_LIST_TAG],
    }),

    // Dropdown-only source — every feature in one shot, no pagination.
    getFeatureOptions: builder.query<FeatureOption[], void>({
      query: () => ({ url: "/new-cars/features/options", method: "GET" }),
      transformResponse: (res: FeatureOptionsRawResponse) => res.data,
      providesTags: [FEATURE_LIST_TAG],
    }),

    createFeature: builder.mutation<FeatureRecord, CreateFeatureInput>({
      query: (input) => ({ url: "/new-cars/features", method: "POST", data: input }),
      transformResponse: (res: FeatureSingleRawResponse) => res.data,
      invalidatesTags: [FEATURE_LIST_TAG],
    }),

    updateFeature: builder.mutation<FeatureRecord, { id: number; input: UpdateFeatureInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/features/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: FeatureSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Feature", id }, FEATURE_LIST_TAG],
    }),

    deleteFeature: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/features/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Feature", id }, FEATURE_LIST_TAG],
    }),
  }),
});

export const {
  useGetFeaturesQuery,
  useGetFeatureOptionsQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
} = featureApi;
