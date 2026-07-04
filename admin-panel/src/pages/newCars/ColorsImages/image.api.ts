// src/pages/newCars/ColorsImages/image.api.ts
//
// RTK Query version, same pattern as color.api.ts / brand.api.ts.

import { api } from "../../../store/baseApi";

export type CarImageAngle =
  | "front"
  | "rear"
  | "side"
  | "interior"
  | "dashboard"
  | "boot"
  | "wheel"
  | "top"
  | "other";

export interface CarImageRecord {
  id: number;
  modelId: number;
  variantId: number | null;
  imageUrl: string;
  isPrimary: boolean;
  angle: CarImageAngle | null;
  model: { id: number; name: string };
  variant: { id: number; variantName: string } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListImagesParams {
  page?: number;
  limit?: number;
  modelId?: number;
  variantId?: number;
  angle?: CarImageAngle;
  isPrimary?: boolean;
  sortBy?: "id" | "isPrimary";
  sortOrder?: "asc" | "desc";
}

export interface CreateImageInput {
  modelId: number;
  variantId?: number;
  isPrimary?: boolean;
  angle?: CarImageAngle;
  // Required on create — every gallery row is exactly one image file.
  image: File;
}

export interface UpdateImageInput {
  modelId?: number;
  variantId?: number | null;
  isPrimary?: boolean;
  angle?: CarImageAngle | null;
}

interface ImageListRawResponse {
  success: true;
  data: CarImageRecord[];
  pagination: Pagination;
}

interface ImageSingleRawResponse {
  success: true;
  data: CarImageRecord;
}

export interface ImageListResult {
  data: CarImageRecord[];
  pagination: Pagination;
}

const IMAGE_LIST_TAG = { type: "CarImage" as const, id: "LIST" };

export const imageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getImages: builder.query<ImageListResult, ListImagesParams | void>({
      query: (params) => ({ url: "/new-cars/images", method: "GET", params: params ?? {} }),
      transformResponse: (res: ImageListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((i) => ({ type: "CarImage" as const, id: i.id })), IMAGE_LIST_TAG]
          : [IMAGE_LIST_TAG],
    }),

    getImageById: builder.query<CarImageRecord, number>({
      query: (id) => ({ url: `/new-cars/images/${id}`, method: "GET" }),
      transformResponse: (res: ImageSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "CarImage", id }],
    }),

    createImage: builder.mutation<CarImageRecord, CreateImageInput>({
      query: ({ image, ...fields }) => {
        const formData = new FormData();
        formData.append("modelId", String(fields.modelId));
        if (fields.variantId) formData.append("variantId", String(fields.variantId));
        formData.append("isPrimary", String(fields.isPrimary ?? false));
        if (fields.angle) formData.append("angle", fields.angle);
        formData.append("image", image);
        return { url: "/new-cars/images", method: "POST", data: formData };
      },
      transformResponse: (res: ImageSingleRawResponse) => res.data,
      invalidatesTags: [IMAGE_LIST_TAG],
    }),

    updateImage: builder.mutation<CarImageRecord, { id: number; input: UpdateImageInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/images/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: ImageSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarImage", id }, IMAGE_LIST_TAG],
    }),

    // Lightweight row-level "set as cover" toggle — separate from the
    // full edit mutation, same idea as brand.api.ts's updateBrandStatus.
    setPrimaryImage: builder.mutation<CarImageRecord, { id: number; isPrimary: boolean }>({
      query: ({ id, isPrimary }) => ({
        url: `/new-cars/images/${id}/set-primary`,
        method: "PATCH",
        data: { isPrimary },
      }),
      transformResponse: (res: ImageSingleRawResponse) => res.data,
      invalidatesTags: [IMAGE_LIST_TAG],
    }),

    replaceImageFile: builder.mutation<{ id: number; imageUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return { url: `/new-cars/images/${id}/file`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; imageUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "CarImage", id }, IMAGE_LIST_TAG],
    }),

    deleteImage: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/images/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "CarImage", id }, IMAGE_LIST_TAG],
    }),
  }),
});

export const {
  useGetImagesQuery,
  useGetImageByIdQuery,
  useCreateImageMutation,
  useUpdateImageMutation,
  useSetPrimaryImageMutation,
  useReplaceImageFileMutation,
  useDeleteImageMutation,
} = imageApi;