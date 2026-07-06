// src/pages/newCars/Videos/video.api.ts
import { api } from "../../../store/baseApi";

// Free-text on the DB (VARCHAR(30), no enum) — this list is just the
// suggested set shown in the dropdown, not a hard constraint (same
// convention as offer.api.ts's OFFER_TYPES).
export const VIDEO_TYPES = ["review", "teaser", "walkaround", "comparison", "launch", "other"] as const;

export type VideoTypeValue = (typeof VIDEO_TYPES)[number];

export interface VideoRecord {
  id: number;
  modelId: number;
  title: string;
  videoType: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number;
  publishedAt: string | null;
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
  videoType?: string;
  sortBy?: "title" | "id" | "viewCount" | "publishedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// modelId, title and videoUrl are the only mandatory fields — the rest
// mirror the schema's own nullability. viewCount is server-managed and
// intentionally not part of this shape. Full replace on edit too — same
// convention as FaqFormInput / VariantFormInput / OfferFormInput.
export interface VideoFormInput {
  modelId: number;
  title: string;
  videoType: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
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

    createVideo: builder.mutation<VideoRecord, VideoFormInput>({
      query: (body) => ({ url: "/new-cars/videos", method: "POST", data: body }),
      transformResponse: (res: VideoSingleRawResponse) => res.data,
      invalidatesTags: [VIDEO_LIST_TAG],
    }),

    updateVideo: builder.mutation<VideoRecord, { id: number; input: VideoFormInput }>({
      query: ({ id, input }) => ({ url: `/new-cars/videos/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: VideoSingleRawResponse) => res.data,
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
  useDeleteVideoMutation,
} = videoApi;