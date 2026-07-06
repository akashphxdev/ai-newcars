// src/pages/newCars/carModels/carModel.api.ts
import { api } from "../../../store/baseApi";

export type BodyType =
  | "hatchback"
  | "sedan"
  | "suv"
  | "muv"
  | "coupe"
  | "convertible"
  | "pickup"
  | "van";

export type LaunchStatus = "available" | "upcoming" | "discontinued";

export interface CarModelRecord {
  id: number;
  brandId: number;
  name: string;
  slug: string;
  bodyType: BodyType | null;
  launchStatus: LaunchStatus;
  expectedLaunchDate: string | null;
  // Decimal fields come back from Prisma serialized as strings.
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
  bodyType?: BodyType;
  launchStatus?: LaunchStatus;
  sortBy?: "name" | "id" | "priceMin" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateCarModelInput {
  brandId: number;
  name: string;
  slug?: string; // auto-generated from name if left blank — intentionally optional
  bodyType: BodyType;
  launchStatus?: LaunchStatus;
  // Required only when launchStatus === "upcoming" — enforced by the backend too.
  expectedLaunchDate?: string;
  priceMin: number;
  priceMax: number;
  // Optional at create time — can also be set/replaced later via uploadCoverImage.
  coverImage?: File;
}

export interface UpdateCarModelInput {
  brandId?: number;
  name?: string;
  slug?: string;
  // Explicit `null` clears the field, `undefined`/omitted leaves it
  // untouched — mirrors the backend's updateCarModelSchema (PATCH semantics).
  bodyType?: BodyType | null;
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
        formData.append("bodyType", fields.bodyType);
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

    // Dedicated "replace just the cover image" mutation — mirrors
    // image.api.ts's replaceImageFile, so the modal doesn't need to resend
    // the whole edit form just to swap the thumbnail.
    uploadCarModelCoverImage: builder.mutation<
      { id: number; coverImageUrl: string | null },
      { id: number; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("coverImage", file);
        return { url: `/new-cars/car-models/${id}/cover-image`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; coverImageUrl: string | null } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarModel", id }, CAR_MODEL_LIST_TAG],
    }),

    // Lightweight row-level quick launch-status change — separate from
    // the full edit mutation so changing it doesn't need the whole
    // edit form's payload.
    updateCarModelLaunchStatus: builder.mutation<CarModelRecord, { id: number; launchStatus: LaunchStatus }>({
      query: ({ id, launchStatus }) => ({
        url: `/new-cars/car-models/${id}/launch-status`,
        method: "PATCH",
        data: { launchStatus },
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
  useGetCarModelByIdQuery,
  useCreateCarModelMutation,
  useUpdateCarModelMutation,
  useUpdateCarModelLaunchStatusMutation,
  useUploadCarModelCoverImageMutation,
  useDeleteCarModelMutation,
} = carModelApi;