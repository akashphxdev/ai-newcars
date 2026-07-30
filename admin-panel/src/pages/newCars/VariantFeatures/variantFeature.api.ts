// src/pages/newCars/VariantFeatures/variantFeature.api.ts
import { api } from "../../../store/baseApi";

export interface FeatureCatalogItem {
  id: number;
  name: string;
}

export interface FeatureCatalogGroup {
  categoryId: number | null;
  categoryName: string;
  features: FeatureCatalogItem[];
}

export interface VariantFeatureAssignment {
  featureId: number;
  value: string | null;
}

export interface SyncVariantFeaturesInput {
  features: { featureId: number; value?: string }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListVariantsWithFeaturesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// A variant only appears here once it has at least one feature
// assigned — brand-new variants are picked via "Add Feature" instead.
export interface VariantWithFeaturesRecord {
  id: number;
  variantName: string;
  price: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
  featureCount: number;
}

export interface VariantsWithFeaturesListResult {
  data: VariantWithFeaturesRecord[];
  pagination: Pagination;
}

interface VariantsWithFeaturesRawResponse {
  success: true;
  data: VariantWithFeaturesRecord[];
  pagination: Pagination;
}

interface FeatureCatalogRawResponse {
  success: true;
  data: FeatureCatalogGroup[];
}

interface VariantFeaturesRawResponse {
  success: true;
  data: VariantFeatureAssignment[];
}

const VARIANT_FEATURE_LIST_TAG = { type: "VariantFeature" as const, id: "LIST" };
const variantFeatureTag = (variantId: number) => ({ type: "VariantFeature" as const, id: variantId });

export const variantFeatureApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Listing for the admin page — only variants that already have
    // features assigned (see backend's listVariantsWithFeatures).
    getVariantsWithFeatures: builder.query<VariantsWithFeaturesListResult, ListVariantsWithFeaturesParams | void>({
      query: (params) => ({ url: "/new-cars/variant-features", method: "GET", params: params ?? {} }),
      transformResponse: (res: VariantsWithFeaturesRawResponse) => ({ data: res.data, pagination: res.pagination }),
      providesTags: (result) =>
        result
          ? [...result.data.map((v) => variantFeatureTag(v.id)), VARIANT_FEATURE_LIST_TAG]
          : [VARIANT_FEATURE_LIST_TAG],
    }),

    // Full feature catalog grouped by category — same regardless of
    // which variant is selected, powers the checklist itself.
    getFeatureCatalog: builder.query<FeatureCatalogGroup[], void>({
      query: () => ({ url: "/new-cars/variant-features/catalog", method: "GET" }),
      transformResponse: (res: FeatureCatalogRawResponse) => res.data,
      providesTags: [{ type: "Feature", id: "LIST" }],
    }),

    getVariantFeatures: builder.query<VariantFeatureAssignment[], number>({
      query: (variantId) => ({ url: `/new-cars/variant-features/${variantId}`, method: "GET" }),
      transformResponse: (res: VariantFeaturesRawResponse) => res.data,
      providesTags: (_result, _error, variantId) => [variantFeatureTag(variantId)],
    }),

    // Invalidates the LIST tag too — a variant with zero features
    // assigned (saved for the first time via "Add Feature") needs to
    // appear in the listing after this succeeds.
    syncVariantFeatures: builder.mutation<void, { variantId: number; input: SyncVariantFeaturesInput }>({
      query: ({ variantId, input }) => ({
        url: `/new-cars/variant-features/${variantId}`,
        method: "PUT",
        data: input,
      }),
      invalidatesTags: (_result, _error, { variantId }) => [variantFeatureTag(variantId), VARIANT_FEATURE_LIST_TAG],
    }),
  }),
});

export const {
  useGetVariantsWithFeaturesQuery,
  useGetFeatureCatalogQuery,
  useGetVariantFeaturesQuery,
  useSyncVariantFeaturesMutation,
} = variantFeatureApi;
