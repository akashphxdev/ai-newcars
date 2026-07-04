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
  slug?: string;
  bodyType?: BodyType;
  launchStatus?: LaunchStatus;
  expectedLaunchDate?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface UpdateCarModelInput {
  brandId?: number;
  name?: string;
  slug?: string;
  // Explicit `null` clears the field, `undefined`/omitted leaves it
  // untouched — mirrors the backend's updateCarModelSchema.
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
      query: (body) => ({ url: "/new-cars/car-models", method: "POST", data: body }),
      transformResponse: (res: CarModelSingleRawResponse) => res.data,
      invalidatesTags: [CAR_MODEL_LIST_TAG],
    }),

    updateCarModel: builder.mutation<CarModelRecord, { id: number; input: UpdateCarModelInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/car-models/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: CarModelSingleRawResponse) => res.data,
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
  useDeleteCarModelMutation,
} = carModelApi;