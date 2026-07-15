// src/pages/Stories/StoryItems/storyItem.api.ts
//
// RTK Query version, same pattern as storyGroup.api.ts.

import { api } from "../../../store/baseApi";

export type MediaType = "image" | "video";
export type StoryItemStatus = "draft" | "published" | "scheduled";

export interface StoryItemRecord {
  id: number;
  groupId: number;
  group: { id: number; title: string };
  mediaType: MediaType;
  mediaUrl: string;
  description: string | null;
  link: string | null;
  viewCount: number;
  status: StoryItemStatus;
  startAt: string | null;
  endAt: string | null;
  displayOrder: number;
  createdBy: number | null;
  createdByAdmin: { id: number; name: string } | null;
  createdAt: string;
  updatedBy: number | null;
  updatedByAdmin: { id: number; name: string } | null;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListStoryItemsParams {
  page?: number;
  limit?: number;
  groupId?: number;
  search?: string;
  status?: StoryItemStatus;
  sortBy?: "id" | "displayOrder" | "viewCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// Shared shape for create/update — full-replace on edit too (mirrors the
// backend's createStoryItemSchema / updateStoryItemSchema, which are
// identical). mediaUrl is only meaningful (and required) when mediaType
// is "video" — for "image" the file rides along separately (create's
// `media` field / the dedicated media-upload route). displayOrder has no
// default on the backend anymore — it's unique per group (see
// @@unique([groupId, displayOrder]) on StoryItem in schema.prisma), so
// every create/update must supply an explicit value.
export interface StoryItemFormInput {
  groupId: number;
  mediaType: MediaType;
  mediaUrl?: string;
  description: string | null;
  link: string | null;
  status: StoryItemStatus;
  startAt: string | null;
  endAt: string | null;
  displayOrder: number;
}

export interface CreateStoryItemInput extends StoryItemFormInput {
  // Required when mediaType is "image" — controller rejects the request
  // without one.
  media?: File;
}

interface StoryItemListRawResponse {
  success: true;
  data: StoryItemRecord[];
  pagination: Pagination;
}

interface StoryItemSingleRawResponse {
  success: true;
  data: StoryItemRecord;
}

export interface StoryItemListResult {
  data: StoryItemRecord[];
  pagination: Pagination;
}

const STORY_ITEM_LIST_TAG = { type: "StoryItem" as const, id: "LIST" };

function buildStoryItemFormData(input: CreateStoryItemInput): FormData {
  const formData = new FormData();
  formData.append("groupId", String(input.groupId));
  formData.append("mediaType", input.mediaType);
  if (input.mediaUrl) formData.append("mediaUrl", input.mediaUrl);
  if (input.description) formData.append("description", input.description);
  if (input.link) formData.append("link", input.link);
  formData.append("status", input.status);
  if (input.startAt) formData.append("startAt", input.startAt);
  if (input.endAt) formData.append("endAt", input.endAt);
  formData.append("displayOrder", String(input.displayOrder));
  if (input.media) formData.append("media", input.media);
  return formData;
}

export const storyItemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStoryItems: builder.query<StoryItemListResult, ListStoryItemsParams | void>({
      query: (params) => ({ url: "/stories/story-items", method: "GET", params: params ?? {} }),
      transformResponse: (res: StoryItemListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((i) => ({ type: "StoryItem" as const, id: i.id })), STORY_ITEM_LIST_TAG]
          : [STORY_ITEM_LIST_TAG],
    }),

    getStoryItemById: builder.query<StoryItemRecord, number>({
      query: (id) => ({ url: `/stories/story-items/${id}`, method: "GET" }),
      transformResponse: (res: StoryItemSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "StoryItem", id }],
    }),

    createStoryItem: builder.mutation<StoryItemRecord, CreateStoryItemInput>({
      query: (input) => ({ url: "/stories/story-items", method: "POST", data: buildStoryItemFormData(input) }),
      transformResponse: (res: StoryItemSingleRawResponse) => res.data,
      invalidatesTags: [STORY_ITEM_LIST_TAG],
    }),

    updateStoryItem: builder.mutation<StoryItemRecord, { id: number; input: StoryItemFormInput }>({
      query: ({ id, input }) => ({ url: `/stories/story-items/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: StoryItemSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "StoryItem", id }, STORY_ITEM_LIST_TAG],
    }),

    // Lightweight row-level status change — separate from the full edit
    // mutation, same pattern as article.api.ts's updateArticleStatus.
    // startAt/endAt only matter when status is "scheduled".
    updateStoryItemStatus: builder.mutation<
      StoryItemRecord,
      { id: number; status: StoryItemStatus; startAt?: string | null; endAt?: string | null }
    >({
      query: ({ id, status, startAt, endAt }) => ({
        url: `/stories/story-items/${id}/status`,
        method: "PATCH",
        data: { status, startAt, endAt },
      }),
      transformResponse: (res: StoryItemSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "StoryItem", id }, STORY_ITEM_LIST_TAG],
    }),

    uploadStoryItemMedia: builder.mutation<{ id: number; mediaUrl: string }, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("media", file);
        return { url: `/stories/story-items/${id}/media`, method: "PATCH", data: formData };
      },
      transformResponse: (res: { success: true; data: { id: number; mediaUrl: string } }) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "StoryItem", id }, STORY_ITEM_LIST_TAG],
    }),

    deleteStoryItem: builder.mutation<void, number>({
      query: (id) => ({ url: `/stories/story-items/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "StoryItem", id }, STORY_ITEM_LIST_TAG],
    }),
  }),
});

export const {
  useGetStoryItemsQuery,
  useGetStoryItemByIdQuery,
  useCreateStoryItemMutation,
  useUpdateStoryItemMutation,
  useUpdateStoryItemStatusMutation,
  useUploadStoryItemMediaMutation,
  useDeleteStoryItemMutation,
} = storyItemApi;
