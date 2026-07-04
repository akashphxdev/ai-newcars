// src/pages/newCars/ColorsImages/color.api.ts
//
// RTK Query version, same pattern as brand.api.ts.

import { api } from "../../../store/baseApi";

export interface CarColorRecord {
  id: number;
  modelId: number;
  colorName: string;
  colorHex: string | null;
  isDualTone: boolean;
  imageUrl: string | null;
  // Decimal field comes back from Prisma serialized as a string.
  additionalCost: string | null;
  model: { id: number; name: string };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListColorsParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  isDualTone?: boolean;
  sortBy?: "colorName" | "id";
  sortOrder?: "asc" | "desc";
}

export interface CreateColorInput {
  modelId: number;
  colorName: string;
  colorHex?: string;
  isDualTone?: boolean;
  additionalCost?: number;
  // Optional — many colors are represented by colorHex alone.
  image?: File;
}

export interface UpdateColorInput {
  modelId?: number;
  colorName?: string;
  colorHex?: string | null;
  isDualTone?: boolean;
  additionalCost?: number | null;
}

interface ColorListRawResponse {
  success: true;
  data: CarColorRecord[];
  pagination: Pagination;
}

interface ColorSingleRawResponse {
  success: true;
  data: CarColorRecord;
}

export interface ColorListResult {
  data: CarColorRecord[];
  pagination: Pagination;
}

const COLOR_LIST_TAG = { type: "CarColor" as const, id: "LIST" };

export const colorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getColors: builder.query<ColorListResult, ListColorsParams | void>({
      query: (params) => ({ url: "/new-cars/colors", method: "GET", params: params ?? {} }),
      transformResponse: (res: ColorListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((c) => ({ type: "CarColor" as const, id: c.id })), COLOR_LIST_TAG]
          : [COLOR_LIST_TAG],
    }),

    getColorById: builder.query<CarColorRecord, number>({
      query: (id) => ({ url: `/new-cars/colors/${id}`, method: "GET" }),
      transformResponse: (res: ColorSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "CarColor", id }],
    }),

    createColor: builder.mutation<CarColorRecord, CreateColorInput>({
      query: ({ image, ...fields }) => {
        const formData = new FormData();
        formData.append("modelId", String(fields.modelId));
        formData.append("colorName", fields.colorName);
        if (fields.colorHex) formData.append("colorHex", fields.colorHex);
        formData.append("isDualTone", String(fields.isDualTone ?? false));
        if (typeof fields.additionalCost === "number") {
          formData.append("additionalCost", String(fields.additionalCost));
        }
        if (image) formData.append("image", image);
        return { url: "/new-cars/colors", method: "POST", data: formData };
      },
      transformResponse: (res: ColorSingleRawResponse) => res.data,
      invalidatesTags: [COLOR_LIST_TAG],
    }),

    updateColor: builder.mutation<CarColorRecord, { id: number; input: UpdateColorInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/colors/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: ColorSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarColor", id }, COLOR_LIST_TAG],
    }),

    uploadColorImage: builder.mutation<{ id: number; imageUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return { url: `/new-cars/colors/${id}/image`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; imageUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarColor", id }, COLOR_LIST_TAG],
    }),

    deleteColor: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/colors/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "CarColor", id }, COLOR_LIST_TAG],
    }),
  }),
});

export const {
  useGetColorsQuery,
  useGetColorByIdQuery,
  useCreateColorMutation,
  useUpdateColorMutation,
  useUploadColorImageMutation,
  useDeleteColorMutation,
} = colorApi;