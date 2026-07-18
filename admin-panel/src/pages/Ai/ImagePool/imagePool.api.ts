// src/pages/Ai/ImagePool/imagePool.api.ts
import { api } from "../../../store/baseApi";

export interface AiImagePoolUploaderSummary {
  id: number;
  name: string;
}

export interface AiImagePoolRecord {
  id: number;
  featureKey: number;
  imageUrl: string;
  originalFilename: string | null;
  isUsed: boolean;
  usedForId: number | null;
  usedAt: string | null;
  uploadedBy: number | null;
  uploadedByAdmin: AiImagePoolUploaderSummary | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListImagePoolParams {
  page?: number;
  limit?: number;
  featureKey?: number;
  isUsed?: boolean;
}

interface ImagePoolListRawResponse {
  success: true;
  data: AiImagePoolRecord[];
  pagination: Pagination;
}

interface ImagePoolUploadRawResponse {
  success: true;
  data: AiImagePoolRecord[];
}

export interface ImagePoolListResult {
  data: AiImagePoolRecord[];
  pagination: Pagination;
}

const IMAGE_POOL_LIST_TAG = { type: "AiImagePool" as const, id: "LIST" };

export const imagePoolApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getImagePool: builder.query<ImagePoolListResult, ListImagePoolParams | void>({
      query: (params) => ({
        url: "/ai/image-pool",
        method: "GET",
        params: params ?? {},
      }),
      transformResponse: (res: ImagePoolListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((img) => ({ type: "AiImagePool" as const, id: img.id })), IMAGE_POOL_LIST_TAG]
          : [IMAGE_POOL_LIST_TAG],
    }),

    uploadImagePool: builder.mutation<AiImagePoolRecord[], { featureKey: number; files: File[] }>({
      query: ({ featureKey, files }) => {
        const formData = new FormData();
        formData.append("featureKey", String(featureKey));
        files.forEach((file) => formData.append("images", file));
        return { url: "/ai/image-pool/upload", method: "POST", data: formData };
      },
      transformResponse: (res: ImagePoolUploadRawResponse) => res.data,
      invalidatesTags: [IMAGE_POOL_LIST_TAG],
    }),

    deleteImagePool: builder.mutation<void, number>({
      query: (id) => ({ url: `/ai/image-pool/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AiImagePool", id }, IMAGE_POOL_LIST_TAG],
    }),
  }),
});

export const {
  useGetImagePoolQuery,
  useUploadImagePoolMutation,
  useDeleteImagePoolMutation,
} = imagePoolApi;