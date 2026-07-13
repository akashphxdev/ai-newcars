// src/pages/newCars/Videos/video.api.ts
import { api } from "../../../store/baseApi";

export interface VideoRecord {
  id: number;
  modelId: number;
  title: string;
  videoType: number;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
  isActive: boolean;
  createdAt: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListVideosParams {
  page?: number;
  limit?: number;
  search?: string;
  modelId?: number;
  videoType?: number;
  isActive?: boolean;
  sortBy?: "title" | "id" | "viewCount" | "publishedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Every field is required — matches faq.api.ts's "all fields mandatory"
// convention. Thumbnail is required on create (multipart upload) and is
// replaced via a dedicated endpoint on edit — same split as
// brand.api.ts's logo.
export interface CreateVideoInput {
  modelId: number;
  title: string;
  videoType: number;
  videoUrl: string;
  durationSeconds: number;
  publishedAt: string;
  isActive: boolean;
  thumbnail: File;
}

export interface UpdateVideoInput {
  modelId: number;
  title: string;
  videoType: number;
  videoUrl: string;
  durationSeconds: number;
  publishedAt: string;
  isActive: boolean;
}

interface VideoListRawResponse {
  success: true;
  data: VideoRecord[];
  pagination: Pagination;
}

interface VideoSingleRawResponse {
  success: true;
  data: VideoRecord;
}

export interface VideoListResult {
  data: VideoRecord[];
  pagination: Pagination;
}

const VIDEO_LIST_TAG = { type: "Video" as const, id: "LIST" };

export const videoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVideos: builder.query<VideoListResult, ListVideosParams | void>({
      query: (params) => ({ url: "/new-cars/videos", method: "GET", params: params ?? {} }),
      transformResponse: (res: VideoListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((v) => ({ type: "Video" as const, id: v.id })), VIDEO_LIST_TAG]
          : [VIDEO_LIST_TAG],
    }),

    getVideoById: builder.query<VideoRecord, number>({
      query: (id) => ({ url: `/new-cars/videos/${id}`, method: "GET" }),
      transformResponse: (res: VideoSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "Video", id }],
    }),

    createVideo: builder.mutation<VideoRecord, CreateVideoInput>({
      query: ({ thumbnail, ...fields }) => {
        const formData = new FormData();
        formData.append("modelId", String(fields.modelId));
        formData.append("title", fields.title);
        formData.append("videoType", String(fields.videoType));
        formData.append("videoUrl", fields.videoUrl);
        formData.append("durationSeconds", String(fields.durationSeconds));
        formData.append("publishedAt", fields.publishedAt);
        formData.append("isActive", String(fields.isActive));
        formData.append("thumbnail", thumbnail);
        return { url: "/new-cars/videos", method: "POST", data: formData };
      },
      transformResponse: (res: VideoSingleRawResponse) => res.data,
      invalidatesTags: [VIDEO_LIST_TAG],
    }),

    updateVideo: builder.mutation<VideoRecord, { id: number; input: UpdateVideoInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/videos/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: VideoSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Video", id }, VIDEO_LIST_TAG],
    }),

    // Lightweight row-level Active/Inactive toggle — separate from the
    // full edit mutation so flipping the switch doesn't need the whole
    // edit form's payload.
    updateVideoStatus: builder.mutation<VideoRecord, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/new-cars/videos/${id}/status`,
        method: "PATCH",
        data: { isActive },
      }),
      transformResponse: (res: VideoSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Video", id }, VIDEO_LIST_TAG],
    }),

    // Thumbnail replace — same pattern as brand.api.ts's uploadBrandLogo.
    uploadVideoThumbnail: builder.mutation<{ id: number; thumbnailUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("thumbnail", file);
        return { url: `/new-cars/videos/${id}/thumbnail`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; thumbnailUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Video", id }, VIDEO_LIST_TAG],
    }),

    deleteVideo: builder.mutation<void, number>({
      query: (id) => ({ url: `/new-cars/videos/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Video", id }, VIDEO_LIST_TAG],
    }),
  }),
});

export const {
  useGetVideosQuery,
  useGetVideoByIdQuery,
  useCreateVideoMutation,
  useUpdateVideoMutation,
  useUpdateVideoStatusMutation,
  useUploadVideoThumbnailMutation,
  useDeleteVideoMutation,
} = videoApi;