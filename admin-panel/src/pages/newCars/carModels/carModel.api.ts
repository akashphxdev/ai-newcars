// src/pages/newCars/carModels/carModel.api.ts
import { api } from "../../../store/baseApi";

export type LaunchStatus = "available" | "upcoming" | "discontinued";

// Minimal body type shape embedded in the car model record — mirrors
// BodyTypeRecord in BodyTypes/bodyType.api.ts.
export interface BodyTypeSummary {
  id: number;
  name: string;
  slug: string;
}

export interface CarModelRecord {
  id: number;
  brandId: number;
  name: string;
  slug: string;
  bodyTypeId: number | null;
  bodyType: BodyTypeSummary | null;
  launchStatus: LaunchStatus;
  expectedLaunchDate: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  brand: { id: number; name: string };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCarModelsParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: number;
  bodyTypeId?: number;
  launchStatus?: LaunchStatus;
  sortBy?: "name" | "id" | "priceMin" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateCarModelInput {
  brandId: number;
  name: string;
  slug?: string; // auto-generated from name if left blank — intentionally optional
  bodyTypeId: number;
  launchStatus?: LaunchStatus;
  expectedLaunchDate?: string;
  priceMin: number;
  priceMax: number;
  coverImage?: File;
}

export interface UpdateCarModelInput {
  brandId?: number;
  name?: string;
  slug?: string;
  bodyTypeId?: number | null;
  launchStatus?: LaunchStatus;
  expectedLaunchDate?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
}

interface CarModelListRawResponse {
  success: true;
  data: CarModelRecord[];
  pagination: Pagination;
}

interface CarModelSingleRawResponse {
  success: true;
  data: CarModelRecord;
}

export interface CarModelOption {
  id: number;
  name: string;
  brandId: number;
  // Needed because most dropdowns render this as "Brand — Model".
  brand: { name: string };
}

export interface ListCarModelOptionsParams {
  brandId?: number;
}

interface CarModelOptionsRawResponse {
  success: true;
  data: CarModelOption[];
}

export interface CarModelListResult {
  data: CarModelRecord[];
  pagination: Pagination;
}

const CAR_MODEL_LIST_TAG = { type: "CarModel" as const, id: "LIST" };

export const carModelApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCarModels: builder.query<CarModelListResult, ListCarModelsParams | void>({
      query: (params) => ({ url: "/new-cars/car-models", method: "GET", params: params ?? {} }),
      transformResponse: (res: CarModelListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((m) => ({ type: "CarModel" as const, id: m.id })), CAR_MODEL_LIST_TAG]
          : [CAR_MODEL_LIST_TAG],
    }),

    // Dropdown-only source — every matching car model in one shot, no
    // pagination. Use this (not getCarModels) wherever CarModel is just
    // a <select>: Variant/Powertrain/Offer/Faq/Video/Article forms & filters.
    getCarModelOptions: builder.query<CarModelOption[], ListCarModelOptionsParams | void>({
      query: (params) => ({ url: "/new-cars/car-models/options", method: "GET", params: params ?? {} }),
      transformResponse: (res: CarModelOptionsRawResponse) => res.data,
      providesTags: [CAR_MODEL_LIST_TAG],
    }),

    getCarModelById: builder.query<CarModelRecord, number>({
      query: (id) => ({ url: `/new-cars/car-models/${id}`, method: "GET" }),
      transformResponse: (res: CarModelSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "CarModel", id }],
    }),

    createCarModel: builder.mutation<CarModelRecord, CreateCarModelInput>({
      query: ({ coverImage, ...fields }) => {
        const formData = new FormData();
        formData.append("brandId", String(fields.brandId));
        formData.append("name", fields.name);
        if (fields.slug) formData.append("slug", fields.slug);
        formData.append("bodyTypeId", String(fields.bodyTypeId));
        if (fields.launchStatus) formData.append("launchStatus", fields.launchStatus);
        if (fields.expectedLaunchDate) formData.append("expectedLaunchDate", fields.expectedLaunchDate);
        formData.append("priceMin", String(fields.priceMin));
        formData.append("priceMax", String(fields.priceMax));
        if (coverImage) formData.append("coverImage", coverImage);
        return { url: "/new-cars/car-models", method: "POST", data: formData };
      },
      transformResponse: (res: CarModelSingleRawResponse) => res.data,
      invalidatesTags: [CAR_MODEL_LIST_TAG],
    }),

    updateCarModel: builder.mutation<CarModelRecord, { id: number; input: UpdateCarModelInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/car-models/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: CarModelSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarModel", id }, CAR_MODEL_LIST_TAG],
    }),

  uploadCarModelCoverImage: builder.mutation<{ id: number; coverImageUrl: string | null }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("coverImage", file);
        return { url: `/new-cars/car-models/${id}/cover-image`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; coverImageUrl: string | null } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarModel", id }, CAR_MODEL_LIST_TAG],
    }),

    updateCarModelLaunchStatus: builder.mutation<
      CarModelRecord,
      { id: number; launchStatus: LaunchStatus; expectedLaunchDate?: string }
    >({
      query: ({ id, launchStatus, expectedLaunchDate }) => ({
        url: `/new-cars/car-models/${id}/launch-status`,
        method: "PATCH",
        data: { launchStatus, expectedLaunchDate },
      }),
      transformResponse: (res: CarModelSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarModel", id }, CAR_MODEL_LIST_TAG],
    }),

    deleteCarModel: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/car-models/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "CarModel", id }, CAR_MODEL_LIST_TAG],
    }),
  }),
});

export const {
  useGetCarModelsQuery,
  useGetCarModelOptionsQuery,
  useGetCarModelByIdQuery,
  useCreateCarModelMutation,
  useUpdateCarModelMutation,
  useUpdateCarModelLaunchStatusMutation,
  useUploadCarModelCoverImageMutation,
  useDeleteCarModelMutation,
} = carModelApi;