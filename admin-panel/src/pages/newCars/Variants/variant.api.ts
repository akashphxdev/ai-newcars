// src/pages/newCars/Variants/variant.api.ts
import { api } from "../../../store/baseApi";

// Minimal transmission attribute-option shape embedded in the variant
// record — mirrors AttributeOptionRecord in AttributeOptions/attributeOption.api.ts.
export interface TransmissionSummary {
  id: number;
  name: string;
  slug: string;
}

export interface VariantRecord {
  id: number;
  modelId: number;
  variantName: string;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention as CarModelRecord's priceMin/priceMax.
  price: string;
  seatingCapacity: number;
  transmissionId: number;
  transmission: TransmissionSummary;
  isTopSeller: boolean;
  createdAt: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListVariantsParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  transmissionId?: number;
  isTopSeller?: boolean;
  sortBy?: "variantName" | "id" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Every field is required on both create AND update — this module
// intentionally does NOT follow Brand/CarModel's partial-update pattern.
// The form always submits the full payload, on Add and on Edit.
export interface VariantFormInput {
  modelId: number;
  variantName: string;
  price: number;
  seatingCapacity: number;
  transmissionId: number;
  isTopSeller: boolean;
}

interface VariantListRawResponse {
  success: true;
  data: VariantRecord[];
  pagination: Pagination;
}

interface VariantSingleRawResponse {
  success: true;
  data: VariantRecord;
}

export interface VariantOption {
  id: number;
  variantName: string;
  modelId: number;
}

export interface ListVariantOptionsParams {
  modelId?: number;
}

interface VariantOptionsRawResponse {
  success: true;
  data: VariantOption[];
}

export interface VariantListResult {
  data: VariantRecord[];
  pagination: Pagination;
}

const VARIANT_LIST_TAG = { type: "Variant" as const, id: "LIST" };

export const variantApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVariants: builder.query<VariantListResult, ListVariantsParams | void>({
      query: (params) => ({ url: "/new-cars/variants", method: "GET", params: params ?? {} }),
      transformResponse: (res: VariantListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((v) => ({ type: "Variant" as const, id: v.id })), VARIANT_LIST_TAG]
          : [VARIANT_LIST_TAG],
    }),

    // Dropdown-only source — every matching variant in one shot, no
    // pagination. Use this (not getVariants) wherever Variant is just a
    // <select>: Powertrain/Offer/Feature/Image forms & filters.
    getVariantOptions: builder.query<VariantOption[], ListVariantOptionsParams | void>({
      query: (params) => ({ url: "/new-cars/variants/options", method: "GET", params: params ?? {} }),
      transformResponse: (res: VariantOptionsRawResponse) => res.data,
      providesTags: [VARIANT_LIST_TAG],
    }),

    getVariantById: builder.query<VariantRecord, number>({
      query: (id) => ({ url: `/new-cars/variants/${id}`, method: "GET" }),
      transformResponse: (res: VariantSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Variant", id }],
    }),

    createVariant: builder.mutation<VariantRecord, VariantFormInput>({
      query: (body) => ({ url: "/new-cars/variants", method: "POST", data: body }),
      transformResponse: (res: VariantSingleRawResponse) => res.data,
      invalidatesTags: [VARIANT_LIST_TAG],
    }),

    // Full replace on edit too — same VariantFormInput shape as create,
    // per the "every field required" rule for this module.
    updateVariant: builder.mutation<VariantRecord, { id: number; input: VariantFormInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/variants/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: VariantSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Variant", id }, VARIANT_LIST_TAG],
    }),

    deleteVariant: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/variants/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Variant", id }, VARIANT_LIST_TAG],
    }),
  }),
});

export const {
  useGetVariantsQuery,
  useGetVariantOptionsQuery,
  useGetVariantByIdQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = variantApi;