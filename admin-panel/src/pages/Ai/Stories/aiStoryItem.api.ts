// src/pages/Ai/Stories/aiStoryItem.api.ts
import { api } from "../../../store/baseApi";

export interface AiStoryItemGroupSummary {
  id: number;
  title: string;
}

export interface AiStoryItemAdminSummary {
  id: number;
  name: string;
}

export interface AiStoryItemRecord {
  id: number;
  groupId: number;
  group: AiStoryItemGroupSummary;
  sourceImagePoolId: number;
  mediaType: string;
  mediaUrl: string;
  description: string;
  link: string | null;
  status: number;
  aiProvider: number;
  aiModel: string;
  publishedStoryItemId: number | null;
  reviewedBy: number | null;
  reviewedByAdmin: AiStoryItemAdminSummary | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAiStoryItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  groupId?: number;
  status?: number;
  sortBy?: "createdAt" | "id";
  sortOrder?: "asc" | "desc";
}

export interface UpdateAiStoryItemInput {
  description: string;
}

interface AiStoryItemListRawResponse {
  success: true;
  data: AiStoryItemRecord[];
  pagination: Pagination;
}

interface AiStoryItemSingleRawResponse {
  success: true;
  data: AiStoryItemRecord;
}

export interface AiStoryItemListResult {
  data: AiStoryItemRecord[];
  pagination: Pagination;
}

const AI_STORY_ITEM_LIST_TAG = { type: "AiStoryItem" as const, id: "LIST" };
// The real, live story item list (Stories/StoryItems/storyItem.api.ts)
// needs to refresh too once a publish creates a row there — same tag
// type it already provides/invalidates on its own list.
const STORY_ITEM_LIST_TAG = { type: "StoryItem" as const, id: "LIST" };

export const aiStoryItemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiStoryItems: builder.query<AiStoryItemListResult, ListAiStoryItemsParams | void>({
      query: (params) => ({ url: "/ai/story-items", method: "GET", params: params ?? {} }),
      transformResponse: (res: AiStoryItemListRawResponse) => ({
        data: res.data,
        pagination: res.pagination,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map((i) => ({ type: "AiStoryItem" as const, id: i.id })), AI_STORY_ITEM_LIST_TAG]
          : [AI_STORY_ITEM_LIST_TAG],
    }),

    getAiStoryItemById: builder.query<AiStoryItemRecord, number>({
      query: (id) => ({ url: `/ai/story-items/${id}`, method: "GET" }),
      transformResponse: (res: AiStoryItemSingleRawResponse) => res.data,
      providesTags: (_result, _error, id) => [{ type: "AiStoryItem", id }],
    }),

    updateAiStoryItem: builder.mutation<AiStoryItemRecord, { id: number; input: UpdateAiStoryItemInput }>({
      query: ({ id, input }) => ({ url: `/ai/story-items/${id}`, method: "PATCH", data: input }),
      transformResponse: (res: AiStoryItemSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "AiStoryItem", id }, AI_STORY_ITEM_LIST_TAG],
    }),

    approveAiStoryItem: builder.mutation<AiStoryItemRecord, number>({
      query: (id) => ({ url: `/ai/story-items/${id}/approve`, method: "PATCH" }),
      transformResponse: (res: AiStoryItemSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiStoryItem", id }, AI_STORY_ITEM_LIST_TAG],
    }),

    rejectAiStoryItem: builder.mutation<AiStoryItemRecord, number>({
      query: (id) => ({ url: `/ai/story-items/${id}/reject`, method: "PATCH" }),
      transformResponse: (res: AiStoryItemSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [{ type: "AiStoryItem", id }, AI_STORY_ITEM_LIST_TAG],
    }),

    publishAiStoryItem: builder.mutation<AiStoryItemRecord, number>({
      query: (id) => ({ url: `/ai/story-items/${id}/publish`, method: "PATCH" }),
      transformResponse: (res: AiStoryItemSingleRawResponse) => res.data,
      invalidatesTags: (_result, _error, id) => [
        { type: "AiStoryItem", id },
        AI_STORY_ITEM_LIST_TAG,
        STORY_ITEM_LIST_TAG,
      ],
    }),

    deleteAiStoryItem: builder.mutation<void, number>({
      query: (id) => ({ url: `/ai/story-items/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "AiStoryItem", id }, AI_STORY_ITEM_LIST_TAG],
    }),
  }),
});

export const {
  useGetAiStoryItemsQuery,
  useGetAiStoryItemByIdQuery,
  useUpdateAiStoryItemMutation,
  useApproveAiStoryItemMutation,
  useRejectAiStoryItemMutation,
  usePublishAiStoryItemMutation,
  useDeleteAiStoryItemMutation,
} = aiStoryItemApi;
